import type { CategoryId, Product } from "./products";
import { categories } from "./products";
import type { Coupon, Order, OrderStatus } from "./commerce";
import { roundMoney } from "./salesRules";

export const DEFAULT_LOCK_MS = 15 * 60 * 1000;
export const WARN_BEFORE_MS = 5 * 60 * 1000;

export type CartLine = { productId: string; color: string; quantity: number };

export type CartLock = CartLine & {
  id: string;
  customerId: string;
  lockedAt: string;
  expiresAt: string;
};

export type ExpiredCartItem = CartLine & {
  customerId: string;
  expiredAt: string;
};

export type StoreNotification = {
  id: string;
  customerId: string;
  at: string;
  title: string;
  body: string;
  orderId?: string;
  read: boolean;
};

export function clockNow(offsetMs = 0) {
  return Date.now() + offsetMs;
}

export function isActiveLock(lock: CartLock, now: number) {
  return new Date(lock.expiresAt).getTime() > now;
}

export function lockedQuantity(
  locks: CartLock[],
  productId: string,
  now: number,
  exceptCustomerId?: string
) {
  return locks
    .filter(
      (lock) =>
        lock.productId === productId &&
        isActiveLock(lock, now) &&
        lock.customerId !== exceptCustomerId
    )
    .reduce((sum, lock) => sum + lock.quantity, 0);
}

export function physicalStock(product: Product | undefined) {
  if (!product) return 0;
  const stock = Number(product.stock);
  return Number.isFinite(stock) ? Math.max(0, stock) : 20;
}

export function availableUnits(
  product: Product | undefined,
  locks: CartLock[],
  now: number,
  customerId?: string
) {
  const stock = physicalStock(product);
  if (!product) return 0;
  const others = lockedQuantity(locks, product.id, now, customerId);
  const own = customerId ? lockedQuantity(locks.filter((l) => l.customerId === customerId), product.id, now) : 0;
  return Math.max(0, stock - others - own);
}

export function displayAvailable(
  product: Product | undefined,
  locks: CartLock[],
  now: number,
  customerId?: string
) {
  const stock = physicalStock(product);
  if (!product) return 0;
  return Math.max(0, stock - lockedQuantity(locks, product.id, now, customerId));
}

export function operatorAccepts(cvv: string | undefined, last4: string) {
  const code = String(cvv ?? "").replace(/\D/g, "");
  if (code === "000") return false;
  if (last4 === "0002") return false;
  return true;
}

export function revalidateLines(
  lines: CartLine[],
  catalog: Product[],
  locks: CartLock[],
  now: number,
  customerId: string
): { lines: CartLine[]; alerts: string[] } {
  const alerts: string[] = [];
  const next: CartLine[] = [];
  const grouped = new Map<string, number>();
  for (const line of lines) {
    const qty = Math.round(Number(line.quantity) || 0);
    grouped.set(line.productId, (grouped.get(line.productId) ?? 0) + qty);
  }
  for (const line of lines) {
    const product = catalog.find((p) => p.id === line.productId);
    if (!product) {
      alerts.push("Um item do carrinho não está mais disponível e foi removido.");
      continue;
    }
    const available = displayAvailable(product, locks, now, customerId);
    const requested = grouped.get(line.productId) ?? 0;
    if (available <= 0) {
      alerts.push(`${product.name} ficou indisponível e foi removido do carrinho.`);
      continue;
    }
    if (requested > available) {
      const keep = Math.min(line.quantity, available);
      if (keep <= 0) {
        alerts.push(`${product.name} ficou indisponível e foi removido do carrinho.`);
        continue;
      }
      alerts.push(
        `A disponibilidade de ${product.name} mudou. Quantidade ajustada para ${available}.`
      );
      next.push({ ...line, quantity: keep });
      grouped.set(line.productId, available);
      continue;
    }
    next.push(line);
  }
  return { lines: next, alerts: [...new Set(alerts)] };
}

export function chartMonthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function chartMonthLabel(key: string) {
  const [y, m] = key.split("-");
  return `01/${m}/${y}`;
}

