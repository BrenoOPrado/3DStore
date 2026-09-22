import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  migrateCustomer,
  seedState,
  settlePaymentIfDue,
  type CommerceState,
} from "./data/commerce";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const dataFile = join(dataDir, "store.json");

let state: CommerceState = seedState();

function hydrate(raw: CommerceState): CommerceState {
  const customers = (raw.customers ?? []).map((c) => migrateCustomer(c));
  const catalog = raw.catalog?.length ? raw.catalog : seedState().catalog;
  const orders = (raw.orders ?? []).map((o) => settlePaymentIfDue(o));
  return { customers, orders, coupons: raw.coupons ?? [], catalog, sessionId: null };
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
    state = hydrate(parsed);
    const changed = state.orders.some((o, i) => o.status !== parsed.orders[i]?.status);
    if (changed) persist();
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
