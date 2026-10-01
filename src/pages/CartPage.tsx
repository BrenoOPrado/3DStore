import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "../data/products";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";

export function CartPage() {
  const { detailed, setQty, remove, subtotal, clear, count, error } = useCart();
  const { user } = useStore();

  if (count === 0) {
    return (
      <div className="page page--narrow page--center empty-state">
        <h1>Seu carrinho está vazio</h1>
        <p>Explore o catálogo e encontre a peça certa.</p>
        <Link to="/catalogo" className="btn-primary">
          Ir às compras
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <div>
        <div className="cart-head">
          <h1>Carrinho</h1>
          <button type="button" onClick={clear} className="ghost-link">
            Limpar
          </button>
        </div>
        <ul className="cart-list" data-testid="cart-list">
          {detailed.map((item) => (
            <li
              key={`${item.product.id}-${item.color}`}
              className="cart-item card-surface"
              data-testid={`cart-item-${item.product.id}`}
            >
              <img src={item.product.image} alt="" className="cart-item__img" />
              <div className="cart-item__body">
                <div className="cart-item__top">
                  <div>
                    <Link to={`/produto/${item.product.id}`} className="cart-item__name">
                      {item.product.name}
                    </Link>
                    <p className="cart-item__color">{item.color}</p>
                    <p className="muted">Estoque: {item.stock}</p>
                  </div>
                  <p className="cart-item__line">{formatPrice(item.line)}</p>
                </div>
                <div className="cart-item__actions">
                  <div className="qty qty--sm">
                    <button
                      type="button"
                      data-testid={`qty-minus-${item.product.id}`}
                      onClick={() => setQty(item.product.id, item.color, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span data-testid={`qty-value-${item.product.id}`}>{item.quantity}</span>
                    <button
                      type="button"
                      data-testid={`qty-plus-${item.product.id}`}
                      disabled={item.quantity >= item.stock}
                      onClick={() => setQty(item.product.id, item.color, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.product.id, item.color)}
                    className="icon-muted"
                    aria-label="Remover"
                    data-testid={`remove-${item.product.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {error && (
          <p className="form-error" data-testid="cart-error">
            {error}
          </p>
        )}
      </div>
      <aside className="summary card-surface">
        <h2>Resumo</h2>
        <div className="summary__row">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="summary__row summary__row--tight">
          <span>Frete</span>
          <span>Calculado no checkout</span>
        </div>
        <div className="summary__total">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <Link
          to={user ? "/checkout" : "/entrar"}
          state={user ? undefined : { from: "/checkout" }}
          className="btn-primary btn-primary--block"
          data-testid="go-checkout"
        >
          {user ? "Finalizar compra" : "Entrar para finalizar"}
        </Link>
        <Link to="/catalogo" className="summary__back">
          Continuar comprando
        </Link>
      </aside>
    </div>
  );
}
