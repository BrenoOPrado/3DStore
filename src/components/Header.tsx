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
    <header className="sticky top-0 z-50 border-b border-line bg-[#07070f]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-6 px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Logo />
          <span className="text-[17px] font-semibold tracking-tight">3D Store</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted lg:flex">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `transition hover:text-white ${isActive ? "text-white" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="relative mx-auto hidden min-w-0 flex-1 md:block" ref={box}>
          <form onSubmit={onSearch}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="O que você procura?"
              className="h-10 w-full rounded-xl border border-line bg-[#101018] pl-10 pr-4 text-sm text-white outline-none placeholder:text-muted/80 focus:border-purple/50"
            />
          </form>
          {open && results.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] w-full overflow-hidden rounded-xl border border-line bg-[#12121c] shadow-2xl">
              {results.map((p) => (
                <Link
                  key={p.id}
                  to={`/produto/${p.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/5"
                >
                  <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover object-top" />
                  <span>{p.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLang((l) => (l === "pt" ? "en" : "pt"))}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-white/5 hover:text-white sm:flex"
            aria-label="Idioma"
            title={lang === "pt" ? "Português" : "English"}
          >
            <Globe size={18} />
          </button>

          <Link
            to="/carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-purple hover:bg-white/5"
            aria-label="Carrinho"
          >
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-purple px-1 text-[10px] font-bold">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[120px] truncate text-sm text-muted md:inline">
                {user.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-line px-3 py-2 text-sm text-muted hover:text-white"
              >
                Sair
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/entrar"
                className="hidden items-center gap-1.5 px-2 text-sm text-white/90 hover:text-white sm:flex"
              >
                <UserRound size={16} />
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="btn-primary hidden rounded-xl px-4 py-2 text-sm font-semibold sm:inline-flex"
              >
                Cadastre-se
              </Link>
            </>
          )}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-white lg:hidden"
            onClick={() => setMobile((v) => !v)}
            aria-label={mobile ? "Fechar menu" : "Abrir menu"}
          >
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {mobile && (
        <div className="border-t border-line bg-[#07070f] px-5 py-4 lg:hidden">
          <form
            onSubmit={(e) => {
              onSearch(e);
              setMobile(false);
            }}
            className="relative mb-4"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você procura?"
              className="h-10 w-full rounded-xl border border-line bg-[#101018] pl-10 pr-4 text-sm outline-none"
            />
          </form>
          <nav className="flex flex-col gap-1 text-sm">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobile(false)}
                className={({ isActive }) =>
                  `rounded-lg px-2 py-2 ${isActive ? "bg-white/5 text-white" : "text-muted"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {!user && (
              <Link
                to="/entrar"
                onClick={() => setMobile(false)}
                className="rounded-lg px-2 py-2 text-muted"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
