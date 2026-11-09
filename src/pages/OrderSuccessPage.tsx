import { Link } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import { formatPrice } from "../data/products";
import { useStore } from "../context/StoreContext";
import { STATUS_LABEL, formatAddress } from "../data/commerce";

export function OrderSuccessPage() {
  const { lastOrderId, myOrders, user } = useStore();
  const order =
    myOrders.find((o) => o.id === lastOrderId) ??
    myOrders.find((o) => o.customerId === user?.id);

  if (!order) {
    return (
      <div className="page page--sm page--center empty-state">
        <h1>Nenhum pedido recente</h1>
        <p>Finalize uma compra para ver a confirmação aqui.</p>
        <Link to="/catalogo" className="btn-primary">
          Ir ao catálogo
        </Link>
      </div>
    );
  }

  const delivery =
    order.shipping.id === "retirada"
      ? "Retire no ateliê a partir de amanhã."
      : `Previsão: ${order.shipping.days.toLowerCase()}.`;

  return (
    <div className="success">
      <div className="success__hero">
        <CheckCircle2 className="icon-cyan" size={56} strokeWidth={1.5} />
        <p className="success__kicker" data-testid="order-id">
          Pedido {order.id}
        </p>
        <h1 data-testid="order-status-title">Pedido em processamento</h1>
        <p className="success__lead">
          {order.customerName}, o pedido foi registrado com status EM PROCESSAMENTO.
        </p>
        <p className="muted" data-testid="order-status">
          Status inicial: Em processamento
        </p>
        <p className="muted" data-testid="order-current-status">
          Status atual: {STATUS_LABEL[order.status]}
        </p>
      </div>

      <section className="success__summary card-surface">
        <h2>
          <Package size={18} className="icon-cyan" />
          Resumo
        </h2>
        <ul className="success-items">
          {order.items.map((item) => (
            <li key={item.id} className="success-item">
              <img src={item.image} alt="" />
              <div className="success-item__info">
                <p>{item.name}</p>
                <p>
                  {item.color} · {item.quantity}x
                </p>
              </div>
              <span>{formatPrice(item.line)}</span>
            </li>
          ))}
        </ul>
        <div className="success__totals">
          <p>
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </p>
          <p>
            <span>Frete ({order.shipping.name})</span>
            <span>{order.shippingPrice === 0 ? "Grátis" : formatPrice(order.shippingPrice)}</span>
          </p>
          <p>
            <span>Cupons</span>
            <span>−{formatPrice(order.discount)}</span>
          </p>
          <p className="success__grand">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </p>
          {order.exchangeCouponCode && (
            <p className="form-ok" data-testid="generated-coupon">
              Cupom de troca {order.exchangeCouponCode} de {formatPrice(order.exchangeCouponValue ?? 0)} gerado pela
              diferença.
            </p>
          )}
        </div>
      </section>

      <section className="success__meta">
        <div className="success__box card-surface">
          <p>Entrega</p>
          <p className="muted pre-line">{formatAddress(order.address)}</p>
          <p className="success__eta">{delivery}</p>
        </div>
        <div className="success__box card-surface">
          <p>Pagamento</p>
          {order.payments.map((p) => (
            <p key={p.cardId} className="muted">
              {p.brand} •••• {p.last4} · {formatPrice(p.amount)}
            </p>
          ))}
        </div>
      </section>

      <div className="success__actions">
        <Link to={`/conta/pedidos/${order.id}`} className="btn-primary">
          Consultar pedido
        </Link>
        <Link to="/catalogo" className="btn-ghost">
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
