import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../context/StoreContext";

export function AdminCustomersPage() {
  const { customers, orders, setCustomerStatus } = useStore();
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return customers.filter(
      (c) =>
        !needle ||
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.cpf.includes(needle)
    );
  }, [customers, q]);

  const toggle = (id: string, status: "ativo" | "inativo") => {
    const err = setCustomerStatus(id, status);
    setMsg(err ?? (status === "ativo" ? "Cliente ativado." : "Cliente desativado."));
  };

  return (
    <div>
      <p className="eyebrow">Clientes</p>
      <h1 className="page-title">Consultar clientes</h1>
      <input
        className="field__control search-filter"
        placeholder="Nome, e-mail ou CPF"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {msg && <p className={msg.includes("Cliente") ? "form-ok" : "form-error"}>{msg}</p>}
      <ul className="stack-list">
        {list.map((c) => {
          const n = orders.filter((o) => o.customerId === c.id).length;
          return (
            <li key={c.id} className="panel card-surface">
              <div className="order-row">
                <Link to={`/admin/clientes/${c.id}`}>
                  <p className="coupon-code">{c.name}</p>
                  <p className="muted">
                    {c.email} · CPF {c.cpf} · {n} pedido(s)
                  </p>
                </Link>
                <span className={`status-pill ${c.status === "ativo" ? "status-ENTREGUE" : "status-CANCELADO"}`}>
                  {c.status}
                </span>
                <button
                  type="button"
                  className={c.status === "ativo" ? "btn-ghost" : "btn-primary btn-primary--sm"}
                  onClick={() => toggle(c.id, c.status === "ativo" ? "inativo" : "ativo")}
                >
                  {c.status === "ativo" ? "Desativar" : "Ativar"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AdminCustomerDetailPage({ id }: { id: string }) {
  const { customers, orders, setCustomerStatus } = useStore();
  const c = customers.find((x) => x.id === id);
  const [msg, setMsg] = useState<string | null>(null);
  if (!c) return <p className="muted">Cliente não encontrado.</p>;
  const theirs = orders.filter((o) => o.customerId === c.id);

  const toggle = () => {
    const next = c.status === "ativo" ? "inativo" : "ativo";
    const err = setCustomerStatus(c.id, next);
    setMsg(err ?? (next === "ativo" ? "Cliente ativado." : "Cliente desativado."));
  };

  return (
    <div>
      <p className="eyebrow">
        <Link to="/admin/clientes" className="link-hover">
          Clientes
        </Link>{" "}
        / {c.name}
      </p>
      <div className="section__head">
        <h1 className="page-title">{c.name}</h1>
        <button
          type="button"
          className={c.status === "ativo" ? "btn-ghost" : "btn-primary"}
          onClick={toggle}
        >
          {c.status === "ativo" ? "Desativar cliente" : "Ativar cliente"}
        </button>
      </div>
      <section className="panel card-surface">
        <p>
          {c.email} · {c.phone}
        </p>
        <p className="muted">
          CPF {c.cpf} · {c.gender} · nasc. {c.birthDate} · {c.status}
        </p>
        {msg && <p className={msg.includes("Cliente") ? "form-ok" : "form-error"}>{msg}</p>}
        <h3 className="panel__kicker">Endereços</h3>
        {c.addresses.map((a) => (
          <p key={a.id} className="muted">
            {a.label}: {a.street}, {a.number} — {a.city}/{a.state}
          </p>
        ))}
        <h3 className="panel__kicker">Cartões</h3>
        {c.cards.map((card) => (
          <p key={card.id} className="muted">
            {card.brand} •••• {card.last4}
          </p>
        ))}
      </section>
      <h2 className="section__title">Pedidos</h2>
      <ul className="stack-list">
        {theirs.map((o) => (
          <li key={o.id}>
            <Link to={`/admin/pedidos/${o.id}`} className="link-cyan">
              {o.id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
