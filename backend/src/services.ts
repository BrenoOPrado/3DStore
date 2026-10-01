import {
  addressLabelTaken,
  cardBrand,
  chartFromOrders,
  productSlug,
  settlePaymentIfDue,
  uid,
  type Address,
  type AuditLog,
  type Card,
  type Coupon,
  type CouponType,
  type Customer,
  type CustomerStatus,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentSplit,
} from "./data/commerce";
import {
  couponDiscountAmount,
  couponFaceSum,
  freightOptions,
  FREIGHT_CRITERION,
  roundMoney,
  validateCardPayments,
  validateCartStock,
  validateCouponSet,
} from "./data/salesRules";
import {
  composePhone,
  customerMatchesFilter,
  hasBillingAddress,
  hasDeliveryAddress,
  hashPassword,
  passwordsMatch,
  validateAddress,
  validateCardInput,
  validateCustomerCore,
  validateSignupPasswords,
  type CustomerFilter,
} from "./data/customerRules";
import { categories, type Product } from "./data/products";
import { publicCard, publicCustomer, publicOrder, snapshot } from "./dto";
import { getState, resetStore, setState } from "./store";

function writeLog(
  actor: { id?: string; email?: string } | null,
  action: string,
  entity: string,
  payload: unknown,
  next: Partial<import("./data/commerce").CommerceState> = {}
) {
  const state = getState();
  const entry: AuditLog = {
    id: uid("log"),
    at: new Date().toISOString(),
    userId: actor?.id ?? null,
    userEmail: actor?.email ?? "",
    action,
    entity,
    payload,
  };
  setState({
    ...state,
    ...next,
    logs: [entry, ...(state.logs ?? [])].slice(0, 400),
  });
}

type Err = { error: string };

function isErr(value: unknown): value is Err {
  return Boolean(value && typeof value === "object" && "error" in value);
}

function currentUser(customerId: string | null): Customer | Err {
  if (!customerId) return { error: "Entre para continuar." };
  const found = getState().customers.find((c) => c.id === customerId);
  if (!found) return { error: "Sessão inválida." };
  if (found.role !== "admin" && found.status === "inativo") {
    return { error: "Esta conta está inativa. Fale com o ateliê." };
  }
  return found;
}

function requireAdmin(customerId: string | null): Customer | Err {
  const user = currentUser(customerId);
  if (isErr(user)) return user;
  if (user.role !== "admin") return { error: "Acesso restrito." };
  return user;
}

export function login(email: string, password: string) {
  const found = getState().customers.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && passwordsMatch(a.password, password)
  );
  if (!found) return { error: "E-mail ou senha inválidos." };
  if (found.role !== "admin" && found.status === "inativo") {
    return { error: "Esta conta está inativa. Fale com o ateliê." };
  }
  return { customerId: found.id };
}

export function signup(data: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  cpf: string;
  gender: string;
  birthDate: string;
  phoneType: string;
  phoneDdd: string;
  phoneNumber: string;
  address: Omit<Address, "id">;
}) {
  const state = getState();
  const coreErr = validateCustomerCore(data);
  if (coreErr) return { error: coreErr };
  const passErr = validateSignupPasswords(data.password, data.passwordConfirm);
  if (passErr) return { error: passErr };
  const addrErr = validateAddress(data.address);
  if (addrErr) return { error: addrErr };
  if (!hasBillingAddress([data.address]) || !hasDeliveryAddress([data.address])) {
    return { error: "O cadastro exige um endereço de cobrança e um de entrega (use o tipo 'ambos')." };
  }
  if (state.customers.some((a) => a.email.toLowerCase() === data.email.toLowerCase())) {
    return { error: "Já existe uma conta com este e-mail." };
  }
  if (state.customers.some((a) => a.cpf && a.cpf === data.cpf.replace(/\D/g, ""))) {
    return { error: "Já existe uma conta com este CPF." };
  }
  const phone = composePhone(data.phoneType, data.phoneDdd, data.phoneNumber);
  const customer: Customer = {
    id: uid("cust"),
    name: data.name.trim(),
    email: data.email.trim(),
    password: hashPassword(data.password),
    cpf: data.cpf.replace(/\D/g, ""),
    phone,
    phoneType: data.phoneType,
    phoneDdd: data.phoneDdd.replace(/\D/g, ""),
    phoneNumber: data.phoneNumber.replace(/\D/g, ""),
    gender: data.gender,
    birthDate: data.birthDate,
    status: "ativo",
    role: "client",
    ranking: 0,
    addresses: [{ ...data.address, id: uid("addr"), label: data.address.label.trim() }],
    cards: [],
  };
  writeLog(
    customer,
    "insert",
    "cliente",
    { id: customer.id, email: customer.email, name: customer.name },
    { customers: [...state.customers, customer] }
  );
  return { customerId: customer.id };
}

