import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../context/StoreContext";
import { type CustomerFilter } from "../../data/customerRules";
import type { Customer } from "../../data/commerce";

const emptyFilter: CustomerFilter = {
  id: "",
  name: "",
  email: "",
  cpf: "",
  phone: "",
  gender: "",
  status: "",
};

export function AdminCustomersPage() {
  const { searchCustomers, setCustomerStatus } = useStore();
  const [filters, setFilters] = useState(emptyFilter);
  const [list, setList] = useState<Customer[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const set = (key: keyof CustomerFilter) => (value: string) =>
    setFilters((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    let live = true;
    searchCustomers(filters).then((rows) => {
      if (live) setList(rows);
    });
    return () => {
      live = false;
    };
  }, [filters, searchCustomers]);

  const toggle = async (id: string, status: "ativo" | "inativo") => {
    const err = await setCustomerStatus(id, status);
    setMsg(err ?? (status === "ativo" ? "Cliente ativado." : "Cliente inativado."));
    const rows = await searchCustomers(filters);
    setList(rows);
  };

  return (
    <div>
      <p className="eyebrow">Clientes</p>
      <h1 className="page-title">Consultar clientes</h1>
      <p className="page-lead">
        Filtre pelos dados de identificação. Inativar preserva o registro; exclusão é feita pelo
        próprio cliente.
      </p>
      <div className="form-grid" data-testid="customer-filters">
        <label className="field">
          <span className="field__label">Nome</span>
          <input className="field__control" value={filters.name} onChange={(e) => set("name")(e.target.value)} data-testid="filter-name" />
        </label>
        <label className="field">
          <span className="field__label">E-mail</span>
          <input className="field__control" value={filters.email} onChange={(e) => set("email")(e.target.value)} data-testid="filter-email" />
        </label>
        <label className="field">
          <span className="field__label">CPF</span>
          <input className="field__control" value={filters.cpf} onChange={(e) => set("cpf")(e.target.value)} data-testid="filter-cpf" />
        </label>
        <label className="field">
          <span className="field__label">Telefone</span>
          <input className="field__control" value={filters.phone} onChange={(e) => set("phone")(e.target.value)} data-testid="filter-phone" />
        </label>
        <label className="field">
          <span className="field__label">Gênero</span>
          <select className="field__control" value={filters.gender} onChange={(e) => set("gender")(e.target.value)} data-testid="filter-gender">
            <option value="">Todos</option>
            <option>Feminino</option>
            <option>Masculino</option>
            <option>Outro</option>
            <option>Prefiro não informar</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">Situação</span>
          <select className="field__control" value={filters.status} onChange={(e) => set("status")(e.target.value)} data-testid="filter-status">
            <option value="">Todas</option>
            <option value="ativo">ativo</option>
            <option value="inativo">inativo</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">Código</span>
          <input className="field__control" value={filters.id} onChange={(e) => set("id")(e.target.value)} data-testid="filter-id" />
        </label>
      </div>
      {msg && (
        <p className={msg.includes("Cliente") ? "form-ok" : "form-error"} data-testid="form-ok">
          {msg}
        </p>
      )}
      <ul className="stack-list" data-testid="customer-list">
        {list.map((c) => {
          const n = c.orderCount ?? 0;
          return (
            <li key={c.id} className="panel card-surface" data-testid={`customer-${c.email}`}>
              <div className="order-row">
                <Link to={`/admin/clientes/${c.id}`}>
                  <p className="coupon-code">{c.name}</p>
                  <p className="muted">
                    {c.id} · {c.email} · CPF {c.cpf} · ranking {c.ranking} · {n} pedido(s)
                  </p>
                </Link>
                <span
                  className={`status-pill ${c.status === "ativo" ? "status-ENTREGUE" : "status-CANCELADO"}`}
                  data-testid={`status-${c.email}`}
                >
                  {c.status}
                </span>
                <button
                  type="button"
                  className={c.status === "ativo" ? "btn-ghost" : "btn-primary btn-primary--sm"}
                  data-testid={`toggle-status-${c.email}`}
                  onClick={() => void toggle(c.id, c.status === "ativo" ? "inativo" : "ativo")}
                >
                  {c.status === "ativo" ? "Inativar" : "Ativar"}
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

  const toggle = async () => {
    const next = c.status === "ativo" ? "inativo" : "ativo";
    const err = await setCustomerStatus(c.id, next);
    setMsg(err ?? (next === "ativo" ? "Cliente ativado." : "Cliente inativado."));
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
          data-testid="toggle-customer-status"
          onClick={() => void toggle()}
        >
          {c.status === "ativo" ? "Inativar cliente" : "Ativar cliente"}
        </button>
      </div>
      <section className="panel card-surface" data-testid="customer-detail">
        <p>
          Código {c.id} · {c.email} · {c.phone} · CPF {c.cpf}
        </p>
        <p className="muted">
          {c.gender} · nasc. {c.birthDate} · {c.status} · ranking {c.ranking}
        </p>
        {msg && (
          <p className={msg.includes("Cliente") ? "form-ok" : "form-error"} data-testid="form-ok">
            {msg}
          </p>
        )}
        <h3 className="panel__kicker">Endereços</h3>
        {c.addresses.map((a) => (
          <p key={a.id} className="muted">
            {a.label} ({a.kind}): {a.streetType} {a.street}, {a.number} — {a.city}/{a.state}
          </p>
        ))}
        <h3 className="panel__kicker">Cartões</h3>
        {c.cards.map((card) => (
          <p key={card.id} className="muted">
            {card.brand} •••• {card.last4}
            {card.preferred ? " · preferencial" : ""}
          </p>
        ))}
      </section>
      <h2 className="section__title">Pedidos</h2>
      <ul className="stack-list" data-testid="customer-orders">
        {theirs.map((o) => (
          <li key={o.id}>
            <Link to={`/admin/pedidos/${o.id}`} className="link-cyan">
              {o.id}
            </Link>
          </li>
        ))}
        {theirs.length === 0 && <p className="muted">Nenhum pedido deste cliente.</p>}
      </ul>
    </div>
  );
}
