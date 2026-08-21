import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { categories } from "../data/products";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-[#08080f]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="mb-4 flex items-center gap-2.5">
            <Logo />
            <span className="font-semibold">3D Store</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Peças únicas impressas em 3D, pensadas para colecionar, presentear e
            transformar o seu espaço.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Navegação</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link to="/catalogo" className="hover:text-white">
                Catálogo
              </Link>
            </li>
            <li>
              <Link to="/lancamentos" className="hover:text-white">
                Lançamentos
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="hover:text-white">
                Sobre nós
              </Link>
            </li>
            <li>
              <Link to="/entrar" className="hover:text-white">
                Minha conta
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Categorias</h4>
          <ul className="space-y-2 text-sm text-muted">
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/catalogo?categoria=${c.id}`} className="hover:text-white">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contato</h4>
          <p className="text-sm text-muted">ola@3dstore.com</p>
          <p className="mt-1 text-sm text-muted">Seg–Sex, 9h às 18h</p>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} 3D Store. Todos os direitos reservados.
      </div>
    </footer>
  );
}