export function updateProfile(
  customerId: string | null,
  data: Partial<
    Pick<Customer, "name" | "phone" | "gender" | "birthDate" | "cpf" | "phoneType" | "phoneDdd" | "phoneNumber">
  >
) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const state = getState();
  const merged = { ...current, ...data };
  const coreErr = validateCustomerCore({
    name: merged.name,
    email: merged.email,
    cpf: merged.cpf,
    gender: merged.gender,
    birthDate: merged.birthDate,
    phoneType: merged.phoneType,
    phoneDdd: merged.phoneDdd,
    phoneNumber: merged.phoneNumber,
  });
  if (coreErr) return { error: coreErr };
  const cpf = merged.cpf.replace(/\D/g, "");
  if (state.customers.some((c) => c.id !== current.id && c.cpf === cpf)) {
    return { error: "Já existe uma conta com este CPF." };
  }
  const phone = composePhone(merged.phoneType, merged.phoneDdd, merged.phoneNumber);
  writeLog(
    current,
    "update",
    "cliente",
    { id: current.id, name: merged.name, email: current.email, cpf, phone },
    {
      customers: state.customers.map((c) =>
        c.id === current.id
          ? {
              ...c,
              ...data,
              cpf,
              phone,
              phoneDdd: merged.phoneDdd.replace(/\D/g, ""),
              phoneNumber: merged.phoneNumber.replace(/\D/g, ""),
            }
          : c
      ),
    }
  );
  return { ok: true };
}

export function changePassword(customerId: string | null, currentPassword: string, next: string, confirm: string) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  if (!passwordsMatch(current.password, currentPassword)) return { error: "Senha atual incorreta." };
  const passErr = validateSignupPasswords(next, confirm);
  if (passErr) return { error: passErr };
  const state = getState();
  setState({
    ...state,
    customers: state.customers.map((c) =>
      c.id === current.id ? { ...c, password: hashPassword(next) } : c
    ),
  });
  return { ok: true };
}

export function deleteAccount(customerId: string | null) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  if (current.role === "admin") return { error: "A conta administrativa não pode ser excluída." };
  const state = getState();
  const email = current.email.toLowerCase();
  setState({
    ...state,
    customers: state.customers.filter((c) => c.id !== current.id),
    coupons: state.coupons.filter((c) => !(c.type === "troca" && c.ownerEmail?.toLowerCase() === email)),
  });
  return { ok: true };
}

export function setCustomerStatus(adminId: string | null, id: string, status: CustomerStatus) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const state = getState();
  const target = state.customers.find((c) => c.id === id);
  if (!target || target.role !== "client") return { error: "Cliente não encontrado." };
  setState({
    ...state,
    customers: state.customers.map((c) => (c.id === id ? { ...c, status } : c)),
  });
  return { ok: true };
}

export function addAddress(customerId: string | null, address: Omit<Address, "id">) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const err = validateAddress(address);
  if (err) return { error: err };
  if (addressLabelTaken(current.addresses, address.label)) {
    return { error: "Já existe um endereço com esse apelido." };
  }
  const next = { ...address, id: uid("addr"), label: address.label.trim() };
  writeLog(
    current,
    "insert",
    "endereco",
    { customerId: current.id, address: next },
    {
      customers: getState().customers.map((c) =>
        c.id === current.id ? { ...c, addresses: [...c.addresses, next] } : c
      ),
    }
  );
  return { address: next };
}

