import { FormEvent, useMemo, useState } from "react";
import { formatCouponValue, type CouponType } from "../../data/commerce";
import { useStore } from "../../context/StoreContext";
import { Field } from "../../components/Field";

const blank = {
  code: "",
  value: "",
  description: "",
  type: "promocional" as CouponType,
  ownerEmail: "",
};

export function AdminCouponsPage() {
  const { coupons, customers, addCoupon, removeCoupon } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return coupons.filter(
      (c) =>
        !needle ||
        c.code.toLowerCase().includes(needle) ||
        c.description.toLowerCase().includes(needle) ||
        (c.ownerEmail ?? "").toLowerCase().includes(needle)
    );
  }, [coupons, q]);

  const startNew = () => {
    setForm(blank);
    setOpen(true);
    setMsg(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await addCoupon({
      code: form.code,
      value: Number(form.value.replace(",", ".")),
      description: form.description,
      type: form.type,
      ownerEmail: form.type === "troca" ? form.ownerEmail : undefined,
    });
    if (typeof result !== "string") {
      setMsg(result.error);
      return;
    }
    setMsg("Cupom adicionado.");
    setOpen(false);
    setForm(blank);
  };

  const onDelete = async (id: string, code: string) => {
    if (!window.confirm(`Excluir o cupom ${code}?`)) return;
    const err = await removeCoupon(id);
    setMsg(err ?? "Cupom excluído.");
  };

  return (
    <div>
      <p className="eyebrow">Benefícios</p>
      <div className="section__head">
        <h1 className="page-title">Cupons</h1>
        <button type="button" className="btn-primary btn-primary--sm" onClick={startNew}>
          Novo cupom
        </button>
      </div>
      <p className="page-lead">
        Promocionais da loja e de troca. O valor é em reais. Clientes aplicam o código no checkout.
      </p>
      <input
        className="field__control search-filter"
        placeholder="Código, descrição ou e-mail"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {msg && (
        <p className={msg === "Cupom adicionado." || msg === "Cupom excluído." ? "form-ok" : "form-error"}>
          {msg}
        </p>
      )}

      <ul className="stack-list">
        {list.map((c) => (
          <li key={c.id} className="panel card-surface">
            <div className="order-row">
              <div>
                <p className="coupon-code">{c.code}</p>
                <p className="muted">
                  {c.type === "troca" ? "Troca" : "Promocional"}
                  {c.ownerEmail ? ` · ${c.ownerEmail}` : ""} · {c.description}
                  {c.used ? " · usado" : ""}
                </p>
              </div>
              <p className="product-card__price">{formatCouponValue(c.value)}</p>
              <button type="button" className="ghost-link" onClick={() => onDelete(c.id, c.code)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
        {list.length === 0 && <p className="muted">Nenhum cupom cadastrado.</p>}
      </ul>

      {open && (
        <form onSubmit={onSubmit} className="panel card-surface account-form">
          <h2 className="panel__title">Novo cupom</h2>
          <div className="form-grid">
            <Field
              label="Código"
              value={form.code}
              onChange={(v) => setForm((f) => ({ ...f, code: v.toUpperCase() }))}
              placeholder="PRINT10"
            />
            <Field
              label="Valor (R$)"
              value={form.value}
              onChange={(v) => setForm((f) => ({ ...f, value: v.replace(/[^\d.,]/g, "").slice(0, 10) }))}
              inputMode="decimal"
              placeholder="20,00"
            />
            <label className="field">
              <span className="field__label">Tipo</span>
              <select
                className="field__control"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CouponType }))}
              >
                <option value="promocional">Promocional</option>
                <option value="troca">Troca</option>
              </select>
            </label>
            {form.type === "troca" && (
              <label className="field field--wide">
                <span className="field__label">Cliente</span>
                <select
                  className="field__control"
                  value={form.ownerEmail}
                  onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                  required
                >
                  <option value="">Selecione</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.email}>
                      {c.name} · {c.email}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Field
              label="Descrição"
              value={form.description}
              onChange={(v) => setForm((f) => ({ ...f, description: v }))}
              required={false}
              wide
              placeholder="R$ 20 de desconto"
            />
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
