import { FormEvent, useState } from "react";
import { Field } from "../../components/Field";
import { useStore } from "../../context/StoreContext";

export function AccountPasswordPage() {
  const { changePassword } = useStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = changePassword(currentPassword, next, confirm);
    setMsg(err ?? "Senha alterada.");
    if (!err) {
      setCurrentPassword("");
      setNext("");
      setConfirm("");
    }
  };

  return (
    <div>
      <p className="eyebrow">Segurança</p>
      <h1 className="page-title">Alterar senha</h1>
      <p className="page-lead">Altere só a senha, sem editar o restante do cadastro.</p>
      <form onSubmit={onSubmit} className="panel card-surface account-form" noValidate>
        <div className="form-grid">
          <Field
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            testId="current-password"
            required={false}
            wide
          />
          <Field
            label="Nova senha"
            type="password"
            value={next}
            onChange={setNext}
            testId="new-password"
            required={false}
          />
          <Field
            label="Confirmação da nova senha"
            type="password"
            value={confirm}
            onChange={setConfirm}
            testId="new-password-confirm"
            required={false}
          />
        </div>
        {msg && (
          <p
            className={msg.includes("alterada") ? "form-ok" : "form-error"}
            data-testid={msg.includes("alterada") ? "form-ok" : "form-error"}
          >
            {msg}
          </p>
        )}
        <div className="account-actions">
          <button type="submit" className="btn-primary" data-testid="submit-password">
            Salvar senha
          </button>
        </div>
      </form>
    </div>
  );
}