export function updateAddress(customerId: string | null, address: Address) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const err = validateAddress(address);
  if (err) return { error: err };
  if (addressLabelTaken(current.addresses, address.label, address.id)) {
    return { error: "Já existe um endereço com esse apelido." };
  }
  const next = current.addresses.map((a) => (a.id === address.id ? address : a));
  if (!hasBillingAddress(next) || !hasDeliveryAddress(next)) {
    return { error: "Mantenha ao menos um endereço de cobrança e um de entrega." };
  }
  const state = getState();
  setState({
    ...state,
    customers: state.customers.map((c) =>
      c.id === current.id
        ? {
            ...c,
            addresses: c.addresses.map((a) =>
              a.id === address.id ? { ...address, label: address.label.trim() } : a
            ),
          }
        : c
    ),
  });
  return { ok: true };
}

export function removeAddress(customerId: string | null, id: string) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const next = current.addresses.filter((a) => a.id !== id);
  if (!hasBillingAddress(next) || !hasDeliveryAddress(next)) {
    return { error: "Não é possível excluir: mantenha ao menos um endereço de cobrança e um de entrega." };
  }
  const state = getState();
  setState({
    ...state,
    customers: state.customers.map((c) =>
      c.id === current.id ? { ...c, addresses: c.addresses.filter((a) => a.id !== id) } : c
    ),
  });
  return { ok: true };
}

export function addCard(
  customerId: string | null,
  card: Omit<Card, "id" | "last4" | "brand" | "preferred"> & {
    brand?: string;
    cvv?: string;
    preferred?: boolean;
  }
) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const err = validateCardInput(card);
  if (err) return { error: err };
  const digits = card.number.replace(/\D/g, "");
  const brand = card.brand?.trim() || cardBrand(digits);
  const preferred = current.cards.length === 0 ? true : Boolean(card.preferred);
  const next: Card = {
    holder: card.holder.trim(),
    number: digits,
    expiry: card.expiry,
    id: uid("card"),
    last4: digits.slice(-4),
    brand,
    preferred,
  };
  writeLog(
    current,
    "insert",
    "cartao",
    { customerId: current.id, last4: next.last4, brand: next.brand, holder: next.holder },
    {
      customers: getState().customers.map((c) =>
        c.id === current.id
          ? {
              ...c,
              cards: [...c.cards.map((item) => ({ ...item, preferred: preferred ? false : item.preferred })), next],
            }
          : c
      ),
    }
  );
  return { card: publicCard(next) };
}

export function removeCard(customerId: string | null, id: string) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const state = getState();
  setState({
    ...state,
    customers: state.customers.map((c) => {
      if (c.id !== current.id) return c;
      const cards = c.cards.filter((a) => a.id !== id);
      if (cards.length && !cards.some((item) => item.preferred)) {
        cards[0] = { ...cards[0], preferred: true };
      }
      return { ...c, cards };
    }),
  });
  return { ok: true };
}

export function setPreferredCard(customerId: string | null, id: string) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  if (!current.cards.some((c) => c.id === id)) return { error: "Cartão não encontrado." };
  const state = getState();
  setState({
    ...state,
    customers: state.customers.map((c) =>
      c.id === current.id
        ? { ...c, cards: c.cards.map((item) => ({ ...item, preferred: item.id === id })) }
        : c
    ),
  });
  return { ok: true };
}

export function addProduct(
  adminId: string | null,
  data: Omit<Product, "id" | "rating" | "reviews"> & Partial<Pick<Product, "rating" | "reviews">>
) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  if (!data.name.trim()) return { error: "Informe o nome do produto." };
  if (!(data.price > 0)) return { error: "Informe um preço válido." };
  if (!data.colors.length) return { error: "Informe ao menos uma cor." };
  const state = getState();
  const product: Product = {
    rating: 5,
    reviews: 0,
    ...data,
    id: productSlug(data.name, state.catalog),
    name: data.name.trim(),
    stock: typeof data.stock === "number" ? Math.max(0, Math.round(data.stock)) : 20,
  };
  writeLog(admin, "insert", "produto", { id: product.id, name: product.name, stock: product.stock }, {
    catalog: [...state.catalog, product],
  });
  return { id: product.id };
}

