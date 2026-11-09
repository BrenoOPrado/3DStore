import type { Coupon } from "./commerce";
import { isListedProduct, type Product } from "./products";
import { calculateShipping, type ShippingOption } from "./checkout";

export const FREIGHT_PER_UNIT = 4.9;

export const FREIGHT_CRITERION =
  "Tarifa regional pelo CEP do endereço + R$ 4,90 por unidade dos itens. A retirada no ateliê é gratuita.";

export function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function couponFaceSum(coupons: { value: number }[]) {
  return roundMoney(coupons.reduce((sum, coupon) => sum + Math.max(0, Number(coupon.value) || 0), 0));
}

export function couponDiscountAmount(payable: number, coupons: { value: number }[]) {
  return Math.min(roundMoney(payable), couponFaceSum(coupons));
}

export function hasMultiplePromoCoupons(coupons: { type: string }[]) {
  return coupons.filter((coupon) => coupon.type === "promocional").length > 1;
}

/** RN0036: um cupom é desnecessário se algum subconjunto próprio já cobre o valor da compra. */
export function hasUnnecessaryCoupons(coupons: { value: number }[], payable: number) {
  const target = roundMoney(payable);
  if (coupons.length <= 1 || target <= 0) return false;
  const n = coupons.length;
  const limit = 1 << n;
  for (let mask = 1; mask < limit - 1; mask++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) sum += Math.max(0, Number(coupons[i].value) || 0);
    }
    if (roundMoney(sum) >= target) return true;
  }
  return false;
}

export function validateCouponSet(coupons: Coupon[], payable: number): string | null {
  if (hasMultiplePromoCoupons(coupons)) {
    return "Apenas um cupom promocional pode ser utilizado por compra.";
  }
  if (hasUnnecessaryCoupons(coupons, payable)) {
    return "Não é possível usar cupons que superem a compra desnecessariamente. Remova o cupom extra.";
  }
  return null;
}

export function validateCardPayments(
  payments: { amount: number }[],
  remaining: number,
  usedCoupons: boolean
): string | null {
  const due = roundMoney(remaining);
  if (due <= 0) {
    if (payments.some((p) => p.amount > 0.009)) {
      return "Não há valor restante para alocar em cartão.";
    }
    return null;
  }
  if (!payments.length) return "Selecione ao menos um cartão para o valor restante.";
  const paySum = roundMoney(payments.reduce((sum, p) => sum + p.amount, 0));
  if (Math.abs(paySum - due) > 0.05) {
    return "A soma dos cartões deve cobrir o total após os cupons.";
  }
  const allowBelowTen = usedCoupons && due < 10;
  if (!allowBelowTen && payments.some((p) => p.amount > 0 && p.amount < 10 - 0.001)) {
    return "Cada cartão deve receber no mínimo R$ 10,00.";
  }
  if (allowBelowTen && payments.length > 1 && payments.some((p) => p.amount > 0 && p.amount < 10 - 0.001)) {
    return "Com valor restante inferior a R$ 10,00 use um único cartão.";
  }
  return null;
}

export function itemQuantity(items: { quantity: number }[]) {
  return items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);
}

export function freightOptions(
  cep: string,
  items: { quantity: number }[] = []
): ShippingOption[] {
  const base = calculateShipping(cep);
  const units = itemQuantity(items);
  const extra = roundMoney(FREIGHT_PER_UNIT * units);
  return base.map((option) =>
    option.id === "retirada" ? option : { ...option, price: roundMoney(option.price + extra) }
  );
}

export function availableStock(product: Product | undefined) {
  if (!product) return 0;
  const stock = Number(product.stock);
  return Number.isFinite(stock) ? Math.max(0, stock) : 20;
}

export function validateCartStock(
  lines: { productId: string; quantity: number }[],
  catalog: Product[]
): string | null {
  const byProduct = new Map<string, number>();
  for (const line of lines) {
    const qty = Math.round(Number(line.quantity) || 0);
    if (qty < 1) return "Quantidade inválida.";
    byProduct.set(line.productId, (byProduct.get(line.productId) ?? 0) + qty);
  }
  for (const [productId, qty] of byProduct) {
    const product = catalog.find((item) => item.id === productId);
    if (!product || !isListedProduct(product)) return "Produto indisponível.";
    const stock = availableStock(product);
    if (stock <= 0) return `${product.name} está indisponível em estoque.`;
    if (qty > stock) return `Quantidade de ${product.name} acima do estoque (${stock}).`;
  }
  return null;
}
