import { getProduct, products as seedCatalog, type CategoryId, type Product } from "./products";
import { calculateShipping, type ShippingOption } from "./checkout";

export type Role = "client" | "admin";
export type CustomerStatus = "ativo" | "inativo";
export type CouponType = "promocional" | "troca";

export type OrderStatus =
  | "EM_ABERTO"
  | "EM_PROCESSAMENTO"
  | "PAGAMENTO_REALIZADO"
  | "EM_TRANSITO"
  | "ENTREGUE"
  | "CANCELADO"
  | "TROCA_SOLICITADA"
  | "TROCA_ACEITA"
  | "TROCA_NEGADA"
  | "ITEM_ENVIADO"
  | "ITEM_RECEBIDO"
  | "TROCA_PROCESSADA";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  EM_ABERTO: "Em aberto",
  EM_PROCESSAMENTO: "Em processamento",
  PAGAMENTO_REALIZADO: "Pagamento realizado",
  EM_TRANSITO: "Em trânsito",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
  TROCA_SOLICITADA: "Troca solicitada",
  TROCA_ACEITA: "Troca aceita",
  TROCA_NEGADA: "Troca negada",
  ITEM_ENVIADO: "Item enviado",
  ITEM_RECEBIDO: "Item recebido",
  TROCA_PROCESSADA: "Troca processada",
};

export type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type Card = {
  id: string;
  holder: string;
  number: string;
  last4: string;
  brand: string;
  expiry: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  password: string;
  cpf: string;
  phone: string;
  gender: string;
  birthDate: string;
  status: CustomerStatus;
  role: Role;
  addresses: Address[];
  cards: Card[];
};

export type PublicUser = Omit<Customer, "password">;

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  /** Percentual de desconto (0–100). */
  value: number;
  ownerEmail?: string;
  used: boolean;
  description: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  color: string;
  quantity: number;
  unitPrice: number;
  line: number;
  image: string;
  category: CategoryId;
};

export type PaymentSplit = {
  cardId: string;
  last4: string;
  brand: string;
  amount: number;
};

export type StatusEvent = {
  status: OrderStatus;
  at: string;
  by: "cliente" | "admin" | "sistema";
};

export type Order = {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  createdAt: string;
  status: OrderStatus;
  history: StatusEvent[];
  items: OrderItem[];
  address: Address;
  shipping: ShippingOption;
  coupons: { code: string; type: CouponType; value: number }[];
  payments: PaymentSplit[];
  subtotal: number;
  shippingPrice: number;
  discount: number;
  total: number;
  exchangeItemId?: string;
  exchangeQty?: number;
};

export const STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  EM_PROCESSAMENTO: "Processar",
  EM_TRANSITO: "Enviar",
  ENTREGUE: "Recebi",
  CANCELADO: "Cancelar",
  TROCA_ACEITA: "Aceitar troca",
  TROCA_NEGADA: "Negar troca",
  ITEM_ENVIADO: "Despachar",
  ITEM_RECEBIDO: "Receber item",
  TROCA_PROCESSADA: "Processar troca",
};

export const STORE_KEY = "3dstore-commerce-v2";

export type CommerceState = {
  customers: Customer[];
  orders: Order[];
  coupons: Coupon[];
  catalog: Product[];
  sessionId: string | null;
};

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function formatAddress(a: Address) {
  const line1 = `${a.street}, ${a.number}${a.complement ? ` — ${a.complement}` : ""}`;
  const line2 = `${a.neighborhood} · ${a.city}/${a.state}`;
  return `${line1}\n${line2}\nCEP ${a.cep}`;
}

export function formatPercent(n: number) {
  return `${n}%`;
}

export function couponPercentSum(coupons: { value: number }[]) {
  return Math.min(100, coupons.reduce((s, c) => s + Math.max(0, Number(c.value) || 0), 0));
}

export function couponDiscount(subtotal: number, coupons: { value: number }[]) {
  const p = couponPercentSum(coupons);
  return Math.round(((subtotal * p) / 100) * 100) / 100;
}

export function addressLabelTaken(addresses: Address[], label: string, exceptId?: string) {
  const n = label.trim().toLowerCase();
  if (!n) return false;
  return addresses.some((a) => a.id !== exceptId && a.label.trim().toLowerCase() === n);
}

