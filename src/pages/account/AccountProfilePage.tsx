import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field, SelectField } from "../../components/Field";
import { useStore } from "../../context/StoreContext";
import { useCart } from "../../context/CartContext";
import { maskCpf } from "../../data/checkout";
import { PHONE_TYPES } from "../../data/customerRules";

export function AccountProfilePage() {
  const { user, updateProfile, deleteAccount } = useStore();
  const { clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    cpf: user?.cpf ?? "",
    phoneType: user?.phoneType ?? "celular",
    phoneDdd: user?.phoneDdd ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    gender: user?.gender ?? "Prefiro não informar",
    birthDate: user?.birthDate ?? "",
  });
  const [msg, setMsg] = useState<string | null>(null);

  if (!user) return null;

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = await updateProfile(form);
    setMsg(err ?? "Cadastro atualizado.");
  };

  const onDelete = async () => {
    if (!confirm("Excluir a conta? Esta ação remove o cadastro e não pode ser desfeita. Não é inativação.")) return;
    const err = await deleteAccount();
    if (err) {
      setMsg(err);
      return;
    }
    clear();
    navigate("/");
  };

  return (
    <div>
      <p className="eyebrow">Cliente</p>
      <h1 className="page-title">Consultar e alterar cadastro</h1>
      <p className="page-lead" data-testid="profile-summary">
        Código {user.id} · e-mail {user.email} · situação {user.status} · ranking {user.ranking}.
      </p>

      <form onSubmit={onSubmit} className="panel card-surface account-form" noValidate>
        <div className="form-grid">
          <Field label="Nome" value={form.name} onChange={set("name")} wide testId="name" required={false} />
          <Field
            label="CPF"
            value={form.cpf}
            onChange={(v) => set("cpf")(maskCpf(v))}
            testId="cpf"
            required={false}
          />
          <SelectField
            label="Gênero"
            value={form.gender}
            onChange={set("gender")}
            options={["Feminino", "Masculino", "Outro", "Prefiro não informar"]}
            testId="gender"
          />
          <Field
            label="Nascimento"
            type="date"
            value={form.birthDate}
            onChange={set("birthDate")}
            testId="birth-date"
            required={false}
          />
          <SelectField
            label="Tipo de telefone"
            value={form.phoneType}
            onChange={set("phoneType")}
            options={[...PHONE_TYPES]}
            testId="phone-type"
          />
          <Field
            label="DDD"
            value={form.phoneDdd}
            onChange={(v) => set("phoneDdd")(v.replace(/\D/g, "").slice(0, 2))}
            testId="phone-ddd"
            required={false}
          />
          <Field
            label="Telefone"
            value={form.phoneNumber}
            onChange={(v) => set("phoneNumber")(v.replace(/\D/g, "").slice(0, 9))}
            testId="phone-number"
            required={false}
          />
        </div>
        {msg && (
          <p className={msg.includes("atualizado") ? "form-ok" : "form-error"} data-testid={msg.includes("atualizado") ? "form-ok" : "form-error"}>
            {msg}
          </p>
        )}
        <div className="account-actions">
          <button type="submit" className="btn-primary" data-testid="submit-profile">
            Salvar alterações
          </button>
          {user.role !== "admin" && (
            <button type="button" className="btn-ghost" data-testid="delete-account" onClick={onDelete}>
              Excluir conta
            </button>
          )}
        </div>
        {user.role !== "admin" && (
          <p className="muted">
            Excluir remove o cadastro. Inativar é feito pelo administrador e preserva os dados.
          </p>
        )}
      </form>
    </div>
  );
}
