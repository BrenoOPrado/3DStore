import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CreditCard, Landmark, MapPin, QrCode, Truck } from "lucide-react";
import { formatPrice } from "../data/products";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  calculateShipping,
  demoAddress,
  demoCard,
  installmentOptions,
  maskCard,
  maskCep,
  maskPhone,
  paymentLabel,
  saveLastOrder,
  type PaymentMethod,
} from "../data/checkout";

export function CheckoutPage() {
  const { detailed, subtotal, count, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    ...demoAddress,
    name: user?.name || demoAddress.name,
    email: user?.email || demoAddress.email,
  });
  const [shippingId, setShippingId] = useState<"pac" | "sedex" | "retirada">("pac");
  const [method, setMethod] = useState<PaymentMethod>("credit");
  const [card, setCard] = useState(demoCard);
  const [installments, setInstallments] = useState(1);

  const [placing, setPlacing] = useState(false);

  const options = useMemo(() => calculateShipping(address.cep), [address.cep]);
  const shipping = options.find((o) => o.id === shippingId) ?? options[0];
  const shippingPrice = shipping?.price ?? 0;
  const total = subtotal + shippingPrice;
  const parcels = installmentOptions(total);
  const selectedParcel = parcels.find((p) => p.n === installments) ?? parcels[0];

  if (count === 0 && !placing) return <Navigate to="/carrinho" replace />;

  const set =
    (key: keyof typeof address) =>
    (value: string) =>
      setAddress((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!shipping) return;

    const orderId = `3DS-${Date.now().toString().slice(-6)}`;
    setPlacing(true);
    saveLastOrder({
      id: orderId,
      createdAt: new Date().toISOString(),
      items: detailed.map((item) => ({
        name: item.product.name,
        color: item.color,
        quantity: item.quantity,
        line: item.line,
        image: item.product.image,
      })),
      recipient: address.name,
      address: [
        `${address.street}, ${address.number}${address.complement ? ` — ${address.complement}` : ""}`,
        `${address.neighborhood} · ${address.city}/${address.state}`,
        `CEP ${address.cep}`,
      ].join("\n"),
      shipping,
      paymentLabel: paymentLabel(
        method,
        selectedParcel?.n ?? 1,
        selectedParcel ? selectedParcel.amount / selectedParcel.n : total
      ),
      subtotal,
      total: selectedParcel?.amount ?? total,
    });
    clear();
    navigate("/pedido-confirmado");
  };

  return (
    <form onSubmit={onSubmit} className="checkout-layout">
      <div className="checkout-stack">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1 className="page-title">Finalizar compra</h1>
          <p className="page-lead">
            Dados de demonstração já preenchidos. Altere o CEP para recalcular o frete.
          </p>
        </div>

        <section className="panel card-surface">
          <h2 className="panel__title">
            <MapPin size={18} className="icon-cyan" />
            Endereço de entrega
          </h2>
          <div className="form-grid">
            <Field label="Nome" value={address.name} onChange={set("name")} wide />
            <Field label="E-mail" type="email" value={address.email} onChange={set("email")} />
            <Field
              label="Telefone"
              value={address.phone}
              onChange={(v) => set("phone")(maskPhone(v))}
            />
            <Field label="CEP" value={address.cep} onChange={(v) => set("cep")(maskCep(v))} />
            <Field label="Estado" value={address.state} onChange={set("state")} />
            <Field label="Rua" value={address.street} onChange={set("street")} wide />
            <Field label="Número" value={address.number} onChange={set("number")} />
            <Field label="Complemento" value={address.complement} onChange={set("complement")} />
            <Field label="Bairro" value={address.neighborhood} onChange={set("neighborhood")} />
            <Field label="Cidade" value={address.city} onChange={set("city")} />
          </div>
        </section>

        <section className="panel card-surface">
          <h2 className="panel__title">
            <Truck size={18} className="icon-cyan" />
            Frete
          </h2>
          {options.length === 0 ? (
            <p className="muted">Informe um CEP válido com 8 dígitos para calcular o frete.</p>
          ) : (
            <ul className="option-list">
              {options.map((opt) => (
                <li key={opt.id}>
                  <label className={`option${shippingId === opt.id ? " is-active" : ""}`}>
                    <span className="option__left">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingId === opt.id}
                        onChange={() => setShippingId(opt.id)}
                      />
                      <span>
                        <span className="option__name">{opt.name}</span>
                        <span className="option__meta">{opt.days}</span>
                      </span>
                    </span>
                    <span className="option__price">
                      {opt.price === 0 ? "Grátis" : formatPrice(opt.price)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel card-surface">
          <h2 className="panel__title">
            <CreditCard size={18} className="icon-cyan" />
            Pagamento
          </h2>
          <div className="pay-grid">
            <PayOption
              active={method === "credit"}
              onClick={() => setMethod("credit")}
              icon={<CreditCard size={16} />}
              label="Cartão"
            />
            <PayOption
              active={method === "pix"}
              onClick={() => setMethod("pix")}
              icon={<QrCode size={16} />}
              label="Pix"
            />
            <PayOption
              active={method === "boleto"}
              onClick={() => setMethod("boleto")}
              icon={<Landmark size={16} />}
              label="Boleto"
            />
          </div>

          {method === "credit" && (
            <div className="form-grid">
              <Field
                label="Nome no cartão"
                value={card.holder}
                onChange={(v) => setCard((c) => ({ ...c, holder: v }))}
                wide
              />
              <Field
                label="Número"
                value={card.number}
                onChange={(v) => setCard((c) => ({ ...c, number: maskCard(v) }))}
                wide
              />
              <Field
                label="Validade"
                value={card.expiry}
                onChange={(v) => setCard((c) => ({ ...c, expiry: v }))}
              />
              <Field
                label="CVV"
                value={card.cvv}
                onChange={(v) => setCard((c) => ({ ...c, cvv: v.replace(/\D/g, "").slice(0, 4) }))}
              />
              <label className="field field--wide">
                <span className="field__label">Parcelamento</span>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="field__control"
                >
                  {parcels.map((p) => (
                    <option key={p.n} value={p.n}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {method === "pix" && (
            <div className="notice">
              <p>Após confirmar, um QR Code de demonstração será gerado.</p>
              <p className="notice__code">0002012633...BR.GOV.BCB.PIX...3DSTORE...6304A1B2</p>
              <p>Aprovação em poucos segundos. Sem parcelamento.</p>
            </div>
          )}

          {method === "boleto" && (
            <div className="notice">
              <p>O boleto de demonstração vence em 3 dias úteis.</p>
              <p className="notice__code notice__code--wide">
                23791.22928 60000.000003 00000.000400 1 844700000{Math.round(total * 100)
                  .toString()
                  .padStart(8, "0")}
              </p>
            </div>
          )}
        </section>
      </div>

      <aside className="summary checkout-summary card-surface">
        <h2>Resumo do pedido</h2>
        <ul className="checkout-items">
          {detailed.map((item) => (
            <li key={`${item.product.id}-${item.color}`} className="checkout-item">
              <img src={item.product.image} alt="" />
              <div className="checkout-item__info">
                <p>{item.product.name}</p>
                <p>
                  {item.color} · {item.quantity}x
                </p>
              </div>
              <p>{formatPrice(item.line)}</p>
            </li>
          ))}
        </ul>
        <div className="summary__rows">
          <Row label="Subtotal" value={formatPrice(subtotal)} />
          <Row
            label="Frete"
            value={shipping ? (shipping.price === 0 ? "Grátis" : formatPrice(shipping.price)) : "—"}
          />
        </div>
        <div className="summary__total">
          <span>Total</span>
          <span>
            {formatPrice(selectedParcel && method === "credit" ? selectedParcel.amount : total)}
          </span>
        </div>
        {method === "credit" && selectedParcel && selectedParcel.n > 1 && (
          <p className="parcel-note">{selectedParcel.label}</p>
        )}
        <button type="submit" className="btn-primary btn-primary--block">
          Confirmar pedido
        </button>
        <Link to="/carrinho" className="summary__back">
          Voltar ao carrinho
        </Link>
      </aside>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary__row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PayOption({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pay-option${active ? " is-active" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "field field--wide" : "field"}>
      <span className="field__label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={label !== "Complemento"}
        className="field__control"
      />
    </label>
  );
}