export function monthRangeKeys(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor.getTime() <= last.getTime()) {
    keys.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

export function monthsBetween(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return (
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth()) +
    1
  );
}

export function validateChartPeriod(startIso: string, endIso: string): string | null {
  if (!startIso || !endIso) return "Informe a data de início e a data de fim.";
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Período inválido.";
  if (end.getTime() < start.getTime()) return "A data de fim não pode ser anterior à data de início.";
  const span = monthsBetween(startIso, endIso);
  if (span < 1) return "O intervalo deve ser de no mínimo 1 mês.";
  if (span > 24) return "O intervalo deve ser de no máximo 24 meses.";
  return null;
}

export function salesByCategoryMonth(
  orders: Order[],
  startIso: string,
  endIso: string,
  categoryIds: CategoryId[]
) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const keys = monthRangeKeys(startIso, endIso);
  const selected = categoryIds.length ? categoryIds : categories.map((c) => c.id);
  const matrix = new Map<string, Map<string, number>>();
  for (const id of selected) {
    matrix.set(id, new Map(keys.map((k) => [k, 0])));
  }

  for (const order of orders) {
    if (order.status !== "ENTREGUE") continue;
    const at = new Date(order.createdAt).getTime();
    if (at < start || at > end) continue;
    const month = chartMonthKey(order.createdAt);
    if (!keys.includes(month)) continue;
    for (const item of order.items) {
      if (!selected.includes(item.category)) continue;
      const row = matrix.get(item.category);
      if (!row) continue;
      row.set(month, roundMoney((row.get(month) ?? 0) + item.line));
    }
  }

  const series = selected.map((id) => {
    const cat = categories.find((c) => c.id === id)!;
    const row = matrix.get(id)!;
    return {
      id,
      label: cat.label,
      color: cat.tint,
      points: keys.map((k) => row.get(k) ?? 0),
    };
  });

  const totals = keys.map((_, i) => roundMoney(series.reduce((s, ser) => s + ser.points[i], 0)));
  return {
    months: keys.map(chartMonthLabel),
    monthKeys: keys,
    series,
    totals,
    revenue: roundMoney(totals.reduce((s, n) => s + n, 0)),
    orderCount: orders.filter((o) => {
      if (o.status !== "ENTREGUE") return false;
      const at = new Date(o.createdAt).getTime();
      if (at < start || at > end) return false;
      return o.items.some((item) => selected.includes(item.category));
    }).length,
  };
}

export function exchangeValue(order: Order) {
  if (order.exchangeWhole) {
    return roundMoney(order.items.reduce((s, i) => s + i.line, 0));
  }
  const item = order.items.find((i) => i.id === order.exchangeItemId);
  if (!item) return 0;
  const qty = Math.min(item.quantity, order.exchangeQty ?? item.quantity);
  return roundMoney(item.unitPrice * qty);
}

export function restockExchange(catalog: Product[], order: Order): Product[] {
  const lines = order.exchangeWhole
    ? order.items
    : order.items.filter((i) => i.id === order.exchangeItemId);
  return catalog.map((p) => {
    const hit = lines.find((i) => i.productId === p.id);
    if (!hit) return p;
    const qty = order.exchangeWhole ? hit.quantity : Math.min(hit.quantity, order.exchangeQty ?? hit.quantity);
    return { ...p, stock: physicalStock(p) + qty };
  });
}

export const DRS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  APROVADA: ["EM_TRANSPORTE"],
  EM_TRANSPORTE: ["ENTREGUE"],
  EM_TROCA: ["TROCA_AUTORIZADA"],
  TROCA_AUTORIZADA: ["TROCADO"],
};

export function couponStillValid(coupon: Coupon, email: string) {
  if (coupon.used) return `Cupom ${coupon.code} já foi usado.`;
  if (coupon.type === "troca" && coupon.ownerEmail?.toLowerCase() !== email.toLowerCase()) {
    return `Cupom ${coupon.code} não pertence a esta conta.`;
  }
  return null;
}
