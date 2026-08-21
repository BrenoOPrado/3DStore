import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function ReleasesPage() {
  const list = products.filter((p) => p.isNew);
  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm text-cyan">Novidades</p>
      <h1 className="mt-1 text-3xl font-bold">Lançamentos</h1>
      <p className="mt-2 max-w-2xl text-muted">
        As peças que acabaram de sair da impressora. Edições limitadas e novos
        acabamentos.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
