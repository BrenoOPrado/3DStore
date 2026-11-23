import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { clearAllSessions, COOKIE, createSession, destroySession, getSession, setLastOrderId } from "./session";
import * as app from "./services";
import { getLlmStatus } from "./ai/llm";
import { loadStore } from "./store";
import type { Address, CustomerStatus, OrderStatus } from "./data/commerce";
import type { Product } from "./data/products";

loadStore();
const llmBoot = getLlmStatus();
console.log(`[ai] ${llmBoot.label}`);

const PORT = Number(process.env.PORT || 3001);
const server = express();

server.use(
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
    credentials: true,
  })
);
server.use(express.json({ limit: "1mb" }));
server.use(cookieParser());
server.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (!res.headersSent) res.setHeader("X-Response-Time", `${Date.now() - start}ms`);
    return originalJson(body);
  }) as typeof res.json;
  app.touchCart();
  next();
});

function tokenOf(req: Request) {
  const raw = req.cookies?.[COOKIE];
  return typeof raw === "string" ? raw : null;
}

function idParam(req: Request, name = "id") {
  const value = req.params[name];
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function customerIdOf(req: Request) {
  return getSession(tokenOf(req))?.customerId ?? null;
}

function lastOrderOf(req: Request) {
  return getSession(tokenOf(req))?.lastOrderId ?? null;
}

function sendResult(req: Request, res: Response, result: unknown) {
  if (result && typeof result === "object" && "error" in result && (result as { error?: string }).error) {
    const error = String((result as { error: string }).error);
    const status =
      error === "Acesso restrito."
        ? 403
        : error.startsWith("Entre") || error === "Sessão inválida." || error === "E-mail ou senha inválidos."
          ? 401
          : 400;
    res.status(status).json({ error });
    return;
  }
  res.json({ ...(result as Record<string, unknown>), ...app.snapshot(customerIdOf(req), lastOrderOf(req)) });
}

server.get("/api/bootstrap", (req, res) => {
  res.json(app.snapshot(customerIdOf(req), lastOrderOf(req)));
});

server.post("/api/auth/login", (req, res) => {
  const result = app.login(String(req.body?.email ?? ""), String(req.body?.password ?? ""));
  if ("error" in result) {
    res.status(401).json(result);
    return;
  }
  const token = createSession(result.customerId);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
  res.json(app.snapshot(result.customerId, null));
});

server.post("/api/auth/signup", (req, res) => {
  const result = app.signup(req.body);
  if ("error" in result) {
    res.status(400).json(result);
    return;
  }
  const token = createSession(result.customerId);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
  res.json(app.snapshot(result.customerId, null));
});

server.post("/api/auth/logout", (req, res) => {
  destroySession(tokenOf(req));
  res.clearCookie(COOKIE, { path: "/" });
  res.json(app.snapshot(null, null));
});

server.patch("/api/account", (req, res) => {
  sendResult(req, res, app.updateProfile(customerIdOf(req), req.body ?? {}));
});

server.post("/api/account/password", (req, res) => {
  sendResult(
    req,
    res,
    app.changePassword(
      customerIdOf(req),
      String(req.body?.currentPassword ?? ""),
      String(req.body?.next ?? ""),
      String(req.body?.confirm ?? "")
    )
  );
});

server.delete("/api/account", (req, res) => {
  const result = app.deleteAccount(customerIdOf(req));
  if (result && "error" in result) {
    sendResult(req, res, result);
    return;
  }
  destroySession(tokenOf(req));
  res.clearCookie(COOKIE, { path: "/" });
  res.json(app.snapshot(null, null));
});

server.post("/api/account/addresses", (req, res) => {
  sendResult(req, res, app.addAddress(customerIdOf(req), req.body as Omit<Address, "id">));
});

server.put("/api/account/addresses/:id", (req, res) => {
  sendResult(req, res, app.updateAddress(customerIdOf(req), { ...(req.body as Address), id: idParam(req) }));
});

server.delete("/api/account/addresses/:id", (req, res) => {
  sendResult(req, res, app.removeAddress(customerIdOf(req), idParam(req)));
});

server.post("/api/account/cards", (req, res) => {
  sendResult(req, res, app.addCard(customerIdOf(req), req.body));
});

server.delete("/api/account/cards/:id", (req, res) => {
  sendResult(req, res, app.removeCard(customerIdOf(req), idParam(req)));
});

server.post("/api/account/cards/:id/preferred", (req, res) => {
  sendResult(req, res, app.setPreferredCard(customerIdOf(req), idParam(req)));
});

server.get("/api/cart", (req, res) => {
  sendResult(req, res, app.getCart(customerIdOf(req)));
});

server.post("/api/cart/items", (req, res) => {
  sendResult(
    req,
    res,
    app.addToCart(customerIdOf(req), {
      productId: String(req.body?.productId ?? ""),
      color: String(req.body?.color ?? ""),
      quantity: Number(req.body?.quantity ?? 1),
    })
  );
});

server.patch("/api/cart/items", (req, res) => {
  sendResult(
    req,
    res,
    app.setCartQty(customerIdOf(req), {
      productId: String(req.body?.productId ?? ""),
      color: String(req.body?.color ?? ""),
      quantity: Number(req.body?.quantity ?? 0),
    })
  );
});

server.delete("/api/cart/items", (req, res) => {
  sendResult(
    req,
    res,
    app.removeCartItem(customerIdOf(req), String(req.body?.productId ?? ""), String(req.body?.color ?? ""))
  );
});

server.post("/api/cart/clear", (req, res) => {
  sendResult(req, res, app.clearCart(customerIdOf(req)));
});

server.post("/api/cart/dismiss-expired", (req, res) => {
  sendResult(req, res, app.dismissExpiredCart(customerIdOf(req)));
});

server.post("/api/notifications/:id/read", (req, res) => {
  sendResult(req, res, app.markNotificationRead(customerIdOf(req), idParam(req)));
});

server.post("/api/checkout/quote", (req, res) => {
  const result = app.quoteCheckout(customerIdOf(req), {
    items: req.body?.items ?? [],
    couponCodes: req.body?.couponCodes ?? [],
    shippingId: req.body?.shippingId,
    cep: String(req.body?.cep ?? ""),
  });
  if (result && typeof result === "object" && "error" in result) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

server.post("/api/orders", (req, res) => {
  const result = app.placeOrder(customerIdOf(req), req.body ?? {});
  if (result && "error" in result) {
    sendResult(req, res, result);
    return;
  }
  setLastOrderId(tokenOf(req), result.id);
  res.json({ ...result, ...app.snapshot(customerIdOf(req), result.id) });
});

server.post("/api/orders/:id/exchange", (req, res) => {
  sendResult(
    req,
    res,
    app.requestExchange(
      customerIdOf(req),
      idParam(req),
      String(req.body?.itemId ?? ""),
      Number(req.body?.qty ?? 0),
      Boolean(req.body?.whole)
    )
  );
});

server.patch("/api/admin/customers/:id", (req, res) => {
  sendResult(req, res, app.setCustomerStatus(customerIdOf(req), idParam(req), req.body?.status as CustomerStatus));
});

server.get("/api/admin/customers", (req, res) => {
  const result = app.adminCustomers(customerIdOf(req), {
    id: String(req.query.id ?? ""),
    name: String(req.query.name ?? ""),
    email: String(req.query.email ?? ""),
    cpf: String(req.query.cpf ?? ""),
    phone: String(req.query.phone ?? ""),
    gender: String(req.query.gender ?? ""),
    status: String(req.query.status ?? ""),
  });
  if (result && "error" in result) {
    sendResult(req, res, result);
    return;
  }
  res.json(result);
});

server.post("/api/admin/orders/:id/status", (req, res) => {
  sendResult(req, res, app.adminSetStatus(customerIdOf(req), idParam(req), req.body?.status as OrderStatus));
});

server.post("/api/admin/products", (req, res) => {
  sendResult(req, res, app.addProduct(customerIdOf(req), req.body as Omit<Product, "id" | "rating" | "reviews">));
});

server.put("/api/admin/products/:id", (req, res) => {
  const body = (req.body ?? {}) as Product & { priceConfirmations?: number };
  const { priceConfirmations, ...rest } = body;
  sendResult(
    req,
    res,
    app.updateProduct(customerIdOf(req), { ...rest, id: idParam(req) }, { priceConfirmations })
  );
});

server.delete("/api/admin/products/:id", (req, res) => {
  sendResult(req, res, app.deleteProduct(customerIdOf(req), idParam(req)));
});

server.post("/api/admin/products/:id/restore", (req, res) => {
  sendResult(req, res, app.restoreProduct(customerIdOf(req), idParam(req)));
});

server.post("/api/admin/coupons", (req, res) => {
  sendResult(req, res, app.addCoupon(customerIdOf(req), req.body ?? {}));
});

server.delete("/api/admin/coupons/:id", (req, res) => {
  sendResult(req, res, app.removeCoupon(customerIdOf(req), idParam(req)));
});

server.get("/api/admin/logs", (req, res) => {
  sendResult(req, res, app.adminLogs(customerIdOf(req)));
});

server.get("/api/admin/chart", (req, res) => {
  const raw = String(req.query.categories ?? "");
  const categoryIds = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const start = String(req.query.start ?? "");
  const end = String(req.query.end ?? "");
  const result = app.adminChart(customerIdOf(req), categoryIds, start || undefined, end || undefined);
  if (result && "error" in result) {
    sendResult(req, res, result);
    return;
  }
  res.json(result);
});

server.post("/api/chat", async (req, res, next) => {
  try {
    sendResult(req, res, await app.chatAsk(customerIdOf(req), String(req.body?.message ?? "")));
  } catch (err) {
    next(err);
  }
});

server.post("/api/chat/feedback", (req, res) => {
  sendResult(req, res, app.chatFeedback(customerIdOf(req), req.body ?? {}));
});

server.get("/api/chat/model", (req, res) => {
  sendResult(req, res, app.chatModelInfo(customerIdOf(req)));
});

server.get("/api/admin/ai", (req, res) => {
  sendResult(req, res, app.adminAiStatus(customerIdOf(req)));
});

server.post("/api/admin/ai/retrain", (req, res) => {
  sendResult(req, res, app.adminRetrainAi(customerIdOf(req)));
});

server.post("/api/dev/expire-locks", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Não encontrado." });
    return;
  }
  sendResult(req, res, app.expireCustomerLocks(customerIdOf(req)));
});

server.post("/api/dev/reset", (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Não encontrado." });
    return;
  }
  clearAllSessions();
  app.resetDemo();
  res.clearCookie(COOKIE, { path: "/" });
  res.json(app.snapshot(null, null));
});

server.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno." });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`API em http://127.0.0.1:${PORT}`);
});