export function updateProduct(adminId: string | null, product: Product) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const state = getState();
  if (!state.catalog.some((p) => p.id === product.id)) return { error: "Produto não encontrado." };
  if (!product.name.trim()) return { error: "Informe o nome do produto." };
  if (!(product.price > 0)) return { error: "Informe um preço válido." };
  if (!product.colors.length) return { error: "Informe ao menos uma cor." };
  writeLog(admin, "update", "produto", { id: product.id, name: product.name.trim(), stock: product.stock }, {
    catalog: state.catalog.map((p) => (p.id === product.id ? { ...product, name: product.name.trim() } : p)),
  });
  return { ok: true };
}

export function deleteProduct(adminId: string | null, id: string) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const state = getState();
  if (!state.catalog.some((p) => p.id === id)) return { error: "Produto não encontrado." };
  setState({ ...state, catalog: state.catalog.filter((p) => p.id !== id) });
  return { ok: true };
}

export function addCoupon(
  adminId: string | null,
  data: {
    code: string;
    value: number;
    description: string;
    type?: CouponType;
    ownerEmail?: string;
  }
) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const state = getState();
  const code = data.code.trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return { error: "Informe o código do cupom." };
  if (!/^[A-Z0-9-]+$/.test(code)) return { error: "Use apenas letras, números e hífen no código." };
  if (state.coupons.some((c) => c.code.toUpperCase() === code)) {
    return { error: "Já existe um cupom com este código." };
  }
  const value = roundMoney(Number(data.value));
  if (!Number.isFinite(value) || value < 0.01) {
    return { error: "Informe o valor do cupom em reais." };
  }
  const type = data.type ?? "promocional";
  const ownerEmail = data.ownerEmail?.trim().toLowerCase() || undefined;
  if (type === "troca") {
    if (!ownerEmail) return { error: "Informe o e-mail do cliente para o cupom de troca." };
    const owner = state.customers.find((c) => c.role === "client" && c.email.toLowerCase() === ownerEmail);
    if (!owner) return { error: "Cliente não encontrado para este e-mail." };
  }
  const coupon: Coupon = {
    id: uid("c"),
    code,
    type,
    value,
    used: false,
    description: data.description.trim() || `Cupom de R$ ${value.toFixed(2).replace(".", ",")}`,
    ownerEmail: type === "troca" ? ownerEmail : undefined,
  };
  writeLog(admin, "insert", "cupom", { id: coupon.id, code: coupon.code, value: coupon.value, type: coupon.type }, {
    coupons: [coupon, ...state.coupons],
  });
  return { id: coupon.id };
}

export function removeCoupon(adminId: string | null, id: string) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const state = getState();
  if (!state.coupons.some((c) => c.id === id)) return { error: "Cupom não encontrado." };
  setState({ ...state, coupons: state.coupons.filter((c) => c.id !== id) });
  return { ok: true };
}

type CartLine = { productId: string; color: string; quantity: number };

function buildItems(lines: CartLine[]): OrderItem[] | Err {
  const catalog = getState().catalog;
  if (!lines.length) return { error: "Carrinho vazio." };
  const stockErr = validateCartStock(lines, catalog);
  if (stockErr) return { error: stockErr };
  const items: OrderItem[] = [];
  for (const line of lines) {
    const product = catalog.find((p) => p.id === line.productId);
    if (!product) return { error: "Produto indisponível." };
    if (!product.colors.includes(line.color)) return { error: "Cor indisponível para este produto." };
    const quantity = Math.max(1, Math.round(Number(line.quantity) || 0));
    items.push({
      id: uid("oi"),
      productId: product.id,
      name: product.name,
      color: line.color,
      quantity,
      unitPrice: product.price,
      line: roundMoney(product.price * quantity),
      image: product.image,
      category: product.category,
    });
  }
  return items;
}

function resolveCoupons(codes: string[], email: string) {
  const state = getState();
  const coupons = codes
    .map((code) => state.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase()))
    .filter((c): c is Coupon => Boolean(c));
  for (const c of coupons) {
    if (c.used) return { error: `Cupom ${c.code} já foi usado.` };
    if (c.type === "troca" && c.ownerEmail?.toLowerCase() !== email.toLowerCase()) {
      return { error: `Cupom ${c.code} não pertence a esta conta.` };
    }
  }
  return { coupons };
}

