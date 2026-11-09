import {
  addressLabelTaken,
  cardBrand,
  productSlug,
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
  couponStillValid,
  displayAvailable,
  exchangeValue,
  isActiveLock,
  operatorAccepts,
  physicalStock,
  restockExchange,
  revalidateLines,
  salesByCategoryMonth,
  validateChartPeriod,
  WARN_BEFORE_MS,
  type CartLock,
} from "./data/orderFlow";
import {
  couponDiscountAmount,
  couponFaceSum,
  freightOptions,
  FREIGHT_CRITERION,
  roundMoney,
  validateCardPayments,
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
import { categories, isListedProduct, type Product } from "./data/products";
import { exceedsPriceConfirmThreshold, priceChangePercent, validateProduct } from "./data/productRules";
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

function normalizeProductInput(data: Partial<Product> & { name: string; price: number; category: Product["category"] }) {
  const colors = (data.colors ?? []).map((c) => c.trim()).filter(Boolean);
  const stock = Math.max(0, Math.round(Number(data.stock) || 0));
  const original = data.originalPrice && data.originalPrice > 0 ? data.originalPrice : undefined;
  return {
    name: data.name.trim(),
    price: roundMoney(Number(data.price)),
    originalPrice: original,
    category: data.category,
    description: (data.description ?? "").trim(),
    material: (data.material ?? "").trim(),
    colors,
    image: (data.image ?? "").trim() || "/products/placeholder.jpg",
    stock,
    isNew: Boolean(data.isNew),
    featured: Boolean(data.featured),
    imageFit: data.imageFit,
    imagePosition: data.imagePosition,
  };
}

export function addProduct(
  adminId: string | null,
  data: Omit<Product, "id" | "rating" | "reviews"> & Partial<Pick<Product, "rating" | "reviews">>
) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const parsed = normalizeProductInput(data);
  const invalid = validateProduct(parsed);
  if (invalid) return { error: invalid };
  const state = getState();
  const product: Product = {
    rating: 5,
    reviews: 0,
    ...parsed,
    id: productSlug(parsed.name, state.catalog),
    status: "ativo",
  };
  writeLog(admin, "insert", "produto", { id: product.id, name: product.name, stock: product.stock, price: product.price }, {
    catalog: [...state.catalog, product],
  });
  return { id: product.id };
}

export function updateProduct(
  adminId: string | null,
  product: Product,
  extras: { priceConfirmations?: number } = {}
) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const state = getState();
  const existing = state.catalog.find((p) => p.id === product.id);
  if (!existing) return { error: "Produto não encontrado." };
  const parsed = normalizeProductInput({ ...existing, ...product, category: product.category ?? existing.category });
  const invalid = validateProduct(parsed);
  if (invalid) return { error: invalid };
  if (exceedsPriceConfirmThreshold(existing.price, parsed.price)) {
    const confirms = Math.max(0, Math.round(Number(extras.priceConfirmations) || 0));
    if (confirms < 2) {
      return {
        error: `Alteração de preço acima de 10% (${priceChangePercent(existing.price, parsed.price)}%) exige duas confirmações.`,
      };
    }
  }
  const next: Product = {
    ...existing,
    ...parsed,
    id: existing.id,
    rating: existing.rating,
    reviews: existing.reviews,
    status: existing.status ?? "ativo",
  };
  writeLog(
    admin,
    "update",
    "produto",
    { id: next.id, name: next.name, stock: next.stock, price: next.price, previousPrice: existing.price },
    { catalog: state.catalog.map((p) => (p.id === next.id ? next : p)) }
  );
  return { ok: true };
}

export function deleteProduct(adminId: string | null, id: string) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const state = getState();
  const product = state.catalog.find((p) => p.id === id);
  if (!product) return { error: "Produto não encontrado." };
  if ((product.status ?? "ativo") === "inativo") return { error: "Produto já está excluído do catálogo." };
  writeLog(
    admin,
    "delete",
    "produto",
    { id: product.id, name: product.name, keepHistory: true },
    {
      catalog: state.catalog.map((p) => (p.id === id ? { ...p, status: "inativo" as const } : p)),
      locks: (state.locks ?? []).filter((lock) => lock.productId !== id),
    }
  );
  return { ok: true };
}

