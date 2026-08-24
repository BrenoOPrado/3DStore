import { Link } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import { formatPrice } from "../data/products";
import { loadLastOrder } from "../data/checkout";

export function OrderSuccessPage() {
  const order = loadLastOrder();

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
        <p className="success__kicker">Pedido {order.id}</p>
        <h1>Obrigado pela sua compra!</h1>
        <p className="success__lead">
          {order.recipient}, recebemos o seu pedido. Esta é uma confirmação de demonstração —
          nenhum pagamento real foi processado.
        </p>
      </div>

      <section className="success__summary card-surface">
        <h2>
          <Package size={18} className="icon-cyan" />
          Resumo
        </h2>
        <ul className="success-items">
          {order.items.map((item) => (
            <li key={`${item.name}-${item.color}`} className="success-item">
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
            <span>{order.shipping.price === 0 ? "Grátis" : formatPrice(order.shipping.price)}</span>
          </p>
          <p className="success__grand">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </p>
        </div>
      </section>

      <section className="success__meta">
        <div className="success__box card-surface">
          <p>Entrega</p>
          <p className="muted">{order.address}</p>
          <p className="success__eta">{delivery}</p>
        </div>
        <div className="success__box card-surface">
          <p>Pagamento</p>
          <p className="muted">{order.paymentLabel}</p>
          <p className="muted">Um e-mail fictício seria enviado para confirmar.</p>
        </div>
      </section>

      <div className="success__actions">
        <Link to="/catalogo" className="btn-primary">
          Continuar comprando
        </Link>
        <Link to="/" className="btn-ghost">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
