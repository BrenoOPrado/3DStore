import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  STORE_KEY,
  addressLabelTaken,
  adminTransitions,
  availableCoupons,
  canCancel,
  canConfirmReceipt,
  canDispatchItem,
  canRequestExchange,
  cardBrand,
  couponDiscount,
  isPickup,
  loadState,
  productSlug,
  saveState,
  settlePaymentIfDue,
  toPublic,
  uid,
  writeSessionId,
  type Address,
  type Card,
  type CommerceState,
  type Coupon,
  type CouponType,
  type Customer,
  type CustomerStatus,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentSplit,
  type PublicUser,
} from "../data/commerce";
import { type Product } from "../data/products";
import { type ShippingOption } from "../data/checkout";

type PlaceOrderInput = {
  address: Address;
  saveAddress?: boolean;
  shipping: ShippingOption;
  couponCodes: string[];
  payments: { cardId: string; amount: number }[];
  items: OrderItem[];
};

type StoreValue = {
  user: PublicUser | null;
  customers: PublicUser[];
  orders: Order[];
  coupons: Coupon[];
  catalog: Product[];
  login: (email: string, password: string) => string | null;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    phone: string;
    gender: string;
    birthDate: string;
  }) => string | null;
  logout: () => void;
  updateProfile: (data: Partial<Pick<Customer, "name" | "phone" | "gender" | "birthDate" | "cpf">>) => string | null;
  deleteAccount: () => string | null;
  setCustomerStatus: (id: string, status: CustomerStatus) => string | null;
  addAddress: (address: Omit<Address, "id">) => Address | { error: string };
  updateAddress: (address: Address) => string | null;
  removeAddress: (id: string) => void;
  addCard: (card: Omit<Card, "id" | "last4" | "brand">) => Card;
  removeCard: (id: string) => void;
  addProduct: (data: Omit<Product, "id" | "rating" | "reviews"> & Partial<Pick<Product, "rating" | "reviews">>) =>
    | string
    | { error: string };
  updateProduct: (product: Product) => string | null;
  deleteProduct: (id: string) => string | null;
  addCoupon: (data: {
    code: string;
    value: number;
    description: string;
    type?: CouponType;
    ownerEmail?: string;
  }) => string | { error: string };
  removeCoupon: (id: string) => string | null;
  myOrders: Order[];
  myCoupons: Coupon[];
  placeOrder: (input: PlaceOrderInput) => string | { error: string };
  cancelOrder: (id: string) => string | null;
  confirmReceipt: (id: string) => string | null;
  requestExchange: (orderId: string, itemId: string, qty: number) => string | null;
  dispatchExchangeItem: (orderId: string) => string | null;
  adminSetStatus: (orderId: string, status: OrderStatus) => string | null;
  lastOrderId: string | null;
};

const StoreContext = createContext<StoreValue | null>(null);

const CHANNEL = "3dstore-commerce";

function persist(next: CommerceState) {
  saveState(next);
  try {
    new BroadcastChannel(CHANNEL).postMessage({ ...next, sessionId: null });
  } catch {
    /* ignore */
  }
  return next;
}

