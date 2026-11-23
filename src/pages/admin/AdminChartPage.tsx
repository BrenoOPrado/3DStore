import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categories, formatPrice, type CategoryId } from "../../data/products";
import { type ChartData, type ChartSeries } from "../../data/commerce";
import { brToIsoDate } from "../../data/dates";
import { DateField } from "../../components/DateField";
import { useStore } from "../../context/StoreContext";

function MultiLineChart({ months, series }: { months: string[]; series: ChartSeries[] }) {
  const data = useMemo(
    () =>
      months.map((month, i) => {
        const row: Record<string, string | number> = { month };
        for (const s of series) row[s.id] = s.points[i] ?? 0;
        return row;
      }),
    [months, series]
  );
  const max = Math.max(1, ...series.flatMap((s) => s.points));
  const ticks = [0, max / 2, max];
  const rotate = months.length >= 12;

  return (
    <div
      className={rotate ? "line-chart line-chart--rotated" : "line-chart"}
      role="img"
      aria-label="Histórico de vendas por categoria"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: rotate ? 36 : 8 }}>
          <CartesianGrid stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={rotate ? -40 : 0}
            textAnchor={rotate ? "end" : "middle"}
            height={rotate ? 56 : 30}
          />
          <YAxis
            tickFormatter={(value) => formatPrice(Number(value))}
            ticks={ticks}
            domain={[0, max]}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={88}
          />
          <Tooltip
            formatter={(value, name) => [formatPrice(Number(value ?? 0)), String(name)]}
            contentStyle={{
              background: "#12121c",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 12,
              fontSize: 13,
              color: "#fff",
            }}
            labelStyle={{ color: "#9ca3af" }}
            cursor={{ stroke: "rgba(255, 255, 255, 0.12)" }}
            isAnimationActive={false}
          />
          {series.map((s) => (
            <Line
              key={s.id}
              type="linear"
              dataKey={s.id}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: s.color, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {series.map((s) => (
        <span key={s.id} data-testid={`chart-series-${s.id}`} hidden />
      ))}
    </div>
  );
}

export function AdminChartPage() {
  const { loadChart } = useStore();
  const [selected, setSelected] = useState<CategoryId[]>([]);
  const [start, setStart] = useState("01/01/2026");
  const [end, setEnd] = useState("31/12/2026");
  const [chart, setChart] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [openIds, setOpenIds] = useState<CategoryId[]>([]);
  const startIso = brToIsoDate(start);
  const endIso = brToIsoDate(end);

  useEffect(() => {
    if (!startIso || !endIso) return;
    let live = true;
    const t0 = performance.now();
    loadChart({
      categoryIds: selected,
      start: `${startIso}T00:00:00.000Z`,
      end: `${endIso}T23:59:59.000Z`,
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
  }, [endIso, loadChart, selected, startIso]);

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
          <DateField label="Data de início" value={start} onChange={setStart} testId="chart-start" />
          <DateField label="Data de fim" value={end} onChange={setEnd} testId="chart-end" />
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
