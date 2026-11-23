import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { formatPrice } from "../../data/products";
import { STATUS_LABEL, formatAddress, formatCouponValue } from "../../data/commerce";
import { useStore } from "../../context/StoreContext";
import { formatDateTimeBr } from "../../data/dates";

export function AccountOrderDetailPage() {
  const { id } = useParams();
  const { myOrders, requestExchange, notifications, markNotificationRead } = useStore();
  const order = myOrders.find((o) => o.id === id);
  const [itemId, setItemId] = useState(order?.items[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  if (!order) return <Navigate to="/conta/pedidos" replace />;

  const notes = notifications.filter((n) => n.orderId === order.id);
  const run = async (fn: () => Promise<string | null>) => {
    const err = await fn();
    setMsg(err ?? "Atualizado.");
  };

  return (
    <div>
      <p className="eyebrow">
        <Link to="/conta/pedidos" className="link-hover">
          Pedidos
        </Link>{" "}
        / {order.id}
      </p>
      <div className="section__head">
        <h1 className="page-title">{order.id}</h1>
        <span className={`status-pill status-${order.status}`} data-testid="order-status-pill">
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      {notes.map((n) => (
        <p key={n.id} className="form-ok" data-testid="exchange-notification">
          {n.title}: {n.body}
          {!n.read && (
            <button type="button" className="ghost-link" onClick={() => void markNotificationRead(n.id)}>
              Marcar como lida
            </button>
          )}
        </p>
      ))}

      <ul className="stack-list">
        {order.items.map((item) => (
          <li key={item.id} className="checkout-item">
            <img src={item.image} alt="" />
            <div className="checkout-item__info">
              <p>{item.name}</p>
              <p>
                {item.color} · {item.quantity}x
                {order.exchangeItemId === item.id || order.exchangeWhole ? " · em troca" : ""}
              </p>
            </div>
            <p>{formatPrice(item.line)}</p>
          </li>
        ))}
      </ul>

      <div className="success__meta">
        <div className="success__box card-surface">
          <p>Entrega</p>
          <p className="muted pre-line">{formatAddress(order.address)}</p>
          <p className="muted">
            {order.shipping.name} · {order.shipping.days}
          </p>
        </div>
        <div className="success__box card-surface">
          <p>Pagamento</p>
          {order.coupons.map((c) => (
            <p key={c.code} className="muted">
              Cupom {c.code} (−{formatCouponValue(c.value)})
            </p>
          ))}
          {order.payments.map((p) => (
            <p key={p.cardId} className="muted">
              {p.brand} •••• {p.last4} · {formatPrice(p.amount)}
            </p>
          ))}
          <p className="success__grand">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </p>
          {order.exchangeCouponCode && (
            <p className="form-ok" data-testid="exchange-coupon">
              Cupom {order.exchangeCouponCode} de {formatCouponValue(order.exchangeCouponValue ?? 0)}
            </p>
          )}
        </div>
      </div>

      <section className="panel card-surface">
        <h2 className="panel__title">Histórico</h2>
        <ol className="timeline">
          {order.history.map((h, i) => (
            <li key={`${h.status}-${i}`}>
              <strong>{STATUS_LABEL[h.status]}</strong>
              <span className="muted">
                {" "}
                · {formatDateTimeBr(h.at)} · {h.by}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel card-surface">
        <h2 className="panel__title">Ações do cliente</h2>
        {order.actions.waitingMessage && <p className="muted">{order.actions.waitingMessage}</p>}
        {!order.actions.requestExchange && (
          <p className="muted" data-testid="exchange-blocked">
            A troca só pode ser pedida após a entrega.
          </p>
        )}
        {order.actions.requestExchange && (
          <div className="exchange-box">
            <p className="field__label">Solicitar troca de um item</p>
            <div className="account-actions wrap">
              <select
                className="field__control"
                value={itemId}
                data-testid="exchange-item"
                onChange={(e) => setItemId(e.target.value)}
              >
                {order.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.color})
                  </option>
                ))}
              </select>
              <input
                className="field__control qty-input"
                type="number"
                min={1}
                max={order.items.find((i) => i.id === itemId)?.quantity ?? 1}
                value={qty}
                data-testid="exchange-qty"
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <button
                type="button"
                className="btn-primary"
                data-testid="request-exchange"
                onClick={() => void run(() => requestExchange(order.id, itemId, qty))}
              >
                Solicitar troca
              </button>
              <button
                type="button"
                className="btn-ghost"
                data-testid="request-exchange-whole"
                onClick={() => void run(() => requestExchange(order.id, itemId, qty, true))}
              >
                Trocar a compra inteira
              </button>
            </div>
          </div>
        )}
        {msg && (
          <p className={msg === "Atualizado." ? "form-ok" : "form-error"} data-testid="order-action-msg">
            {msg}
          </p>
        )}
      </section>
    </div>
  );
}