export function restoreProduct(adminId: string | null, id: string) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const state = getState();
  const product = state.catalog.find((p) => p.id === id);
  if (!product) return { error: "Produto não encontrado." };
  if ((product.status ?? "ativo") === "ativo") return { error: "Produto já está ativo no catálogo." };
  writeLog(admin, "update", "produto", { id: product.id, name: product.name, status: "ativo" }, {
    catalog: state.catalog.map((p) => (p.id === id ? { ...p, status: "ativo" as const } : p)),
  });
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

function nowMs() {
  return Date.now() + (getState().clockOffsetMs ?? 0);
}

export function touchCart() {
  sweepExpired();
}

function sweepExpired() {
  const state = getState();
  const now = nowMs();
  const kept: CartLock[] = [];
  const expired = [...(state.expiredCart ?? [])];
  let changed = false;
  for (const lock of state.locks ?? []) {
    if (isActiveLock(lock, now)) {
      kept.push(lock);
      continue;
    }
    changed = true;
    expired.push({
      productId: lock.productId,
      color: lock.color,
      quantity: lock.quantity,
      customerId: lock.customerId,
      expiredAt: lock.expiresAt,
    });
  }
  if (!changed) return state;
  const next = { ...state, locks: kept, expiredCart: expired };
  setState(next);
  return next;
}

function refreshCustomerExpiry(locks: CartLock[], customerId: string, now: number, ttl: number) {
  const expiresAt = new Date(now + ttl).toISOString();
  return locks.map((lock) =>
    lock.customerId === customerId && isActiveLock(lock, now) ? { ...lock, expiresAt } : lock
  );
}

function cartLinesOf(customerId: string): CartLine[] {
  const state = sweepExpired();
  const now = nowMs();
  return (state.locks ?? [])
    .filter((lock) => lock.customerId === customerId && isActiveLock(lock, now))
    .map((lock) => ({ productId: lock.productId, color: lock.color, quantity: lock.quantity }));
}

export function getCart(customerId: string | null) {
  const current = currentUser(customerId);
  if (isErr(current)) {
    return {
      items: [] as CartLine[],
      expired: [] as CartLine[],
      buyDisabled: false,
      expiresAt: null as string | null,
      warnAt: null as string | null,
    };
  }
  const state = sweepExpired();
  const now = nowMs();
  const items = (state.locks ?? [])
    .filter((lock) => lock.customerId === current.id && isActiveLock(lock, now))
    .map((lock) => ({ productId: lock.productId, color: lock.color, quantity: lock.quantity }));
  const expired = (state.expiredCart ?? [])
    .filter((item) => item.customerId === current.id)
    .map((item) => ({ productId: item.productId, color: item.color, quantity: item.quantity }));
  const soonest = (state.locks ?? [])
    .filter((lock) => lock.customerId === current.id && isActiveLock(lock, now))
    .map((lock) => lock.expiresAt)
    .sort()[0];
  return {
    items,
    expired,
    buyDisabled: expired.length > 0,
    expiresAt: soonest ?? null,
    warnAt: soonest ? new Date(new Date(soonest).getTime() - WARN_BEFORE_MS).toISOString() : null,
  };
}

export function addToCart(
  customerId: string | null,
  input: { productId: string; color: string; quantity?: number }
) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const qty = Math.max(1, Math.round(Number(input.quantity) || 1));
  const state = sweepExpired();
  const now = nowMs();
  const product = state.catalog.find((p) => p.id === input.productId);
  if (!product || !isListedProduct(product)) return { error: "Produto indisponível." };
  if (!product.colors.includes(input.color)) return { error: "Cor indisponível para este produto." };
  const available = displayAvailable(product, state.locks ?? [], now, current.id);
  const own = (state.locks ?? [])
    .filter((lock) => lock.customerId === current.id && lock.productId === product.id && isActiveLock(lock, now))
    .reduce((sum, lock) => sum + lock.quantity, 0);
  if (available <= 0) return { error: `${product.name} está indisponível em estoque.` };
  if (own + qty > available) {
    return { error: `Quantidade de ${product.name} acima do estoque (${available}).` };
  }
  const ttl = state.lockTtlMs || 15 * 60 * 1000;
  const expiresAt = new Date(now + ttl).toISOString();
  let locks = [...(state.locks ?? [])];
  const idx = locks.findIndex(
    (lock) =>
      lock.customerId === current.id &&
      lock.productId === input.productId &&
      lock.color === input.color &&
      isActiveLock(lock, now)
  );
  if (idx >= 0) {
    locks[idx] = { ...locks[idx], quantity: locks[idx].quantity + qty, expiresAt };
  } else {
    locks.push({
      id: uid("lock"),
      customerId: current.id,
      productId: input.productId,
      color: input.color,
      quantity: qty,
      lockedAt: new Date(now).toISOString(),
      expiresAt,
    });
  }
  locks = refreshCustomerExpiry(locks, current.id, now, ttl);
  writeLog(current, "update", "carrinho", { productId: input.productId, quantity: qty }, { locks });
  return { ok: true, ...getCart(current.id) };
}

