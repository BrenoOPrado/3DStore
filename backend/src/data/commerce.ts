import { getProduct, products as seedCatalog, type CategoryId, type Product } from "./products";
import { calculateShipping, type ShippingOption } from "./checkout";
import {
  DEFAULT_LOCK_MS,
  DRS_TRANSITIONS,
  type CartLock,
  type ExpiredCartItem,
  type StoreNotification,
} from "./orderFlow";
import {
  emptyModel,
  trainAiModel,
  type AiModel,
  type ChatFeedback,
} from "../ai/recommender";

export { DEFAULT_LOCK_MS };
export type { AiModel, ChatFeedback };

export type Role = "client" | "admin";
export type CustomerStatus = "ativo" | "inativo";
export type CouponType = "promocional" | "troca";

export type OrderStatus =
  | "EM_PROCESSAMENTO"
  | "APROVADA"
  | "REPROVADA"
  | "EM_TRANSPORTE"
  | "ENTREGUE"
  | "EM_TROCA"
  | "TROCA_AUTORIZADA"
  | "TROCADO";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  EM_PROCESSAMENTO: "Em processamento",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
  EM_TRANSPORTE: "Em transporte",
  ENTREGUE: "Entregue",
  EM_TROCA: "Em troca",
  TROCA_AUTORIZADA: "Troca autorizada",
  TROCADO: "Trocado",
};

export type AddressKind = "entrega" | "cobranca" | "ambos";

export type Address = {
  id: string;
  label: string;
  kind: AddressKind;
  residenceType: string;
  streetType: string;
  recipient: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  notes: string;
};

export type Card = {
  id: string;
  holder: string;
  number: string;
  last4: string;
  brand: string;
  expiry: string;
  preferred: boolean;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  password: string;
  cpf: string;
  phone: string;
  phoneType: string;
  phoneDdd: string;
  phoneNumber: string;
  gender: string;
  birthDate: string;
  status: CustomerStatus;
  role: Role;
  ranking: number;
  /** Preferências explícitas (chat / perfil). Histórico de compras também alimenta o modelo. */
  preferences?: string[];
  addresses: Address[];
  cards: Card[];
};

export type PublicUser = Omit<Customer, "password">;

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  /** Valor em reais (R$). */
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
  exchangeWhole?: boolean;
  exchangeCouponCode?: string;
  exchangeCouponValue?: number;
};

export const STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  EM_TRANSPORTE: "Despachar",
  ENTREGUE: "Confirmar entrega",
  TROCA_AUTORIZADA: "Autorizar troca",
  TROCADO: "Confirmar recebimento da troca",
};

export const STORE_KEY = "3dstore-commerce-v2";
export const SESSION_KEY = "3dstore-session-id";

export type AuditLog = {
  id: string;
  at: string;
  userId: string | null;
  userEmail: string;
  action: string;
  entity: string;
  payload: unknown;
};

export type CommerceState = {
  customers: Customer[];
  orders: Order[];
  coupons: Coupon[];
  catalog: Product[];
  logs: AuditLog[];
  sessionId: string | null;
  locks: CartLock[];
  expiredCart: ExpiredCartItem[];
  notifications: StoreNotification[];
  clockOffsetMs: number;
  lockTtlMs: number;
  chatFeedback: ChatFeedback[];
  aiModel: AiModel;
};

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function formatAddress(a: Address) {
  const streetType = a.streetType || "";
  const residence = a.residenceType || "";
  const country = a.country || "Brasil";
  const line1 = `${streetType} ${a.street}, ${a.number}${a.complement ? ` — ${a.complement}` : ""}`.trim();
  const line2 = `${a.neighborhood} · ${a.city}/${a.state} · ${country}`;
  return `${residence ? `${residence} · ` : ""}${line1}\n${line2}\nCEP ${a.cep}`;
}

export function addressDefaults(partial: Partial<Address> & Pick<Address, "id" | "label">): Address {
  return {
    kind: "ambos",
    residenceType: "Casa",
    streetType: "Rua",
    recipient: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    country: "Brasil",
    notes: "",
    ...partial,
  };
}

export function formatPercent(n: number) {
  return `${n}%`;
}

export function couponPercentSum(coupons: { value: number }[]) {
  return Math.round(coupons.reduce((s, c) => s + Math.max(0, Number(c.value) || 0), 0) * 100) / 100;
}

export function couponDiscount(payable: number, coupons: { value: number }[]) {
  const sum = couponPercentSum(coupons);
  return Math.min(Math.round((Number(payable) || 0) * 100) / 100, sum);
}

export function migrateAddress(a: Partial<Address> & Pick<Address, "id" | "label">): Address {
  return addressDefaults(a);
}

export function migrateCustomer(c: Customer): Customer {
  const fromPhone = (c.phoneNumber || c.phone || "").replace(/\D/g, "");
  const cards = (c.cards ?? []).map((card, i) => ({
    ...card,
    preferred: card.preferred ?? i === 0,
  }));
  return {
    ...c,
    phoneType: c.phoneType || "celular",
    phoneDdd: c.phoneDdd || fromPhone.slice(0, 2) || "11",
    phoneNumber: c.phoneNumber || fromPhone.slice(2),
    ranking: c.ranking ?? 0,
    preferences: c.preferences ?? [],
    addresses: (c.addresses ?? []).map((a) => migrateAddress(a)),
    cards,
  };
}

