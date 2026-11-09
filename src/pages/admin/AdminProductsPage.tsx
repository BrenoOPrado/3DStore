import { FormEvent, useMemo, useState } from "react";
import { formatPrice, categories, type CategoryId, type Product } from "../../data/products";
import {
  exceedsPriceConfirmThreshold,
  parseColors,
  parseMoney,
  priceChangePercent,
  validateProduct,
} from "../../data/productRules";
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
  stock: "20",
  isNew: false,
  featured: false,
};

export function AdminProductsPage() {
  const { adminCatalog, catalog, addProduct, updateProduct, deleteProduct, restoreProduct } = useStore();
  const products = adminCatalog.length ? adminCatalog : catalog;
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [priceStep, setPriceStep] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      const status = p.status ?? "ativo";
      if (statusFilter !== "todos" && status !== statusFilter) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle) ||
        p.category.includes(needle) ||
        p.material.toLowerCase().includes(needle)
      );
    });
  }, [products, q, statusFilter]);

  const startNew = () => {
    setEditing(null);
    setForm(blank);
    setOpen(true);
    setMsg(null);
    setPriceStep(0);
    setPendingDelete(null);
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price).replace(".", ","),
      originalPrice: p.originalPrice ? String(p.originalPrice).replace(".", ",") : "",
      category: p.category,
      description: p.description,
      material: p.material,
      colors: p.colors.join(", "),
      image: p.image,
      stock: String(typeof p.stock === "number" ? p.stock : 20),
      isNew: Boolean(p.isNew),
      featured: Boolean(p.featured),
    });
    setOpen(true);
    setMsg(null);
    setPriceStep(0);
    setPendingDelete(null);
  };

  const parsed = () => {
    const originalRaw = form.originalPrice.trim();
    const original = originalRaw ? parseMoney(originalRaw) : undefined;
    return {
      name: form.name,
      price: parseMoney(form.price),
      originalPrice: original,
      category: form.category,
      description: form.description,
      material: form.material,
      colors: parseColors(form.colors),
      image: form.image.trim() || "/products/placeholder.jpg",
      stock: Math.max(0, Math.round(Number(form.stock.replace(/\D/g, "")) || 0)),
      isNew: form.isNew,
      featured: form.featured,
    };
  };

  const persist = async (confirmations = 0) => {
    const data = parsed();
    const invalid = validateProduct(data);
    if (invalid) {
      setMsg(invalid);
      return false;
    }
    if (editing) {
      const err = await updateProduct({ ...editing, ...data }, { priceConfirmations: confirmations });
      if (err) {
        setMsg(err);
        return false;
      }
      setMsg("Produto atualizado.");
    } else {
      const result = await addProduct(data);
      if (typeof result !== "string") {
        setMsg(result.error);
        return false;
      }
      setMsg("Produto adicionado.");
    }
    setOpen(false);
    setPriceStep(0);
    setEditing(null);
    return true;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = parsed();
    const invalid = validateProduct(data);
    if (invalid) {
      setMsg(invalid);
      setPriceStep(0);
      return;
    }
    if (editing && exceedsPriceConfirmThreshold(editing.price, data.price)) {
      setPriceStep(1);
      setMsg(null);
      return;
    }
    await persist(0);
  };

  const confirmPrice = async () => {
    if (priceStep < 2) {
      setPriceStep(2);
      return;
    }
    await persist(2);
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    const err = await deleteProduct(pendingDelete.id);
    setMsg(err ?? "Produto excluído do catálogo. Pedidos e análises foram preservados.");
    if (!err && editing?.id === pendingDelete.id) {
      setOpen(false);
      setEditing(null);
    }
    setPendingDelete(null);
  };

  const onRestore = async (p: Product) => {
    const err = await restoreProduct(p.id);
    setMsg(err ?? "Produto restaurado no catálogo.");
  };

  const priceShift = editing ? parsed().price : 0;
  const pricePct = editing && Number.isFinite(priceShift) ? priceChangePercent(editing.price, priceShift) : 0;

  return (
    <div>
      <p className="eyebrow">Catálogo</p>
      <div className="section__head">
        <h1 className="page-title">Produtos</h1>
        <button type="button" className="btn-primary btn-primary--sm" data-testid="product-new" onClick={startNew}>
          Novo produto
        </button>
      </div>
      <p className="page-lead">
        Cadastre, altere e exclua peças. A exclusão retira o item da loja e não altera o histórico de
        pedidos nem as análises de venda.
      </p>
      <div className="product-filters">
        <input
          className="field__control search-filter"
          placeholder="Nome, código, categoria ou material"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="product-search"
        />
        <select
          className="field__control search-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "todos" | "ativo" | "inativo")}
          data-testid="product-filter-status"
        >
          <option value="todos">Todas as situações</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Excluídos</option>
        </select>
      </div>
      {msg && (
        <p
          className={
            msg.includes("não") ||
            msg.includes("Informe") ||
            msg.includes("Acesso") ||
            msg.includes("exige") ||
            msg.includes("já está")
              ? "form-error"
              : "form-ok"
          }
          data-testid={
            msg.includes("não") ||
            msg.includes("Informe") ||
            msg.includes("Acesso") ||
            msg.includes("exige") ||
            msg.includes("já está")
              ? "product-error"
              : "product-ok"
          }
        >
          {msg}
        </p>
      )}

      <ul className="stack-list" data-testid="product-list">
        {list.map((p) => {
          const status = p.status ?? "ativo";
          return (
            <li key={p.id} className="panel card-surface" data-testid={`product-row-${p.id}`}>
              <div className="order-row">
                <img src={p.image} alt="" className="search__thumb" />
                <div>
                  <p className="coupon-code">{p.name}</p>
                  <p className="muted">
                    {p.id} · {categories.find((c) => c.id === p.category)?.label} · {formatPrice(p.price)} ·
                    estoque {typeof p.stock === "number" ? p.stock : 20}
                  </p>
                </div>
                <span
                  className={`status-pill ${status === "ativo" ? "status-ENTREGUE" : "status-REPROVADA"}`}
                  data-testid={`product-status-${p.id}`}
                >
                  {status === "ativo" ? "ativo" : "excluído"}
                </span>
                <div className="account-actions">
                  <button type="button" className="ghost-link" data-testid={`product-edit-${p.id}`} onClick={() => startEdit(p)}>
                    Editar
                  </button>
                  {status === "ativo" ? (
                    <button
                      type="button"
                      className="ghost-link"
                      data-testid={`product-delete-${p.id}`}
                      onClick={() => setPendingDelete(p)}
                    >
                      Excluir
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ghost-link"
                      data-testid={`product-restore-${p.id}`}
                      onClick={() => void onRestore(p)}
                    >
                      Restaurar
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {list.length === 0 && <p className="muted">Nenhum produto encontrado.</p>}
      </ul>

      {pendingDelete && (
        <div className="confirm-box panel card-surface" data-testid="product-delete-confirm">
          <h2 className="panel__title">Excluir produto</h2>
          <p>
            Excluir “{pendingDelete.name}” do catálogo? Pedidos já feitos e as análises de venda{" "}
            <strong>não serão alterados</strong>.
          </p>
          <div className="account-actions">
            <button type="button" className="btn-primary" data-testid="product-delete-yes" onClick={() => void onDelete()}>
              Excluir do catálogo
            </button>
            <button type="button" className="btn-ghost" data-testid="product-delete-no" onClick={() => setPendingDelete(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {open && (
        <form onSubmit={onSubmit} noValidate className="panel card-surface account-form" data-testid="product-form">
          <h2 className="panel__title">{editing ? "Editar produto" : "Novo produto"}</h2>
          {editing && (
            <p className="muted">
              Código único: <span data-testid="product-id">{editing.id}</span>
            </p>
          )}
          <div className="form-grid">
            <Field label="Nome" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} wide testId="product-name" />
            <Field label="Preço (R$)" value={form.price} onChange={(v) => { setForm((f) => ({ ...f, price: v })); setPriceStep(0); }} testId="product-price" />
            <Field
              label="Preço anterior (opcional)"
              value={form.originalPrice}
              onChange={(v) => setForm((f) => ({ ...f, originalPrice: v }))}
              required={false}
              testId="product-original-price"
            />
            <label className="field">
              <span className="field__label">Categoria</span>
              <select
                className="field__control"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as CategoryId }))}
                data-testid="product-category"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Material" value={form.material} onChange={(v) => setForm((f) => ({ ...f, material: v }))} testId="product-material" />
            <Field
              label="Cores (separadas por vírgula)"
              value={form.colors}
              onChange={(v) => setForm((f) => ({ ...f, colors: v }))}
              wide
              testId="product-colors"
            />
            <Field
              label="Estoque"
              value={form.stock}
              onChange={(v) => setForm((f) => ({ ...f, stock: v.replace(/\D/g, "").slice(0, 5) }))}
              inputMode="numeric"
              testId="product-stock"
            />
            <Field
              label="URL da imagem"
              value={form.image}
              onChange={(v) => setForm((f) => ({ ...f, image: v }))}
              required={false}
              wide
              testId="product-image"
            />
            <label className="field field--wide">
              <span className="field__label">Descrição</span>
              <textarea
                className="field__control"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                data-testid="product-description"
              />
            </label>
          </div>
          <div className="account-actions wrap">
            <label className="check-line">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => setForm((f) => ({ ...f, isNew: e.target.checked }))}
                data-testid="product-is-new"
              />
              Lançamento
            </label>
            <label className="check-line">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                data-testid="product-featured"
              />
              Destaque
            </label>
          </div>
          {priceStep > 0 && editing && (
            <div className="confirm-box" data-testid="price-confirm">
              <p>
                O preço passa de {formatPrice(editing.price)} para {formatPrice(priceShift)} ({pricePct}%).
                Alterações acima de 10% exigem duas confirmações.
              </p>
              <p className="muted" data-testid="price-confirm-step">
                Confirmação {priceStep} de 2
              </p>
              <div className="account-actions">
                <button type="button" className="btn-primary" data-testid="price-confirm-yes" onClick={() => void confirmPrice()}>
                  {priceStep === 1 ? "Confirmar alteração" : "Confirmar novamente"}
                </button>
                <button type="button" className="btn-ghost" data-testid="price-confirm-no" onClick={() => setPriceStep(0)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {priceStep === 0 && (
            <div className="account-actions">
              <button type="submit" className="btn-primary" data-testid="product-save">
                Salvar
              </button>
              <button type="button" className="btn-ghost" data-testid="product-cancel" onClick={() => setOpen(false)}>
                Cancelar
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
