import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "../data/products";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";

export function CartPage() {
  const {
    detailed,
    setQty,
    remove,
    subtotal,
    clear,
    count,
    error,
    expiredDetailed,
    buyDisabled,
    expiresAt,
    warnAt,
    dismissExpired,
  } = useCart();
  const { user } = useStore();
  const lockSoon =
    Boolean(expiresAt && warnAt && new Date(warnAt).getTime() <= Date.now() && new Date(expiresAt).getTime() > Date.now());

  if (count === 0 && expiredDetailed.length === 0) {
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
          {count > 0 && (
            <button type="button" onClick={() => void clear()} className="ghost-link">
              Limpar
            </button>
          )}
        </div>
        {lockSoon && (
          <p className="form-error" data-testid="lock-warning">
            O bloqueio dos itens expira em breve. Finalize a compra ou os produtos voltam ao estoque.
          </p>
        )}
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
                      onClick={() => void setQty(item.product.id, item.color, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span data-testid={`qty-value-${item.product.id}`}>{item.quantity}</span>
                    <button
                      type="button"
                      data-testid={`qty-plus-${item.product.id}`}
                      disabled={item.quantity >= item.stock}
                      onClick={() => void setQty(item.product.id, item.color, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(item.product.id, item.color)}
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
        {expiredDetailed.length > 0 && (
          <section className="panel card-surface" data-testid="cart-expired">
            <h2 className="panel__title">Itens removidos por expiração do bloqueio</h2>
            <p className="muted">A compra fica desabilitada até você reconhecer estes itens.</p>
            <ul className="cart-list">
              {expiredDetailed.map((item) => (
                <li key={`exp-${item.product.id}-${item.color}`} className="cart-item">
                  <img src={item.product.image} alt="" className="cart-item__img" />
                  <div className="cart-item__body">
                    <p className="cart-item__name">{item.product.name}</p>
                    <p className="muted">
                      {item.color} · {item.quantity}x
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-ghost" data-testid="dismiss-expired" onClick={() => void dismissExpired()}>
              Reconhecer e liberar compra
            </button>
          </section>
        )}
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
        {buyDisabled || count === 0 ? (
          <button type="button" className="btn-primary btn-primary--block" data-testid="go-checkout" disabled>
            Compra desabilitada
          </button>
        ) : (
          <Link
            to={user ? "/checkout" : "/entrar"}
            state={user ? undefined : { from: "/checkout" }}
            className="btn-primary btn-primary--block"
            data-testid="go-checkout"
          >
            {user ? "Finalizar compra" : "Entrar para finalizar"}
          </Link>
        )}
        <Link to="/catalogo" className="summary__back">
          Continuar comprando
        </Link>
      </aside>
    </div>
  );
}