export function cloneCatalog(): Product[] {
  return seedCatalog.map((p) => ({ ...p, colors: [...p.colors] }));
}

export function productSlug(name: string, existing: Product[], keepId?: string) {
  if (keepId) return keepId;
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "produto";
  let id = base;
  let n = 2;
  while (existing.some((p) => p.id === id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

export function cardBrand(number: string) {
  const d = number.replace(/\D/g, "");
  if (d.startsWith("4")) return "Visa";
  if (d.startsWith("5")) return "Mastercard";
  if (d.startsWith("6")) return "Elo";
  return "Cartão";
}

export function isPickup(order: Pick<Order, "shipping">) {
  return order.shipping.id === "retirada";
}

export function adminTransitions(status: OrderStatus, order?: Pick<Order, "shipping">): OrderStatus[] {
  switch (status) {
    case "EM_ABERTO":
      return ["EM_PROCESSAMENTO"];
    case "PAGAMENTO_REALIZADO":
      return order && isPickup(order) ? [] : ["EM_TRANSITO"];
    case "TROCA_SOLICITADA":
      return ["TROCA_ACEITA", "TROCA_NEGADA"];
    case "ITEM_ENVIADO":
      return ["ITEM_RECEBIDO"];
    case "ITEM_RECEBIDO":
      return ["TROCA_PROCESSADA"];
    default:
      return [];
  }
}

export function adminWaitingMessage(status: OrderStatus, order?: Pick<Order, "shipping">): string | null {
  if (status === "EM_PROCESSAMENTO") {
    return "O sistema está verificando se o pagamento foi realizado.";
  }
  if (status === "PAGAMENTO_REALIZADO" && order && isPickup(order)) {
    return "Aguardando o cliente retirar no ateliê.";
  }
  if (status === "EM_TRANSITO") return "Aguardando o cliente confirmar o recebimento.";
  return null;
}

export function paymentIsConfirmed(order: Pick<Order, "payments" | "total">) {
  const paid = Math.round(order.payments.reduce((s, p) => s + p.amount, 0) * 100) / 100;
  if (order.total <= 0) return true;
  return paid >= order.total - 0.05;
}

export function settlePaymentIfDue(order: Order, at = new Date().toISOString()): Order {
  if (order.status !== "EM_PROCESSAMENTO") return order;
  if (!paymentIsConfirmed(order)) return order;
  return {
    ...order,
    status: "PAGAMENTO_REALIZADO",
    history: [...order.history, { status: "PAGAMENTO_REALIZADO", at, by: "sistema" }],
  };
}

export function canCancel(status: OrderStatus) {
  return status === "EM_ABERTO" || status === "EM_PROCESSAMENTO";
}

export function canConfirmReceipt(status: OrderStatus, order?: Pick<Order, "shipping">) {
  if (status === "EM_TRANSITO") return true;
  return status === "PAGAMENTO_REALIZADO" && Boolean(order && isPickup(order));
}

export function canRequestExchange(status: OrderStatus) {
  return status === "ENTREGUE" || status === "TROCA_NEGADA";
}

export function canDispatchItem(status: OrderStatus) {
  return status === "TROCA_ACEITA";
}

function event(status: OrderStatus, at: string, by: StatusEvent["by"]): StatusEvent {
  return { status, at, by };
}

function itemFrom(
  productId: string,
  color: string,
  quantity: number,
  id: string
): OrderItem {
  const p = getProduct(productId)!;
  return {
    id,
    productId,
    name: p.name,
    color,
    quantity,
    unitPrice: p.price,
    line: p.price * quantity,
    image: p.image,
    category: p.category,
  };
}

function makeOrder(partial: Omit<Order, "history" | "subtotal" | "shippingPrice" | "discount" | "total"> & {
  createdAt: string;
  history?: StatusEvent[];
  discount?: number;
}): Order {
  const subtotal = partial.items.reduce((s, i) => s + i.line, 0);
  const shippingPrice = partial.shipping.price;
  const discount = partial.discount ?? couponDiscount(subtotal, partial.coupons);
  const total = Math.max(0, Math.round((subtotal + shippingPrice - discount) * 100) / 100);
  const history =
    partial.history ?? [event(partial.status, partial.createdAt, "cliente")];
  return { ...partial, history, subtotal, shippingPrice, discount, total };
}

const anaHome: Address = {
  id: "addr-ana-1",
  label: "Casa",
  recipient: "Ana Souza",
  phone: "(11) 98888-1234",
  cep: "01310-100",
  street: "Rua Augusta",
  number: "1500",
  complement: "Apto 42",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
};

const anaWork: Address = {
  id: "addr-ana-2",
  label: "Trabalho",
  recipient: "Ana Souza",
  phone: "(11) 98888-1234",
  cep: "01311-200",
  street: "Av. Paulista",
  number: "1578",
  complement: "Conj. 101",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
};

const carlaHome: Address = {
  id: "addr-carla-1",
  label: "Casa",
  recipient: "Carla Mendes",
  phone: "(11) 97777-2222",
  cep: "04038-001",
  street: "Rua Domingos de Morais",
  number: "2564",
  complement: "",
  neighborhood: "Vila Mariana",
  city: "São Paulo",
  state: "SP",
};

const brunoHome: Address = {
  id: "addr-bruno-1",
  label: "Casa",
  recipient: "Bruno Lima",
  phone: "(21) 98888-0000",
  cep: "22041-080",
  street: "Rua Barata Ribeiro",
  number: "370",
  complement: "501",
  neighborhood: "Copacabana",
  city: "Rio de Janeiro",
  state: "RJ",
};

export function seedState(): CommerceState {
  const customers: Customer[] = [
    {
      id: "cust-admin",
      name: "Administrador",
      email: "admin@3dstore.com",
      password: "admin123",
      cpf: "00000000000",
      phone: "(11) 3000-0000",
      gender: "Prefiro não informar",
      birthDate: "1990-01-01",
      status: "ativo",
      role: "admin",
      addresses: [],
      cards: [],
    },
    {
      id: "cust-ana",
      name: "Ana Souza",
      email: "ana.souza@email.com",
      password: "123456",
      cpf: "12345678901",
      phone: "(11) 98888-1234",
      gender: "Feminino",
      birthDate: "1994-05-12",
      status: "ativo",
      role: "client",
      addresses: [anaHome, anaWork],
      cards: [
        {
          id: "card-ana-1",
          holder: "ANA SOUZA",
          number: "4111111111111111",
          last4: "1111",
          brand: "Visa",
          expiry: "12/28",
        },
        {
          id: "card-ana-2",
          holder: "ANA SOUZA",
          number: "5555555555554444",
          last4: "4444",
          brand: "Mastercard",
          expiry: "08/27",
        },
      ],
    },
    {
      id: "cust-carla",
      name: "Carla Mendes",
      email: "carla.mendes@email.com",
      password: "123456",
      cpf: "98765432100",
      phone: "(11) 97777-2222",
      gender: "Feminino",
      birthDate: "1988-11-03",
      status: "ativo",
      role: "client",
      addresses: [carlaHome],
      cards: [
        {
          id: "card-carla-1",
          holder: "CARLA MENDES",
          number: "4012888888881881",
          last4: "1881",
          brand: "Visa",
          expiry: "03/29",
        },
      ],
    },
    {
      id: "cust-bruno",
      name: "Bruno Lima",
      email: "bruno.lima@email.com",
      password: "123456",
      cpf: "11122233344",
      phone: "(21) 98888-0000",
      gender: "Masculino",
      birthDate: "1991-07-20",
      status: "inativo",
      role: "client",
      addresses: [brunoHome],
      cards: [],
    },
  ];

  const coupons: Coupon[] = [
    {
      id: "c-welcome",
      code: "BEMVINDO20",
      type: "promocional",
      value: 20,
      used: false,
      description: "20% off na primeira compra",
    },
    {
      id: "c-print",
      code: "PRINT10",
      type: "promocional",
      value: 10,
      used: false,
      description: "10% off em qualquer pedido",
    },
    {
      id: "c-atelier",
      code: "ATELIE15",
      type: "promocional",
      value: 15,
      used: false,
      description: "15% off em peças do ateliê",
    },
    {
      id: "c-ana-troca",
      code: "TROCA-ANA-64",
      type: "troca",
      value: 15,
      ownerEmail: "ana.souza@email.com",
      used: false,
      description: "15% de desconto pela troca do suporte de headset",
    },
  ];

  const pac = calculateShipping("01310100")[0];
  const sedex = calculateShipping("01310100")[1];
  const pacRj = calculateShipping("22041080")[0];

  const orders: Order[] = [
    makeOrder({
      id: "3DS-100001",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-03-12T14:20:00.000Z",
      status: "ENTREGUE",
      items: [itemFrom("vaso-zen", "Preto", 1, "oi-1")],
      address: anaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-ana-1", last4: "1111", brand: "Visa", amount: 82.8 }],
      history: [
        event("EM_ABERTO", "2026-03-12T14:20:00.000Z", "cliente"),
        event("EM_PROCESSAMENTO", "2026-03-12T16:00:00.000Z", "admin"),
        event("PAGAMENTO_REALIZADO", "2026-03-12T16:10:00.000Z", "sistema"),
        event("EM_TRANSITO", "2026-03-13T09:00:00.000Z", "admin"),
        event("ENTREGUE", "2026-03-18T11:30:00.000Z", "cliente"),
      ],
    }),
    makeOrder({
      id: "3DS-100002",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-05-04T10:00:00.000Z",
      status: "EM_TRANSITO",
      items: [
        itemFrom("filtro-dino", "Azul petróleo", 1, "oi-2"),
        itemFrom("porta-alho", "Verde", 1, "oi-3"),
      ],
      address: anaWork,
      shipping: sedex,
      coupons: [{ code: "PRINT10", type: "promocional", value: 10 }],
      payments: [{ cardId: "card-ana-1", last4: "1111", brand: "Visa", amount: 147.7 }],
      history: [
        event("EM_ABERTO", "2026-05-04T10:00:00.000Z", "cliente"),
        event("EM_PROCESSAMENTO", "2026-05-04T11:00:00.000Z", "admin"),
        event("PAGAMENTO_REALIZADO", "2026-05-04T11:20:00.000Z", "sistema"),
        event("EM_TRANSITO", "2026-05-05T08:40:00.000Z", "admin"),
      ],
    }),
    makeOrder({
      id: "3DS-100003",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-07-22T19:10:00.000Z",
      status: "EM_ABERTO",
      items: [itemFrom("luminaria-estrela", "Grafite", 1, "oi-4")],
      address: anaHome,
      shipping: pac,
      coupons: [],
      payments: [
        { cardId: "card-ana-1", last4: "1111", brand: "Visa", amount: 90 },
        { cardId: "card-ana-2", last4: "4444", brand: "Mastercard", amount: 82.8 },
      ],
    }),
    makeOrder({
      id: "3DS-100004",
      customerId: "cust-carla",
      customerEmail: "carla.mendes@email.com",
      customerName: "Carla Mendes",
      createdAt: "2026-04-18T13:00:00.000Z",
      status: "TROCA_SOLICITADA",
      items: [itemFrom("suporte-headset", "Azul e rosa", 1, "oi-5")],
      address: carlaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-carla-1", last4: "1881", brand: "Visa", amount: 77.8 }],
      exchangeItemId: "oi-5",
      exchangeQty: 1,
      history: [
        event("EM_ABERTO", "2026-04-18T13:00:00.000Z", "cliente"),
        event("EM_PROCESSAMENTO", "2026-04-18T15:00:00.000Z", "admin"),
        event("PAGAMENTO_REALIZADO", "2026-04-18T15:10:00.000Z", "sistema"),
        event("EM_TRANSITO", "2026-04-19T09:00:00.000Z", "admin"),
        event("ENTREGUE", "2026-04-25T18:00:00.000Z", "cliente"),
        event("TROCA_SOLICITADA", "2026-04-28T12:00:00.000Z", "cliente"),
      ],
    }),
    makeOrder({
      id: "3DS-100005",
      customerId: "cust-carla",
      customerEmail: "carla.mendes@email.com",
      customerName: "Carla Mendes",
      createdAt: "2026-06-09T16:40:00.000Z",
      status: "TROCA_ACEITA",
      items: [itemFrom("vasos-dino", "Verde lima", 1, "oi-6")],
      address: carlaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-carla-1", last4: "1881", brand: "Visa", amount: 92.8 }],
      exchangeItemId: "oi-6",
      exchangeQty: 1,
      history: [
        event("EM_ABERTO", "2026-06-09T16:40:00.000Z", "cliente"),
        event("EM_PROCESSAMENTO", "2026-06-09T17:00:00.000Z", "admin"),
        event("PAGAMENTO_REALIZADO", "2026-06-09T17:05:00.000Z", "sistema"),
        event("EM_TRANSITO", "2026-06-10T08:00:00.000Z", "admin"),
        event("ENTREGUE", "2026-06-16T10:00:00.000Z", "admin"),
        event("TROCA_SOLICITADA", "2026-06-18T09:00:00.000Z", "cliente"),
        event("TROCA_ACEITA", "2026-06-18T14:00:00.000Z", "admin"),
      ],
    }),
    makeOrder({
      id: "3DS-100006",
      customerId: "cust-carla",
      customerEmail: "carla.mendes@email.com",
      customerName: "Carla Mendes",
      createdAt: "2026-02-08T11:00:00.000Z",
      status: "ITEM_ENVIADO",
      items: [itemFrom("gancho-trex", "Verde", 2, "oi-7")],
      address: carlaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-carla-1", last4: "1881", brand: "Visa", amount: 82.7 }],
      exchangeItemId: "oi-7",
      exchangeQty: 1,
      history: [
        event("EM_ABERTO", "2026-02-08T11:00:00.000Z", "cliente"),
        event("EM_PROCESSAMENTO", "2026-02-08T12:00:00.000Z", "admin"),
        event("PAGAMENTO_REALIZADO", "2026-02-08T12:10:00.000Z", "sistema"),
        event("EM_TRANSITO", "2026-02-09T09:00:00.000Z", "admin"),
        event("ENTREGUE", "2026-02-15T11:00:00.000Z", "cliente"),
        event("TROCA_SOLICITADA", "2026-02-16T10:00:00.000Z", "cliente"),
        event("TROCA_ACEITA", "2026-02-16T15:00:00.000Z", "admin"),
        event("ITEM_ENVIADO", "2026-02-17T09:30:00.000Z", "cliente"),
      ],
    }),
    makeOrder({
      id: "3DS-100007",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-01-20T09:00:00.000Z",
      status: "ITEM_RECEBIDO",
      items: [itemFrom("luminaria-cao", "Areia", 1, "oi-8")],
      address: anaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-ana-1", last4: "1111", brand: "Visa", amount: 132.8 }],
      exchangeItemId: "oi-8",
      exchangeQty: 1,
      history: [
        event("EM_ABERTO", "2026-01-20T09:00:00.000Z", "cliente"),
        event("EM_PROCESSAMENTO", "2026-01-20T10:00:00.000Z", "admin"),
        event("PAGAMENTO_REALIZADO", "2026-01-20T10:05:00.000Z", "sistema"),
        event("EM_TRANSITO", "2026-01-21T08:00:00.000Z", "admin"),
        event("ENTREGUE", "2026-01-27T14:00:00.000Z", "cliente"),
        event("TROCA_SOLICITADA", "2026-01-28T09:00:00.000Z", "cliente"),
        event("TROCA_ACEITA", "2026-01-28T11:00:00.000Z", "admin"),
        event("ITEM_ENVIADO", "2026-01-29T10:00:00.000Z", "cliente"),
        event("ITEM_RECEBIDO", "2026-02-02T16:00:00.000Z", "admin"),
      ],
    }),
    makeOrder({
      id: "3DS-100008",
      customerId: "cust-bruno",
      customerEmail: "bruno.lima@email.com",
      customerName: "Bruno Lima",
      createdAt: "2026-08-02T15:30:00.000Z",
      status: "PAGAMENTO_REALIZADO",
      items: [itemFrom("aquario-r2d2", "Branco e azul", 1, "oi-9")],
      address: brunoHome,
      shipping: pacRj,
      coupons: [],
      payments: [{ cardId: "card-ana-1", last4: "0000", brand: "Visa", amount: 278.8 }],
      history: [
        event("EM_ABERTO", "2026-08-02T15:30:00.000Z", "cliente"),
        event("EM_PROCESSAMENTO", "2026-08-02T17:00:00.000Z", "admin"),
        event("PAGAMENTO_REALIZADO", "2026-08-02T17:00:05.000Z", "sistema"),
      ],
    }),
    makeOrder({
      id: "3DS-100009",
      customerId: "cust-carla",
      customerEmail: "carla.mendes@email.com",
      customerName: "Carla Mendes",
      createdAt: "2026-08-14T12:00:00.000Z",
      status: "PAGAMENTO_REALIZADO",
      items: [itemFrom("porta-chaves", "Cinza, azul, amarelo e vermelho", 1, "oi-10")],
      address: carlaHome,
      shipping: pac,
      coupons: [{ code: "ATELIE15", type: "promocional", value: 15 }],
      payments: [{ cardId: "card-carla-1", last4: "1881", brand: "Visa", amount: 37.8 }],
      history: [
        event("EM_ABERTO", "2026-08-14T12:00:00.000Z", "cliente"),
        event("EM_PROCESSAMENTO", "2026-08-14T13:00:00.000Z", "admin"),
        event("PAGAMENTO_REALIZADO", "2026-08-14T13:08:00.000Z", "sistema"),
      ],
    }),
    makeOrder({
      id: "3DS-100010",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-08-21T18:00:00.000Z",
      status: "CANCELADO",
      items: [itemFrom("escorredor-elefante", "Cinza", 1, "oi-11")],
      address: anaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-ana-2", last4: "4444", brand: "Mastercard", amount: 60.8 }],
      history: [
        event("EM_ABERTO", "2026-08-21T18:00:00.000Z", "cliente"),
        event("CANCELADO", "2026-08-21T18:20:00.000Z", "cliente"),
      ],
    }),
  ];

  return { customers, orders, coupons, catalog: cloneCatalog(), sessionId: null };
}

export function loadState(): CommerceState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as CommerceState;
    if (!parsed.customers?.length) return seedState();
    if (!parsed.catalog?.length) parsed.catalog = cloneCatalog();
    const orders = (parsed.orders ?? []).map((o) => settlePaymentIfDue(o));
    const changed = orders.some((o, i) => o.status !== parsed.orders[i]?.status);
    parsed.orders = orders;
    if (changed) saveState(parsed);
    return parsed;
  } catch {
    return seedState();
  }
}

export function saveState(state: CommerceState) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function toPublic(c: Customer): PublicUser {
  const { password, ...rest } = c;
  void password;
  return rest;
}

export function availableCoupons(coupons: Coupon[], email: string) {
  return coupons.filter((c) => {
    if (c.used) return false;
    if (c.type === "troca") return c.ownerEmail?.toLowerCase() === email.toLowerCase();
    return true;
  });
}

export type ChartPoint = { label: string; total: number; count: number };
export type CategoryBar = { id: CategoryId; label: string; total: number };

export function chartFromOrders(
  orders: Order[],
  categoryLabels: { id: CategoryId; label: string }[]
): { months: ChartPoint[]; categories: CategoryBar[] } {
  const paid = new Set<OrderStatus>([
    "PAGAMENTO_REALIZADO",
    "EM_TRANSITO",
    "ENTREGUE",
    "TROCA_SOLICITADA",
    "TROCA_ACEITA",
    "TROCA_NEGADA",
    "ITEM_ENVIADO",
    "ITEM_RECEBIDO",
    "TROCA_PROCESSADA",
  ]);
  const relevant = orders.filter((o) => paid.has(o.status));

  const monthMap = new Map<string, ChartPoint>();
  for (const o of relevant) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const cur = monthMap.get(key) ?? { label, total: 0, count: 0 };
    cur.total += o.total;
    cur.count += 1;
    monthMap.set(key, cur);
  }
  const months = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => v);

  const catMap = new Map<CategoryId, number>();
  for (const o of relevant) {
    for (const item of o.items) {
      catMap.set(item.category, (catMap.get(item.category) ?? 0) + item.line);
    }
  }
  const categories = categoryLabels.map((c) => ({
    id: c.id,
    label: c.label,
    total: catMap.get(c.id) ?? 0,
  }));

  return { months, categories };
}
