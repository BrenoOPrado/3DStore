import type { CategoryId, Product } from "./products";

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
  last4: string;
  brand: string;
  expiry: string;
  preferred: boolean;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
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
  orderCount?: number;
  addresses: Address[];
  cards: Card[];
};

export type PublicUser = Customer;

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
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

export type ShippingOption = {
  id: "pac" | "sedex" | "retirada";
  name: string;
  days: string;
  price: number;
};

export type OrderActions = {
  cancel: boolean;
  confirmReceipt: boolean;
  requestExchange: boolean;
  dispatchItem: boolean;
  adminNext: OrderStatus[];
  waitingMessage: string | null;
  pickup: boolean;
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
  actions: OrderActions;
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

export type ChartPoint = { label: string; total: number; count: number };
export type CategoryBar = { id: CategoryId; label: string; total: number };
export type ChartData = {
  months: ChartPoint[];
  categories: CategoryBar[];
  revenue: number;
  orderCount: number;
  totalOrders: number;
};

export type { Product };
