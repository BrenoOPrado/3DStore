import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Field, SelectField } from "../components/Field";
import { AddressFields, emptyAddress } from "../components/AddressFields";
import { useStore } from "../context/StoreContext";
import { maskCpf } from "../data/checkout";
import { PHONE_TYPES } from "../data/customerRules";

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
      <form onSubmit={onSubmit} noValidate>
        <Field label="E-mail" type="email" value={email} onChange={setEmail} testId="email" required={false} />
        <Field label="Senha" type="password" value={password} onChange={setPassword} testId="password" required={false} />
        {error && (
          <p className="form-error" data-testid="form-error">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary btn-primary--block" data-testid="submit-login">
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
    passwordConfirm: "",
    cpf: "",
    gender: "Feminino",
    birthDate: "",
    phoneType: "celular",
    phoneDdd: "",
    phoneNumber: "",
  });
  const [address, setAddress] = useState(emptyAddress());
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((p) => ({ ...p, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = signup({
      ...form,
      address: { ...address, recipient: address.recipient || form.name },
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
      <p className="auth__lead">
        Informe seus dados e um endereço de cobrança e entrega (tipo “ambos”).
      </p>
      <form onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <Field label="Nome" type="text" value={form.name} onChange={set("name")} testId="name" required={false} wide />
          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={set("email")}
            testId="email"
            required={false}
          />
          <Field
            label="CPF"
            type="text"
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
            type="text"
            value={form.phoneDdd}
            onChange={(v) => set("phoneDdd")(v.replace(/\D/g, "").slice(0, 2))}
            testId="phone-ddd"
            required={false}
          />
          <Field
            label="Telefone"
            type="text"
            value={form.phoneNumber}
            onChange={(v) => set("phoneNumber")(v.replace(/\D/g, "").slice(0, 9))}
            testId="phone-number"
            required={false}
          />
          <Field
            label="Senha"
            type="password"
            value={form.password}
            onChange={set("password")}
            testId="password"
            required={false}
          />
          <Field
            label="Confirmação da senha"
            type="password"
            value={form.passwordConfirm}
            onChange={set("passwordConfirm")}
            testId="password-confirm"
            required={false}
          />
        </div>
        <p className="muted">
          Senha com no mínimo 8 caracteres, incluindo maiúscula, minúscula e caractere especial.
          Digite a senha duas vezes.
        </p>
        <h2 className="panel__title">Endereço residencial (cobrança e entrega)</h2>
        <AddressFields value={address} onChange={setAddress} />
        {error && (
          <p className="form-error" data-testid="form-error">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary btn-primary--block" data-testid="submit-signup">
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