export function addressLabelTaken(addresses: Address[], label: string, exceptId?: string) {
  const n = label.trim().toLowerCase();
  if (!n) return false;
  return addresses.some((a) => a.id !== exceptId && a.label.trim().toLowerCase() === n);
}

const STOCK_BY_ID: Record<string, number> = {
  "gancho-trex": 8,
  "porta-alho": 8,
  "escorredor-elefante": 1,
  "dragao-articulado": 12,
  "chaveiro-flexi-dino": 40,
  "busto-guerreiro": 10,
};

export function cloneCatalog(): Product[] {
  return seedCatalog.map((p) => ({
    ...p,
    colors: [...p.colors],
    stock: p.stock ?? STOCK_BY_ID[p.id] ?? 20,
    status: p.status ?? "ativo",
  }));
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
  if (d.startsWith("34") || d.startsWith("37")) return "American Express";
  if (d.startsWith("4")) return "Visa";
  if (d.startsWith("5")) return "Mastercard";
  if (d.startsWith("6")) return "Elo";
  return "";
}

export function customerRanking(orders: { customerId: string; status: OrderStatus }[], customerId: string) {
  return orders.filter((o) => o.customerId === customerId && o.status !== "REPROVADA").length;
}

export function isPickup(order: Pick<Order, "shipping">) {
  return order.shipping.id === "retirada";
}

export function adminTransitions(status: OrderStatus, _order?: Pick<Order, "shipping">): OrderStatus[] {
  return DRS_TRANSITIONS[status] ? [...DRS_TRANSITIONS[status]!] : [];
}

export function adminWaitingMessage(status: OrderStatus, _order?: Pick<Order, "shipping">): string | null {
  if (status === "EM_PROCESSAMENTO") {
    return "O sistema está validando o pagamento.";
  }
  if (status === "APROVADA") return "Selecione a venda para despacho (EM TRANSPORTE).";
  if (status === "EM_TRANSPORTE") return "Confirme a entrega para marcar como ENTREGUE.";
  if (status === "EM_TROCA") return "Visualize e autorize a troca.";
  if (status === "TROCA_AUTORIZADA") return "Confirme o recebimento dos itens da troca.";
  return null;
}

export function canRequestExchange(status: OrderStatus) {
  return status === "ENTREGUE";
}

export function migrateOrderStatus(status: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    EM_ABERTO: "EM_PROCESSAMENTO",
    PAGAMENTO_REALIZADO: "APROVADA",
    EM_TRANSITO: "EM_TRANSPORTE",
    CANCELADO: "REPROVADA",
    TROCA_SOLICITADA: "EM_TROCA",
    TROCA_ACEITA: "TROCA_AUTORIZADA",
    TROCA_NEGADA: "ENTREGUE",
    ITEM_ENVIADO: "TROCA_AUTORIZADA",
    ITEM_RECEBIDO: "TROCA_AUTORIZADA",
    TROCA_PROCESSADA: "TROCADO",
  };
  return (map[status] ?? status) as OrderStatus;
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

const SAFE_2026_CHART_CATEGORIES = new Set<CategoryId>([
  "games",
  "cutelaria",
  "acessorios",
  "action-figures",
]);

