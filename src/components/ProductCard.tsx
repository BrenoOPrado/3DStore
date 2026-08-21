import { Link } from "react-router-dom";
import { formatPrice, productImageClass, type Product } from "../data/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/produto/${product.id}`}
      className="group card-surface flex h-full flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-purple/40"
    >
      <div className="relative aspect-square shrink-0 overflow-hidden bg-[#0a0a12]">
        <img
          src={product.image}
          alt={product.name}
          className={`h-full w-full transition duration-500 group-hover:scale-[1.03] ${productImageClass(product, "card")}`}
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {product.isNew && (
            <span className="rounded-full bg-cyan/90 px-2.5 py-0.5 text-[11px] font-semibold text-black">
              Novo
            </span>
          )}
          {product.originalPrice && (
            <span className="rounded-full bg-purple px-2.5 py-0.5 text-[11px] font-semibold">
              Oferta
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <h3 className="font-semibold leading-snug text-white group-hover:text-cyan-bright">
          {product.name}
        </h3>
        <p className="text-sm text-muted line-clamp-2">{product.description}</p>
        <div className="mt-auto flex items-end justify-between pt-1">
          <div>
            {product.originalPrice && (
              <p className="text-xs text-muted line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
            <p className="text-lg font-bold">{formatPrice(product.price)}</p>
          </div>
          <p className="text-xs text-muted">
            {product.rating.toFixed(1)} · {product.reviews} avaliações
          </p>
        </div>
      </div>
    </Link>
  );
}
