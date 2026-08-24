import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Globe, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { Logo } from "./Logo";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { searchProducts } from "../data/products";

const nav = [
  { to: "/", label: "Início" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/lancamentos", label: "Lançamentos" },
  { to: "/sobre", label: "Sobre nós" },
];

export function Header() {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const box = useRef<HTMLDivElement>(null);

  const results = query.trim().length > 1 ? searchProducts(query).slice(0, 6) : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link to="/" className="brand">
          <Logo />
          <span className="brand__name">3D Store</span>
        </Link>

        <nav className="site-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="search" ref={box}>
          <form onSubmit={onSearch}>
            <Search className="search__icon" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="O que você procura?"
              className="search__input"
            />
          </form>
          {open && results.length > 0 && (
            <div className="search__results">
              {results.map((p) => (
                <Link
                  key={p.id}
                  to={`/produto/${p.id}`}
                  onClick={() => setOpen(false)}
                  className="search__result"
                >
                  <img src={p.image} alt="" className="search__thumb" />
                  <span>{p.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="site-header__actions">
          <button
            type="button"
            onClick={() => setLang((l) => (l === "pt" ? "en" : "pt"))}
            className="icon-btn"
            aria-label="Idioma"
            title={lang === "pt" ? "Português" : "English"}
          >
            <Globe size={18} />
          </button>

          <Link to="/carrinho" className="cart-btn" aria-label="Carrinho">
            <ShoppingCart size={20} />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>

          {user ? (
            <div className="user-chip">
              <span className="user-chip__name">{user.name}</span>
              <button type="button" onClick={logout} className="btn-outline">
                Sair
              </button>
            </div>
          ) : (
            <>
              <Link to="/entrar" className="login-link">
                <UserRound size={16} />
                Entrar
              </Link>
              <Link to="/cadastro" className="btn-primary btn-primary--sm signup-link">
                Cadastre-se
              </Link>
            </>
          )}
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMobile((v) => !v)}
            aria-label={mobile ? "Fechar menu" : "Abrir menu"}
          >
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {mobile && (
        <div className="mobile-panel">
          <form
            onSubmit={(e) => {
              onSearch(e);
              setMobile(false);
            }}
            className="mobile-search"
          >
            <Search className="search__icon" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você procura?"
              className="search__input"
            />
          </form>
          <nav className="mobile-nav">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobile(false)}
                className={({ isActive }) => `nav-link-mobile${isActive ? " is-active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
            {!user && (
              <Link to="/entrar" onClick={() => setMobile(false)} className="nav-link-mobile">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
