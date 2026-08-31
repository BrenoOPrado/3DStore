import { FormEvent, useState } from "react";
import { Field } from "../../components/Field";
import { useStore } from "../../context/StoreContext";
import { maskCep, maskPhone } from "../../data/checkout";
import { formatAddress, type Address } from "../../data/commerce";

const blank: Omit<Address, "id"> = {
  label: "Casa",
  recipient: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export function AccountAddressesPage() {
  const { user, addAddress, updateAddress, removeAddress } = useStore();
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!user) return null;

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const startNew = () => {
    setEditing(null);
    setForm({ ...blank, recipient: user.name, phone: user.phone });
    setOpen(true);
    setMsg(null);
  };

  const startEdit = (a: Address) => {
    setEditing(a);
    const { id: _, ...rest } = a;
    setForm(rest);
    setOpen(true);
    setMsg(null);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) {
      const err = updateAddress({ ...form, id: editing.id });
      if (err) {
        setMsg(err);
        return;
      }
    } else {
      const result = addAddress(form);
      if ("error" in result) {
        setMsg(result.error);
        return;
      }
    }
    setMsg(null);
    setOpen(false);
  };

  return (
    <div>
      <p className="eyebrow">Entrega</p>
      <div className="section__head">
        <h1 className="page-title">Endereços</h1>
        <button type="button" className="btn-primary btn-primary--sm" onClick={startNew}>
          Novo endereço
        </button>
      </div>
      <p className="page-lead">Selecione um destes no checkout ou cadastre outro.</p>

      <ul className="stack-list">
        {user.addresses.map((a) => (
          <li key={a.id} className="panel card-surface">
            <div className="row-between">
              <div>
                <p className="panel__kicker">{a.label}</p>
                <p className="pre-line">{formatAddress(a)}</p>
                <p className="muted">{a.recipient} · {a.phone}</p>
              </div>
              <div className="account-actions">
                <button type="button" className="ghost-link" onClick={() => startEdit(a)}>
                  Alterar
                </button>
                <button type="button" className="ghost-link" onClick={() => removeAddress(a.id)}>
                  Excluir
                </button>
              </div>
            </div>
          </li>
        ))}
        {user.addresses.length === 0 && <p className="muted">Nenhum endereço cadastrado.</p>}
      </ul>

      {open && (
        <form onSubmit={onSubmit} className="panel card-surface account-form">
          <h2 className="panel__title">{editing ? "Alterar endereço" : "Novo endereço"}</h2>
          {msg && <p className="form-error">{msg}</p>}
          <div className="form-grid">
            <Field label="Apelido" value={form.label} onChange={set("label")} />
            <Field label="Destinatário" value={form.recipient} onChange={set("recipient")} />
            <Field label="Telefone" value={form.phone} onChange={(v) => set("phone")(maskPhone(v))} />
            <Field label="CEP" value={form.cep} onChange={(v) => set("cep")(maskCep(v))} />
            <Field label="Estado" value={form.state} onChange={set("state")} />
            <Field label="Rua" value={form.street} onChange={set("street")} wide />
            <Field label="Número" value={form.number} onChange={set("number")} />
            <Field
              label="Complemento"
              value={form.complement}
              onChange={set("complement")}
              required={false}
            />
            <Field label="Bairro" value={form.neighborhood} onChange={set("neighborhood")} />
            <Field label="Cidade" value={form.city} onChange={set("city")} />
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
  