function buildTrafficOrders(
  paidFlow: (start: string, processAt: string, approveAt: string, shipAt?: string, deliverAt?: string) => StatusEvent[],
  pac: ShippingOption,
  sedex: ShippingOption,
  pacRj: ShippingOption
): Order[] {
  const rand = mulberry32(20250101);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]!;
  const addHours = (iso: string, hours: number) => new Date(new Date(iso).getTime() + hours * 3600 * 1000).toISOString();
  const addDays = (iso: string, days: number) => addHours(iso, days * 24);
  const catalog = seedCatalog.filter((p) => p.colors.length > 0);
  const safeCatalog = catalog.filter((p) => SAFE_2026_CHART_CATEGORIES.has(p.category));
  const pickup = calculateShipping("01310100")[2];
  const pacMg = calculateShipping("30130141")[0];
  const sedexMg = calculateShipping("30130141")[1];
  const pacPr = calculateShipping("80020320")[0];
  const buyers = [
    {
      id: "cust-ana",
      email: "ana.souza@email.com",
      name: "Ana Souza",
      address: anaHome,
      card: { cardId: "card-ana-1", last4: "1111", brand: "Visa" },
      ships: [pac, sedex, pickup],
      weight: 26,
    },
    {
      id: "cust-carla",
      email: "carla.mendes@email.com",
      name: "Carla Mendes",
      address: carlaHome,
      card: { cardId: "card-carla-1", last4: "1881", brand: "Visa" },
      ships: [pac, sedex],
      weight: 20,
    },
    {
      id: "cust-diego",
      email: "diego.alves@email.com",
      name: "Diego Alves",
      address: diegoHome,
      card: { cardId: "card-diego-1", last4: "1111", brand: "Visa" },
      ships: [pac, sedex, pickup],
      weight: 20,
    },
    {
      id: "cust-fernanda",
      email: "fernanda.costa@email.com",
      name: "Fernanda Costa",
      address: fernandaHome,
      card: { cardId: "card-fernanda-1", last4: "4444", brand: "Mastercard" },
      ships: [pacMg, sedexMg],
      weight: 18,
    },
    {
      id: "cust-rafael",
      email: "rafael.nunes@email.com",
      name: "Rafael Nunes",
      address: rafaelHome,
      card: { cardId: "card-rafael-1", last4: "1881", brand: "Visa" },
      ships: [pacPr, calculateShipping("80020320")[1]],
      weight: 12,
    },
    {
      id: "cust-bruno",
      email: "bruno.lima@email.com",
      name: "Bruno Lima",
      address: brunoHome,
      card: { cardId: "card-bruno-1", last4: "0000", brand: "Visa" },
      ships: [pacRj],
      weight: 4,
    },
  ];
  const weightSum = buyers.reduce((s, b) => s + b.weight, 0);
  const pickBuyer = () => {
    let n = rand() * weightSum;
    for (const b of buyers) {
      n -= b.weight;
      if (n <= 0) return b;
    }
    return buyers[0];
  };

  const startMs = Date.UTC(2025, 0, 1, 12, 0, 0);
  const endMs = Date.UTC(2026, 10, 8, 20, 0, 0);
  const nowMs = Date.UTC(2026, 10, 9, 12, 0, 0);

  const orders: Order[] = [];
  for (let i = 0; i < 100; i++) {
    const t = rand() ** 0.72;
    const createdMs = startMs + t * (endMs - startMs);
    const created = new Date(createdMs);
    const hour = 11 + Math.floor(rand() * 10);
    const minute = Math.floor(rand() * 60);
    const createdAt = new Date(
      Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate(), hour, minute, 0)
    ).toISOString();
    const year = created.getUTCFullYear();
    const ageDays = (nowMs - createdMs) / 86400000;
    const wantDelivered = ageDays > 12 && rand() > 0.18;
    const productPool = year === 2026 && wantDelivered ? safeCatalog : catalog;
    const first = pick(productPool);
    const items = [
      itemFrom(first.id, pick(first.colors), rand() < 0.18 ? 2 : 1, `oi-t-${i}-a`),
    ];
    if (rand() < 0.16) {
      const extraPool = year === 2026 && wantDelivered ? safeCatalog : catalog;
      const second = pick(extraPool.filter((p) => p.id !== first.id));
      items.push(itemFrom(second.id, pick(second.colors), 1, `oi-t-${i}-b`));
    }

    let status: OrderStatus = "ENTREGUE";
    if (ageDays < 2) status = rand() < 0.55 ? "EM_PROCESSAMENTO" : "APROVADA";
    else if (ageDays < 8) status = rand() < 0.35 ? "APROVADA" : rand() < 0.7 ? "EM_TRANSPORTE" : "ENTREGUE";
    else if (rand() < 0.06) status = "REPROVADA";
    else if (rand() < 0.05) status = "TROCADO";
    else if (rand() < 0.04) status = "EM_TROCA";
    else if (rand() < 0.04) status = "TROCA_AUTORIZADA";
    else if (rand() < 0.08) status = "APROVADA";
    else if (rand() < 0.06) status = "EM_TRANSPORTE";
    else status = "ENTREGUE";

    const risky2026 = year === 2026 && items.some((it) => !SAFE_2026_CHART_CATEGORIES.has(it.category));
    if (status === "ENTREGUE" && risky2026) {
      status = ageDays < 20 ? "EM_TRANSPORTE" : "APROVADA";
    }

    const buyer = pickBuyer();
    const processAt = addHours(createdAt, 0.02);
    const approveAt = addHours(createdAt, 0.04);
    const shipAt = addDays(createdAt, 1 + Math.floor(rand() * 2));
    const deliverAt = addDays(createdAt, 5 + Math.floor(rand() * 6));
    let history: StatusEvent[];
    if (status === "EM_PROCESSAMENTO") {
      history = [event("EM_PROCESSAMENTO", createdAt, "cliente")];
    } else if (status === "REPROVADA") {
      history = [event("EM_PROCESSAMENTO", createdAt, "cliente"), event("REPROVADA", approveAt, "sistema")];
    } else if (status === "APROVADA") {
      history = paidFlow(createdAt, processAt, approveAt);
    } else if (status === "EM_TRANSPORTE") {
      history = paidFlow(createdAt, processAt, approveAt, shipAt);
    } else if (status === "ENTREGUE") {
      history = paidFlow(createdAt, processAt, approveAt, shipAt, deliverAt);
    } else if (status === "EM_TROCA") {
      history = [
        ...paidFlow(createdAt, processAt, approveAt, shipAt, deliverAt),
        event("EM_TROCA", addDays(deliverAt, 2), "cliente"),
      ];
    } else if (status === "TROCA_AUTORIZADA") {
      history = [
        ...paidFlow(createdAt, processAt, approveAt, shipAt, deliverAt),
        event("EM_TROCA", addDays(deliverAt, 2), "cliente"),
        event("TROCA_AUTORIZADA", addDays(deliverAt, 2.4), "admin"),
      ];
    } else {
      history = [
        ...paidFlow(createdAt, processAt, approveAt, shipAt, deliverAt),
        event("EM_TROCA", addDays(deliverAt, 2), "cliente"),
        event("TROCA_AUTORIZADA", addDays(deliverAt, 2.3), "admin"),
        event("TROCADO", addDays(deliverAt, 6), "admin"),
      ];
    }

    const coupons =
      rand() < 0.12 && status !== "REPROVADA"
        ? [{ code: "PRINT10", type: "promocional" as const, value: 10 }]
        : [];
    const order = makeOrder({
      id: `3DS-${100014 + i}`,
      customerId: buyer.id,
      customerEmail: buyer.email,
      customerName: buyer.name,
      createdAt,
      status,
      items,
      address: buyer.address,
      shipping: pick(buyer.ships),
      coupons,
      payments: [{ ...buyer.card, amount: 0 }],
      history,
      ...(status === "EM_TROCA" || status === "TROCA_AUTORIZADA" || status === "TROCADO"
        ? { exchangeItemId: items[0].id, exchangeQty: 1 }
        : {}),
    });
    order.payments[0].amount = order.total;
    orders.push(order);
  }
  return orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

