import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { categories, formatPrice, type CategoryId } from "../../data/products";
import { type ChartData, type ChartSeries } from "../../data/commerce";
import { useStore } from "../../context/StoreContext";

function MultiLineChart({ months, series }: { months: string[]; series: ChartSeries[] }) {
  const w = 720;
  const h = 300;
  const padL = 96;
  const padR = 20;
  const padT = 20;
  const padB = 44;
  const max = Math.max(1, ...series.flatMap((s) => s.points));
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const n = months.length;
  const xAt = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v: number) => padT + innerH - (v / max) * innerH;
  const ticks = [1, 0.5, 0];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="line-chart" role="img" aria-label="Histórico de vendas por categoria">
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
      {series.map((s) => {
        const line = s.points
          .map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`)
          .join(" ");
        return (
          <g key={s.id} data-testid={`chart-series-${s.id}`}>
            <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" />
            {s.points.map((v, i) => (
              <circle key={`${s.id}-${i}`} cx={xAt(i)} cy={yAt(v)} r="4" fill={s.color}>
                <title>
                  {s.label} · {months[i]}: {formatPrice(v)}
                </title>
              </circle>
            ))}
          </g>
        );
      })}
      {months.map((label, i) => (
        <text key={label} className="line-chart__xlabel" x={xAt(i)} y={h - 14} textAnchor="middle">
          {label}
        </text>
      ))}
    </svg>
  );
}

export function AdminChartPage() {
  const { loadChart } = useStore();
  const [selected, setSelected] = useState<CategoryId[]>([]);
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-12-31");
  const [chart, setChart] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [openIds, setOpenIds] = useState<CategoryId[]>([]);

  useEffect(() => {
    let live = true;
    const t0 = performance.now();
    loadChart({
      categoryIds: selected,
      start: `${start}T00:00:00.000Z`,
      end: `${end}T23:59:59.000Z`,
    }).then((data) => {
      if (!live) return;
      setElapsedMs(Math.round(performance.now() - t0));
      if ("error" in data && data.error) {
        setError(String(data.error));
        return;
      }
      setError(null);
      setChart(data as ChartData);
    });
    return () => {
      live = false;
    };
  }, [end, loadChart, selected, start]);

  const series = chart?.series ?? [];
  const months = chart?.months ?? [];
  const categoryTotals = useMemo(
    () =>
      series.map((s) => ({
        id: s.id,
        label: s.label,
        total: s.points.reduce((sum, n) => sum + n, 0),
      })),
    [series]
  );
  const maxCat = Math.max(1, ...categoryTotals.map((c) => c.total));
  const allActive = selected.length === 0;

  const toggleCategory = (id: CategoryId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    setOpenIds([]);
  };

  return (
    <div>
      <p className="eyebrow">Análise</p>
      <h1 className="page-title">Histórico de vendas por categoria</h1>
      <p className="page-lead">
        Somente compras ENTREGUE entram no cálculo. Receita {formatPrice(chart?.revenue ?? 0)} ·{" "}
        {chart?.orderCount ?? 0} pedidos no período.
      </p>

      <section className="panel card-surface">
        <h2 className="panel__title">Período</h2>
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Data de início</span>
            <input
              className="field__control"
              type="date"
              data-testid="chart-start"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Data de fim</span>
            <input
              className="field__control"
              type="date"
              data-testid="chart-end"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <p className="form-error" data-testid="chart-error">
            {error}
          </p>
        )}
        {elapsedMs != null && (
          <p className="muted" data-testid="chart-timing">
            Consulta em {elapsedMs} ms
          </p>
        )}
      </section>

      <section className="panel card-surface">
        <h2 className="panel__title">Categorias</h2>
        <div className="chart-filters" role="group" aria-label="Comparar categorias">
          <button
            type="button"
            className={`chip${allActive ? " is-active" : ""}`}
            aria-pressed={allActive}
            data-testid="chart-cat-all"
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
                data-testid={`chart-cat-${c.id}`}
                onClick={() => toggleCategory(c.id)}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        {months.length === 0 ? (
          <p className="muted">Nenhuma venda ENTREGUE no período.</p>
        ) : (
          <div data-testid="sales-line-chart">
            <MultiLineChart months={months} series={series} />
            <ul className="chart-legend" data-testid="chart-legend">
              {series.map((s) => (
                <li key={s.id}>
                  <span className="chart-legend__swatch" style={{ background: s.color }} />
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        )}
        <ul className="chart-breakdown" data-testid="chart-values">
          {series.map((s) => {
            const open = openIds.includes(s.id);
            const nonzero = months
              .map((label, i) => ({ label, value: s.points[i] ?? 0 }))
              .filter((point) => point.value > 0);
            return (
              <li key={s.id} className="chart-breakdown__item" data-testid={`chart-values-${s.id}`}>
                <button
                  type="button"
                  className={`chart-breakdown__toggle${open ? " is-open" : ""}`}
                  aria-expanded={open}
                  data-testid={`chart-values-toggle-${s.id}`}
                  onClick={() =>
                    setOpenIds((prev) =>
                      prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                    )
                  }
                >
                  <span>{s.label}</span>
                  <ChevronDown size={18} aria-hidden />
                </button>
                {open && (
                  <ul className="chart-breakdown__months">
                    {nonzero.length === 0 ? (
                      <li className="muted">Nenhum mês com venda neste período.</li>
                    ) : (
                      nonzero.map((point) => (
                        <li key={point.label}>
                          {point.label}: {formatPrice(point.value)}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel card-surface">
        <h2 className="panel__title">Totais no período</h2>
        <ul className="cat-bars">
          {categoryTotals.map((c) => (
            <li key={c.id}>
              <div className="row-between">
                <span>{c.label}</span>
                <span data-testid={`chart-total-${c.id}`}>{formatPrice(c.total)}</span>
              </div>
              <div className="cat-bars__track">
                <div className="cat-bars__fill" style={{ width: `${(c.total / maxCat) * 100}%` }} />
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
