export type ShippingOption = {
  id: "pac" | "sedex" | "retirada";
  name: string;
  days: string;
  price: number;
};

export type PaymentMethod = "credit" | "pix" | "boleto";

export type LastOrder = {
  id: string;
  createdAt: string;
  items: {
    name: string;
    color: string;
    quantity: number;
    line: number;
    image: string;
  }[];
  recipient: string;
  address: string;
  shipping: ShippingOption;
  paymentLabel: string;
  subtotal: number;
  total: number;
};

export const LAST_ORDER_KEY = "3dstore-last-order";

export const demoAddress = {
  name: "Ana Souza",
  email: "ana.souza@email.com",
  phone: "(11) 98888-1234",
  cep: "01310-100",
  street: "Rua Augusta",
  number: "1500",
  complement: "Apto 42",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
};

export const demoCard = {
  holder: "ANA SOUZA",
  number: "4111 1111 1111 1111",
  expiry: "12/28",
  cvv: "123",
};

export function maskCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) =>
      c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : ""
    );
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function maskCard(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Digits only; always `0,00` with a fixed comma and two decimal places. */
export function maskMoney(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const intPart = padded.slice(0, -2).replace(/^0+(?=\d)/, "") || "0";
  return `${intPart},${padded.slice(-2)}`;
}

export function parseMoney(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

export function formatMoneyInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "";
  return maskMoney(String(Math.round(value * 100)));
}

export function moneyKeyDown(e: { key: string; ctrlKey: boolean; metaKey: boolean; preventDefault: () => void }) {
  if (e.ctrlKey || e.metaKey) return;
  if (["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End", "Enter"].includes(e.key)) {
    return;
  }
  if (!/^\d$/.test(e.key)) e.preventDefault();
}

export function calculateShipping(cep: string): ShippingOption[] {
  const digits = cep.replace(/\D/g, "");
  if (digits.length < 8) return [];

  const region = Number(digits[0]);
  const near = region <= 1;

  return [
    {
      id: "pac",
      name: "PAC",
      days: near ? "6 a 9 dias úteis" : "10 a 15 dias úteis",
      price: near ? 12.9 : 28.9,
    },
    {
      id: "sedex",
      name: "Sedex",
      days: near ? "2 a 4 dias úteis" : "5 a 8 dias úteis",
      price: near ? 24.9 : 46.9,
    },
    {
      id: "retirada",
      name: "Retirada no ateliê",
      days: "A partir de amanhã, 9h–18h",
      price: 0,
    },
  ];
}

export function installmentOptions(total: number) {
  const max = total >= 120 ? 12 : total >= 60 ? 6 : 3;
  return Array.from({ length: max }, (_, i) => {
    const n = i + 1;
    const interest = n <= 3 ? 0 : 0.019 * (n - 3);
    const amount = total * (1 + interest);
    return {
      n,
      amount,
      label:
        n === 1
          ? `1x de ${formatBRL(amount)} à vista`
          : `${n}x de ${formatBRL(amount / n)}${interest ? " com juros" : " sem juros"}`,
    };
  });
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function paymentLabel(
  method: PaymentMethod,
  installments: number,
  installmentAmount: number
) {
  if (method === "pix") return "Pix (aprovação imediata)";
  if (method === "boleto") return "Boleto bancário (1–2 dias úteis)";
  if (installments === 1) return "Cartão de crédito à vista";
  return `Cartão de crédito em ${installments}x de ${formatBRL(installmentAmount)}`;
}

export function saveLastOrder(order: LastOrder) {
  sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
}

export function loadLastOrder(): LastOrder | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch {
    return null;
  }
}
