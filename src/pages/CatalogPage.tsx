import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { categories, type CategoryId } from "../data/products";
import { ProductCard } from "../components/ProductCard";
import { useStore } from "../context/StoreContext";

export function CatalogPage() {
  const { catalog } = useStore();
  const [params, setParams] = useSearchParams();
  const category = params.get("categoria") as CategoryId | null;
  const q = params.get("q") ?? "";
  const sort = params.get("ordem") ?? "destaque";

  const list = useMemo(() => {
    let items = [...catalog];
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
  }, [catalog, category, q, sort]);

  const setCategory = (id: CategoryId | "") => {
    const next = new URLSearchParams(params);
    if (id) next.set("categoria", id);
    else next.delete("categoria");
    setParams(next);
  };

  return (
    <div className="page catalog">
      <p className="eyebrow">Loja</p>
      <h1 className="page-title">Catálogo</h1>
      <p className="page-lead">Explore vasos, figures, games e utilitários impressos em 3D.</p>

      <div className="filters">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`chip${!category ? " is-active" : ""}`}
        >
          Todas
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`chip${category === c.id ? " is-active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="catalog-toolbar">
        <p className="catalog-toolbar__count">{list.length} produtos</p>
        <select
          value={sort}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            next.set("ordem", e.target.value);
            setParams(next);
          }}
          className="select select--compact"
        >
          <option value="destaque">Destaque</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="avaliacao">Melhor avaliação</option>
        </select>
      </div>

      {list.length === 0 ? (
        <p className="empty-note">Nenhum produto encontrado.</p>
      ) : (
        <div className="product-grid">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
