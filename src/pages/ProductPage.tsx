import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { categories, formatPrice, productImageClass } from "../data/products";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import { ProductCard } from "../components/ProductCard";

export function ProductPage() {
  const { id } = useParams();
  const { catalog, user } = useStore();
  const product = id ? catalog.find((p) => p.id === id) : undefined;
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!product) return;
    setColor(product.colors[0]);
    setQty(1);
    setAdded(false);
  }, [product]);

  if (!product) {
    return (
      <div className="page page--narrow page--center">
        <h1 className="page-title">Produto não encontrado</h1>
        <Link to="/catalogo" className="not-found-link">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const related = catalog
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);
  const category = categories.find((c) => c.id === product.category);
  const canBuy = Boolean(user);

  const addToCart = () => {
    if (!user) {
      navigate("/entrar", { state: { from: `/produto/${product.id}` } });
      return;
    }
    if (!add(product.id, color || product.colors[0], qty)) return;
    setAdded(true);
  };

  return (
    <div className="page">
      <p className="crumb">
        <Link to="/catalogo" className="link-hover">
          Catálogo
        </Link>{" "}
        / {category?.label} / {product.name}
      </p>

      <div className="product-layout">
        <div className="product-gallery">
          <img
            src={product.image}
            alt={product.name}
            className={productImageClass(product, "detail")}
          />
        </div>
        <div className="product-info">
          {product.isNew && <span className="product-info__badge">Lançamento</span>}
          <h1>{product.name}</h1>
          <p className="product-info__rating">
            <Star size={14} className="icon-star" />
            {product.rating.toFixed(1)} · {product.reviews} avaliações · {product.material}
          </p>
          <div className="product-info__prices">
            <p className="product-info__price">{formatPrice(product.price)}</p>
            {product.originalPrice && (
              <p className="product-info__old">{formatPrice(product.originalPrice)}</p>
            )}
          </div>
          <p className="product-info__desc">{product.description}</p>

          <div className="product-info__colors">
            <p>Cor</p>
            <div className="chip-row">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`chip${color === c ? " is-active" : ""}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="product-info__buy">
            <div className="qty">
              <button
                type="button"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                aria-label="Diminuir"
              >
                <Minus size={16} />
              </button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((n) => n + 1)} aria-label="Aumentar">
                <Plus size={16} />
              </button>
            </div>
            <button type="button" onClick={addToCart} className="btn-primary btn-primary--grow">
              <ShoppingCart size={16} />
              {canBuy ? "Adicionar ao carrinho" : "Entrar para adicionar"}
            </button>
          </div>
          {!user && (
            <p className="muted">Entre na sua conta para colocar itens no carrinho.</p>
          )}
          {added && (
            <div className="added-banner">
              Adicionado.
              <button type="button" className="link-cyan" onClick={() => navigate("/carrinho")}>
                Ver carrinho
              </button>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="related">
          <h2>Você também pode gostar</h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
