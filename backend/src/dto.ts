import { categories } from "./data/products";
import {
  adminTransitions,
  adminWaitingMessage,
  availableCoupons,
  canCancel,
  canConfirmReceipt,
  canDispatchItem,
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
import { getState } from "./store";

export type PublicCard = Omit<Card, "number">;

export type PublicCustomer = Omit<PublicUser, "cards"> & {
  cards: PublicCard[];
  ranking: number;
  orderCount: number;
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
    cancel: canCancel(order.status),
    confirmReceipt: canConfirmReceipt(order.status, order),
    requestExchange: canRequestExchange(order.status),
    dispatchItem: canDispatchItem(order.status),
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
  categories: typeof categories;
  customers: PublicCustomer[];
  orders: PublicOrder[];
  coupons: Coupon[];
  myOrders: PublicOrder[];
  myCoupons: Coupon[];
  myUsedCoupons: Coupon[];
  lastOrderId: string | null;
  logs?: { id: string; at: string; userEmail: string; action: string; entity: string; payload: unknown }[];
};

export function snapshot(customerId: string | null, lastOrderId: string | null): Snapshot {
  const state = getState();
  const current = customerId ? state.customers.find((c) => c.id === customerId) ?? null : null;
  const isAdmin = current?.role === "admin";
  const user = current ? publicCustomer(current, state.orders) : null;
  return {
    user,
    catalog: state.catalog,
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
    logs: isAdmin ? state.logs ?? [] : [],
  };
}
