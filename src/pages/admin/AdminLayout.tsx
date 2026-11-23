import { NavLink, Navigate, Outlet, Link } from "react-router-dom";
import { useStore } from "../../context/StoreContext";

const links = [
  { to: "/admin", label: "Gráfico", end: true },
  { to: "/admin/ia", label: "IA" },
  { to: "/admin/clientes", label: "Clientes" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/produtos", label: "Produtos" },
  { to: "/admin/cupons", label: "Cupons" },
];

export function AdminLayout() {
  const { user, logout } = useStore();
  if (!user) return <Navigate to="/entrar" replace />;
  if (user.role !== "admin") return <Navigate to="/conta" replace />;

  return (
    <div className="admin">
      <aside className="admin__bar">
        <p className="brand__name">3D Store · ADM</p>
        <nav className="admin__nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `admin__link${isActive ? " is-active" : ""}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="ghost-link">
          Loja
        </Link>
        <Link to="/conta" className="ghost-link">
          Minha conta
        </Link>
        <button type="button" className="ghost-link" data-testid="logout" onClick={() => void logout()}>
          Sair
        </button>
      </aside>
      <div className="admin__content">
        <Outlet />
      </div>
    </div>
  );
}
