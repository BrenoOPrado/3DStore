import { Link } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import { formatPrice } from "../data/products";
import { loadLastOrder } from "../data/checkout";

export function OrderSuccessPage() {
  const order = loadLastOrder();

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="text-2xl font-bold">Nenhum pedido recente</h1>
        <p className="mt-3 text-muted">Finalize uma compra para ver a confirmação aqui.</p>
        <Link to="/catalogo" className="btn-primary mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold">
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
    <div className="mx-auto max-w-2xl px-5 py-14">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="text-cyan" size={56} strokeWidth={1.5} />
        <p className="mt-4 text-sm font-medium text-cyan">Pedido {order.id}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Obrigado pela sua compra!</h1>
        <p className="mt-3 max-w-md text-muted">
          {order.recipient}, recebemos o seu pedido. Esta é uma confirmação de demonstração —
          nenhum pagamento real foi processado.
        </p>
      </div>

      <section className="card-surface mt-10 rounded-2xl p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Package size={18} className="text-cyan" />
          Resumo
        </h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((item) => (
            <li key={`${item.name}-${item.color}`} className="flex items-center gap-3 text-sm">
              <img src={item.image} alt="" className="h-12 w-12 rounded-lg object-cover object-top" />
              <div className="min-w-0 flex-1">
                <p className="truncate">{item.name}</p>
                <p className="text-xs text-muted">
                  {item.color} · {item.quantity}x
                </p>
              </div>
              <span>{formatPrice(item.line)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm text-muted">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>Frete ({order.shipping.name})</span>
            <span>{order.shipping.price === 0 ? "Grátis" : formatPrice(order.shipping.price)}</span>
          </p>
          <p className="flex justify-between pt-2 text-base font-semibold text-white">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card-surface rounded-2xl p-5 text-sm">
          <p className="font-semibold">Entrega</p>
          <p className="mt-2 whitespace-pre-line text-muted">{order.address}</p>
          <p className="mt-2 text-cyan">{delivery}</p>
        </div>
        <div className="card-surface rounded-2xl p-5 text-sm">
          <p className="font-semibold">Pagamento</p>
          <p className="mt-2 text-muted">{order.paymentLabel}</p>
          <p className="mt-2 text-muted">Um e-mail fictício seria enviado para confirmar.</p>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/catalogo" className="btn-primary rounded-xl px-5 py-3 text-sm font-semibold">
          Continuar comprando
        </Link>
        <Link
          to="/"
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