export function quoteCheckout(
  customerId: string | null,
  input: { items: CartLine[]; couponCodes: string[]; shippingId?: string; cep: string }
) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const items = buildItems(input.items);
  if (isErr(items)) return items;
  const couponRes = resolveCoupons(input.couponCodes ?? [], current.email);
  if (isErr(couponRes)) return couponRes;
  const subtotal = roundMoney(items.reduce((s, i) => s + i.line, 0));
  const options = freightOptions(input.cep, input.items);
  const shipping = options.find((o) => o.id === input.shippingId) ?? options[0] ?? null;
  const shippingPrice = shipping?.price ?? 0;
  const payable = roundMoney(subtotal + shippingPrice);
  const couponErr = validateCouponSet(couponRes.coupons, payable);
  if (couponErr) return { error: couponErr };
  const couponSum = couponFaceSum(couponRes.coupons);
  const discount = couponDiscountAmount(payable, couponRes.coupons);
  const couponExcess = roundMoney(Math.max(0, couponSum - payable));
  const total = roundMoney(Math.max(0, payable - discount));
  return {
    items,
    subtotal,
    discount,
    couponSum,
    couponExcess,
    freightNote: FREIGHT_CRITERION,
    options,
    shipping,
    shippingPrice,
    total,
  };
}

export function placeOrder(
  customerId: string | null,
  input: {
    addressId?: string;
    address?: Omit<Address, "id"> & { id?: string };
    saveAddress?: boolean;
    shippingId: string;
    couponCodes: string[];
    payments: { cardId: string; amount: number }[];
    items: CartLine[];
    newCard?: {
      holder: string;
      number: string;
      expiry: string;
      cvv: string;
      brand?: string;
      save?: boolean;
      amount: number;
    };
  }
) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  if (current.status === "inativo") return { error: "Conta inativa." };
  const quote = quoteCheckout(customerId, {
    items: input.items,
    couponCodes: input.couponCodes,
    shippingId: input.shippingId,
    cep:
      (input.addressId
        ? current.addresses.find((a) => a.id === input.addressId)?.cep
        : input.address?.cep) ?? "",
  });
  if (isErr(quote) || !("total" in quote)) return isErr(quote) ? quote : { error: "Não foi possível calcular o pedido." };
  if (!quote.shipping) return { error: "Selecione o frete." };

  let state = getState();
  let customers = state.customers;
  let live = current;

  if (input.newCard) {
    const cardErr = validateCardInput(input.newCard);
    if (cardErr) return { error: cardErr };
    if (input.newCard.save !== false) {
      const added = addCard(customerId, input.newCard);
      if (isErr(added) || !("card" in added)) return isErr(added) ? added : { error: "Não foi possível salvar o cartão." };
      const refreshed = currentUser(customerId);
      if (isErr(refreshed)) return refreshed;
      live = refreshed;
      customers = getState().customers;
      input.payments = [...(input.payments ?? []), { cardId: added.card.id, amount: input.newCard.amount }];
    }
  }

  const paymentsInput = [
    ...(input.payments ?? []).filter((p) => p.amount > 0),
    ...(input.newCard && input.newCard.save === false
      ? [{ cardId: "new", amount: input.newCard.amount }]
      : []),
  ];
  const payErr = validateCardPayments(paymentsInput, quote.total, (input.couponCodes ?? []).length > 0);
  if (payErr) return { error: payErr };

  const payments: PaymentSplit[] = paymentsInput.map((p) => {
    const card = live.cards.find((c) => c.id === p.cardId);
    if (card) {
      return { cardId: card.id, last4: card.last4, brand: card.brand, amount: roundMoney(p.amount) };
    }
    if (input.newCard && input.newCard.save === false) {
      const digits = input.newCard.number.replace(/\D/g, "");
      return {
        cardId: uid("card"),
        last4: digits.slice(-4),
        brand: input.newCard.brand?.trim() || cardBrand(digits),
        amount: roundMoney(p.amount || input.newCard.amount),
      };
    }
    return { cardId: p.cardId, last4: "0000", brand: "Cartão", amount: roundMoney(p.amount) };
  });

  let address: Address | undefined;
  if (input.addressId) {
    address = live.addresses.find((a) => a.id === input.addressId);
    if (!address) return { error: "Endereço não encontrado." };
  } else if (input.address) {
    const addrErr = validateAddress(input.address);
    if (addrErr) return { error: addrErr };
    if (input.saveAddress && addressLabelTaken(live.addresses, input.address.label)) {
      return { error: "Já existe um endereço com esse apelido." };
    }
    address = { ...input.address, id: input.address.id || uid("addr"), label: input.address.label.trim() };
    if (input.saveAddress) {
      customers = customers.map((c) =>
        c.id === live.id ? { ...c, addresses: [...c.addresses, address!] } : c
      );
    }
  }
  if (!address) return { error: "Informe o endereço de entrega." };

  const couponRes = resolveCoupons(input.couponCodes ?? [], live.email);
  if (isErr(couponRes)) return couponRes;

  const at = new Date().toISOString();
  let coupons = getState().coupons;
  const usedIds = new Set(couponRes.coupons.map((c) => c.id));
  coupons = coupons.map((c) => (usedIds.has(c.id) ? { ...c, used: true } : c));

  const order: Order = {
    id: `3DS-${Date.now().toString().slice(-6)}`,
    customerId: live.id,
    customerEmail: live.email,
    customerName: live.name,
    createdAt: at,
    status: "EM_PROCESSAMENTO",
    history: [{ status: "EM_PROCESSAMENTO", at, by: "cliente" }],
    items: quote.items,
    address,
    shipping: quote.shipping,
    coupons: couponRes.coupons.map((c) => ({ code: c.code, type: c.type, value: c.value })),
    payments,
    subtotal: quote.subtotal,
    shippingPrice: quote.shippingPrice,
    discount: quote.discount,
    total: quote.total,
  };

  if (quote.couponExcess > 0.009) {
    const extra: Coupon = {
      id: uid("c"),
      code: `TROCA-${order.id.slice(-6)}`,
      type: "troca",
      value: quote.couponExcess,
      ownerEmail: live.email.toLowerCase(),
      used: false,
      description: `R$ ${quote.couponExcess.toFixed(2).replace(".", ",")} de diferença da compra ${order.id}`,
    };
    coupons = [...coupons, extra];
    order.exchangeCouponCode = extra.code;
    order.exchangeCouponValue = extra.value;
  }

  writeLog(
    live,
    "insert",
    "pedido",
    {
      id: order.id,
      status: order.status,
      total: order.total,
      items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      coupons: order.coupons,
      payments: order.payments,
      address: { id: address.id, label: address.label, cep: address.cep },
      exchangeCouponCode: order.exchangeCouponCode,
    },
    { customers, orders: [order, ...getState().orders], coupons }
  );
  return { id: order.id, order: publicOrder(order) };
}

