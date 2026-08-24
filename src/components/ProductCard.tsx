import { Link } from "react-router-dom";
import { formatPrice, productImageClass, type Product } from "../data/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/produto/${product.id}`} className="product-card card-surface">
      <div className="product-card__media">
        <img
          src={product.image}
          alt={product.name}
          className={`product-card__img ${productImageClass(product, "card")}`}
        />
        <div className="product-card__badges">
          {product.isNew && <span className="badge badge--new">Novo</span>}
          {product.originalPrice && <span className="badge badge--sale">Oferta</span>}
        </div>
      </div>
      <div className="product-card__body">
        <h3 className="product-card__title">{product.name}</h3>
        <p className="product-card__desc">{product.description}</p>
        <div className="product-card__meta">
          <div>
            {product.originalPrice && (
              <p className="product-card__old">{formatPrice(product.originalPrice)}</p>
            )}
            <p className="product-card__price">{formatPrice(product.price)}</p>
          </div>
          <p className="product-card__rating">
            {product.rating.toFixed(1)} · {product.reviews} avaliações
          </p>
        </div>
      </div>
    </Link>
  );
}
