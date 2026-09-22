import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categories, formatPrice, type CategoryId } from "../../data/products";
import { type ChartData, type ChartPoint } from "../../data/commerce";
import { useStore } from "../../context/StoreContext";

function MonthLineChart({ months }: { months: ChartPoint[] }) {
  const w = 640;
  const h = 280;
  const padL = 96;
  const padR = 20;
  const padT = 20;
  const padB = 44;
  const max = Math.max(1, ...months.map((m) => m.total));
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const n = months.length;
  const xAt = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v: number) => padT + innerH - (v / max) * innerH;
  const line = months
    .map((m, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(m.total).toFixed(1)}`)
    .join(" ");
  const area =
    n === 0
      ? ""
      : `${line} L ${xAt(n - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${xAt(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
  const ticks = [1, 0.5, 0];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="line-chart" role="img" aria-label="Receita por mês">
      <defs>
        <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => {
        const y = yAt(max * t);
        return (
          <g key={t}>
            <line className="line-chart__grid" x1={padL} x2={w - padR} y1={y} y2={y} />
            <text className="line-chart__tick" x={padL - 8} y={y + 4} textAnchor="end">
              {formatPrice(max * t)}
            </text>
          </g>
        );
      })}
      {area && <path className="line-chart__area" d={area} />}
      {n > 0 && <path className="line-chart__line" d={line} />}
      {months.map((m, i) => (
        <g key={m.label}>
          <circle className="line-chart__dot" cx={xAt(i)} cy={yAt(m.total)} r="5">
            <title>
              {m.label}: {formatPrice(m.total)}
            </title>
          </circle>
          <text className="line-chart__xlabel" x={xAt(i)} y={h - 14} textAnchor="middle">
            {m.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function AdminChartPage() {
  const { loadChart } = useStore();
  const [selected, setSelected] = useState<CategoryId[]>([]);
  const [chart, setChart] = useState<ChartData | null>(null);
  const months = chart?.months ?? [];
  const bars = chart?.categories ?? [];
  const maxCat = Math.max(1, ...bars.map((c) => c.total));
  const revenue = chart?.revenue ?? 0;
  const orderCount = chart?.orderCount ?? 0;
  const totalOrders = chart?.totalOrders ?? 0;
  const allActive = selected.length === 0;

  useEffect(() => {
    let live = true;
    loadChart(selected).then((data) => {
      if (!live || "error" in data) return;
      setChart(data);
    });
    return () => {
      live = false;
    };
  }, [loadChart, selected]);

  const toggleCategory = (id: CategoryId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <p className="eyebrow">Análise</p>
      <h1 className="page-title">Gráfico de vendas</h1>
      <p className="page-lead">
        Pedidos com pagamento confirmado (e fluxos seguintes). Receita {formatPrice(revenue)} ·{" "}
        {orderCount} pedidos{allActive ? ` · ${totalOrders} no total` : " na seleção"}.
      </p>

      <section className="panel card-surface">
        <h2 className="panel__title">Receita por mês</h2>
        <p className="muted chart-filters__hint">Filtre por categoria. Várias podem ficar ativas ao mesmo tempo.</p>
        <div className="chart-filters" role="group" aria-label="Filtrar gráfico por categoria">
          <button
            type="button"
            className={`chip${allActive ? " is-active" : ""}`}
            aria-pressed={allActive}
            onClick={() => setSelected([])}
          >
            Todas
          </button>
          {categories.map((c) => {
            const active = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`chip${active ? " is-active" : ""}`}
                aria-pressed={active}
                onClick={() => toggleCategory(c.id)}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        {months.length === 0 ? (
          <p className="muted">Nenhuma venda no período{allActive ? "." : " para as categorias selecionadas."}</p>
        ) : (
          <MonthLineChart months={months} />
        )}
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
