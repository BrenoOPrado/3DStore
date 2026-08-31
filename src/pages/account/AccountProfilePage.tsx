import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field } from "../../components/Field";
import { useStore } from "../../context/StoreContext";
import { maskPhone } from "../../data/checkout";

export function AccountProfilePage() {
  const { user, updateProfile, inactivate } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    gender: user?.gender ?? "Prefiro não informar",
    birthDate: user?.birthDate ?? "",
    cpf: user?.cpf ?? "",
  });
  const [msg, setMsg] = useState<string | null>(null);

  if (!user) return null;

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = updateProfile({
      ...form,
      phone: maskPhone(form.phone),
      cpf: form.cpf.replace(/\D/g, ""),
    });
    setMsg(err ?? "Cadastro atualizado.");
  };

  const onInactivate = () => {
    if (!confirm("Inativar a conta? Você não poderá mais entrar até o ateliê reativá-la.")) return;
    const err = inactivate();
    if (err) setMsg(err);
    else navigate("/");
  };

  return (
    <div>
      <p className="eyebrow">Cliente</p>
      <h1 className="page-title">Consultar e alterar cadastro</h1>
      <p className="page-lead">E-mail {user.email} · situação {user.status}.</p>

      <form onSubmit={onSubmit} className="panel card-surface account-form">
        <div className="form-grid">
          <Field label="Nome" value={form.name} onChange={set("name")} wide />
          <Field
            label="CPF"
            value={form.cpf}
            onChange={(v) => set("cpf")(v.replace(/\D/g, "").slice(0, 11))}
          />
          <Field label="Telefone" value={form.phone} onChange={(v) => set("phone")(maskPhone(v))} />
          <label className="field">
            <span className="field__label">Gênero</span>
            <select
              className="field__control"
              value={form.gender}
              onChange={(e) => set("gender")(e.target.value)}
            >
              <option>Feminino</option>
              <option>Masculino</option>
              <option>Outro</option>
              <option>Prefiro não informar</option>
            </select>
          </label>
          <Field label="Nascimento" type="date" value={form.birthDate} onChange={set("birthDate")} />
        </div>
        {msg && <p className={msg.includes("atualizado") ? "form-ok" : "form-error"}>{msg}</p>}
        <div className="account-actions">
          <button type="submit" className="btn-primary">
            Salvar alterações
          </button>
          {user.role !== "admin" && (
            <button type="button" className="btn-ghost" onClick={onInactivate}>
              Inativar cliente
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
