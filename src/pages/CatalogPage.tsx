import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { categories, products, type CategoryId } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("categoria") as CategoryId | null;
  const q = params.get("q") ?? "";
  const sort = params.get("ordem") ?? "destaque";

  const list = useMemo(() => {
    let items = [...products];
    if (category) items = items.filter((p) => p.category === category);
    if (q.trim()) {
      const needle = q.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle)
      );
    }
    if (sort === "menor") items.sort((a, b) => a.price - b.price);
    if (sort === "maior") items.sort((a, b) => b.price - a.price);
    if (sort === "avaliacao") items.sort((a, b) => b.rating - a.rating);
    return items;
  }, [category, q, sort]);

  const setCategory = (id: CategoryId | "") => {
    const next = new URLSearchParams(params);
    if (id) next.set("categoria", id);
    else next.delete("categoria");
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm text-cyan">Loja</p>
      <h1 className="mt-1 text-3xl font-bold">Catálogo</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Explore vasos, figures, games e utilitários impressos em 3D.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`rounded-full border px-4 py-1.5 text-sm ${
            !category ? "border-purple bg-purple/20" : "border-line text-muted"
          }`}
        >
          Todas
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              category === c.id
                ? "border-purple bg-purple/20"
                : "border-line text-muted hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{list.length} produtos</p>
        <select
          value={sort}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            next.set("ordem", e.target.value);
            setParams(next);
          }}
          className="rounded-xl border border-line bg-[#101018] px-3 py-2 text-sm outline-none"
        >
          <option value="destaque">Destaque</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="avaliacao">Melhor avaliação</option>
        </select>
      </div>

      {list.length === 0 ? (
        <p className="mt-16 text-center text-muted">Nenhum produto encontrado.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