function keepSession(incoming: CommerceState, sessionId: string | null): CommerceState {
  return { ...incoming, sessionId };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommerceState>(loadState);
  const [lastOrderId, setLastOrderId] = useState<string | null>(
    () => sessionStorage.getItem("3dstore-last-order-id")
  );

  const patch = useCallback((fn: (s: CommerceState) => CommerceState) => {
    setState((prev) => persist(fn(prev)));
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORE_KEY || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue) as CommerceState;
        setState((prev) => keepSession(incoming, prev.sessionId));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = (e) => {
        if (e.data && typeof e.data === "object" && Array.isArray(e.data.orders)) {
          setState((prev) => keepSession(e.data as CommerceState, prev.sessionId));
        }
      };
    } catch {
      channel = null;
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, []);

  useEffect(() => {
    if (!state.sessionId) return;
    const me = state.customers.find((c) => c.id === state.sessionId);
    if (!me || (me.role !== "admin" && me.status === "inativo")) {
      writeSessionId(null);
      setState((s) => (s.sessionId ? { ...s, sessionId: null } : s));
    }
  }, [state.customers, state.sessionId]);

  const current = state.customers.find((c) => c.id === state.sessionId) ?? null;

  const value = useMemo<StoreValue>(() => {
    const user = current ? toPublic(current) : null;

    const login = (email: string, password: string) => {
      const found = state.customers.find(
        (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
      );
      if (!found) return "E-mail ou senha inválidos.";
      if (found.role !== "admin" && found.status === "inativo") {
        return "Esta conta está inativa. Fale com o ateliê.";
      }
      writeSessionId(found.id);
      patch((s) => ({ ...s, sessionId: found.id }));
      return null;
    };

    const signup: StoreValue["signup"] = (data) => {
      if (data.name.trim().length < 2) return "Informe seu nome.";
      if (!data.email.includes("@")) return "E-mail inválido.";
      if (data.password.length < 6) return "A senha precisa ter ao menos 6 caracteres.";
      if (data.cpf.replace(/\D/g, "").length !== 11) return "CPF deve ter 11 dígitos.";
      if (state.customers.some((a) => a.email.toLowerCase() === data.email.toLowerCase())) {
        return "Já existe uma conta com este e-mail.";
      }
      const customer: Customer = {
        id: uid("cust"),
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        cpf: data.cpf.replace(/\D/g, ""),
        phone: data.phone,
        gender: data.gender,
        birthDate: data.birthDate,
        status: "ativo",
        role: "client",
        addresses: [],
        cards: [],
      };
      patch((s) => ({
        ...s,
        customers: [...s.customers, customer],
        sessionId: customer.id,
      }));
      writeSessionId(customer.id);
      return null;
    };

    const logout = () => {
      writeSessionId(null);
      patch((s) => ({ ...s, sessionId: null }));
    };

    const updateProfile: StoreValue["updateProfile"] = (data) => {
      if (!current) return "Entre para editar o cadastro.";
      patch((s) => ({
        ...s,
        customers: s.customers.map((c) => (c.id === current.id ? { ...c, ...data } : c)),
      }));
      return null;
    };

    const deleteAccount = () => {
      if (!current) return "Entre para excluir a conta.";
      if (current.role === "admin") return "A conta administrativa não pode ser excluída.";
      const email = current.email.toLowerCase();
      patch((s) => ({
        ...s,
        customers: s.customers.filter((c) => c.id !== current.id),
        coupons: s.coupons.filter(
          (c) => !(c.type === "troca" && c.ownerEmail?.toLowerCase() === email)
        ),
        sessionId: null,
      }));
      writeSessionId(null);
      return null;
    };

    const setCustomerStatus: StoreValue["setCustomerStatus"] = (id, status) => {
      if (current?.role !== "admin") return "Acesso restrito.";
      const target = state.customers.find((c) => c.id === id);
      if (!target || target.role !== "client") return "Cliente não encontrado.";
      patch((s) => ({
        ...s,
        customers: s.customers.map((c) => (c.id === id ? { ...c, status } : c)),
      }));
      return null;
    };

    const addAddress: StoreValue["addAddress"] = (address) => {
      if (!current) return { error: "Entre para cadastrar um endereço." };
      if (!address.label.trim()) return { error: "Informe um apelido para o endereço." };
      if (addressLabelTaken(current.addresses, address.label)) {
        return { error: "Já existe um endereço com esse apelido." };
      }
      const next = { ...address, id: uid("addr"), label: address.label.trim() };
      patch((s) => ({
        ...s,
        customers: s.customers.map((c) =>
          c.id === current.id ? { ...c, addresses: [...c.addresses, next] } : c
        ),
      }));
      return next;
    };

    const updateAddress: StoreValue["updateAddress"] = (address) => {
      if (!current) return "Entre para alterar o endereço.";
      if (!address.label.trim()) return "Informe um apelido para o endereço.";
      if (addressLabelTaken(current.addresses, address.label, address.id)) {
        return "Já existe um endereço com esse apelido.";
      }
      patch((s) => ({
        ...s,
        customers: s.customers.map((c) =>
          c.id === current.id
            ? {
                ...c,
                addresses: c.addresses.map((a) =>
                  a.id === address.id ? { ...address, label: address.label.trim() } : a
                ),
              }
            : c
        ),
      }));
      return null;
    };

    const removeAddress: StoreValue["removeAddress"] = (id) => {
      if (!current) return;
      patch((s) => ({
        ...s,
        customers: s.customers.map((c) =>
          c.id === current.id ? { ...c, addresses: c.addresses.filter((a) => a.id !== id) } : c
        ),
      }));
    };

    const addCard: StoreValue["addCard"] = (card) => {
      const digits = card.number.replace(/\D/g, "");
      const next: Card = {
        ...card,
        id: uid("card"),
        number: digits,
        last4: digits.slice(-4),
        brand: cardBrand(digits),
      };
      if (current) {
        patch((s) => ({
          ...s,
          customers: s.customers.map((c) =>
            c.id === current.id ? { ...c, cards: [...c.cards, next] } : c
          ),
        }));
      }
      return next;
    };

    const removeCard: StoreValue["removeCard"] = (id) => {
      if (!current) return;
      patch((s) => ({
        ...s,
        customers: s.customers.map((c) =>
          c.id === current.id ? { ...c, cards: c.cards.filter((a) => a.id !== id) } : c
        ),
      }));
    };

    const addProduct: StoreValue["addProduct"] = (data) => {
      if (current?.role !== "admin") return { error: "Acesso restrito." };
      if (!data.name.trim()) return { error: "Informe o nome do produto." };
      if (!(data.price > 0)) return { error: "Informe um preço válido." };
      if (!data.colors.length) return { error: "Informe ao menos uma cor." };
      const product: Product = {
        rating: 5,
        reviews: 0,
        ...data,
        id: productSlug(data.name, state.catalog),
        name: data.name.trim(),
      };
      patch((s) => ({ ...s, catalog: [...s.catalog, product] }));
      return product.id;
    };

    const updateProduct: StoreValue["updateProduct"] = (product) => {
      if (current?.role !== "admin") return "Acesso restrito.";
      if (!state.catalog.some((p) => p.id === product.id)) return "Produto não encontrado.";
      if (!product.name.trim()) return "Informe o nome do produto.";
      if (!(product.price > 0)) return "Informe um preço válido.";
      if (!product.colors.length) return "Informe ao menos uma cor.";
      patch((s) => ({
        ...s,
        catalog: s.catalog.map((p) => (p.id === product.id ? { ...product, name: product.name.trim() } : p)),
      }));
      return null;
    };

    const deleteProduct: StoreValue["deleteProduct"] = (id) => {
      if (current?.role !== "admin") return "Acesso restrito.";
      if (!state.catalog.some((p) => p.id === id)) return "Produto não encontrado.";
      patch((s) => ({ ...s, catalog: s.catalog.filter((p) => p.id !== id) }));
      return null;
    };

    const addCoupon: StoreValue["addCoupon"] = (data) => {
      if (current?.role !== "admin") return { error: "Acesso restrito." };
      const code = data.code.trim().toUpperCase().replace(/\s+/g, "");
      if (!code) return { error: "Informe o código do cupom." };
      if (!/^[A-Z0-9-]+$/.test(code)) return { error: "Use apenas letras, números e hífen no código." };
      if (state.coupons.some((c) => c.code.toUpperCase() === code)) {
        return { error: "Já existe um cupom com este código." };
      }
      const value = Math.round(Number(data.value));
      if (!Number.isFinite(value) || value < 1 || value > 100) {
        return { error: "O desconto deve ser um percentual entre 1 e 100." };
      }
      const type = data.type ?? "promocional";
      const ownerEmail = data.ownerEmail?.trim().toLowerCase() || undefined;
      if (type === "troca") {
        if (!ownerEmail) return { error: "Informe o e-mail do cliente para o cupom de troca." };
        const owner = state.customers.find(
          (c) => c.role === "client" && c.email.toLowerCase() === ownerEmail
        );
        if (!owner) return { error: "Cliente não encontrado para este e-mail." };
      }
      const coupon: Coupon = {
        id: uid("c"),
        code,
        type,
        value,
        used: false,
        description: data.description.trim() || `${value}% de desconto`,
        ownerEmail: type === "troca" ? ownerEmail : undefined,
      };
      patch((s) => ({ ...s, coupons: [coupon, ...s.coupons] }));
      return coupon.id;
    };

    const removeCoupon: StoreValue["removeCoupon"] = (id) => {
      if (current?.role !== "admin") return "Acesso restrito.";
      if (!state.coupons.some((c) => c.id === id)) return "Cupom não encontrado.";
      patch((s) => ({ ...s, coupons: s.coupons.filter((c) => c.id !== id) }));
      return null;
    };

    const placeOrder: StoreValue["placeOrder"] = (input) => {
      if (!current) return { error: "Entre para finalizar a compra." };
      if (current.status === "inativo") return { error: "Conta inativa." };
      if (!input.items.length) return { error: "Carrinho vazio." };
      if (!input.shipping) return { error: "Selecione o frete." };

      const subtotal = input.items.reduce((s, i) => s + i.line, 0);
      const coupons = input.couponCodes
        .map((code) => state.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase()))
        .filter((c): c is Coupon => Boolean(c));

      for (const c of coupons) {
        if (c.used) return { error: `Cupom ${c.code} já foi usado.` };
        if (c.type === "troca" && c.ownerEmail?.toLowerCase() !== current.email.toLowerCase()) {
          return { error: `Cupom ${c.code} não pertence a esta conta.` };
        }
      }

      const discount = couponDiscount(subtotal, coupons);
      const total = Math.max(0, Math.round((subtotal + input.shipping.price - discount) * 100) / 100);
      const paySum = Math.round(input.payments.reduce((s, p) => s + p.amount, 0) * 100) / 100;

      if (total > 0 && input.payments.length === 0) {
        return { error: "Selecione ao menos um cartão para o valor restante." };
      }
      if (Math.abs(paySum - total) > 0.05) {
        return { error: "A soma dos cartões deve cobrir o total após os cupons." };
      }
      if (total > 0 && input.payments.some((p) => p.amount < 10 && total >= 10)) {
        return { error: "Cada cartão deve receber no mínimo R$ 10,00." };
      }

      const payments: PaymentSplit[] = input.payments.map((p) => {
        const card = current.cards.find((c) => c.id === p.cardId);
        return {
          cardId: p.cardId,
          last4: card?.last4 ?? "0000",
          brand: card?.brand ?? "Cartão",
          amount: p.amount,
        };
      });

      let address = input.address;
      let customers = state.customers;
      if (input.saveAddress && !current.addresses.some((a) => a.id === address.id)) {
        if (!address.label.trim()) return { error: "Informe um apelido para o endereço." };
        if (addressLabelTaken(current.addresses, address.label)) {
          return { error: "Já existe um endereço com esse apelido." };
        }
        address = { ...address, id: address.id || uid("addr"), label: address.label.trim() };
        customers = customers.map((c) =>
          c.id === current.id ? { ...c, addresses: [...c.addresses, address] } : c
        );
      }

      const order: Order = {
        id: `3DS-${Date.now().toString().slice(-6)}`,
        customerId: current.id,
        customerEmail: current.email,
        customerName: current.name,
        createdAt: new Date().toISOString(),
        status: "EM_ABERTO",
        history: [{ status: "EM_ABERTO", at: new Date().toISOString(), by: "cliente" }],
        items: input.items,
        address,
        shipping: input.shipping,
        coupons: coupons.map((c) => ({ code: c.code, type: c.type, value: c.value })),
        payments,
        subtotal,
        shippingPrice: input.shipping.price,
        discount,
        total,
      };

      const usedIds = new Set(coupons.map((c) => c.id));
      patch((s) => ({
        ...s,
        customers,
        orders: [order, ...s.orders],
        coupons: s.coupons.map((c) => (usedIds.has(c.id) ? { ...c, used: true } : c)),
      }));
      setLastOrderId(order.id);
      sessionStorage.setItem("3dstore-last-order-id", order.id);
      return order.id;
    };

    const setOrderStatus = (
      id: string,
      status: OrderStatus,
      by: "cliente" | "admin" | "sistema",
      extra?: Partial<Order>
    ) => {
      const at = new Date().toISOString();
      patch((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                ...extra,
                status,
                history: [...o.history, { status, at, by }],
              }
            : o
        ),
      }));
    };

    const cancelOrder: StoreValue["cancelOrder"] = (id) => {
      const order = state.orders.find((o) => o.id === id);
      if (!order || order.customerId !== current?.id) return "Pedido não encontrado.";
      if (!canCancel(order.status)) return "Este pedido não pode mais ser cancelado.";
      setOrderStatus(id, "CANCELADO", "cliente");
      return null;
    };

    const confirmReceipt: StoreValue["confirmReceipt"] = (id) => {
      const order = state.orders.find((o) => o.id === id);
      if (!order || order.customerId !== current?.id) return "Pedido não encontrado.";
      if (!canConfirmReceipt(order.status, order)) {
        return isPickup(order)
          ? "A retirada só pode ser confirmada após o pagamento."
          : "Só é possível confirmar após o envio.";
      }
      setOrderStatus(id, "ENTREGUE", "cliente");
      return null;
    };

    const requestExchange: StoreValue["requestExchange"] = (orderId, itemId, qty) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order || order.customerId !== current?.id) return "Pedido não encontrado.";
      if (!canRequestExchange(order.status)) return "A troca só pode ser pedida após a entrega.";
      const item = order.items.find((i) => i.id === itemId);
      if (!item) return "Item não encontrado.";
      if (qty < 1 || qty > item.quantity) return "Quantidade inválida.";
      setOrderStatus(orderId, "TROCA_SOLICITADA", "cliente", {
        exchangeItemId: itemId,
        exchangeQty: qty,
      });
      return null;
    };

    const dispatchExchangeItem: StoreValue["dispatchExchangeItem"] = (orderId) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order || order.customerId !== current?.id) return "Pedido não encontrado.";
      if (!canDispatchItem(order.status)) return "Aguarde a aceitação da troca.";
      setOrderStatus(orderId, "ITEM_ENVIADO", "cliente");
      return null;
    };

    const adminSetStatus: StoreValue["adminSetStatus"] = (orderId, status) => {
      if (current?.role !== "admin") return "Acesso restrito.";
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return "Pedido não encontrado.";
      const allowed = adminTransitions(order.status, order);
      if (!allowed.includes(status)) return "Transição de status inválida.";
      if (status === "EM_TRANSITO" && isPickup(order)) {
        return "Pedidos de retirada no ateliê não entram em trânsito.";
      }
      if (status === "PAGAMENTO_REALIZADO") {
        return "O pagamento é confirmado automaticamente pelo sistema.";
      }

      if (status === "EM_PROCESSAMENTO") {
        const at = new Date().toISOString();
        patch((s) => ({
          ...s,
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const processing: Order = {
              ...o,
              status: "EM_PROCESSAMENTO",
              history: [...o.history, { status: "EM_PROCESSAMENTO", at, by: "admin" as const }],
            };
            return settlePaymentIfDue(processing, new Date(Date.now() + 1000).toISOString());
          }),
        }));
        return null;
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
        patch((s) => ({
          ...s,
          coupons: [...s.coupons, coupon],
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  history: [...o.history, { status, at, by: "admin" as const }],
                }
              : o
          ),
        }));
        return null;
      }

      if (status === "TROCA_NEGADA") {
        setOrderStatus(orderId, "TROCA_NEGADA", "admin");
        return null;
      }

      setOrderStatus(orderId, status, "admin");
      return null;
    };

    return {
      user,
      customers: state.customers.filter((c) => c.role === "client").map(toPublic),
      orders: state.orders,
      coupons: state.coupons,
      catalog: state.catalog,
      login,
      signup,
      logout,
      updateProfile,
      deleteAccount,
      setCustomerStatus,
      addAddress,
      updateAddress,
      removeAddress,
      addCard,
      removeCard,
      addProduct,
      updateProduct,
      deleteProduct,
      addCoupon,
      removeCoupon,
      myOrders: current ? state.orders.filter((o) => o.customerId === current.id) : [],
      myCoupons: current ? availableCoupons(state.coupons, current.email) : [],
      placeOrder,
      cancelOrder,
      confirmReceipt,
      requestExchange,
      dispatchExchangeItem,
      adminSetStatus,
      lastOrderId,
    };
  }, [current, lastOrderId, patch, state.catalog, state.coupons, state.customers, state.orders, state.sessionId]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useAuth() {
  const { user, login, signup, logout } = useStore();
  return { user, login, signup, logout };
}
