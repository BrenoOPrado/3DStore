import { Link } from "react-router-dom";
import { categories, formatPrice } from "../../data/products";
import { chartFromOrders } from "../../data/commerce";
import { useStore } from "../../context/StoreContext";

export function AdminChartPage() {
  const { orders } = useStore();
  const { months, categories: bars } = chartFromOrders(orders, categories);
  const maxMonth = Math.max(1, ...months.map((m) => m.total));
  const maxCat = Math.max(1, ...bars.map((c) => c.total));
  const revenue = months.reduce((s, m) => s + m.total, 0);

  return (
    <div>
      <p className="eyebrow">Análise</p>
      <h1 className="page-title">Gráfico de vendas</h1>
      <p className="page-lead">
        Pedidos com pagamento confirmado (e fluxos seguintes). Receita {formatPrice(revenue)} ·{" "}
        {orders.length} pedidos no total.
      </p>

      <section className="panel card-surface">
        <h2 className="panel__title">Receita por mês</h2>
        <div className="chart">
          {months.map((m) => (
            <div key={m.label} className="chart__col">
              <div className="chart__bar-wrap">
                <div
                  className="chart__bar"
                  style={{ height: `${Math.max(6, (m.total / maxMonth) * 100)}%` }}
                  title={formatPrice(m.total)}
                />
              </div>
              <span className="chart__label">{m.label}</span>
              <span className="chart__value">{formatPrice(m.total)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel card-surface">
        <h2 className="panel__title">Por categoria</h2>
        <ul className="cat-bars">
          {bars.map((c) => (
            <li key={c.id}>
              <div className="row-between">
                <span>{c.label}</span>
                <span>{formatPrice(c.total)}</span>
              </div>
              <div className="cat-bars__track">
                <div
                  className="cat-bars__fill"
                  style={{ width: `${(c.total / maxCat) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="muted">
        Consulte também{" "}
        <Link to="/admin/clientes" className="link-cyan">
          clientes
        </Link>{" "}
        e{" "}
        <Link to="/admin/pedidos" className="link-cyan">
          pedidos
        </Link>
        .
      </p>
    </div>
  );
}