export function setCartQty(
  customerId: string | null,
  input: { productId: string; color: string; quantity: number }
) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const quantity = Math.round(Number(input.quantity) || 0);
  const state = sweepExpired();
  const now = nowMs();
  let locks = [...(state.locks ?? [])];
  if (quantity <= 0) {
    locks = locks.filter(
      (lock) =>
        !(lock.customerId === current.id && lock.productId === input.productId && lock.color === input.color)
    );
    writeLog(current, "delete", "carrinho", { productId: input.productId }, { locks });
    return { ok: true, ...getCart(current.id) };
  }
  const product = state.catalog.find((p) => p.id === input.productId);
  if (!product || !isListedProduct(product)) return { error: "Produto indisponível." };
  const available = displayAvailable(product, state.locks ?? [], now, current.id);
  const othersOwn = locks
    .filter(
      (lock) =>
        lock.customerId === current.id &&
        lock.productId === input.productId &&
        lock.color !== input.color &&
        isActiveLock(lock, now)
    )
    .reduce((sum, lock) => sum + lock.quantity, 0);
  if (othersOwn + quantity > available) {
    return { error: `Quantidade de ${product.name} acima do estoque (${available}).` };
  }
  const ttl = state.lockTtlMs || 15 * 60 * 1000;
  const idx = locks.findIndex(
    (lock) =>
      lock.customerId === current.id && lock.productId === input.productId && lock.color === input.color
  );
  if (idx < 0) return { error: "Item não está no carrinho." };
  locks[idx] = { ...locks[idx], quantity };
  locks = refreshCustomerExpiry(locks, current.id, now, ttl);
  writeLog(current, "update", "carrinho", { productId: input.productId, quantity }, { locks });
  return { ok: true, ...getCart(current.id) };
}

export function removeCartItem(customerId: string | null, productId: string, color: string) {
  return setCartQty(customerId, { productId, color, quantity: 0 });
}

export function clearCart(customerId: string | null) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const state = sweepExpired();
  const locks = (state.locks ?? []).filter((lock) => lock.customerId !== current.id);
  writeLog(current, "delete", "carrinho", { clear: true }, { locks });
  return { ok: true, ...getCart(current.id) };
}

export function dismissExpiredCart(customerId: string | null) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const state = sweepExpired();
  setState({
    ...state,
    expiredCart: (state.expiredCart ?? []).filter((item) => item.customerId !== current.id),
  });
  return { ok: true, ...getCart(current.id) };
}

export function expireCustomerLocks(customerId: string | null) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const state = getState();
  const past = new Date(nowMs() - 1000).toISOString();
  setState({
    ...state,
    locks: (state.locks ?? []).map((lock) =>
      lock.customerId === current.id ? { ...lock, expiresAt: past } : lock
    ),
  });
  sweepExpired();
  return { ok: true, ...getCart(current.id) };
}

