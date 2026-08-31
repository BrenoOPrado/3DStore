import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useStore } from "../../context/StoreContext";

const links = [
  { to: "/conta", label: "Cadastro", end: true },
  { to: "/conta/enderecos", label: "Endereços" },
  { to: "/conta/cartoes", label: "Cartões" },
  { to: "/conta/cupons", label: "Cupons" },
  { to: "/conta/pedidos", label: "Pedidos" },
];

export function AccountLayout() {
  const { user } = useStore();
  if (!user) return <Navigate to="/entrar" replace />;

  return (
    <div className="account">
      <aside className="account__nav card-surface">
        <p className="account__nav-title">Minha conta</p>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `account__link${isActive ? " is-active" : ""}`}
          >
            {l.label}
          </NavLink>
        ))}
      </aside>
      <div className="account__main">
        <Outlet />
      </div>
    </div>
  );
}
