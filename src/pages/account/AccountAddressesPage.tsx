import { FormEvent, useState } from "react";
import { AddressFields, emptyAddress } from "../../components/AddressFields";
import { useStore } from "../../context/StoreContext";
import { formatAddress, type Address } from "../../data/commerce";

export function AccountAddressesPage() {
  const { user, addAddress, updateAddress, removeAddress } = useStore();
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(emptyAddress());
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!user) return null;

  const startNew = () => {
    setEditing(null);
    setForm(emptyAddress(user.name, user.phone));
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

  const onRemove = (id: string) => {
    const err = removeAddress(id);
    if (err) setMsg(err);
    else setMsg(null);
  };

  return (
    <div>
      <p className="eyebrow">Entrega</p>
      <div className="section__head">
        <h1 className="page-title">Endereços</h1>
        <button type="button" className="btn-primary btn-primary--sm" data-testid="new-address" onClick={startNew}>
          Novo endereço
        </button>
      </div>
      <p className="page-lead">
        Cadastre endereços com um apelido. Mantenha ao menos um de cobrança e um de entrega.
      </p>
      {msg && !open && (
        <p className="form-error" data-testid="form-error">
          {msg}
        </p>
      )}

      <ul className="stack-list" data-testid="address-list">
        {user.addresses.map((a) => (
          <li key={a.id} className="panel card-surface" data-testid={`address-${a.label}`}>
            <div className="row-between">
              <div>
                <p className="panel__kicker">
                  {a.label} · {a.kind}
                </p>
                <p className="pre-line">{formatAddress(a)}</p>
                <p className="muted">
                  {a.recipient} · {a.phone}
                </p>
              </div>
              <div className="account-actions">
                <button type="button" className="ghost-link" data-testid={`edit-address-${a.label}`} onClick={() => startEdit(a)}>
                  Alterar
                </button>
                <button type="button" className="ghost-link" data-testid={`remove-address-${a.label}`} onClick={() => onRemove(a.id)}>
                  Excluir
                </button>
              </div>
            </div>
          </li>
        ))}
        {user.addresses.length === 0 && <p className="muted">Nenhum endereço cadastrado.</p>}
      </ul>

      {open && (
        <form onSubmit={onSubmit} className="panel card-surface account-form" noValidate data-testid="address-form">
          <h2 className="panel__title">{editing ? "Alterar endereço" : "Novo endereço"}</h2>
          {msg && (
            <p className="form-error" data-testid="form-error">
              {msg}
            </p>
          )}
          <AddressFields value={form} onChange={setForm} />
          <div className="account-actions">
            <button type="submit" className="btn-primary" data-testid="submit-address">
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
