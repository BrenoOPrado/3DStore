import { randomUUID } from "node:crypto";

export const COOKIE = "3dstore.sid";

type Session = { customerId: string; lastOrderId: string | null };

const sessions = new Map<string, Session>();

export function createSession(customerId: string) {
  const token = randomUUID();
  sessions.set(token, { customerId, lastOrderId: null });
  return token;
}

export function getSession(token: string | undefined | null) {
  if (!token) return null;
  return sessions.get(token) ?? null;
}

export function destroySession(token: string | undefined | null) {
  if (token) sessions.delete(token);
}

export function setLastOrderId(token: string | undefined | null, orderId: string | null) {
  if (!token) return;
  const session = sessions.get(token);
  if (session) session.lastOrderId = orderId;
}

export function clearAllSessions() {
  sessions.clear();
}
