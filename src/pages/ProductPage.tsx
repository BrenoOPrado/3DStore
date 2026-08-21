import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { categories, formatPrice, getProduct, productImageClass, products } from "../data/products";
import { useCart } from "../context/CartContext";
import { ProductCard } from "../components/ProductCard";

export function ProductPage() {
  const { id } = useParams();
  const product = id ? getProduct(id) : undefined;
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
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold">Produto não encontrado</h1>
        <Link to="/catalogo" className="mt-4 inline-block text-cyan">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);
  const category = categories.find((c) => c.id === product.category);

  const addToCart = () => {
    add(product.id, color || product.colors[0], qty);
    setAdded(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm text-muted">
        <Link to="/catalogo" className="hover:text-white">
          Catálogo
        </Link>{" "}
        / {category?.label} / {product.name}
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-3xl border border-line bg-[#0a0a12]">
          <img
            src={product.image}
            alt={product.name}
            className={`h-full w-full ${productImageClass(product, "detail")}`}
          />
        </div>
        <div>
          {product.isNew && (
            <span className="rounded-full bg-cyan/20 px-3 py-1 text-xs font-semibold text-cyan">
              Lançamento
            </span>
          )}
          <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <Star size={14} className="fill-cyan text-cyan" />
            {product.rating.toFixed(1)} · {product.reviews} avaliações · {product.material}
          </p>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-3xl font-extrabold">{formatPrice(product.price)}</p>
            {product.originalPrice && (
              <p className="text-muted line-through">{formatPrice(product.originalPrice)}</p>
            )}
          </div>
          <p className="mt-5 leading-relaxed text-muted">{product.description}</p>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Cor</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    color === c ? "border-purple bg-purple/20" : "border-line text-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-line">
              <button
                type="button"
                className="grid h-11 w-11 place-items-center"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                aria-label="Diminuir"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center"
                onClick={() => setQty((n) => n + 1)}
                aria-label="Aumentar"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={addToCart}
              className="btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
            >
              <ShoppingCart size={16} />
              Adicionar ao carrinho
            </button>
          </div>
          {added && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-purple/30 bg-purple/10 px-4 py-3 text-sm">
              Adicionado.
              <button type="button" className="font-semibold text-cyan" onClick={() => navigate("/carrinho")}>
                Ver carrinho
              </button>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Você também pode gostar</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
