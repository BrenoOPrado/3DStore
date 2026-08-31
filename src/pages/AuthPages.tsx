import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Field } from "../components/Field";
import { useStore } from "../context/StoreContext";
import { maskPhone } from "../data/checkout";

export function LoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = login(email, password);
    if (err) setError(err);
    else {
      const isAdmin = email.toLowerCase() === "admin@3dstore.com";
      navigate(from && from !== "/" ? from : isAdmin ? "/admin" : "/");
    }
  };

  return (
    <div className="auth">
      <div className="auth__brand">
        <Logo />
        <span className="brand__name">3D Store</span>
      </div>
      <h1>Entrar</h1>
      <p className="auth__lead">Cliente ou administrador. Dados de demonstração abaixo.</p>
      <form onSubmit={onSubmit}>
        <Field label="E-mail" type="email" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" value={password} onChange={setPassword} />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary btn-primary--block">
          Entrar
        </button>
      </form>
      <div className="notice">
        <p>
          Cliente: <code>ana.souza@email.com</code> / <code>123456</code>
        </p>
        <p>
          Admin: <code>admin@3dstore.com</code> / <code>admin123</code>
        </p>
      </div>
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
  const { signup } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    cpf: "",
    phone: "",
    gender: "Prefiro não informar",
    birthDate: "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((p) => ({ ...p, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = signup({
      ...form,
      phone: maskPhone(form.phone),
      cpf: form.cpf.replace(/\D/g, ""),
    });
    if (err) setError(err);
    else navigate("/conta");
  };

  return (
    <div className="auth auth--wide">
      <div className="auth__brand">
        <Logo />
        <span className="brand__name">3D Store</span>
      </div>
      <h1>Cadastre-se</h1>
      <p className="auth__lead">Crie o cadastro de cliente. Depois adicione endereço e cartão.</p>
      <form onSubmit={onSubmit}>
        <Field label="Nome" type="text" value={form.name} onChange={set("name")} />
        <Field label="E-mail" type="email" value={form.email} onChange={set("email")} />
        <Field label="Senha" type="password" value={form.password} onChange={set("password")} />
        <Field
          label="CPF"
          type="text"
          value={form.cpf}
          onChange={(v) => set("cpf")(v.replace(/\D/g, "").slice(0, 11))}
        />
        <Field label="Telefone" type="text" value={form.phone} onChange={(v) => set("phone")(maskPhone(v))} />
        <label className="field">
          <span className="field__label">Gênero</span>
          <select className="field__control" value={form.gender} onChange={(e) => set("gender")(e.target.value)}>
            <option>Feminino</option>
            <option>Masculino</option>
            <option>Outro</option>
            <option>Prefiro não informar</option>
          </select>
        </label>
        <Field label="Nascimento" type="date" value={form.birthDate} onChange={set("birthDate")} />
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
