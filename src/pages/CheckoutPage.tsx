import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CreditCard, MapPin, Ticket, Truck } from "lucide-react";
import { formatPrice } from "../data/products";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import {
  formatMoneyInput,
  maskCard,
  maskExpiry,
  maskMoney,
  moneyKeyDown,
  parseMoney,
} from "../data/checkout";
import { formatCouponValue, type Address } from "../data/commerce";
import type { QuoteResult } from "../api/types";
import { AddressFields, emptyAddress } from "../components/AddressFields";
import { Field, SelectField } from "../components/Field";
import { CARD_BRANDS } from "../data/customerRules";

const blankAddress = (name: string, phone: string): Address => ({
  id: "",
  ...emptyAddress(name, phone),
});

export function CheckoutPage() {
  const { detailed, count, clear, buyDisabled } = useCart();
  const { user, myCoupons, addCard, placeOrder, quoteCheckout } = useStore();
  const navigate = useNavigate();

  const [addressId, setAddressId] = useState(user?.addresses[0]?.id ?? "new");
  const [newAddr, setNewAddr] = useState(blankAddress(user?.name ?? "", user?.phone ?? ""));
  const [saveAddr, setSaveAddr] = useState(true);
  const [shippingId, setShippingId] = useState<"pac" | "sedex" | "retirada">("pac");
  const [couponSel, setCouponSel] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [cardSel, setCardSel] = useState<Record<string, string>>({});
  const [cardCvv, setCardCvv] = useState<Record<string, string>>({});
  const [addingCard, setAddingCard] = useState(false);
  const [cardForm, setCardForm] = useState({ holder: "", number: "", expiry: "", cvv: "", brand: "Visa" });
  const [saveCard, setSaveCard] = useState(true);
  const [pendingCard, setPendingCard] = useState<{
    holder: string;
    number: string;
    expiry: string;
    cvv: string;
    brand: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  const usingSaved = addressId !== "new" && user?.addresses.some((a) => a.id === addressId);
  const address = usingSaved ? user!.addresses.find((a) => a.id === addressId)! : newAddr;
  const cartItems = useMemo(
    () => detailed.map((item) => ({ productId: item.product.id, color: item.color, quantity: item.quantity })),
    [detailed]
  );

  useEffect(() => {
    if (!user) return;
    let live = true;
    quoteCheckout({
      items: cartItems,
      couponCodes: couponSel,
      shippingId,
      cep: address.cep,
    }).then((result) => {
      if (!live) return;
      if ("error" in result) {
        setQuote(null);
        setCouponMsg(result.error);
        return;
      }
      setCouponMsg(null);
      setQuote(result);
    });
    return () => {
      live = false;
    };
  }, [address.cep, cartItems, couponSel, quoteCheckout, shippingId, user]);

  const options = quote?.options ?? [];
  const shipping = quote?.shipping ?? options.find((o) => o.id === shippingId) ?? options[0];
  const shippingPrice = quote?.shippingPrice ?? 0;
  const coupons = myCoupons.filter((c) => couponSel.includes(c.code));
  const discount = quote?.discount ?? 0;
  const couponExcess = quote?.couponExcess ?? 0;
  const freightNote = quote?.freightNote;
  const total = quote?.total ?? 0;
  const subtotal = quote?.subtotal ?? 0;

  const selectedPays = Object.entries(cardSel)
    .map(([cardId, amount]) => ({ cardId, amount: parseMoney(amount) }))
    .filter((p) => p.amount > 0);
  const paySum = Math.round(selectedPays.reduce((s, p) => s + p.amount, 0) * 100) / 100;

  if (!user) return <Navigate to="/entrar" replace state={{ from: "/checkout" }} />;
  if ((count === 0 || buyDisabled) && !placing) return <Navigate to="/carrinho" replace />;

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMsg("Digite o código do cupom.");
      return;
    }
    const found = myCoupons.find((c) => c.code.toUpperCase() === code);
    if (!found) {
      setCouponMsg("Cupom inválido ou indisponível.");
      return;
    }
    if (couponSel.includes(found.code)) {
      setCouponMsg("Este cupom já foi aplicado.");
      return;
    }
    if (found.type === "promocional" && couponSel.some((code) => myCoupons.find((c) => c.code === code)?.type === "promocional")) {
      setCouponMsg("Apenas um cupom promocional pode ser utilizado por compra.");
      return;
    }
    setCouponSel((prev) => [...prev, found.code]);
    setCouponCode("");
    setCouponMsg(null);
  };

  const removeCoupon = (code: string) => {
    setCouponSel((prev) => prev.filter((c) => c !== code));
  };

  const splitEven = () => {
    const ids = user.cards.map((c) => c.id);
    if (!ids.length || total <= 0) return;
    const n = ids.length;
    const base = Math.floor((total / n) * 100) / 100;
    const rest = Math.round((total - base * (n - 1)) * 100) / 100;
    const next: Record<string, string> = {};
    ids.forEach((id, i) => {
      next[id] = formatMoneyInput(i === n - 1 ? rest : base);
    });
    setCardSel(next);
  };

  const onAddCard = async () => {
    if (!saveCard) {
      setPendingCard({ ...cardForm });
      setAddingCard(false);
      setCardForm({ holder: "", number: "", expiry: "", cvv: "", brand: "Visa" });
      setError(null);
      return;
    }
    const card = await addCard({
      holder: cardForm.holder,
      number: cardForm.number,
      expiry: cardForm.expiry,
      cvv: cardForm.cvv,
      brand: cardForm.brand,
    });
    if ("error" in card) {
      setError(card.error);
      return;
    }
    setCardSel((p) => ({ ...p, [card.id]: formatMoneyInput(total) }));
    setPendingCard(null);
    setAddingCard(false);
    setCardForm({ holder: "", number: "", expiry: "", cvv: "", brand: "Visa" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shipping) return setError("Informe um CEP válido para o frete.");
    setPlacing(true);
    const remaining = Math.round((total - paySum) * 100) / 100;
    const result = await placeOrder({
      addressId: usingSaved ? address.id : undefined,
      address: usingSaved ? undefined : newAddr,
      saveAddress: !usingSaved && saveAddr,
      shippingId: shipping.id,
      couponCodes: couponSel,
      payments: selectedPays.map((p) => ({ ...p, cvv: cardCvv[p.cardId] })),
      items: cartItems,
      newCard: pendingCard
        ? { ...pendingCard, save: false, amount: remaining > 0 ? remaining : 0 }
        : undefined,
    });
    if (typeof result !== "string") {
      setPlacing(false);
      setError(result.error);
      return;
    }
    void clear();
    navigate("/pedido-confirmado");
  };

  return (
    <form onSubmit={onSubmit} className="checkout-layout" data-testid="checkout-form">
      <div className="checkout-stack">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1 className="page-title">Finalizar compra</h1>
          <p className="page-lead">
            Escolha endereço, cupons em reais e um ou mais cartões. A soma dos cartões cobre o total após os cupons.
          </p>
        </div>

        <section className="panel card-surface">
          <h2 className="panel__title">
            <MapPin size={18} className="icon-cyan" />
            Endereço de entrega
          </h2>
          <div className="chip-row">
            {user.addresses.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`chip${addressId === a.id ? " is-active" : ""}`}
                data-testid={`address-${a.label}`}
                onClick={() => setAddressId(a.id)}
              >
                {a.label}
              </button>
            ))}
            <button
              type="button"
              className={`chip${addressId === "new" ? " is-active" : ""}`}
              data-testid="address-new"
              onClick={() => setAddressId("new")}
            >
              Novo endereço
            </button>
          </div>
          {usingSaved ? (
            <p className="pre-line muted">{`${address.recipient}\n${address.streetType} ${address.street}, ${address.number}\n${address.city}/${address.state} · ${address.cep}`}</p>
          ) : (
            <>
              <AddressFields
                value={newAddr}
                onChange={(next) => setNewAddr({ ...next, id: newAddr.id })}
              />
              <label className="check-line">
                <input
                  type="checkbox"
                  checked={saveAddr}
                  data-testid="save-address"
                  onChange={(e) => setSaveAddr(e.target.checked)}
                />
                Salvar este endereço na conta
              </label>
            </>
          )}
        </section>

        <section className="panel card-surface">
          <h2 className="panel__title">
            <Truck size={18} className="icon-cyan" />
            Frete
          </h2>
          {freightNote && (
            <p className="muted" data-testid="freight-note">
              {freightNote}
            </p>
          )}
          {options.length === 0 ? (
            <p className="muted">Informe um CEP válido com 8 dígitos.</p>
          ) : (
            <ul className="option-list">
              {options.map((opt) => (
                <li key={opt.id}>
                  <label className={`option${shippingId === opt.id ? " is-active" : ""}`}>
                    <span className="option__left">
                      <input
                        type="radio"
                        name="shipping"
                        data-testid={`shipping-${opt.id}`}
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
            <Ticket size={18} className="icon-cyan" />
            Cupons de troca e promocionais
          </h2>
          <p className="muted">Digite o código. Cupons têm valor em reais. Apenas um cupom promocional por compra.</p>
          <div className="coupon-apply">
            <Field
              label="Código do cupom"
              value={couponCode}
              onChange={(v) => {
                setCouponCode(v);
                setCouponMsg(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyCoupon();
                }
              }}
              required={false}
              placeholder="TROCA20"
              testId="coupon-code"
            />
            <button type="button" className="btn-primary" data-testid="apply-coupon" onClick={applyCoupon}>
              Aplicar
            </button>
          </div>
          {couponMsg && (
            <p className="form-error" data-testid="coupon-msg">
              {couponMsg}
            </p>
          )}
          {coupons.length > 0 && (
            <ul className="chip-row coupon-chips">
              {coupons.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="chip is-active"
                    data-testid={`coupon-chip-${c.code}`}
                    onClick={() => removeCoupon(c.code)}
                  >
                    {c.code} (−{formatCouponValue(c.value)}) ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          {couponExcess > 0 && (
            <p className="form-ok" data-testid="coupon-excess">
              Os cupons superam a compra em {formatPrice(couponExcess)}. Um cupom de troca será gerado com essa diferença.
            </p>
          )}
        </section>

        <section className="panel card-surface">
          <h2 className="panel__title">
            <CreditCard size={18} className="icon-cyan" />
            Cartões
          </h2>
          <p className="muted">
            Combine vários cartões. O valor restante após cupons é {formatPrice(total)}. CVV 000 ou cartão
            final 0002 simulam recusa da operadora.
          </p>
          {user.cards.length === 0 && (
            <p className="muted">Nenhum cartão salvo. Adicione um abaixo.</p>
          )}
          <ul className="option-list">
            {user.cards.map((c) => (
              <li key={c.id} className="pay-split" data-testid={`pay-card-${c.last4}`}>
                <span>
                  {c.brand} •••• {c.last4} · {c.holder}
                </span>
                <label className="field">
                  <span className="field__label">Valor (R$)</span>
                  <input
                    className="field__control"
                    inputMode="numeric"
                    autoComplete="off"
                    data-testid={`pay-amount-${c.last4}`}
                    value={cardSel[c.id] ?? ""}
                    onChange={(e) => setCardSel((p) => ({ ...p, [c.id]: maskMoney(e.target.value) }))}
                    onKeyDown={moneyKeyDown}
                    placeholder="0,00"
                  />
                </label>
                <label className="field">
                  <span className="field__label">CVV</span>
                  <input
                    className="field__control"
                    inputMode="numeric"
                    autoComplete="off"
                    data-testid={`pay-cvv-${c.last4}`}
                    value={cardCvv[c.id] ?? ""}
                    onChange={(e) =>
                      setCardCvv((p) => ({ ...p, [c.id]: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                    }
                    placeholder="123"
                  />
                </label>
              </li>
            ))}
          </ul>
          <div className="account-actions wrap">
            <button type="button" className="btn-ghost" data-testid="split-even" onClick={splitEven}>
              Dividir igualmente
            </button>
            <button type="button" className="btn-ghost" data-testid="toggle-new-card" onClick={() => setAddingCard((v) => !v)}>
              Adicionar novo cartão
            </button>
          </div>
          {addingCard && (
            <div className="form-grid">
              <Field
                label="Nome no cartão"
                value={cardForm.holder}
                onChange={(v) => setCardForm((f) => ({ ...f, holder: v }))}
                wide
                testId="card-holder"
              />
              <Field
                label="Número"
                value={cardForm.number}
                onChange={(v) => setCardForm((f) => ({ ...f, number: maskCard(v) }))}
                wide
                testId="card-number"
              />
              <SelectField
                label="Bandeira"
                value={cardForm.brand}
                onChange={(v) => setCardForm((f) => ({ ...f, brand: v }))}
                options={[...CARD_BRANDS]}
                testId="card-brand"
              />
              <Field
                label="Validade"
                value={cardForm.expiry}
                onChange={(v) => setCardForm((f) => ({ ...f, expiry: maskExpiry(v) }))}
                placeholder="MM/AA"
                testId="card-expiry"
              />
              <Field
                label="CVV"
                value={cardForm.cvv}
                onChange={(v) => setCardForm((f) => ({ ...f, cvv: v.replace(/\D/g, "").slice(0, 4) }))}
                testId="card-cvv"
              />
              <label className="check-line">
                <input
                  type="checkbox"
                  checked={saveCard}
                  data-testid="save-card"
                  onChange={(e) => setSaveCard(e.target.checked)}
                />
                Salvar este cartão na conta
              </label>
              <button type="button" className="btn-primary" data-testid="save-new-card" onClick={() => void onAddCard()}>
                Incluir cartão
              </button>
            </div>
          )}
          {pendingCard && (
            <p className="form-ok" data-testid="pending-card">
              Cartão •••• {pendingCard.number.replace(/\D/g, "").slice(-4)} será usado nesta compra (não salvo na conta).
            </p>
          )}
          <p className={Math.abs(paySum - total) < 0.05 ? "form-ok" : "muted"} data-testid="pay-allocated">
            Alocado em cartões: {formatPrice(paySum)} / {formatPrice(total)}
          </p>
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
          <div className="summary__row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary__row">
            <span>Frete</span>
            <span>{shippingPrice === 0 ? "Grátis" : formatPrice(shippingPrice)}</span>
          </div>
          <div className="summary__row">
            <span>Cupons</span>
            <span>−{formatPrice(discount)}</span>
          </div>
        </div>
        <div className="summary__total">
          <span>Total</span>
          <span data-testid="checkout-total">{formatPrice(total)}</span>
        </div>
        {error && (
          <p className="form-error" data-testid="checkout-error">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary btn-primary--block" data-testid="confirm-order">
          Confirmar pedido
        </button>
        <Link to="/carrinho" className="summary__back">
          Voltar ao carrinho
        </Link>
      </aside>
    </form>
  );
}
