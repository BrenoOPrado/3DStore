import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function ReleasesPage() {
  const list = products.filter((p) => p.isNew);
  return (
    <div className="page releases">
      <p className="eyebrow">Novidades</p>
      <h1 className="page-title">Lançamentos</h1>
      <p className="page-lead">
        As peças que acabaram de sair da impressora. Edições limitadas e novos acabamentos.
      </p>
      <div className="product-grid">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