const anaHome: Address = addressDefaults({
  id: "addr-ana-1",
  label: "Casa",
  kind: "ambos",
  residenceType: "Apartamento",
  streetType: "Rua",
  recipient: "Ana Souza",
  phone: "(11) 98888-1234",
  cep: "01310-100",
  street: "Augusta",
  number: "1500",
  complement: "Apto 42",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
});

const anaWork: Address = addressDefaults({
  id: "addr-ana-2",
  label: "Trabalho",
  kind: "entrega",
  residenceType: "Comercial",
  streetType: "Avenida",
  recipient: "Ana Souza",
  phone: "(11) 98888-1234",
  cep: "01311-200",
  street: "Paulista",
  number: "1578",
  complement: "Conj. 101",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
});

const carlaHome: Address = addressDefaults({
  id: "addr-carla-1",
  label: "Casa",
  kind: "ambos",
  recipient: "Carla Mendes",
  phone: "(11) 97777-2222",
  cep: "04038-001",
  streetType: "Rua",
  street: "Domingos de Morais",
  number: "2564",
  neighborhood: "Vila Mariana",
  city: "São Paulo",
  state: "SP",
});

const brunoHome: Address = addressDefaults({
  id: "addr-bruno-1",
  label: "Casa",
  kind: "ambos",
  recipient: "Bruno Lima",
  phone: "(21) 98888-0000",
  cep: "22041-080",
  streetType: "Rua",
  street: "Barata Ribeiro",
  number: "370",
  complement: "501",
  neighborhood: "Copacabana",
  city: "Rio de Janeiro",
  state: "RJ",
});

const diegoHome: Address = addressDefaults({
  id: "addr-diego-1",
  label: "Casa",
  kind: "ambos",
  recipient: "Diego Alves",
  phone: "(11) 99111-3344",
  cep: "05422-030",
  streetType: "Rua",
  street: "Teodoro Sampaio",
  number: "1020",
  neighborhood: "Pinheiros",
  city: "São Paulo",
  state: "SP",
});

const fernandaHome: Address = addressDefaults({
  id: "addr-fernanda-1",
  label: "Casa",
  kind: "ambos",
  recipient: "Fernanda Costa",
  phone: "(31) 99876-2211",
  cep: "30130-141",
  streetType: "Avenida",
  street: "Afonso Pena",
  number: "867",
  complement: "Sala 3",
  neighborhood: "Centro",
  city: "Belo Horizonte",
  state: "MG",
});

const rafaelHome: Address = addressDefaults({
  id: "addr-rafael-1",
  label: "Casa",
  kind: "ambos",
  recipient: "Rafael Nunes",
  phone: "(41) 98765-0099",
  cep: "80020-320",
  streetType: "Rua",
  street: "XV de Novembro",
  number: "412",
  neighborhood: "Centro",
  city: "Curitiba",
  state: "PR",
});

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedCpf(base9: string) {
  const n = base9.replace(/\D/g, "").padStart(9, "0").slice(-9);
  const digit = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factor - i);
    const rest = (sum * 10) % 11;
    return String(rest === 10 ? 0 : rest);
  };
  const d1 = digit(n, 10);
  return n + d1 + digit(n + d1, 11);
}

