import { Link } from "react-router-dom";
import { formatPercent } from "../../data/commerce";
import { useStore } from "../../context/StoreContext";

export function AccountCouponsPage() {
  const { myCoupons, myUsedCoupons } = useStore();
  const available = myCoupons;
  const used = myUsedCoupons;

  return (
    <div>
      <p className="eyebrow">Benefícios</p>
      <h1 className="page-title">Consultar cupons</h1>
      <p className="page-lead">
        Veja os códigos disponíveis. No checkout, digite o cupom para aplicar o desconto em
        porcentagem.
      </p>

      <h2 className="section__title">Disponíveis</h2>
      <ul className="stack-list">
        {available.map((c) => (
          <li key={c.id} className="panel card-surface row-between">
            <div>
              <p className="coupon-code">{c.code}</p>
              <p className="muted">
                {c.type === "troca" ? "Cupom de troca" : "Cupom promocional"} · {c.description}
              </p>
            </div>
            <p className="product-card__price">{formatPercent(c.value)}</p>
          </li>
        ))}
        {available.length === 0 && <p className="muted">Nenhum cupom disponível.</p>}
      </ul>

      {used.length > 0 && (
        <>
          <h2 className="section__title">Utilizados</h2>
          <ul className="stack-list">
            {used.map((c) => (
              <li key={c.id} className="panel card-surface muted">
                {c.code} · {formatPercent(c.value)}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="page-lead">
        <Link to="/checkout" className="link-cyan">
          Ir ao checkout
        </Link>{" "}
        para aplicar um código.
      </p>
    </div>
  );
}
