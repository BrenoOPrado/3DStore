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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="mb-8 flex items-center gap-2">
        <Logo />
        <span className="font-semibold">3D Store</span>
      </div>
      <h1 className="text-3xl font-bold">Entrar</h1>
      <p className="mt-2 text-sm text-muted">Acesse sua conta para acompanhar pedidos.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="E-mail" type="email" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" value={password} onChange={setPassword} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full rounded-xl py-3 text-sm font-semibold">
          Entrar
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link to="/cadastro" className="text-cyan hover:underline">
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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="mb-8 flex items-center gap-2">
        <Logo />
        <span className="font-semibold">3D Store</span>
      </div>
      <h1 className="text-3xl font-bold">Cadastre-se</h1>
      <p className="mt-2 text-sm text-muted">Crie sua conta e comece a montar sua coleção.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Nome" type="text" value={name} onChange={setName} />
        <Field label="E-mail" type="email" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" value={password} onChange={setPassword} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full rounded-xl py-3 text-sm font-semibold">
          Criar conta
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Já tem conta?{" "}
        <Link to="/entrar" className="text-cyan hover:underline">
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
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="h-11 w-full rounded-xl border border-line bg-[#101018] px-3 outline-none focus:border-purple/50"
      />
    </label>
  );
}
