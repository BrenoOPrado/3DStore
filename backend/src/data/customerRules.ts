import { cardBrand, type Address, type Customer } from "./commerce";

export const CARD_BRANDS = ["Visa", "Mastercard", "Elo", "American Express"] as const;
export type CardBrandName = (typeof CARD_BRANDS)[number];

export const PHONE_TYPES = ["celular", "fixo"] as const;
export const RESIDENCE_TYPES = ["Casa", "Apartamento", "Comercial", "Outro"] as const;
export const STREET_TYPES = ["Rua", "Avenida", "Alameda", "Travessa", "Praça"] as const;

export function hashPassword(plain: string) {
  let h = 2166136261;
  for (let i = 0; i < plain.length; i++) {
    h ^= plain.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a:${(h >>> 0).toString(16).padStart(8, "0")}`;
}

export function passwordsMatch(stored: string, plain: string) {
  if (stored.startsWith("fnv1a:")) return stored === hashPassword(plain);
  return stored === plain;
}

export function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function validateCpf(value: string) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const digit = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factor - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const d1 = digit(cpf.slice(0, 9), 10);
  const d2 = digit(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export function composePhone(type: string, ddd: string, number: string) {
  const n = digitsOnly(number);
  const formatted = n.length === 9 ? `${n.slice(0, 5)}-${n.slice(5)}` : n.length === 8 ? `${n.slice(0, 4)}-${n.slice(4)}` : n;
  return `${type} (${digitsOnly(ddd)}) ${formatted}`.trim();
}

export function validateAddress(address: Omit<Address, "id">) {
  if (!address.label.trim()) return "Informe um apelido para o endereço.";
  if (!address.residenceType.trim()) return "Informe o tipo de residência.";
  if (!address.streetType.trim()) return "Informe o tipo de logradouro.";
  if (!address.street.trim()) return "Informe o logradouro.";
  if (!address.number.trim()) return "Informe o número.";
  if (!address.neighborhood.trim()) return "Informe o bairro.";
  if (digitsOnly(address.cep).length !== 8) return "CEP deve ter 8 dígitos.";
  if (!address.city.trim()) return "Informe a cidade.";
  if (!address.state.trim()) return "Informe o estado.";
  if (!address.country.trim()) return "Informe o país.";
  return null;
}

export function validateCustomerCore(data: {
  name: string;
  email: string;
  cpf: string;
  gender: string;
  birthDate: string;
  phoneType: string;
  phoneDdd: string;
  phoneNumber: string;
}) {
  if (data.name.trim().length < 2) return "Informe seu nome.";
  if (!data.gender.trim()) return "Informe o gênero.";
  if (!data.birthDate) return "Informe a data de nascimento.";
  if (!validateCpf(data.cpf)) return "CPF inválido.";
  if (!PHONE_TYPES.includes(data.phoneType as (typeof PHONE_TYPES)[number])) {
    return "Informe o tipo de telefone.";
  }
  if (digitsOnly(data.phoneDdd).length !== 2) return "DDD deve ter 2 dígitos.";
  const phoneLen = digitsOnly(data.phoneNumber).length;
  if (data.phoneType === "celular" && phoneLen !== 9) return "Celular deve ter 9 dígitos.";
  if (data.phoneType === "fixo" && phoneLen !== 8) return "Telefone fixo deve ter 8 dígitos.";
  if (phoneLen < 8) return "Informe o número de telefone.";
  if (!data.email.includes("@") || !data.email.includes(".")) return "E-mail inválido.";
  return null;
}

export function validateSignupPasswords(password: string, confirm: string) {
  if (!isStrongPassword(password)) {
    return "A senha precisa ter ao menos 8 caracteres, com maiúscula, minúscula e caractere especial.";
  }
  if (password !== confirm) return "A confirmação da senha não confere.";
  return null;
}

export function validateCardInput(card: {
  holder: string;
  number: string;
  expiry: string;
  brand?: string;
  cvv?: string;
}) {
  if (!card.holder.trim()) return "Informe o nome impresso no cartão.";
  const digits = digitsOnly(card.number);
  if (digits.length < 13 || digits.length > 19) return "Número do cartão inválido.";
  const brand = card.brand?.trim() || cardBrand(digits);
  if (!CARD_BRANDS.includes(brand as (typeof CARD_BRANDS)[number])) {
    return "Informe uma bandeira válida (Visa, Mastercard, Elo ou American Express).";
  }
  if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return "Validade no formato MM/AA.";
  const month = Number(card.expiry.slice(0, 2));
  if (month < 1 || month > 12) return "Mês de validade inválido.";
  if (card.cvv !== undefined) {
    const cvv = digitsOnly(card.cvv);
    if (cvv.length < 3 || cvv.length > 4) return "CVV inválido.";
  }
  return null;
}

export function hasBillingAddress(addresses: Pick<Address, "kind">[]) {
  return addresses.some((a) => a.kind === "cobranca" || a.kind === "ambos");
}

export function hasDeliveryAddress(addresses: Pick<Address, "kind">[]) {
  return addresses.some((a) => a.kind === "entrega" || a.kind === "ambos");
}

export type CustomerFilter = {
  id?: string;
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  gender?: string;
  status?: string;
};

export function customerMatchesFilter(
  c: Pick<Customer, "id" | "name" | "email" | "cpf" | "phone" | "gender" | "status">,
  filter: CustomerFilter
) {
  const eq = (needle: string | undefined, value: string) =>
    !needle?.trim() || value.toLowerCase().includes(needle.trim().toLowerCase());
  return (
    eq(filter.id, c.id) &&
    eq(filter.name, c.name) &&
    eq(filter.email, c.email) &&
    eq(filter.cpf, c.cpf) &&
    eq(filter.phone, c.phone) &&
    eq(filter.gender, c.gender) &&
    eq(filter.status, c.status)
  );
}
