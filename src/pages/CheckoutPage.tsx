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
    <form onSubmit={onSubmit} className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <div>
          <p className="text-sm text-cyan">Checkout</p>
          <h1 className="mt-1 text-3xl font-bold">Finalizar compra</h1>
          <p className="mt-2 text-sm text-muted">
            Dados de demonstração já preenchidos. Altere o CEP para recalcular o frete.
          </p>
        </div>

        <section className="card-surface rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <MapPin size={18} className="text-cyan" />
            Endereço de entrega
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome" value={address.name} onChange={set("name")} className="sm:col-span-2" />
            <Field label="E-mail" type="email" value={address.email} onChange={set("email")} />
            <Field
              label="Telefone"
              value={address.phone}
              onChange={(v) => set("phone")(maskPhone(v))}
            />
            <Field
              label="CEP"
              value={address.cep}
              onChange={(v) => set("cep")(maskCep(v))}
            />
            <Field label="Estado" value={address.state} onChange={set("state")} />
            <Field label="Rua" value={address.street} onChange={set("street")} className="sm:col-span-2" />
            <Field label="Número" value={address.number} onChange={set("number")} />
            <Field label="Complemento" value={address.complement} onChange={set("complement")} />
            <Field label="Bairro" value={address.neighborhood} onChange={set("neighborhood")} />
            <Field label="Cidade" value={address.city} onChange={set("city")} />
          </div>
        </section>

        <section className="card-surface rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Truck size={18} className="text-cyan" />
            Frete
          </h2>
          {options.length === 0 ? (
            <p className="text-sm text-muted">Informe um CEP válido com 8 dígitos para calcular o frete.</p>
          ) : (
            <ul className="space-y-2">
              {options.map((opt) => (
                <li key={opt.id}>
                  <label
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                      shippingId === opt.id
                        ? "border-purple bg-purple/15"
                        : "border-line hover:border-white/20"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingId === opt.id}
                        onChange={() => setShippingId(opt.id)}
                        className="accent-purple"
                      />
                      <span>
                        <span className="block text-sm font-medium">{opt.name}</span>
                        <span className="text-xs text-muted">{opt.days}</span>
                      </span>
                    </span>
                    <span className="text-sm font-semibold">
                      {opt.price === 0 ? "Grátis" : formatPrice(opt.price)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-surface rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <CreditCard size={18} className="text-cyan" />
            Pagamento
          </h2>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Nome no cartão"
                value={card.holder}
                onChange={(v) => setCard((c) => ({ ...c, holder: v }))}
                className="sm:col-span-2"
              />
              <Field
                label="Número"
                value={card.number}
                onChange={(v) => setCard((c) => ({ ...c, number: maskCard(v) }))}
                className="sm:col-span-2"
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
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-muted">Parcelamento</span>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-line bg-[#101018] px-3 outline-none focus:border-purple/50"
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
            <div className="rounded-xl border border-line bg-white/5 p-4 text-sm text-muted">
              <p>Após confirmar, um QR Code de demonstração será gerado.</p>
              <p className="mt-2 font-mono text-xs text-white/80">
                0002012633...BR.GOV.BCB.PIX...3DSTORE...6304A1B2
              </p>
              <p className="mt-2">Aprovação em poucos segundos. Sem parcelamento.</p>
            </div>
          )}

          {method === "boleto" && (
            <div className="rounded-xl border border-line bg-white/5 p-4 text-sm text-muted">
              <p>O boleto de demonstração vence em 3 dias úteis.</p>
              <p className="mt-2 font-mono text-xs tracking-widest text-white/80">
                23791.22928 60000.000003 00000.000400 1 844700000{Math.round(total * 100)
                  .toString()
                  .padStart(8, "0")}
              </p>
            </div>
          )}
        </section>
      </div>

      <aside className="card-surface h-fit rounded-2xl p-6 lg:sticky lg:top-24">
        <h2 className="font-semibold">Resumo do pedido</h2>
        <ul className="mt-4 space-y-3">
          {detailed.map((item) => (
            <li key={`${item.product.id}-${item.color}`} className="flex gap-3 text-sm">
              <img
                src={item.product.image}
                alt=""
                className="h-14 w-14 rounded-lg object-cover object-top"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.product.name}</p>
                <p className="text-xs text-muted">
                  {item.color} · {item.quantity}x
                </p>
              </div>
              <p className="text-sm">{formatPrice(item.line)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm text-muted">
          <Row label="Subtotal" value={formatPrice(subtotal)} />
          <Row
            label="Frete"
            value={
              shipping ? (shipping.price === 0 ? "Grátis" : formatPrice(shipping.price)) : "—"
            }
          />
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(selectedParcel && method === "credit" ? selectedParcel.amount : total)}</span>
        </div>
        {method === "credit" && selectedParcel && selectedParcel.n > 1 && (
          <p className="mt-1 text-right text-xs text-muted">{selectedParcel.label}</p>
        )}
        <button type="submit" className="btn-primary mt-6 w-full rounded-xl py-3 text-sm font-semibold">
          Confirmar pedido
        </button>
        <Link to="/carrinho" className="mt-3 block text-center text-sm text-muted hover:text-white">
          Voltar ao carrinho
        </Link>
      </aside>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
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
      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium ${
        active ? "border-purple bg-purple/20" : "border-line text-muted hover:text-white"
      }`}
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
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 block text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={label !== "Complemento"}
        className="h-11 w-full rounded-xl border border-line bg-[#101018] px-3 outline-none focus:border-purple/50"
      />
    </label>
  );
}
