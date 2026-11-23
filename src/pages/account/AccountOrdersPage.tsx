import { Link } from "react-router-dom";
import { formatPrice } from "../../data/products";
import { STATUS_LABEL } from "../../data/commerce";
import { useStore } from "../../context/StoreContext";
import { formatDateBr } from "../../data/dates";

export function AccountOrdersPage() {
  const { myOrders } = useStore();

  return (
    <div>
      <p className="eyebrow">Pedidos</p>
      <h1 className="page-title">Consultar pedidos</h1>
      <p className="page-lead">Acompanhe o status dos pedidos e solicite troca após a entrega.</p>

      {myOrders.length === 0 ? (
        <p className="muted">Você ainda não fez pedidos.</p>
      ) : (
        <ul className="stack-list">
          {myOrders.map((o) => (
            <li key={o.id}>
              <Link to={`/conta/pedidos/${o.id}`} className="panel card-surface order-row" data-testid={`order-${o.id}`}>
                <div>
                  <p className="coupon-code">{o.id}</p>
                  <p className="muted">
                    {formatDateBr(o.createdAt)} · {o.items.length} item(ns)
                  </p>
                </div>
                <span className={`status-pill status-${o.status}`} data-testid={`order-status-${o.id}`}>
                  {STATUS_LABEL[o.status]}
                </span>
                <p className="order-row__total">{formatPrice(o.total)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