export function seedState(): CommerceState {
  const customers: Customer[] = [
    {
      id: "cust-admin",
      name: "Administrador",
      email: "admin@3dstore.com",
      password: "admin123",
      cpf: "86288366757",
      phone: "(11) 3000-0000",
      phoneType: "fixo",
      phoneDdd: "11",
      phoneNumber: "30000000",
      gender: "Prefiro não informar",
      birthDate: "1990-01-01",
      status: "ativo",
      role: "admin",
      ranking: 0,
      addresses: [],
      cards: [],
    },
    {
      id: "cust-ana",
      name: "Ana Souza",
      email: "ana.souza@email.com",
      password: "123456",
      cpf: "52998224725",
      phone: "(11) 98888-1234",
      phoneType: "celular",
      phoneDdd: "11",
      phoneNumber: "988881234",
      gender: "Feminino",
      birthDate: "1994-05-12",
      status: "ativo",
      role: "client",
      ranking: 0,
      preferences: ["games", "dinossauro", "utilitarios"],
      addresses: [anaHome, anaWork],
      cards: [
        {
          id: "card-ana-1",
          holder: "ANA SOUZA",
          number: "4111111111111111",
          last4: "1111",
          brand: "Visa",
          expiry: "12/28",
          preferred: true,
        },
        {
          id: "card-ana-2",
          holder: "ANA SOUZA",
          number: "5555555555554444",
          last4: "4444",
          brand: "Mastercard",
          expiry: "08/27",
          preferred: false,
        },
      ],
    },
    {
      id: "cust-carla",
      name: "Carla Mendes",
      email: "carla.mendes@email.com",
      password: "123456",
      cpf: "39053344705",
      phone: "(11) 97777-2222",
      phoneType: "celular",
      phoneDdd: "11",
      phoneNumber: "977772222",
      gender: "Feminino",
      birthDate: "1988-11-03",
      status: "ativo",
      role: "client",
      ranking: 0,
      preferences: ["vasos", "decoracao", "luminaria"],
      addresses: [carlaHome],
      cards: [
        {
          id: "card-carla-1",
          holder: "CARLA MENDES",
          number: "4012888888881881",
          last4: "1881",
          brand: "Visa",
          expiry: "03/29",
          preferred: true,
        },
      ],
    },
    {
      id: "cust-bruno",
      name: "Bruno Lima",
      email: "bruno.lima@email.com",
      password: "123456",
      cpf: "15350946056",
      phone: "(21) 98888-0000",
      phoneType: "celular",
      phoneDdd: "21",
      phoneNumber: "988880000",
      gender: "Masculino",
      birthDate: "1991-07-20",
      status: "inativo",
      role: "client",
      ranking: 0,
      addresses: [brunoHome],
      cards: [],
    },
    {
      id: "cust-diego",
      name: "Diego Alves",
      email: "diego.alves@email.com",
      password: "123456",
      cpf: seedCpf("482365910"),
      phone: "(11) 99111-3344",
      phoneType: "celular",
      phoneDdd: "11",
      phoneNumber: "991113344",
      gender: "Masculino",
      birthDate: "1992-03-14",
      status: "ativo",
      role: "client",
      ranking: 0,
      addresses: [diegoHome],
      cards: [
        {
          id: "card-diego-1",
          holder: "DIEGO ALVES",
          number: "4111111111111111",
          last4: "1111",
          brand: "Visa",
          expiry: "09/29",
          preferred: true,
        },
      ],
    },
    {
      id: "cust-fernanda",
      name: "Fernanda Costa",
      email: "fernanda.costa@email.com",
      password: "123456",
      cpf: seedCpf("609184237"),
      phone: "(31) 99876-2211",
      phoneType: "celular",
      phoneDdd: "31",
      phoneNumber: "998762211",
      gender: "Feminino",
      birthDate: "1989-08-22",
      status: "ativo",
      role: "client",
      ranking: 0,
      addresses: [fernandaHome],
      cards: [
        {
          id: "card-fernanda-1",
          holder: "FERNANDA COSTA",
          number: "5555555555554444",
          last4: "4444",
          brand: "Mastercard",
          expiry: "11/28",
          preferred: true,
        },
      ],
    },
    {
      id: "cust-rafael",
      name: "Rafael Nunes",
      email: "rafael.nunes@email.com",
      password: "123456",
      cpf: seedCpf("375820146"),
      phone: "(41) 98765-0099",
      phoneType: "celular",
      phoneDdd: "41",
      phoneNumber: "987650099",
      gender: "Masculino",
      birthDate: "1996-12-02",
      status: "ativo",
      role: "client",
      ranking: 0,
      addresses: [rafaelHome],
      cards: [
        {
          id: "card-rafael-1",
          holder: "RAFAEL NUNES",
          number: "4012888888881881",
          last4: "1881",
          brand: "Visa",
          expiry: "04/30",
          preferred: true,
        },
      ],
    },
  ];

  const coupons: Coupon[] = [
    {
      id: "c-welcome",
      code: "BEMVINDO20",
      type: "promocional",
      value: 20,
      used: false,
      description: "R$ 20,00 de desconto promocional",
    },
    {
      id: "c-print",
      code: "PRINT10",
      type: "promocional",
      value: 10,
      used: false,
      description: "R$ 10,00 de desconto promocional",
    },
    {
      id: "c-promo30",
      code: "PROMO30",
      type: "promocional",
      value: 30,
      used: false,
      description: "R$ 30,00 de desconto promocional",
    },
    {
      id: "c-atelier",
      code: "ATELIE15",
      type: "promocional",
      value: 15,
      used: false,
      description: "R$ 15,00 de desconto promocional",
    },
    {
      id: "c-ana-troca",
      code: "TROCA-ANA-64",
      type: "troca",
      value: 15,
      ownerEmail: "ana.souza@email.com",
      used: false,
      description: "R$ 15,00 de cupom de troca",
    },
    {
      id: "c-ana-20",
      code: "TROCA20",
      type: "troca",
      value: 20,
      ownerEmail: "ana.souza@email.com",
      used: false,
      description: "R$ 20,00 de cupom de troca",
    },
    {
      id: "c-ana-40",
      code: "TROCA40",
      type: "troca",
      value: 40,
      ownerEmail: "ana.souza@email.com",
      used: false,
      description: "R$ 40,00 de cupom de troca",
    },
    {
      id: "c-ana-35",
      code: "TROCA35",
      type: "troca",
      value: 35,
      ownerEmail: "ana.souza@email.com",
      used: false,
      description: "R$ 35,00 de cupom de troca",
    },
  ];

  const pac = calculateShipping("01310100")[0];
  const sedex = calculateShipping("01310100")[1];
  const pacRj = calculateShipping("22041080")[0];

  const paidFlow = (
    start: string,
    processAt: string,
    approveAt: string,
    shipAt?: string,
    deliverAt?: string
  ): StatusEvent[] => {
    const hist: StatusEvent[] = [
      event("EM_PROCESSAMENTO", start, "cliente"),
      event("APROVADA", approveAt, "sistema"),
    ];
    if (shipAt) hist.push(event("EM_TRANSPORTE", shipAt, "admin"));
    if (deliverAt) hist.push(event("ENTREGUE", deliverAt, "admin"));
    void processAt;
    return hist;
  };

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
      history: paidFlow(
        "2026-03-12T14:20:00.000Z",
        "2026-03-12T14:20:01.000Z",
        "2026-03-12T14:20:02.000Z",
        "2026-03-13T09:00:00.000Z",
        "2026-03-18T11:30:00.000Z"
      ),
    }),
    makeOrder({
      id: "3DS-100002",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-05-04T10:00:00.000Z",
      status: "APROVADA",
      items: [
        itemFrom("filtro-dino", "Azul petróleo", 1, "oi-2"),
        itemFrom("porta-alho", "Verde", 1, "oi-3"),
      ],
      address: anaWork,
      shipping: sedex,
      coupons: [{ code: "PRINT10", type: "promocional", value: 10 }],
      payments: [{ cardId: "card-ana-1", last4: "1111", brand: "Visa", amount: 147.7 }],
      history: paidFlow("2026-05-04T10:00:00.000Z", "2026-05-04T10:00:01.000Z", "2026-05-04T10:00:02.000Z"),
    }),
    makeOrder({
      id: "3DS-100003",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-07-22T19:10:00.000Z",
      status: "EM_PROCESSAMENTO",
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
      status: "EM_TROCA",
      items: [itemFrom("suporte-headset", "Azul e rosa", 1, "oi-5")],
      address: carlaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-carla-1", last4: "1881", brand: "Visa", amount: 77.8 }],
      exchangeItemId: "oi-5",
      exchangeQty: 1,
      history: [
        ...paidFlow(
          "2026-04-18T13:00:00.000Z",
          "2026-04-18T13:00:01.000Z",
          "2026-04-18T13:00:02.000Z",
          "2026-04-19T09:00:00.000Z",
          "2026-04-25T18:00:00.000Z"
        ),
        event("EM_TROCA", "2026-04-28T12:00:00.000Z", "cliente"),
      ],
    }),
    makeOrder({
      id: "3DS-100005",
      customerId: "cust-carla",
      customerEmail: "carla.mendes@email.com",
      customerName: "Carla Mendes",
      createdAt: "2026-06-09T16:40:00.000Z",
      status: "TROCA_AUTORIZADA",
      items: [itemFrom("vasos-dino", "Verde lima", 1, "oi-6")],
      address: carlaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-carla-1", last4: "1881", brand: "Visa", amount: 92.8 }],
      exchangeItemId: "oi-6",
      exchangeQty: 1,
      history: [
        ...paidFlow(
          "2026-06-09T16:40:00.000Z",
          "2026-06-09T16:40:01.000Z",
          "2026-06-09T16:40:02.000Z",
          "2026-06-10T08:00:00.000Z",
          "2026-06-16T10:00:00.000Z"
        ),
        event("EM_TROCA", "2026-06-18T09:00:00.000Z", "cliente"),
        event("TROCA_AUTORIZADA", "2026-06-18T14:00:00.000Z", "admin"),
      ],
    }),
    makeOrder({
      id: "3DS-100006",
      customerId: "cust-carla",
      customerEmail: "carla.mendes@email.com",
      customerName: "Carla Mendes",
      createdAt: "2026-02-08T11:00:00.000Z",
      status: "ENTREGUE",
      items: [itemFrom("gancho-trex", "Verde", 2, "oi-7")],
      address: carlaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-carla-1", last4: "1881", brand: "Visa", amount: 82.7 }],
      history: paidFlow(
        "2026-02-08T11:00:00.000Z",
        "2026-02-08T11:00:01.000Z",
        "2026-02-08T11:00:02.000Z",
        "2026-02-09T09:00:00.000Z",
        "2026-02-15T11:00:00.000Z"
      ),
    }),
    makeOrder({
      id: "3DS-100007",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-01-20T09:00:00.000Z",
      status: "TROCADO",
      items: [itemFrom("luminaria-cao", "Areia", 1, "oi-8")],
      address: anaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-ana-1", last4: "1111", brand: "Visa", amount: 132.8 }],
      exchangeItemId: "oi-8",
      exchangeQty: 1,
      exchangeWhole: false,
      exchangeCouponCode: "TROCA-ANA-64",
      exchangeCouponValue: 15,
      history: [
        ...paidFlow(
          "2026-01-20T09:00:00.000Z",
          "2026-01-20T09:00:01.000Z",
          "2026-01-20T09:00:02.000Z",
          "2026-01-21T08:00:00.000Z",
          "2026-01-27T14:00:00.000Z"
        ),
        event("EM_TROCA", "2026-01-28T09:00:00.000Z", "cliente"),
        event("TROCA_AUTORIZADA", "2026-01-28T11:00:00.000Z", "admin"),
        event("TROCADO", "2026-02-02T16:00:00.000Z", "admin"),
      ],
    }),
    makeOrder({
      id: "3DS-100008",
      customerId: "cust-bruno",
      customerEmail: "bruno.lima@email.com",
      customerName: "Bruno Lima",
      createdAt: "2026-08-02T15:30:00.000Z",
      status: "APROVADA",
      items: [itemFrom("aquario-r2d2", "Branco e azul", 1, "oi-9")],
      address: brunoHome,
      shipping: pacRj,
      coupons: [],
      payments: [{ cardId: "card-ana-1", last4: "0000", brand: "Visa", amount: 278.8 }],
      history: paidFlow("2026-08-02T15:30:00.000Z", "2026-08-02T15:30:01.000Z", "2026-08-02T15:30:02.000Z"),
    }),
    makeOrder({
      id: "3DS-100009",
      customerId: "cust-carla",
      customerEmail: "carla.mendes@email.com",
      customerName: "Carla Mendes",
      createdAt: "2026-08-14T12:00:00.000Z",
      status: "APROVADA",
      items: [itemFrom("porta-chaves", "Cinza, azul, amarelo e vermelho", 1, "oi-10")],
      address: carlaHome,
      shipping: pac,
      coupons: [{ code: "ATELIE15", type: "promocional", value: 15 }],
      payments: [{ cardId: "card-carla-1", last4: "1881", brand: "Visa", amount: 37.8 }],
      history: paidFlow("2026-08-14T12:00:00.000Z", "2026-08-14T12:00:01.000Z", "2026-08-14T12:00:02.000Z"),
    }),
    makeOrder({
      id: "3DS-100010",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-08-21T18:00:00.000Z",
      status: "REPROVADA",
      items: [itemFrom("escorredor-elefante", "Cinza", 1, "oi-11")],
      address: anaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-ana-3", last4: "0002", brand: "Visa", amount: 60.8 }],
      history: [
        event("EM_PROCESSAMENTO", "2026-08-21T18:00:00.000Z", "cliente"),
        event("REPROVADA", "2026-08-21T18:00:02.000Z", "sistema"),
      ],
    }),
    makeOrder({
      id: "3DS-100011",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-05-18T11:00:00.000Z",
      status: "ENTREGUE",
      items: [itemFrom("filtro-dino", "Verde", 1, "oi-12")],
      address: anaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-ana-1", last4: "1111", brand: "Visa", amount: 102.8 }],
      history: paidFlow(
        "2026-05-18T11:00:00.000Z",
        "2026-05-18T11:00:01.000Z",
        "2026-05-18T11:00:02.000Z",
        "2026-05-19T09:00:00.000Z",
        "2026-05-25T16:00:00.000Z"
      ),
    }),
    makeOrder({
      id: "3DS-100012",
      customerId: "cust-carla",
      customerEmail: "carla.mendes@email.com",
      customerName: "Carla Mendes",
      createdAt: "2026-06-22T14:00:00.000Z",
      status: "ENTREGUE",
      items: [itemFrom("luminaria-estrela", "Grafite", 1, "oi-13")],
      address: carlaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-carla-1", last4: "1881", brand: "Visa", amount: 172.8 }],
      history: paidFlow(
        "2026-06-22T14:00:00.000Z",
        "2026-06-22T14:00:01.000Z",
        "2026-06-22T14:00:02.000Z",
        "2026-06-23T09:00:00.000Z",
        "2026-06-28T12:00:00.000Z"
      ),
    }),
    makeOrder({
      id: "3DS-100013",
      customerId: "cust-ana",
      customerEmail: "ana.souza@email.com",
      customerName: "Ana Souza",
      createdAt: "2026-01-08T10:00:00.000Z",
      status: "ENTREGUE",
      items: [itemFrom("vasos-dino", "Turquesa", 1, "oi-14")],
      address: anaHome,
      shipping: pac,
      coupons: [],
      payments: [{ cardId: "card-ana-1", last4: "1111", brand: "Visa", amount: 92.8 }],
      history: paidFlow(
        "2026-01-08T10:00:00.000Z",
        "2026-01-08T10:00:01.000Z",
        "2026-01-08T10:00:02.000Z",
        "2026-01-09T09:00:00.000Z",
        "2026-01-14T11:00:00.000Z"
      ),
    }),
    ...buildTrafficOrders(paidFlow, pac, sedex, pacRj),
  ];

  const catalog = cloneCatalog();
  const chatFeedback: ChatFeedback[] = [
    {
      id: "fb-1",
      customerId: "cust-ana",
      messageId: "seed-ana-1",
      query: "suporte para headset gamer",
      reply: "Indiquei suporte de headset e torre de controles.",
      useful: true,
      productIds: ["suporte-headset", "torre-controles"],
      at: "2025-06-12T15:00:00.000Z",
    },
    {
      id: "fb-2",
      customerId: "cust-ana",
      messageId: "seed-ana-2",
      query: "filtro dinossauro mesa",
      reply: "Indiquei filtro-dino e gancho T-Rex.",
      useful: true,
      productIds: ["filtro-dino", "gancho-trex"],
      at: "2025-08-03T11:20:00.000Z",
    },
    {
      id: "fb-3",
      customerId: "cust-ana",
      messageId: "seed-ana-3",
      query: "vaso zen para suculenta",
      reply: "Sugeri vaso zen.",
      useful: false,
      productIds: ["vaso-zen"],
      at: "2025-09-18T09:40:00.000Z",
    },
    {
      id: "fb-4",
      customerId: "cust-ana",
      messageId: "seed-ana-4",
      query: "chaveiro articulado dino",
      reply: "Indiquei chaveiro flexi dino.",
      useful: true,
      productIds: ["chaveiro-flexi-dino"],
      at: "2026-02-02T14:10:00.000Z",
    },
    {
      id: "fb-5",
      customerId: "cust-carla",
      messageId: "seed-carla-1",
      query: "vaso para suculenta",
      reply: "Indiquei vasos dino e kit cogumelo.",
      useful: true,
      productIds: ["vasos-dino", "kit-vasos-cogumelo"],
      at: "2025-05-22T16:00:00.000Z",
    },
    {
      id: "fb-6",
      customerId: "cust-carla",
      messageId: "seed-carla-2",
      query: "luminária para mesa",
      reply: "Indiquei luminária estrela e lua.",
      useful: true,
      productIds: ["luminaria-estrela", "luminaria-lua"],
      at: "2025-07-09T10:30:00.000Z",
    },
    {
      id: "fb-7",
      customerId: "cust-carla",
      messageId: "seed-carla-3",
      query: "torre de dados rpg",
      reply: "Indiquei torre de dados dragão.",
      useful: false,
      productIds: ["torre-dados-dragao"],
      at: "2025-10-01T19:00:00.000Z",
    },
    {
      id: "fb-8",
      customerId: "cust-carla",
      messageId: "seed-carla-4",
      query: "decoração geek escritório",
      reply: "Indiquei aquário R2-D2 e luminária estrela.",
      useful: true,
      productIds: ["aquario-r2d2", "luminaria-estrela"],
      at: "2026-03-14T13:45:00.000Z",
    },
    {
      id: "fb-9",
      customerId: "cust-diego",
      messageId: "seed-diego-1",
      query: "action figure guerreiro",
      reply: "Indiquei busto e mini cavaleiro.",
      useful: true,
      productIds: ["busto-guerreiro", "mini-cavaleiro"],
      at: "2025-11-20T12:00:00.000Z",
    },
    {
      id: "fb-10",
      customerId: "cust-fernanda",
      messageId: "seed-fer-1",
      query: "organizador de cabos mesa",
      reply: "Indiquei organizador e dock.",
      useful: true,
      productIds: ["organizador-cabos", "dock-celular"],
      at: "2026-01-28T17:20:00.000Z",
    },
  ];
  const aiModel = trainAiModel(orders, chatFeedback, catalog, emptyModel());

  return {
    customers,
    orders,
    coupons,
    catalog,
    logs: [],
    sessionId: null,
    locks: [],
    expiredCart: [],
    notifications: [],
    clockOffsetMs: 0,
    lockTtlMs: DEFAULT_LOCK_MS,
    chatFeedback,
    aiModel,
  };
}