function setOrderStatus(
  id: string,
  status: OrderStatus,
  by: "cliente" | "admin" | "sistema",
  extra?: Partial<Order>
) {
  const at = new Date().toISOString();
  const state = getState();
  setState({
    ...state,
    orders: state.orders.map((o) =>
      o.id === id
        ? {
            ...o,
            ...extra,
            status,
            history: [...o.history, { status, at, by }],
          }
        : o
    ),
  });
}

export function cancelOrder(customerId: string | null, id: string) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const order = getState().orders.find((o) => o.id === id);
  if (!order || order.customerId !== current.id) return { error: "Pedido não encontrado." };
  if (!orderActionsSafe(order).cancel) return { error: "Este pedido não pode mais ser cancelado." };
  setOrderStatus(id, "CANCELADO", "cliente");
  return { ok: true };
}

function orderActionsSafe(order: Order) {
  return publicOrder(order).actions;
}

export function confirmReceipt(customerId: string | null, id: string) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const order = getState().orders.find((o) => o.id === id);
  if (!order || order.customerId !== current.id) return { error: "Pedido não encontrado." };
  const actions = orderActionsSafe(order);
  if (!actions.confirmReceipt) {
    return {
      error: actions.pickup
        ? "A retirada só pode ser confirmada após o pagamento."
        : "Só é possível confirmar após o envio.",
    };
  }
  setOrderStatus(id, "ENTREGUE", "cliente");
  return { ok: true };
}

