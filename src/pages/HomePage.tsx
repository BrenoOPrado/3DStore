import { Link } from "react-router-dom";
import { ArrowRight, Printer, Sparkles, Star } from "lucide-react";
import { categories } from "../data/products";
import { ProductCard } from "../components/ProductCard";
import { CategoryGlyph } from "../components/CategoryGlyph";
import { useStore } from "../context/StoreContext";

const HERO_IMG =
  "https://images.unsplash.com/photo-1612815154858-961fe0a6f8a2?auto=format&fit=crop&w=1600&q=80";

export function HomePage() {
  const { catalog } = useStore();
  const featured = catalog.filter((p) => p.featured);

  return (
    <div>
      <section className="hero">
        <div className="glow-purple" />
        <div className="hero__media">
          <img src={HERO_IMG} alt="" className="hero__img" />
          <div className="hero__shade" />
        </div>

        <div className="hero__inner">
          <div>
            <span className="hero__badge">
              <Sparkles size={13} />
              Transforme suas ideias
            </span>
            <h1 className="hero__title">
              Produtos únicos <span className="gradient-text">criados em 3D</span>
            </h1>
            <p className="hero__lead">
              Peças impressas sob demanda, com acabamento premium e designs que você não
              encontra em lojas comuns. Do colecionável ao utilitário.
            </p>
            <div className="hero__actions">
              <Link to="/catalogo" className="btn-primary">
                Ir às compras
                <ArrowRight size={16} />
              </Link>
              <Link to="/sobre" className="btn-ghost">
                Saiba mais
              </Link>
            </div>
            <div className="hero__stats">
              <Stat value="500+" label="Itens" />
              <Stat value="4.9" label="Avaliações" icon />
              <Stat value="3D" label="Impressão" printer />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Categorias</h2>
        <div className="categories">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/catalogo?categoria=${c.id}`}
              className="category-card card-surface"
            >
              <span className="category-card__icon" style={{ background: `${c.tint}22` }}>
                <CategoryGlyph id={c.id} color={c.tint} />
              </span>
              <span className="category-card__label">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--products">
        <div className="section__head">
          <div>
            <p className="section__kicker">Seleção da casa</p>
            <h2 className="section__title">Destaques</h2>
          </div>
          <Link to="/catalogo" className="link-muted">
            Ver catálogo →
          </Link>
        </div>
        <div className="product-grid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section section--cta">
        <div className="cta-banner card-surface">
          <div className="cta-banner__copy">
            <h2>Do arquivo à sua mesa</h2>
            <p>
              Cada peça é fatiada, impressa e revisada um a um. Cores sob encomenda, prazos
              claros e embalagem pensada para colecionadores.
            </p>
            <Link to="/sobre" className="btn-primary">
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
      <p className="stat__value">
        {value}
        {icon && <Star size={16} className="icon-star" />}
        {printer && <Printer size={16} className="icon-cyan" />}
      </p>
      <p className="stat__label">{label}</p>
    </div>
  );
}
