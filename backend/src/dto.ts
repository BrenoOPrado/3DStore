import { categories } from "./data/products";
import { listedCatalog } from "./data/productRules";
import {
  adminTransitions,
  adminWaitingMessage,
  availableCoupons,
  canRequestExchange,
  customerRanking,
  isPickup,
  type Card,
  type Coupon,
  type Customer,
  type Order,
  type OrderStatus,
  type PublicUser,
} from "./data/commerce";
import { isActiveLock, WARN_BEFORE_MS } from "./data/orderFlow";
import { getState } from "./store";

export type PublicCard = Omit<Card, "number">;

export type PublicCustomer = Omit<PublicUser, "cards"> & {
  cards: PublicCard[];
  ranking: number;
  orderCount: number;
};

export type OrderActions = {
  requestExchange: boolean;
  adminNext: OrderStatus[];
  waitingMessage: string | null;
  pickup: boolean;
};

export type PublicOrder = Order & { actions: OrderActions };

export function publicCard(card: Card): PublicCard {
  const { number: _number, ...rest } = card;
  void _number;
  return rest;
}

export function publicCustomer(c: Customer, orders = getState().orders): PublicCustomer {
  const { password: _password, cards, ...rest } = c;
  void _password;
  return {
    ...rest,
    cards: cards.map(publicCard),
    ranking: customerRanking(orders, c.id),
    orderCount: orders.filter((o) => o.customerId === c.id).length,
  };
}

export function orderActions(order: Order): OrderActions {
  return {
    requestExchange: canRequestExchange(order.status),
    adminNext: adminTransitions(order.status, order),
    waitingMessage: adminWaitingMessage(order.status, order),
    pickup: isPickup(order),
  };
}

export function publicOrder(order: Order): PublicOrder {
  return { ...order, actions: orderActions(order) };
}

export type Snapshot = {
  user: PublicCustomer | null;
  catalog: typeof import("./data/products").products;
  adminCatalog: typeof import("./data/products").products;
  categories: typeof categories;
  customers: PublicCustomer[];
  orders: PublicOrder[];
  coupons: Coupon[];
  myOrders: PublicOrder[];
  myCoupons: Coupon[];
  myUsedCoupons: Coupon[];
  lastOrderId: string | null;
  cart: {
    items: { productId: string; color: string; quantity: number }[];
    expired: { productId: string; color: string; quantity: number }[];
    buyDisabled: boolean;
    expiresAt: string | null;
    warnAt: string | null;
  };
  notifications: {
    id: string;
    at: string;
    title: string;
    body: string;
    orderId?: string;
    read: boolean;
  }[];
  logs?: { id: string; at: string; userEmail: string; action: string; entity: string; payload: unknown }[];
};

function cartSnapshot(customerId: string | null) {
  if (!customerId) {
    return { items: [], expired: [], buyDisabled: false, expiresAt: null, warnAt: null };
  }
  const state = getState();
  const now = Date.now() + (state.clockOffsetMs ?? 0);
  const items = (state.locks ?? [])
    .filter((lock) => lock.customerId === customerId && isActiveLock(lock, now))
    .map((lock) => ({ productId: lock.productId, color: lock.color, quantity: lock.quantity }));
  const expired = (state.expiredCart ?? [])
    .filter((item) => item.customerId === customerId)
    .map((item) => ({ productId: item.productId, color: item.color, quantity: item.quantity }));
  const soonest = (state.locks ?? [])
    .filter((lock) => lock.customerId === customerId && isActiveLock(lock, now))
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

export function snapshot(customerId: string | null, lastOrderId: string | null): Snapshot {
  const state = getState();
  const current = customerId ? state.customers.find((c) => c.id === customerId) ?? null : null;
  const isAdmin = current?.role === "admin";
  const user = current ? publicCustomer(current, state.orders) : null;
  return {
    user,
    catalog: listedCatalog(state.catalog),
    adminCatalog: isAdmin ? state.catalog : listedCatalog(state.catalog),
    categories,
    customers: isAdmin
      ? state.customers.filter((c) => c.role === "client").map((c) => publicCustomer(c, state.orders))
      : [],
    orders: isAdmin ? state.orders.map(publicOrder) : [],
    coupons: isAdmin ? state.coupons : [],
    myOrders: current ? state.orders.filter((o) => o.customerId === current.id).map(publicOrder) : [],
    myCoupons: current ? availableCoupons(state.coupons, current.email) : [],
    myUsedCoupons: current
      ? state.coupons.filter(
          (c) =>
            c.used &&
            c.type === "troca" &&
            c.ownerEmail?.toLowerCase() === current.email.toLowerCase()
        )
      : [],
    lastOrderId,
    cart: cartSnapshot(current?.id ?? null),
    notifications: current
      ? (state.notifications ?? []).filter((n) => n.customerId === current.id)
      : [],
    logs: isAdmin ? state.logs ?? [] : [],
  };
}
