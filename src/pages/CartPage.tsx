import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "../data/products";
import { useCart } from "../context/CartContext";

export function CartPage() {
  const { detailed, setQty, remove, subtotal, clear, count } = useCart();

  if (count === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold">Seu carrinho está vazio</h1>
        <p className="mt-3 text-muted">Explore o catálogo e encontre a peça certa.</p>
        <Link to="/catalogo" className="btn-primary mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold">
          Ir às compras
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Carrinho</h1>
          <button type="button" onClick={clear} className="text-sm text-muted hover:text-white">
            Limpar
          </button>
        </div>
        <ul className="space-y-4">
          {detailed.map((item) => (
            <li
              key={`${item.product.id}-${item.color}`}
              className="card-surface flex gap-4 rounded-2xl p-4"
            >
              <img
                src={item.product.image}
                alt=""
                className="h-24 w-24 shrink-0 rounded-xl object-cover object-top"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link to={`/produto/${item.product.id}`} className="font-semibold hover:text-cyan">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted">{item.color}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.line)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-lg border border-line">
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center"
                      onClick={() => setQty(item.product.id, item.color, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center"
                      onClick={() => setQty(item.product.id, item.color, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.product.id, item.color)}
                    className="text-muted hover:text-white"
                    aria-label="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="card-surface h-fit rounded-2xl p-6">
        <h2 className="font-semibold">Resumo</h2>
        <div className="mt-4 flex justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm text-muted">
          <span>Frete</span>
          <span>Calculado no checkout</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <Link to="/checkout" className="btn-primary mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold">
          Finalizar compra
        </Link>
        <Link to="/catalogo" className="mt-3 block text-center text-sm text-muted hover:text-white">
          Continuar comprando
        </Link>
      </aside>
    </div>
  );
}