function buildItems(lines: CartLine[], customerId?: string): OrderItem[] | Err {
  const state = sweepExpired();
  const catalog = state.catalog;
  if (!lines.length) return { error: "Carrinho vazio." };
  const now = nowMs();
  const byProduct = new Map<string, number>();
  for (const line of lines) {
    const qty = Math.round(Number(line.quantity) || 0);
    if (qty < 1) return { error: "Quantidade inválida." };
    byProduct.set(line.productId, (byProduct.get(line.productId) ?? 0) + qty);
  }
  for (const [productId, qty] of byProduct) {
    const product = catalog.find((item) => item.id === productId);
    if (!product || !isListedProduct(product)) return { error: "Produto indisponível." };
    const stock = displayAvailable(product, state.locks ?? [], now, customerId);
    if (stock <= 0) return { error: `${product.name} está indisponível em estoque.` };
    if (qty > stock) return { error: `Quantidade de ${product.name} acima do estoque (${stock}).` };
  }
  const items: OrderItem[] = [];
  for (const line of lines) {
    const product = catalog.find((p) => p.id === line.productId);
    if (!product || !isListedProduct(product)) return { error: "Produto indisponível." };
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
  const items = buildItems(input.items, current.id);
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
    payments: { cardId: string; amount: number; cvv?: string }[];
    items?: CartLine[];
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
  sweepExpired();
  const locked = cartLinesOf(current.id);
  const source = locked.length ? locked : input.items ?? [];
  const reviewed = revalidateLines(source, getState().catalog, getState().locks ?? [], nowMs(), current.id);
  if (reviewed.alerts.length) {
    const ttl = getState().lockTtlMs || 15 * 60 * 1000;
    const now = nowMs();
    const expiresAt = new Date(now + ttl).toISOString();
    const otherLocks = (getState().locks ?? []).filter((lock) => lock.customerId !== current.id);
    const nextLocks: CartLock[] = [
      ...otherLocks,
      ...reviewed.lines.map((line) => ({
        id: uid("lock"),
        customerId: current.id,
        productId: line.productId,
        color: line.color,
        quantity: line.quantity,
        lockedAt: new Date(now).toISOString(),
        expiresAt,
      })),
    ];
    setState({ ...getState(), locks: nextLocks });
    return { error: reviewed.alerts.join(" "), alerts: reviewed.alerts };
  }
  const quote = quoteCheckout(customerId, {
    items: reviewed.lines,
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

  const operatorOk = payments.every((pay, index) => {
    const cvv =
      paymentsInput[index] && "cvv" in paymentsInput[index]
        ? String((paymentsInput[index] as { cvv?: string }).cvv ?? "")
        : pay.cardId === "new" || (input.newCard && input.newCard.save === false)
          ? input.newCard?.cvv
          : input.payments?.find((p) => p.cardId === pay.cardId)?.cvv;
    const fallbackCvv =
      input.newCard && (pay.last4 === input.newCard.number.replace(/\D/g, "").slice(-4))
        ? input.newCard.cvv
        : cvv;
    return operatorAccepts(fallbackCvv, pay.last4);
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
  const approveAt = new Date(Date.now() + 20).toISOString();
  const couponErrs = couponRes.coupons
    .map((coupon) => couponStillValid(coupon, live.email))
    .filter((msg): msg is string => Boolean(msg));
  const approved = operatorOk && couponErrs.length === 0;
  const usedIds = new Set(couponRes.coupons.map((c) => c.id));

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

  let coupons = getState().coupons;
  let catalog = getState().catalog;
  if (approved) {
    coupons = coupons.map((c) => (usedIds.has(c.id) ? { ...c, used: true } : c));
    catalog = catalog.map((product) => {
      const qty = order.items
        .filter((item) => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      if (!qty) return product;
      return { ...product, stock: Math.max(0, physicalStock(product) - qty) };
    });
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
    order.status = "APROVADA";
    order.history = [...order.history, { status: "APROVADA", at: approveAt, by: "sistema" }];
  } else {
    order.status = "REPROVADA";
    order.history = [...order.history, { status: "REPROVADA", at: approveAt, by: "sistema" }];
  }

  const locks = (getState().locks ?? []).filter((lock) => lock.customerId !== live.id);
  const expiredCart = (getState().expiredCart ?? []).filter((item) => item.customerId !== live.id);

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
      payment: approved ? "aprovado" : "reprovado",
    },
    { customers, orders: [order, ...getState().orders], coupons, catalog, locks, expiredCart }
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

function orderActionsSafe(order: Order) {
  return publicOrder(order).actions;
}

export function requestExchange(
  customerId: string | null,
  orderId: string,
  itemId: string,
  qty: number,
  whole = false
) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const order = getState().orders.find((o) => o.id === orderId);
  if (!order || order.customerId !== current.id) return { error: "Pedido não encontrado." };
  if (order.status !== "ENTREGUE") return { error: "A troca só pode ser pedida após a entrega." };
  if (whole) {
    setOrderStatus(orderId, "EM_TROCA", "cliente", { exchangeWhole: true, exchangeItemId: undefined, exchangeQty: undefined });
    writeLog(current, "update", "pedido", { id: orderId, status: "EM_TROCA", whole: true });
    return { ok: true };
  }
  const item = order.items.find((i) => i.id === itemId);
  if (!item) return { error: "Item não encontrado." };
  if (qty < 1 || qty > item.quantity) return { error: "Quantidade inválida." };
  setOrderStatus(orderId, "EM_TROCA", "cliente", { exchangeItemId: itemId, exchangeQty: qty, exchangeWhole: false });
  writeLog(current, "update", "pedido", { id: orderId, status: "EM_TROCA", itemId, qty });
  return { ok: true };
}

export function markNotificationRead(customerId: string | null, id: string) {
  const current = currentUser(customerId);
  if (isErr(current)) return current;
  const state = getState();
  setState({
    ...state,
    notifications: (state.notifications ?? []).map((n) =>
      n.id === id && n.customerId === current.id ? { ...n, read: true } : n
    ),
  });
  return { ok: true };
}

export function adminSetStatus(adminId: string | null, orderId: string, status: OrderStatus) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const order = getState().orders.find((o) => o.id === orderId);
  if (!order) return { error: "Pedido não encontrado." };
  const allowed = orderActionsSafe(order).adminNext;
  if (!allowed.includes(status)) return { error: "Transição de status inválida." };

  if (status === "TROCA_AUTORIZADA") {
    const at = new Date().toISOString();
    const state = getState();
    const note = {
      id: uid("n"),
      customerId: order.customerId,
      at,
      title: "Troca autorizada",
      body: `A troca do pedido ${order.id} foi autorizada.`,
      orderId: order.id,
      read: false,
    };
    setState({
      ...state,
      notifications: [note, ...(state.notifications ?? [])],
      orders: state.orders.map((o) =>
        o.id === orderId
          ? { ...o, status, history: [...o.history, { status, at, by: "admin" as const }] }
          : o
      ),
    });
    writeLog(admin, "update", "pedido", { id: orderId, status });
    return { ok: true };
  }

  if (status === "TROCADO") {
    const value = exchangeValue(order);
    const coupon: Coupon = {
      id: uid("c"),
      code: `TROCA-${order.id.slice(-6)}`,
      type: "troca",
      value,
      ownerEmail: order.customerEmail.toLowerCase(),
      used: false,
      description: `R$ ${value.toFixed(2).replace(".", ",")} de cupom de troca do pedido ${order.id}`,
    };
    const at = new Date().toISOString();
    const state = getState();
    setState({
      ...state,
      coupons: [...state.coupons, coupon],
      catalog: restockExchange(state.catalog, order),
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              history: [...o.history, { status, at, by: "admin" as const }],
              exchangeCouponCode: coupon.code,
              exchangeCouponValue: coupon.value,
            }
          : o
      ),
    });
    writeLog(admin, "update", "pedido", { id: orderId, status, coupon: coupon.code, value });
    return { ok: true };
  }

  setOrderStatus(orderId, status, "admin");
  writeLog(admin, "update", "pedido", { id: orderId, status });
  return { ok: true };
}

export function adminChart(
  adminId: string | null,
  categoryIds: string[] = [],
  startIso?: string,
  endIso?: string
) {
  const admin = requireAdmin(adminId);
  if (isErr(admin)) return admin;
  const start = startIso || "2026-01-01T00:00:00.000Z";
  const end = endIso || "2026-12-31T23:59:59.000Z";
  const periodErr = validateChartPeriod(start, end);
  if (periodErr) return { error: periodErr };
  const ids = categoryIds.filter((id): id is (typeof categories)[number]["id"] =>
    categories.some((c) => c.id === id)
  );
  const chart = salesByCategoryMonth(getState().orders, start, end, ids);
  return { ...chart, totalOrders: getState().orders.length, start, end };
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
