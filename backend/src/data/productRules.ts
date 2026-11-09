import { categories, type CategoryId, type Product } from "./products";

export const PRICE_CONFIRM_RATIO = 0.1;

export type ProductInput = {
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  material: string;
  colors: string[];
  image?: string;
  stock?: number;
};

export function parseColors(value: string) {
  return value
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export function parseMoney(value: string) {
  const n = Number(String(value).trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function priceChangeRatio(from: number, to: number) {
  if (!(from > 0)) return from === to ? 0 : 1;
  return Math.abs(to - from) / from;
}

export function exceedsPriceConfirmThreshold(from: number, to: number) {
  return priceChangeRatio(from, to) > PRICE_CONFIRM_RATIO;
}

export function priceChangePercent(from: number, to: number) {
  return Math.round(priceChangeRatio(from, to) * 1000) / 10;
}

export function isCategoryId(value: string): value is CategoryId {
  return categories.some((c) => c.id === value);
}

export function validateProduct(data: ProductInput): string | null {
  if (!data.name.trim() || data.name.trim().length < 2) return "Informe o nome do produto.";
  if (!Number.isFinite(data.price) || !(data.price > 0)) return "Informe um preço válido.";
  if (data.originalPrice != null && (!(data.originalPrice > 0) || Number.isNaN(data.originalPrice))) {
    return "Informe um preço anterior válido.";
  }
  if (!isCategoryId(data.category)) return "Informe uma categoria válida.";
  if (!data.description.trim() || data.description.trim().length < 10) {
    return "Informe a descrição do produto.";
  }
  if (!data.material.trim()) return "Informe o material.";
  if (!data.colors.length) return "Informe ao menos uma cor.";
  if (data.stock != null && (!Number.isFinite(data.stock) || data.stock < 0 || !Number.isInteger(data.stock))) {
    return "Informe um estoque válido.";
  }
  return null;
}

export function listedCatalog<T extends Pick<Product, "status">>(catalog: T[]) {
  return catalog.filter((p) => (p.status ?? "ativo") === "ativo");
}
