import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { categories } from "../data/products";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <Link to="/" className="brand">
            <Logo />
            <span className="brand__name">3D Store</span>
          </Link>
          <p className="site-footer__blurb">
            Peças únicas impressas em 3D, pensadas para colecionar, presentear e transformar o
            seu espaço.
          </p>
        </div>
        <div>
          <h4>Navegação</h4>
          <ul className="site-footer__list">
            <li>
              <Link to="/catalogo">Catálogo</Link>
            </li>
            <li>
              <Link to="/lancamentos">Lançamentos</Link>
            </li>
            <li>
              <Link to="/sobre">Sobre nós</Link>
            </li>
            <li>
              <Link to="/entrar">Minha conta</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Categorias</h4>
          <ul className="site-footer__list">
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/catalogo?categoria=${c.id}`}>{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Contato</h4>
          <p className="muted">ola@3dstore.com</p>
          <p className="muted">Seg–Sex, 9h às 18h</p>
        </div>
      </div>
      <div className="site-footer__copy">
        © {new Date().getFullYear()} 3D Store. Todos os direitos reservados.
      </div>
    </footer>
  );
}
