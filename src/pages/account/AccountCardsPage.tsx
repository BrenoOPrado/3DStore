import { FormEvent, useState } from "react";
import { Field } from "../../components/Field";
import { useStore } from "../../context/StoreContext";
import { maskCard } from "../../data/checkout";

export function AccountCardsPage() {
  const { user, addCard, removeCard } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ holder: "", number: "", expiry: "", cvv: "" });

  if (!user) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addCard({ holder: form.holder, number: form.number, expiry: form.expiry });
    setForm({ holder: "", number: "", expiry: "", cvv: "" });
    setOpen(false);
  };

  return (
    <div>
      <p className="eyebrow">Pagamento</p>
      <div className="section__head">
        <h1 className="page-title">Cartões</h1>
        <button type="button" className="btn-primary btn-primary--sm" onClick={() => setOpen(true)}>
          Adicionar cartão
        </button>
      </div>
      <p className="page-lead">Use um ou mais cartões no checkout, combinando com cupons.</p>

      <ul className="stack-list">
        {user.cards.map((c) => (
          <li key={c.id} className="panel card-surface row-between">
            <div>
              <p className="panel__kicker">{c.brand} •••• {c.last4}</p>
              <p>{c.holder}</p>
              <p className="muted">Validade {c.expiry}</p>
            </div>
            <button type="button" className="ghost-link" onClick={() => removeCard(c.id)}>
              Remover
            </button>
          </li>
        ))}
        {user.cards.length === 0 && <p className="muted">Nenhum cartão salvo.</p>}
      </ul>

      {open && (
        <form onSubmit={onSubmit} className="panel card-surface account-form">
          <h2 className="panel__title">Novo cartão</h2>
          <div className="form-grid">
            <Field
              label="Nome no cartão"
              value={form.holder}
              onChange={(v) => setForm((f) => ({ ...f, holder: v }))}
              wide
            />
            <Field
              label="Número"
              value={form.number}
              onChange={(v) => setForm((f) => ({ ...f, number: maskCard(v) }))}
              wide
            />
            <Field
              label="Validade"
              value={form.expiry}
              onChange={(v) => setForm((f) => ({ ...f, expiry: v }))}
              placeholder="MM/AA"
            />
            <Field
              label="CVV"
              value={form.cvv}
              onChange={(v) => setForm((f) => ({ ...f, cvv: v.replace(/\D/g, "").slice(0, 4) }))}
            />
          </div>
          <div className="account-actions">
            <button type="submit" className="btn-primary">
              Salvar cartão
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
