import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = login(email, password);
    if (err) setError(err);
    else navigate("/");
  };

  return (
    <div className="auth">
      <div className="auth__brand">
        <Logo />
        <span className="brand__name">3D Store</span>
      </div>
      <h1>Entrar</h1>
      <p className="auth__lead">Acesse sua conta para acompanhar pedidos.</p>
      <form onSubmit={onSubmit}>
        <Field label="E-mail" type="email" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" value={password} onChange={setPassword} />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary btn-primary--block">
          Entrar
        </button>
      </form>
      <p className="auth__switch">
        Ainda não tem conta?{" "}
        <Link to="/cadastro" className="link-cyan">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = signup(name, email, password);
    if (err) setError(err);
    else navigate("/");
  };

  return (
    <div className="auth">
      <div className="auth__brand">
        <Logo />
        <span className="brand__name">3D Store</span>
      </div>
      <h1>Cadastre-se</h1>
      <p className="auth__lead">Crie sua conta e comece a montar sua coleção.</p>
      <form onSubmit={onSubmit}>
        <Field label="Nome" type="text" value={name} onChange={setName} />
        <Field label="E-mail" type="email" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" value={password} onChange={setPassword} />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary btn-primary--block">
          Criar conta
        </button>
      </form>
      <p className="auth__switch">
        Já tem conta?{" "}
        <Link to="/entrar" className="link-cyan">
          Entrar
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="field__control"
      />
    </label>
  );
}
