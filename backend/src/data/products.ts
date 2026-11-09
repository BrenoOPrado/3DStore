export type CategoryId =
  | "vasos"
  | "action-figures"
  | "decoracao"
  | "utilitarios"
  | "games"
  | "cutelaria"
  | "acessorios";

export type ProductStatus = "ativo" | "inativo";

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
  stock?: number;
  status?: ProductStatus;
  isNew?: boolean;
  featured?: boolean;
  /** How the photo fills the square thumbnail */
  imageFit?: "cover" | "contain";
  imagePosition?: "center" | "top";
};

export function isListedProduct(product: Product) {
  return (product.status ?? "ativo") === "ativo";
}

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
  {
    id: "kit-vasos-cogumelo",
    name: "Kit vasos cogumelo",
    price: 49.9,
    originalPrice: 59.9,
    category: "vasos",
    rating: 4.8,
    reviews: 214,
    image: "/products/kit-vasos-cogumelo.jpg",
    description:
      "Trio de vasos em forma de cogumelo para suculentas: haste oca, chapéu com dreno e base larga. Kit no estilo das peças mais vendidas em lojas de print 3D.",
    material: "PLA",
    colors: ["Vermelho e branco", "Verde e branco", "Azul e branco"],
    featured: true,
    isNew: true,
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "kit-vasos-coruja",
    name: "Kit vasos coruja",
    price: 59.9,
    category: "vasos",
    rating: 4.7,
    reviews: 128,
    image: "/products/kit-vasos-coruja.jpg",
    description:
      "Família de corujas com a cabeça oca para planta. Três tamanhos, olhos em relevo e penas em camadas. Peça clássica de catálogo 3D para mesa e janela.",
    material: "PLA fosco",
    colors: ["Terracota", "Branco", "Verde oliva"],
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "kit-vasos-fractal",
    name: "Kit vasos fractal twist",
    price: 35.9,
    category: "vasos",
    rating: 4.6,
    reviews: 97,
    image: "/products/kit-vasos-fractal.jpg",
    description:
      "Vasos torcidos em padrão fractal: parede dupla, encaixe estável e visual low poly. Kit de dois tamanhos para suculenta ou cacto pequeno.",
    material: "PLA+",
    colors: ["Areia", "Preto", "Verde menta"],
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "vaso-colmeia",
    name: "Vaso colmeia geométrico",
    price: 33.9,
    category: "vasos",
    rating: 4.5,
    reviews: 84,
    image: "/products/vaso-colmeia.jpg",
    description:
      "Cilindro com células hexagonais e vaso interno. A colmeia vaza luz e sombra na parede — modelo recorrente em marketplaces de impressão 3D.",
    material: "PLA",
    colors: ["Amarelo mostarda", "Branco", "Cinza"],
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "vaso-lowpoly",
    name: "Vaso low poly icosaedro",
    price: 24.9,
    category: "vasos",
    rating: 4.4,
    reviews: 63,
    image: "/products/vaso-lowpoly.jpg",
    description:
      "Vaso geométrico de faces triangulares, 10 cm, com prato. Print rápido, visual de facetas — o “vaso básico” das lojas de Elo7 e Etsy.",
    material: "PLA",
    colors: ["Branco", "Preto", "Terracota"],
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "busto-guerreiro",
    name: "Busto guerreiro espartano",
    price: 44.9,
    category: "action-figures",
    rating: 4.8,
    reviews: 156,
    image: "/products/busto-guerreiro.jpg",
    description:
      "Busto 14 cm em PLA, barba, elmo e base circular. Pintura fosca opcional. Peça de coleção no estilo dos bustos de games vendidos em lojas 3D.",
    material: "PLA+",
    colors: ["Cinza pedra", "Bronze", "Branco primer"],
    featured: true,
    isNew: true,
    imageFit: "cover",
    imagePosition: "top",
  },
  {
    id: "dragao-articulado",
    name: "Dragão articulado flexi",
    price: 79.9,
    category: "action-figures",
    rating: 4.9,
    reviews: 312,
    image: "/products/dragao-articulado.jpg",
    description:
      "Dragão print-in-place: asas, maxilar e cauda articulados, sem montagem. O brinquedo flexível mais comum em Etsy, Printables e feiras 3D.",
    material: "PLA+",
    colors: ["Verde esmeralda", "Vermelho", "Preto", "Dourado"],
    featured: true,
    isNew: true,
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "mini-cavaleiro",
    name: "Mini cavaleiro articulado",
    price: 54.9,
    category: "action-figures",
    rating: 4.7,
    reviews: 91,
    image: "/products/mini-cavaleiro.jpg",
    description:
      "Boneco 12 cm com armadura, elmo e espada encaixável. Juntas em clip para pose. Miniatura de mesa no estilo action figure impressa.",
    material: "PLA+",
    colors: ["Prata e azul", "Ouro e vermelho"],
    imageFit: "cover",
    imagePosition: "top",
  },
  {
    id: "torre-controles",
    name: "Torre para 4 controles",
    price: 59.9,
    category: "games",
    rating: 4.8,
    reviews: 173,
    image: "/products/torre-controles.jpg",
    description:
      "Estante vertical com quatro nichos para DualSense, Xbox ou Switch Pro. Cabos passam atrás. Peça típica de lojas gamer de impressão 3D.",
    material: "PETG",
    colors: ["Preto", "Branco", "Cinza"],
    featured: true,
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "suporte-controle-mesa",
    name: "Suporte de mesa para controle",
    price: 39.9,
    category: "games",
    rating: 4.6,
    reviews: 118,
    image: "/products/suporte-controle-mesa.jpg",
    description:
      "Dock de mesa que segura o controle em pé, com canal para o cabo USB. Um para cada player — o acessório mais simples das lojas 3D gamer.",
    material: "PLA",
    colors: ["Preto", "Branco", "Azul"],
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "torre-dados-dragao",
    name: "Torre de dados dragão",
    price: 89.9,
    category: "games",
    rating: 4.9,
    reviews: 204,
    image: "/products/torre-dados-dragao.jpg",
    description:
      "Torre RPG: o dragão “engole” o dado e a rampa interna entrega na bandeja. Print modular, 25 cm. Clássico de Etsy e mesas de D&D.",
    material: "PLA+",
    colors: ["Verde e ouro", "Preto e prata"],
    isNew: true,
    imageFit: "cover",
    imagePosition: "top",
  },
  {
    id: "porta-lapis-torre",
    name: "Porta-lápis torre de feitiçaria",
    price: 59.9,
    category: "utilitarios",
    rating: 4.7,
    reviews: 142,
    image: "/products/porta-lapis-torre.jpg",
    description:
      "Torre com janelas, ameias e pátio interno para lápis e canetas. Quatro compartimentos. Peça de escritório no estilo das torres mágicas de print 3D.",
    material: "PLA",
    colors: ["Pedra cinza", "Marrom e dourado"],
    imageFit: "cover",
    imagePosition: "top",
  },
  {
    id: "paliteiro-escudo",
    name: "Paliteiro escudo medieval",
    price: 34.9,
    category: "cutelaria",
    rating: 4.6,
    reviews: 88,
    image: "/products/paliteiro-escudo.jpg",
    description:
      "Escudo com fenda superior: os palitos saem como flechas. Base estável para a mesa de jantar. Item curto e barato, comum em lojas brasileiras de 3D.",
    material: "PLA",
    colors: ["Vermelho e dourado", "Azul e prata"],
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "organizador-cabos",
    name: "Organizador de cabos de mesa",
    price: 29.9,
    category: "acessorios",
    rating: 4.5,
    reviews: 167,
    image: "/products/organizador-cabos.jpg",
    description:
      "Pente com 5 canais e base antiderrapante. Prende USB, HDMI e fonte na borda da mesa. Acessório funcional que aparece em quase todo shop 3D.",
    material: "TPU + PLA",
    colors: ["Preto", "Cinza", "Branco"],
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "dock-celular",
    name: "Dock de celular universal",
    price: 49.9,
    category: "acessorios",
    rating: 4.7,
    reviews: 139,
    image: "/products/dock-celular.jpg",
    description:
      "Suporte com fenda para cabo lightning/USB-C e ângulo de 60°. Cabe na mesa de trabalho. Modelo no estilo dos docks vendidos em Elo7.",
    material: "PLA+",
    colors: ["Preto", "Branco", "Madeira"],
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "chaveiro-flexi-dino",
    name: "Chaveiro T-Rex articulado",
    price: 16.9,
    category: "acessorios",
    rating: 4.8,
    reviews: 421,
    image: "/products/chaveiro-flexi-dino.jpg",
    description:
      "Mini T-Rex print-in-place com argola. Mandíbula e pernas mexem. O chaveiro articulado mais pedido em lojas 3D e feiras.",
    material: "PLA",
    colors: ["Verde", "Laranja", "Azul", "Rosa"],
    isNew: true,
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "moldura-porta-serie",
    name: "Moldura de porta amarela",
    price: 34.9,
    category: "decoracao",
    rating: 4.6,
    reviews: 76,
    image: "/products/moldura-porta-serie.jpg",
    description:
      "Olho mágico em moldura de porta amarela, para pendurar na parede. Homenagem pop a séries de apartamento — peça leve, 18 cm.",
    material: "PLA",
    colors: ["Amarelo", "Roxo"],
    imageFit: "cover",
    imagePosition: "center",
  },
  {
    id: "luminaria-lua",
    name: "Luminária lua litofânia",
    price: 69.9,
    category: "decoracao",
    rating: 4.9,
    reviews: 188,
    image: "/products/luminaria-lua.jpg",
    description:
      "Esfera com relevo lunar: a LED interna revela crateras em litofânia. Base anel e cabo USB. A luminária 3D mais vendida em marketplaces.",
    material: "PLA branco",
    colors: ["Branco lunar"],
    featured: true,
    isNew: true,
    imageFit: "cover",
    imagePosition: "center",
  },
];

export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getProduct(id: string, list: Product[] = products) {
  return list.find((p) => p.id === id);
}

export function getByCategory(id: CategoryId, list: Product[] = products) {
  return list.filter((p) => p.category === id);
}

export function searchProducts(query: string, list: Product[] = products) {
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
