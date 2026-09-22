import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { formatPrice } from "../../data/products";
import {
  STATUS_ACTION,
  STATUS_LABEL,
  formatAddress,
  formatPercent,
  type OrderStatus,
} from "../../data/commerce";
import { useStore } from "../../context/StoreContext";
import { AdminCustomerDetailPage } from "./AdminCustomersPage";

export function AdminCustomerRoute() {
  const { id } = useParams();
  if (!id) return <Navigate to="/admin/clientes" replace />;
  return <AdminCustomerDetailPage id={id} />;
}

export function AdminOrdersPage() {
  const { orders } = useStore();
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const list = useMemo(
    () => (status ? orders.filter((o) => o.status === status) : orders),
    [orders, status]
  );

  return (
    <div>
      <p className="eyebrow">Pedidos</p>
      <h1 className="page-title">Consultar pedidos</h1>
      <select
        className="field__control search-filter"
        value={status}
        onChange={(e) => setStatus(e.target.value as "" | OrderStatus)}
      >
        <option value="">Todos os status</option>
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <ul className="stack-list">
        {list.map((o) => (
          <li key={o.id}>
            <Link to={`/admin/pedidos/${o.id}`} className="panel card-surface order-row">
              <div>
                <p className="coupon-code">{o.id}</p>
                <p className="muted">
                  {o.customerName} · {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className={`status-pill status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
              <p className="order-row__total">{formatPrice(o.total)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const { orders, adminSetStatus } = useStore();
  const order = orders.find((o) => o.id === id);
  const [msg, setMsg] = useState<string | null>(null);

  if (!order) return <Navigate to="/admin/pedidos" replace />;
  const next = order.actions.adminNext;
  const waiting = order.actions.waitingMessage;

  const apply = async (status: OrderStatus) => {
    const err = await adminSetStatus(order.id, status);
    if (err) {
      setMsg(err);
      return;
    }
    if (status === "EM_PROCESSAMENTO") {
      setMsg("Pedido processado. O sistema confirmou o pagamento.");
      return;
    }
    setMsg(`Status alterado para ${STATUS_LABEL[status]}.`);
  };

  return (
    <div>
      <p className="eyebrow">
        <Link to="/admin/pedidos" className="link-hover">
          Pedidos
        </Link>{" "}
        / {order.id}
      </p>
      <div className="section__head">
        <h1 className="page-title">{order.id}</h1>
        <span className={`status-pill status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
      </div>
      <p className="page-lead">
        Cliente{" "}
        <Link to={`/admin/clientes/${order.customerId}`} className="link-cyan">
          {order.customerName}
        </Link>
      </p>

      <ul className="stack-list">
        {order.items.map((item) => (
          <li key={item.id} className="checkout-item">
            <img src={item.image} alt="" />
            <div className="checkout-item__info">
              <p>{item.name}</p>
              <p>
                {item.color} · {item.quantity}x
                {order.exchangeItemId === item.id ? " · item da troca" : ""}
              </p>
            </div>
            <p>{formatPrice(item.line)}</p>
          </li>
        ))}
      </ul>

      <div className="success__meta">
        <div className="success__box card-surface">
          <p>Entrega</p>
          <p className="muted">{order.shipping.name} · {order.shipping.days}</p>
          <p className="muted pre-line">{formatAddress(order.address)}</p>
        </div>
        <div className="success__box card-surface">
          <p>Pagamento</p>
          {order.coupons.map((c) => (
            <p key={c.code} className="muted">
              {c.code} (−{formatPercent(c.value)})
            </p>
          ))}
          {order.payments.map((p) => (
            <p key={p.cardId} className="muted">
              {p.brand} •••• {p.last4} · {formatPrice(p.amount)}
            </p>
          ))}
          <p>Total {formatPrice(order.total)}</p>
        </div>
      </div>

      <section className="panel card-surface">
        <h2 className="panel__title">Alterar status</h2>
        {waiting && <p className="muted">{waiting}</p>}
        {next.length === 0 && !waiting ? (
          <p className="muted">Nenhuma transição administrativa a partir deste status.</p>
        ) : next.length === 0 ? null : (
          <div className="account-actions wrap">
            {next.map((s) => (
              <button key={s} type="button" className="btn-primary" onClick={() => void apply(s)}>
                {STATUS_ACTION[s] ?? STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
        {msg && (
          <p className={msg.startsWith("Status") || msg.startsWith("Pedido processado") ? "form-ok" : "form-error"}>
            {msg}
          </p>
        )}
      </section>

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
    </div>
  );
}
