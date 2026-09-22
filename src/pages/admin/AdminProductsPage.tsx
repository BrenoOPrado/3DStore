import { FormEvent, useMemo, useState } from "react";
import { formatPrice, categories, type CategoryId, type Product } from "../../data/products";
import { useStore } from "../../context/StoreContext";
import { Field } from "../../components/Field";

const blank = {
  name: "",
  price: "",
  originalPrice: "",
  category: "decoracao" as CategoryId,
  description: "",
  material: "PLA",
  colors: "",
  image: "",
  isNew: false,
  featured: false,
};

export function AdminProductsPage() {
  const { catalog, addProduct, updateProduct, deleteProduct } = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.filter(
      (p) =>
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        p.category.includes(needle) ||
        p.material.toLowerCase().includes(needle)
    );
  }, [catalog, q]);

  const startNew = () => {
    setEditing(null);
    setForm(blank);
    setOpen(true);
    setMsg(null);
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : "",
      category: p.category,
      description: p.description,
      material: p.material,
      colors: p.colors.join(", "),
      image: p.image,
      isNew: Boolean(p.isNew),
      featured: Boolean(p.featured),
    });
    setOpen(true);
    setMsg(null);
  };

  const parsed = () => {
    const colors = form.colors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const price = Number(form.price.replace(",", "."));
    const original = form.originalPrice.trim()
      ? Number(form.originalPrice.replace(",", "."))
      : undefined;
    return {
      name: form.name,
      price,
      originalPrice: original && original > 0 ? original : undefined,
      category: form.category,
      description: form.description,
      material: form.material,
      colors,
      image: form.image.trim() || "/products/placeholder.jpg",
      isNew: form.isNew,
      featured: form.featured,
    };
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = parsed();
    if (editing) {
      const err = await updateProduct({
        ...editing,
        ...data,
      });
      if (err) {
        setMsg(err);
        return;
      }
      setMsg("Produto atualizado.");
    } else {
      const result = await addProduct(data);
      if (typeof result !== "string") {
        setMsg(result.error);
        return;
      }
      setMsg("Produto adicionado.");
    }
    setOpen(false);
  };

  const onDelete = async (p: Product) => {
    if (!window.confirm(`Excluir “${p.name}”?`)) return;
    const err = await deleteProduct(p.id);
    setMsg(err ?? "Produto excluído.");
    if (!err && editing?.id === p.id) {
      setOpen(false);
      setEditing(null);
    }
  };

  return (
    <div>
      <p className="eyebrow">Catálogo</p>
      <div className="section__head">
        <h1 className="page-title">Produtos</h1>
        <button type="button" className="btn-primary btn-primary--sm" onClick={startNew}>
          Novo produto
        </button>
      </div>
      <input
        className="field__control search-filter"
        placeholder="Nome, categoria ou material"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {msg && (
        <p className={msg.includes("não") || msg.includes("Informe") || msg.includes("Acesso") ? "form-error" : "form-ok"}>
          {msg}
        </p>
      )}

      <ul className="stack-list">
        {list.map((p) => (
          <li key={p.id} className="panel card-surface">
            <div className="order-row">
              <img src={p.image} alt="" className="search__thumb" />
              <div>
                <p className="coupon-code">{p.name}</p>
                <p className="muted">
                  {categories.find((c) => c.id === p.category)?.label} · {formatPrice(p.price)}
                </p>
              </div>
              <div className="account-actions">
                <button type="button" className="ghost-link" onClick={() => startEdit(p)}>
                  Editar
                </button>
                <button type="button" className="ghost-link" onClick={() => onDelete(p)}>
                  Excluir
                </button>
              </div>
            </div>
          </li>
        ))}
        {list.length === 0 && <p className="muted">Nenhum produto encontrado.</p>}
      </ul>

      {open && (
        <form onSubmit={onSubmit} className="panel card-surface account-form">
          <h2 className="panel__title">{editing ? "Editar produto" : "Novo produto"}</h2>
          <div className="form-grid">
            <Field label="Nome" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} wide />
            <Field label="Preço (R$)" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} />
            <Field
              label="Preço anterior (opcional)"
              value={form.originalPrice}
              onChange={(v) => setForm((f) => ({ ...f, originalPrice: v }))}
              required={false}
            />
            <label className="field">
              <span className="field__label">Categoria</span>
              <select
                className="field__control"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as CategoryId }))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Material"
              value={form.material}
              onChange={(v) => setForm((f) => ({ ...f, material: v }))}
            />
            <Field
              label="Cores (separadas por vírgula)"
              value={form.colors}
              onChange={(v) => setForm((f) => ({ ...f, colors: v }))}
              wide
            />
            <Field
              label="URL da imagem"
              value={form.image}
              onChange={(v) => setForm((f) => ({ ...f, image: v }))}
              required={false}
              wide
            />
            <label className="field field--wide">
              <span className="field__label">Descrição</span>
              <textarea
                className="field__control"
                rows={4}
                required
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
          </div>
          <div className="account-actions wrap">
            <label className="check-line">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => setForm((f) => ({ ...f, isNew: e.target.checked }))}
              />
              Lançamento
            </label>
            <label className="check-line">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              />
              Destaque
            </label>
          </div>
          <div className="account-actions">
            <button type="submit" className="btn-primary">
              Salvar
            </button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
