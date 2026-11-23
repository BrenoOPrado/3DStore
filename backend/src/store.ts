import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  migrateCustomer,
  migrateOrderStatus,
  seedState,
  type CommerceState,
} from "./data/commerce";
import { emptyModel, trainAiModel } from "./ai/recommender";
import { DEFAULT_LOCK_MS } from "./data/orderFlow";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const dataFile = join(dataDir, "store.json");

let state: CommerceState = seedState();

function hydrate(raw: CommerceState): CommerceState {
  const seeded = seedState();
  const existingCustomers = (raw.customers ?? []).map((c) => migrateCustomer(c));
  const haveCust = new Set(existingCustomers.map((c) => c.id));
  const extraCust = existingCustomers.length
    ? seeded.customers.filter((c) => !haveCust.has(c.id))
    : [];
  const customers = [...(existingCustomers.length ? existingCustomers : seeded.customers), ...extraCust].map(
    (c) => {
      const seed = seeded.customers.find((s) => s.id === c.id);
      return {
        ...c,
        preferences: c.preferences?.length ? c.preferences : seed?.preferences,
      };
    }
  );
  const existing = raw.catalog?.length ? raw.catalog : [];
  const have = new Set(existing.map((p) => p.id));
  const extras = existing.length ? seeded.catalog.filter((p) => !have.has(p.id)) : [];
  const catalog = [...(existing.length ? existing : seeded.catalog), ...extras].map((p) => ({
    ...p,
    stock: typeof p.stock === "number" ? p.stock : 20,
    status: p.status === "inativo" ? ("inativo" as const) : ("ativo" as const),
  }));
  const existingOrders = raw.orders ?? [];
  const haveOrder = new Set(existingOrders.map((o) => o.id));
  const extraOrders = existingOrders.length
    ? seeded.orders.filter((o) => !haveOrder.has(o.id))
    : [];
  const orders = [...(existingOrders.length ? existingOrders : seeded.orders), ...extraOrders].map((o) => ({
    ...o,
    status: migrateOrderStatus(o.status),
    history: (o.history ?? []).map((h) => ({ ...h, status: migrateOrderStatus(h.status) })),
  }));
  const chatFeedback = raw.chatFeedback?.length ? raw.chatFeedback : seeded.chatFeedback;
  const aiModel =
    raw.aiModel && raw.aiModel.version > 0
      ? raw.aiModel
      : trainAiModel(orders, chatFeedback, catalog, emptyModel());
  return {
    customers,
    orders,
    coupons: raw.coupons ?? seeded.coupons,
    catalog,
    logs: raw.logs ?? [],
    sessionId: null,
    locks: raw.locks ?? [],
    expiredCart: raw.expiredCart ?? [],
    notifications: raw.notifications ?? [],
    clockOffsetMs: raw.clockOffsetMs ?? 0,
    lockTtlMs: raw.lockTtlMs ?? DEFAULT_LOCK_MS,
    chatFeedback,
    aiModel,
  };
}

export function loadStore() {
  try {
    mkdirSync(dataDir, { recursive: true });
    if (!existsSync(dataFile)) {
      state = seedState();
      persist();
      return state;
    }
    const parsed = JSON.parse(readFileSync(dataFile, "utf8")) as CommerceState;
    if (!parsed.customers?.length) {
      state = seedState();
      persist();
      return state;
    }
    const parsedOrderCount = parsed.orders?.length ?? 0;
    const parsedCustCount = parsed.customers?.length ?? 0;
    state = hydrate(parsed);
    if (state.orders.length > parsedOrderCount || state.customers.length > parsedCustCount) {
      persist();
    }
  } catch {
    state = seedState();
    persist();
  }
  return state;
}

export function getState() {
  return state;
}

export function setState(next: CommerceState) {
  state = { ...next, sessionId: null };
  persist();
  return state;
}

export function resetStore() {
  state = seedState();
  persist();
  return state;
}

function persist() {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(dataFile, JSON.stringify({ ...state, sessionId: null }, null, 2));
}