export function requestExchange(customerId: string | null, orderId: string, itemId: string, qty: number) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const order = getState().orders.find((o) => o.id === orderId);
  if (!order || order.customerId !== current.id) return { error: "Pedido não encontrado." };
  if (!orderActionsSafe(order).requestExchange) return { error: "A troca só pode ser pedida após a entrega." };
  const item = order.items.find((i) => i.id === itemId);
  if (!item) return { error: "Item não encontrado." };
  if (qty < 1 || qty > item.quantity) return { error: "Quantidade inválida." };
  setOrderStatus(orderId, "TROCA_SOLICITADA", "cliente", { exchangeItemId: itemId, exchangeQty: qty });
  return { ok: true };
}

export function dispatchExchangeItem(customerId: string | null, orderId: string) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const order = getState().orders.find((o) => o.id === orderId);
  if (!order || order.customerId !== current.id) return { error: "Pedido não encontrado." };
  if (!orderActionsSafe(order).dispatchItem) return { error: "Aguarde a aceitação da troca." };
  setOrderStatus(orderId, "ITEM_ENVIADO", "cliente");
  return { ok: true };
}

export function adminSetStatus(adminId: string | null, orderId: string, status: OrderStatus) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const order = getState().orders.find((o) => o.id === orderId);
  if (!order) return { error: "Pedido não encontrado." };
  const allowed = orderActionsSafe(order).adminNext;
  if (!allowed.includes(status)) return { error: "Transição de status inválida." };
  if (status === "EM_TRANSITO" && orderActionsSafe(order).pickup) {
    return { error: "Pedidos de retirada no ateliê não entram em trânsito." };
  }
  if (status === "PAGAMENTO_REALIZADO") {
    return { error: "O pagamento é confirmado automaticamente pelo sistema." };
  }

  if (status === "EM_PROCESSAMENTO") {
    const at = new Date().toISOString();
    const state = getState();
    setState({
      ...state,
      orders: state.orders.map((o) => {
        if (o.id !== orderId) return o;
        const processing: Order = {
          ...o,
          status: "EM_PROCESSAMENTO",
          history: [...o.history, { status: "EM_PROCESSAMENTO", at, by: "admin" as const }],
        };
        return settlePaymentIfDue(processing, new Date(Date.now() + 1000).toISOString());
      }),
    });
    return { ok: true };
  }

  if (status === "TROCA_PROCESSADA") {
    const item = order.items.find((i) => i.id === order.exchangeItemId) ?? order.items[0];
    const line = item ? item.unitPrice * (order.exchangeQty ?? item.quantity) : 0;
    const value =
      order.subtotal > 0 ? Math.min(100, Math.max(1, Math.round((line / order.subtotal) * 100))) : 10;
    const coupon: Coupon = {
      id: uid("c"),
      code: `TROCA-${order.id.slice(-6)}`,
      type: "troca",
      value,
      ownerEmail: order.customerEmail,
      used: false,
      description: `${value}% de desconto pela troca do pedido ${order.id}`,
    };
    const at = new Date().toISOString();
    const state = getState();
    setState({
      ...state,
      coupons: [...state.coupons, coupon],
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              history: [...o.history, { status, at, by: "admin" as const }],
            }
          : o
      ),
    });
    return { ok: true };
  }

  setOrderStatus(orderId, status, "admin");
  return { ok: true };
}

export function adminChart(adminId: string | null, categoryIds: string[] = []) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const ids = categoryIds.filter((id): id is (typeof categories)[number]["id"] =>
    categories.some((c) => c.id === id)
  );
  const chart = chartFromOrders(getState().orders, categories, ids);
  const revenue = chart.months.reduce((s, m) => s + m.total, 0);
  const orderCount = chart.months.reduce((s, m) => s + m.count, 0);
  return { ...chart, revenue, orderCount, totalOrders: getState().orders.length };
}

export function adminCustomers(adminId: string | null, filter: CustomerFilter) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const state = getState();
  return {
    customers: state.customers
      .filter((c) => c.role === "client")
      .filter((c) => customerMatchesFilter(c, filter))
      .map((c) => publicCustomer(c, state.orders)),
  };
}

export function adminLogs(adminId: string | null) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  return { logs: getState().logs ?? [] };
}

export function resetDemo() {
  resetStore();
  return { ok: true };
}

export { snapshot };
