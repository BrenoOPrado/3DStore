import { Link } from "react-router-dom";
import { ArrowRight, Printer, Sparkles, Star } from "lucide-react";
import { categories, products } from "../data/products";
import { ProductCard } from "../components/ProductCard";
import { CategoryGlyph } from "../components/CategoryGlyph";

const HERO_IMG =
  "https://images.unsplash.com/photo-1612815154858-961fe0a6f8a2?auto=format&fit=crop&w=1600&q=80";

export function HomePage() {
  const featured = products.filter((p) => p.featured);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="glow-purple pointer-events-none absolute inset-0" />
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt=""
            className="hero-fade hidden h-full w-full object-cover object-center opacity-35 lg:block"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07070f] via-[#07070f]/88 to-[#07070f]/40" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-16 lg:grid-cols-2 lg:pb-28 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-purple/30 bg-purple/15 px-3.5 py-1 text-xs font-medium text-purple-200">
              <Sparkles size={13} />
              Transforme suas ideias
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[56px]">
              Produtos únicos <span className="gradient-text">criados em 3D</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Peças impressas sob demanda, com acabamento premium e designs que
              você não encontra em lojas comuns. Do colecionável ao utilitário.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/catalogo"
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
              >
                Ir às compras
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/sobre"
                className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Saiba mais
              </Link>
            </div>
            <div className="mt-10 flex max-w-md items-start gap-8">
              <Stat value="500+" label="Itens" />
              <Stat value="4.9" label="Avaliações" icon />
              <Stat value="3D" label="Impressão" printer />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8 pt-4">
        <h2 className="mb-6 text-2xl font-bold">Categorias</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/catalogo?categoria=${c.id}`}
              className="card-surface flex flex-col items-center gap-3 rounded-2xl px-3 py-5 text-center transition hover:-translate-y-0.5 hover:border-purple/40"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-xl"
                style={{ background: `${c.tint}22` }}
              >
                <CategoryGlyph id={c.id} color={c.tint} />
              </span>
              <span className="text-xs font-medium sm:text-sm">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-cyan">Seleção da casa</p>
            <h2 className="text-2xl font-bold">Destaques</h2>
          </div>
          <Link
            to="/catalogo"
            className="text-sm text-muted hover:text-white"
          >
            Ver catálogo →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="card-surface overflow-hidden rounded-3xl bg-gradient-to-br from-purple/20 via-transparent to-cyan/10 p-8 sm:p-12">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold">Do arquivo à sua mesa</h2>
            <p className="mt-3 text-muted">
              Cada peça é fatiada, impressa e revisada um a um. Cores sob
              encomenda, prazos claros e embalagem pensada para colecionadores.
            </p>
            <Link
              to="/sobre"
              className="btn-primary mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold"
            >
              Conheça o ateliê
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  value,
  label,
  icon,
  printer,
}: {
  value: string;
  label: string;
  icon?: boolean;
  printer?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-2xl font-bold">
        {value}
        {icon && <Star size={16} className="fill-cyan text-cyan" />}
        {printer && <Printer size={16} className="text-cyan" />}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
