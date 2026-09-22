import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { formatPrice } from "../../data/products";
import {
  STATUS_ACTION,
  STATUS_LABEL,
  formatAddress,
  formatPercent,
} from "../../data/commerce";
import { useStore } from "../../context/StoreContext";

export function AccountOrderDetailPage() {
  const { id } = useParams();
  const {
    myOrders,
    cancelOrder,
    confirmReceipt,
    requestExchange,
    dispatchExchangeItem,
  } = useStore();
  const order = myOrders.find((o) => o.id === id);
  const [itemId, setItemId] = useState(order?.items[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  if (!order) return <Navigate to="/conta/pedidos" replace />;

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
        <span className={`status-pill status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
      </div>

      <ul className="stack-list">
        {order.items.map((item) => (
          <li key={item.id} className="checkout-item">
            <img src={item.image} alt="" />
            <div className="checkout-item__info">
              <p>{item.name}</p>
              <p>
                {item.color} · {item.quantity}x
                {order.exchangeItemId === item.id ? " · em troca" : ""}
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
              Cupom {c.code} (−{formatPercent(c.value)})
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
                · {new Date(h.at).toLocaleString("pt-BR")} · {h.by}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel card-surface">
        <h2 className="panel__title">Ações do cliente</h2>
        <div className="account-actions wrap">
          {order.actions.cancel && (
            <button type="button" className="btn-ghost" onClick={() => void run(() => cancelOrder(order.id))}>
              Cancelar
            </button>
          )}
          {order.actions.confirmReceipt && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => void run(() => confirmReceipt(order.id))}
            >
              {order.actions.pickup ? "Retirei" : STATUS_ACTION.ENTREGUE}
            </button>
          )}
          {order.actions.dispatchItem && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => void run(() => dispatchExchangeItem(order.id))}
            >
              {STATUS_ACTION.ITEM_ENVIADO}
            </button>
          )}
        </div>
        {order.actions.waitingMessage && <p className="muted">{order.actions.waitingMessage}</p>}
        {order.status === "PAGAMENTO_REALIZADO" && order.actions.pickup && (
          <p className="muted">O pedido está pronto. Retire no ateliê e confirme a retirada.</p>
        )}

        {order.actions.requestExchange && (
          <div className="exchange-box">
            <p className="field__label">Solicitar troca de um item</p>
            <div className="account-actions wrap">
              <select
                className="field__control"
                value={itemId}
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
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => void run(() => requestExchange(order.id, itemId, qty))}
              >
                Solicitar troca
              </button>
            </div>
          </div>
        )}
        {msg && <p className={msg === "Atualizado." ? "form-ok" : "form-error"}>{msg}</p>}
      </section>
    </div>
  );
}
