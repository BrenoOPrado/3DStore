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
  /** How the photo fills the square thumbnail */
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

export const products: Product[] = [
  {
    id: "filtro-dino",
    name: "Filtro de linha dinossauro",
    price: 89.9,
    originalPrice: 109.9,
    category: "utilitarios",
    rating: 4.8,
    reviews: 186,
    image: "/products/filtro-dino.jpg",
    description:
      "Régua de tomadas em forma de dinossauro. Modelos Brontossauro, T-Rex e Estegossauro, com o cabo saindo da cauda. Peça de mesa para escritório ou quarto.",
    material: "PLA+",
    colors: ["Azul petróleo", "Verde", "Vermelho", "Laranja"],
    featured: true,
    isNew: true,
    imageFit: "cover",
    imagePosition: "top",
  },
  {
    id: "aquario-r2d2",
    name: "Aquário de mesa R2-D2",
    price: 249.9,
    category: "decoracao",
    rating: 4.9,
    reviews: 94,
    image: "/products/aquario-r2d2.jpg",
    description:
      "Aquário compacto no corpo do droide: cúpula, pernas e base impressas, cilindro transparente no centro, LED azul e espaço para plantas e peixes pequenos.",
    material: "PLA + acrílico",
    colors: ["Branco e azul"],
    featured: true,
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "luminaria-estrela",
    name: "Luminária Estrela da Morte",
    price: 159.9,
    category: "decoracao",
    rating: 4.8,
    reviews: 131,
    image: "/products/luminaria-estrela.jpg",
    description:
      "Esfera com painéis, superlaser e “dano de batalha”. LED interno quente simula o brilho da lareira — versão de mesa do clássico print galáctico.",
    material: "PLA",
    colors: ["Grafite", "Preto fosco"],
    featured: true,
    imageFit: "cover",
    imagePosition: "top",
  },
  {
    id: "porta-alho",
    name: "Porta-alho Bulbasaur",
    price: 42.9,
    category: "cutelaria",
    rating: 4.9,
    reviews: 267,
    image: "/products/porta-alho.jpg",
    description:
      "O bulbo nas costas vira nicho: cabe uma cabeça de alho ou uma suculenta. Print de bancada com linhas de camada à mostra.",
    material: "PLA",
    colors: ["Ciano", "Verde"],
    featured: true,
    isNew: true,
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "suporte-headset",
    name: "Suporte de headset polvo",
    price: 64.9,
    category: "games",
    rating: 4.8,
    reviews: 208,
    image: "/products/suporte-headset.jpg",
    description:
      "Dois tentáculos entrelaçados seguram o arco do fone. Base estável, ventosas em relevo e paleta pastel azul e rosa.",
    material: "PLA",
    colors: ["Azul e rosa", "Preto"],
    featured: true,
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "gancho-trex",
    name: "Gancho de parede T-Rex",
    price: 34.9,
    category: "acessorios",
    rating: 4.7,
    reviews: 154,
    image: "/products/gancho-trex.jpg",
    description:
      "Cabeça low poly com a mandíbula aberta virando gancho. Furo tipo keyhole no verso para parafuso. Mochila, casaco ou chaveiro.",
    material: "PLA",
    colors: ["Branco", "Azul", "Verde"],
    imageFit: "cover",
    imagePosition: "top",
  },
  {
    id: "vaso-zen",
    name: "Vaso humanóide zen",
    price: 69.9,
    category: "vasos",
    rating: 4.8,
    reviews: 112,
    image: "/products/vaso-zen.jpg",
    description:
      "Figura sentada em pose de meditação: a cabeça oca recebe suculenta e o colo segura um vasinho extra. Preto ou branco fosco.",
    material: "PLA fosco",
    colors: ["Preto", "Branco"],
    featured: true,
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "amplificador-celular",
    name: "Amplificador acústico de celular",
    price: 54.9,
    category: "utilitarios",
    rating: 4.6,
    reviews: 89,
    image: "/products/amplificador-celular.jpg",
    description:
      "Bloco com cone interno e fenda no topo. Sem eletrônica: o próprio alto-falante do celular ganha volume. Base com ângulo ajustável.",
    material: "PLA wood",
    colors: ["Madeira clara", "Preto"],
    imageFit: "cover",
    imagePosition: "top",
  },
  {
    id: "porta-chaves",
    name: "Porta-chaves estilo bloco",
    price: 39.9,
    category: "acessorios",
    rating: 4.7,
    reviews: 176,
    image: "/products/porta-chaves.jpg",
    description:
      "Placa de parede + três tijolinhos 1x4 com argola. Encaixa as chaves na base e ainda monta o letreiro KEYS!.",
    material: "PLA",
    colors: ["Cinza, azul, amarelo e vermelho"],
    isNew: true,
    imageFit: "cover",
    imagePosition: "top",
  },
  {
    id: "escorredor-elefante",
    name: "Escorredor elefante",
    price: 47.9,
    category: "cutelaria",
    rating: 4.8,
    reviews: 143,
    image: "/products/escorredor-elefante.jpg",
    description:
      "O fundo inclina para a tromba: água de talheres ou escovas escorre direto na pia. Serve na cozinha e no banheiro.",
    material: "PETG",
    colors: ["Cinza", "Off-white"],
    imageFit: "cover",
    imagePosition: "top",
  },
  {
    id: "suporte-tacas",
    name: "Suporte de taças sob prateleira",
    price: 44.9,
    category: "utilitarios",
    rating: 4.5,
    reviews: 72,
    image: "/products/suporte-tacas.jpg",
    description:
      "Trilhos brancos que prendem a haste da taça de cabeça para baixo, mais mãos geométricas para a prateleira.",
    material: "PLA",
    colors: ["Branco e preto"],
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "vasos-dino",
    name: "Vasos dinossauro (kit)",
    price: 79.9,
    category: "vasos",
    rating: 4.9,
    reviews: 198,
    image: "/products/vasos-dino.jpg",
    description:
      "T-Rex, parassaurolofo e saurópodes com nicho nas costas para suculenta. Superfície escamosa, cores neon. Vendidos no kit.",
    material: "PLA",
    colors: ["Verde lima", "Turquesa"],
    featured: true,
    isNew: true,
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "luminaria-cao",
    name: "Luminária cachorro articulada",
    price: 119.9,
    category: "decoracao",
    rating: 4.7,
    reviews: 81,
    image: "/products/luminaria-cao.jpg",
    description:
      "Corpo oco com lâmpada e quatro patas encaixáveis. Em pé, sentado ou “pedindo” — o pose muda o facho de luz.",
    material: "PLA wood",
    colors: ["Areia", "Branco"],
    isNew: true,
    imageFit: "cover",
    imagePosition: "top",
  },
];

export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function getByCategory(id: CategoryId) {
  return products.filter((p) => p.category === id);
}

export function searchProducts(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
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