export function loadState(): CommerceState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as CommerceState;
    if (!parsed.customers?.length) return seedState();
    parsed.customers = parsed.customers.map((c) => migrateCustomer(c));
    if (!parsed.catalog?.length) parsed.catalog = cloneCatalog();
    parsed.orders = (parsed.orders ?? []).map((o) => ({
      ...o,
      status: migrateOrderStatus(o.status),
      history: (o.history ?? []).map((h) => ({ ...h, status: migrateOrderStatus(h.status) })),
    }));
    parsed.locks = parsed.locks ?? [];
    parsed.expiredCart = parsed.expiredCart ?? [];
    parsed.notifications = parsed.notifications ?? [];
    parsed.clockOffsetMs = parsed.clockOffsetMs ?? 0;
    parsed.lockTtlMs = parsed.lockTtlMs ?? DEFAULT_LOCK_MS;
    parsed.chatFeedback = parsed.chatFeedback?.length
      ? parsed.chatFeedback
      : seedState().chatFeedback;
    parsed.aiModel =
      parsed.aiModel?.version > 0
        ? parsed.aiModel
        : trainAiModel(parsed.orders, parsed.chatFeedback, parsed.catalog, emptyModel());
    parsed.sessionId = readSessionId();
    return parsed;
  } catch {
    return seedState();
  }
}

export function readSessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function writeSessionId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function saveState(state: CommerceState) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ ...state, sessionId: null }));
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

export type ChartPoint = { label: string; total: number; count?: number };
export type CategoryBar = { id: CategoryId; label: string; total: number; color?: string; points?: number[] };
