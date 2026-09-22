import { FormEvent, useState } from "react";
import { Field, SelectField } from "../../components/Field";
import { useStore } from "../../context/StoreContext";
import { maskCard, maskExpiry } from "../../data/checkout";
import { CARD_BRANDS } from "../../data/customerRules";

export function AccountCardsPage() {
  const { user, addCard, removeCard, setPreferredCard } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    holder: "",
    number: "",
    expiry: "",
    cvv: "",
    brand: "Visa",
    preferred: false,
  });
  const [msg, setMsg] = useState<string | null>(null);

  if (!user) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await addCard({
      holder: form.holder,
      number: form.number,
      expiry: form.expiry,
      brand: form.brand,
      preferred: form.preferred,
      cvv: form.cvv,
    });
    if ("error" in result) {
      setMsg(result.error);
      return;
    }
    setForm({ holder: "", number: "", expiry: "", cvv: "", brand: "Visa", preferred: false });
    setOpen(false);
    setMsg(null);
  };

  return (
    <div>
      <p className="eyebrow">Pagamento</p>
      <div className="section__head">
        <h1 className="page-title">Cartões</h1>
        <button type="button" className="btn-primary btn-primary--sm" data-testid="new-card" onClick={() => setOpen(true)}>
          Adicionar cartão
        </button>
      </div>
      <p className="page-lead">
        Salve um ou mais cartões e defina um como preferencial.
      </p>
      {msg && !open && (
        <p className="form-error" data-testid="form-error">
          {msg}
        </p>
      )}

      <ul className="stack-list" data-testid="card-list">
        {user.cards.map((c) => (
          <li key={c.id} className="panel card-surface row-between" data-testid={`card-${c.last4}`}>
            <div>
              <p className="panel__kicker">
                {c.brand} •••• {c.last4}
                {c.preferred ? " · preferencial" : ""}
              </p>
              <p>{c.holder}</p>
              <p className="muted">Validade {c.expiry}</p>
            </div>
            <div className="account-actions">
              {!c.preferred && (
                <button
                  type="button"
                  className="ghost-link"
                  data-testid={`prefer-card-${c.last4}`}
                  onClick={() => void setPreferredCard(c.id)}
                >
                  Preferencial
                </button>
              )}
              <button type="button" className="ghost-link" data-testid={`remove-card-${c.last4}`} onClick={() => void removeCard(c.id)}>
                Remover
              </button>
            </div>
          </li>
        ))}
        {user.cards.length === 0 && <p className="muted">Nenhum cartão salvo.</p>}
      </ul>

      {open && (
        <form onSubmit={onSubmit} className="panel card-surface account-form" noValidate data-testid="card-form">
          <h2 className="panel__title">Novo cartão</h2>
          {msg && (
            <p className="form-error" data-testid="form-error">
              {msg}
            </p>
          )}
          <div className="form-grid">
            <Field
              label="Nome no cartão"
              value={form.holder}
              onChange={(v) => setForm((f) => ({ ...f, holder: v }))}
              wide
              testId="card-holder"
              required={false}
            />
            <Field
              label="Número"
              value={form.number}
              onChange={(v) => setForm((f) => ({ ...f, number: maskCard(v) }))}
              wide
              testId="card-number"
              required={false}
            />
            <SelectField
              label="Bandeira"
              value={form.brand}
              onChange={(v) => setForm((f) => ({ ...f, brand: v }))}
              options={[...CARD_BRANDS]}
              testId="card-brand"
            />
            <Field
              label="Validade"
              value={form.expiry}
              onChange={(v) => setForm((f) => ({ ...f, expiry: maskExpiry(v) }))}
              placeholder="MM/AA"
              testId="card-expiry"
              required={false}
            />
            <Field
              label="CVV"
              value={form.cvv}
              onChange={(v) => setForm((f) => ({ ...f, cvv: v.replace(/\D/g, "").slice(0, 4) }))}
              testId="card-cvv"
              required={false}
            />
            <label className="check-line field--wide">
              <input
                type="checkbox"
                checked={form.preferred}
                onChange={(e) => setForm((f) => ({ ...f, preferred: e.target.checked }))}
                data-testid="card-preferred"
              />
              Definir como preferencial
            </label>
          </div>
          <div className="account-actions">
            <button type="submit" className="btn-primary" data-testid="submit-card">
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
