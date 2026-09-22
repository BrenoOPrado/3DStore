export type CategoryId =
  | "vasos"
  | "action-figures"
  | "decoracao"
  | "utilitarios"
  | "games"
  | "cutelaria"
  | "acessorios";

export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: CategoryId;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  material: string;
  colors: string[];
  isNew?: boolean;
  featured?: boolean;
  imageFit?: "cover" | "contain";
  imagePosition?: "center" | "top";
};

export const categories: {
  id: CategoryId;
  label: string;
  icon: string;
  tint: string;
}[] = [
  { id: "vasos", label: "Vasos", icon: "sprout", tint: "#4ade80" },
  { id: "action-figures", label: "Action Figures", icon: "figure", tint: "#d6a56a" },
  { id: "decoracao", label: "Decoração", icon: "cube", tint: "#c084fc" },
  { id: "utilitarios", label: "Utilitários", icon: "tool", tint: "#c4a574" },
  { id: "games", label: "Games", icon: "game", tint: "#a78bfa" },
  { id: "cutelaria", label: "Cutelaria", icon: "blade", tint: "#cbd5e1" },
  { id: "acessorios", label: "Acessórios", icon: "spark", tint: "#fbbf24" },
];

export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function searchProducts(query: string, list: Product[]) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      categories.find((c) => c.id === p.category)?.label.toLowerCase().includes(q)
  );
}

export function productImageClass(product: Product, mode: "card" | "detail" = "card") {
  const pos = product.imagePosition ?? "center";
  const posClass = pos === "top" ? "img-pos-top" : "img-pos-center";
  if (mode === "detail" && pos === "top") {
    return `img-fit-contain ${posClass}`;
  }
  const fit = product.imageFit ?? "cover";
  return `${fit === "contain" ? "img-fit-contain" : "img-fit-cover"} ${posClass}`;
}
