export const CARD_BRANDS = ["Visa", "Mastercard", "Elo", "American Express"] as const;
export type CardBrandName = (typeof CARD_BRANDS)[number];

export const PHONE_TYPES = ["celular", "fixo"] as const;
export const RESIDENCE_TYPES = ["Casa", "Apartamento", "Comercial", "Outro"] as const;
export const STREET_TYPES = ["Rua", "Avenida", "Alameda", "Travessa", "Praça"] as const;

export type CustomerFilter = {
  id?: string;
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  gender?: string;
  status?: string;
};
