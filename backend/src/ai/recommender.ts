import type { CategoryId, Product } from "../data/products";
import { categories } from "../data/products";
import type { Customer, Order } from "../data/commerce";

export type ChatFeedback = {
  id: string;
  customerId: string;
  messageId: string;
  query: string;
  reply: string;
  useful: boolean;
  productIds: string[];
  at: string;
};

export type AiModel = {
  version: number;
  trainedAt: string;
  salesSamples: number;
  feedbackSamples: number;
  productBias: Record<string, number>;
  categoryBias: Record<string, number>;
  tokenCategory: Record<string, Record<string, number>>;
  tokenProduct: Record<string, Record<string, number>>;
  customerCategory: Record<string, Record<string, number>>;
  customerProduct: Record<string, Record<string, number>>;
};

export type ChatIntent = "personalizada" | "busca" | "duvida" | "preco" | "preferencia" | "geral";

/** Interpretação estruturada da mensagem do cliente (NLU local). */
export type QueryUnderstanding = {
  intent: ChatIntent;
  categories: CategoryId[];
  keywords: string[];
  useCases: string[];
  priceMode: "cheap" | "none";
  productIds: string[];
  personalized: boolean;
  specific: boolean;
  summary: string;
};

export type ChatMessageResult = {
  messageId: string;
  reply: string;
  productIds: string[];
  modelVersion: number;
  intent: string;
  understanding?: QueryUnderstanding;
};

function bump(map: Record<string, number>, key: string, amount: number) {
  map[key] = (map[key] ?? 0) + amount;
}

function bumpNested(
  map: Record<string, Record<string, number>>,
  outer: string,
  inner: string,
  amount: number
) {
  if (!map[outer]) map[outer] = {};
  map[outer][inner] = (map[outer][inner] ?? 0) + amount;
}

export function tokenize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

export function emptyModel(): AiModel {
  return {
    version: 0,
    trainedAt: new Date(0).toISOString(),
    salesSamples: 0,
    feedbackSamples: 0,
    productBias: {},
    categoryBias: {},
    tokenCategory: {},
    tokenProduct: {},
    customerCategory: {},
    customerProduct: {},
  };
}

/** Ajuste fino supervisionado: vendas ENTREGUE + feedback útil/não útil atualizam pesos. */
export function trainAiModel(
  orders: Order[],
  feedback: ChatFeedback[],
  catalog: Product[],
  previous?: AiModel | null
): AiModel {
  const model = emptyModel();
  model.version = (previous?.version ?? 0) + 1;
  model.trainedAt = new Date().toISOString();

  const known = new Set(catalog.map((p) => p.id));
  let sales = 0;
  for (const order of orders) {
    if (order.status !== "ENTREGUE") continue;
    sales++;
    for (const item of order.items) {
      if (!known.has(item.productId)) continue;
      const w = item.quantity;
      bump(model.productBias, item.productId, w);
      bump(model.categoryBias, item.category, w);
      bumpNested(model.customerProduct, order.customerId, item.productId, w * 2);
      bumpNested(model.customerCategory, order.customerId, item.category, w * 2);
      for (const token of tokenize(`${item.name} ${item.category}`)) {
        bumpNested(model.tokenProduct, token, item.productId, 0.5);
        bumpNested(model.tokenCategory, token, item.category, 0.5);
      }
    }
  }
  model.salesSamples = sales;

  let fb = 0;
  for (const row of feedback) {
    fb++;
    const sign = row.useful ? 1 : -1;
    const tokens = tokenize(row.query);
    for (const productId of row.productIds) {
      if (!known.has(productId)) continue;
      const product = catalog.find((p) => p.id === productId);
      if (!product) continue;
      bump(model.productBias, productId, sign * 1.5);
      bump(model.categoryBias, product.category, sign * 1.2);
      bumpNested(model.customerProduct, row.customerId, productId, sign * 3);
      bumpNested(model.customerCategory, row.customerId, product.category, sign * 2.5);
      for (const token of tokens) {
        bumpNested(model.tokenProduct, token, productId, sign * 2);
        bumpNested(model.tokenCategory, token, product.category, sign * 1.5);
      }
    }
    for (const token of tokens) {
      for (const pref of tokenize(row.reply)) {
        if (categories.some((c) => c.id === pref || c.label.toLowerCase().includes(pref))) {
          bumpNested(model.tokenCategory, token, pref, sign * 0.4);
        }
      }
    }
  }
  model.feedbackSamples = fb;
  return model;
}

const CATEGORY_SYNONYMS: { id: CategoryId; words: string[] }[] = [
  { id: "vasos", words: ["vaso", "vasos", "suculenta", "suculentas", "planta", "plantas", "cacto"] },
  {
    id: "action-figures",
    words: ["figure", "figures", "boneco", "bonecos", "miniatura", "dragao", "cavaleiro", "busto"],
  },
  { id: "decoracao", words: ["decoracao", "decor", "luminaria", "luminarias", "lua", "aquario", "estrela"] },
  {
    id: "utilitarios",
    words: ["utilitario", "utilitarios", "filtro", "organizador", "escritorio"],
  },
  { id: "games", words: ["game", "games", "gamer", "controle", "headset", "fone", "rpg", "dados"] },
  { id: "cutelaria", words: ["cutelaria", "cozinha", "alho", "palito", "escorredor", "talher"] },
  { id: "acessorios", words: ["acessorio", "acessorios", "chaveiro", "gancho", "dock", "cabo"] },
];

const USE_CASE_WORDS: { tag: string; words: string[]; categories: CategoryId[] }[] = [
  {
    tag: "escritório",
    words: ["escritorio", "trabalho", "home office"],
    categories: ["utilitarios", "acessorios", "decoracao"],
  },
  {
    tag: "presente",
    words: ["presente", "presentear", "aniversario", "namorado", "namorada"],
    categories: ["decoracao", "action-figures", "games", "utilitarios"],
  },
  { tag: "cozinha", words: ["cozinha", "pia", "bancada"], categories: ["cutelaria", "utilitarios"] },
  { tag: "games", words: ["setup", "pc gamer", "console"], categories: ["games"] },
  { tag: "quarto", words: ["quarto", "crianca"], categories: ["decoracao", "vasos", "action-figures"] },
];

/** Tokens genéricos demais para casar produto/categoria. */
const STOPWORDS = new Set([
  "para",
  "algo",
  "uma",
  "uns",
  "umas",
  "com",
  "sem",
  "por",
  "pelo",
  "pela",
  "mais",
  "menos",
  "que",
  "nao",
  "mim",
  "meu",
  "minha",
  "meus",
  "minhas",
  "seu",
  "sua",
  "dos",
  "das",
  "como",
  "onde",
  "quando",
  "muito",
  "pode",
  "tem",
  "ser",
  "sao",
  "esta",
  "esse",
  "essa",
  "isto",
  "aqui",
  "voce",
  "voces",
  "sobre",
  "entre",
  "depois",
  "antes",
  "ainda",
  "recomend",
  "recomenda",
  "indicar",
  "indica",
  "sugest",
  "sugira",
  "quero",
  "precis",
  "mostra",
  "buscar",
  "procur",
]);

function norm(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesAny(haystack: string, words: string[]) {
  return words.some((w) => haystack.includes(norm(w)));
}

function contentTokens(query: string) {
  return tokenize(query).filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** NLU: extrai intenção, categorias, casos de uso e peças citadas. */
export function understandQuery(query: string, catalog: Product[]): QueryUnderstanding {
  const raw = query.trim();
  const q = norm(raw);
  const tokens = contentTokens(raw);

  const categoriesFound = CATEGORY_SYNONYMS.filter((c) =>
    c.words.some((w) => {
      const nw = norm(w);
      // “mesa” sozinho é ambíguo demais para forçar utilitários.
      if (nw === "mesa") return false;
      return nw.length >= 3 && q.includes(nw);
    })
  ).map((c) => c.id);

  const useCases = USE_CASE_WORDS.filter((u) => includesAny(q, u.words)).map((u) => u.tag);
  for (const u of USE_CASE_WORDS) {
    if (!includesAny(q, u.words)) continue;
    for (const cat of u.categories) {
      if (!categoriesFound.includes(cat)) categoriesFound.push(cat);
    }
  }

  const productIds: string[] = [];
  for (const product of catalog) {
    const blob = norm(`${product.name} ${product.description} ${product.id.replace(/-/g, " ")}`);
    const nameTokens = tokenize(product.name).filter((t) => !STOPWORDS.has(t));
    let hits = 0;
    for (const t of tokens) {
      if (blob.includes(t)) hits += nameTokens.includes(t) ? 4 : 1;
    }
    // Frases típicas: “luminária lua”, “filtro dinossauro”, “suporte de headset”
    const compactName = norm(product.name);
    const nameOverlap = tokens.filter((t) => compactName.includes(t)).length;
    if (nameOverlap >= 2) hits += 8;
    else if (nameOverlap === 1 && tokens.some((t) => nameTokens.includes(t) && t.length >= 5)) hits += 3;
    if (hits >= 4) productIds.push(product.id);
  }

  const priceMode = /barat|promo|oferta|custa|preco|valor|mais barato|economico/.test(q) ? "cheap" : "none";

  const personalized = /para mim|personaliz|meu historico|minhas prefer|do meu perfil/.test(q);
  const prefers = /gosto de|prefiro|quero mais/.test(q);
  const isDoubt = /\bo que e\b|\bo que eh\b|\bserve\b|\bexplica\b|duvida|material|como funciona|diferen/.test(q);

  let intent: ChatIntent = "geral";
  if (prefers) intent = "preferencia";
  else if (personalized && categoriesFound.length === 0 && productIds.length === 0 && useCases.length === 0) {
    intent = "personalizada";
  } else if (priceMode === "cheap" && categoriesFound.length === 0 && productIds.length === 0) {
    intent = "preco";
  } else if (isDoubt) intent = "duvida";
  else if (
    categoriesFound.length > 0 ||
    productIds.length > 0 ||
    useCases.length > 0 ||
    /busca|procur|indica|recomenda|sugest|mostra|encontrar|preciso|gostaria|quero /.test(q)
  ) {
    intent = personalized && categoriesFound.length === 0 && productIds.length === 0 ? "personalizada" : "busca";
  } else if (personalized) intent = "personalizada";
  else if (priceMode === "cheap") intent = "preco";

  const specific =
    intent !== "personalizada" &&
    intent !== "preferencia" &&
    (categoriesFound.length > 0 ||
      productIds.length > 0 ||
      useCases.length > 0 ||
      intent === "duvida" ||
      intent === "preco" ||
      intent === "busca");

  const keywords = [...tokens, ...categoriesFound, ...useCases.map((u) => norm(u))].slice(0, 12);

  const bits: string[] = [];
  if (intent === "personalizada") bits.push("pedido personalizado pelo perfil");
  if (intent === "preferencia") bits.push("registro de preferência");
  if (intent === "preco") bits.push("foco em custo-benefício");
  if (intent === "duvida") bits.push("dúvida sobre peça");
  if (categoriesFound.length) {
    bits.push(
      `categorias: ${categoriesFound.map((id) => categories.find((c) => c.id === id)?.label ?? id).join(", ")}`
    );
  }
  if (useCases.length) bits.push(`uso: ${useCases.join(", ")}`);
  if (productIds.length) {
    const names = productIds
      .slice(0, 3)
      .map((id) => catalog.find((p) => p.id === id)?.name)
      .filter(Boolean);
    if (names.length) bits.push(`peças mencionadas: ${names.join(", ")}`);
  }
  if (!bits.length) bits.push("pedido aberto no catálogo");

  return {
    intent,
    categories: [...new Set(categoriesFound)],
    keywords: [...new Set(keywords)],
    useCases: [...new Set(useCases)],
    priceMode,
    productIds: [...new Set(productIds)],
    personalized,
    specific,
    summary: bits.join(" · "),
  };
}

function preferenceBoost(product: Product, customer: Customer) {
  const prefs = (customer.preferences ?? []).map((p) => p.toLowerCase());
  let score = 0;
  for (const pref of prefs) {
    const n = norm(pref);
    if (product.category.includes(n) || norm(product.name).includes(n) || norm(product.description).includes(n)) {
      score += 4;
    }
    const cat = categories.find(
      (c) => c.id === n || norm(c.label).includes(n) || n.includes(c.id)
    );
    if (cat && cat.id === product.category) score += 5;
  }
  return score;
}

function queryRelevance(product: Product, understanding: QueryUnderstanding, tokens: string[]) {
  let score = 0;
  const blob = norm(`${product.name} ${product.description} ${product.category} ${product.material}`);

  if (understanding.productIds.includes(product.id)) score += 40;
  if (understanding.categories.includes(product.category)) score += 22;

  for (const token of tokens) {
    if (token.length < 3) continue;
    if (norm(product.name).includes(token)) score += 10;
    else if (blob.includes(token)) score += 4;
    if (product.category.includes(token)) score += 6;
  }

  for (const kw of understanding.keywords) {
    if (blob.includes(kw)) score += 3;
  }

  for (const use of understanding.useCases) {
    const rule = USE_CASE_WORDS.find((u) => u.tag === use);
    if (rule?.categories.includes(product.category)) score += 8;
    if (blob.includes(norm(use))) score += 4;
  }

  return score;
}

export function scoreProducts(
  model: AiModel,
  catalog: Product[],
  customer: Customer,
  query: string,
  limit = 3,
  understanding?: QueryUnderstanding
) {
  const understood = understanding ?? understandQuery(query, catalog);
  const tokens = tokenize(query);

  const scored = catalog
    .filter((p) => (p.status ?? "ativo") === "ativo")
    .map((product) => {
      const relevance = queryRelevance(product, understood, tokens);

      // Perfil / ajuste fino — peso menor quando a pergunta é específica.
      let personal = 0;
      personal += (model.productBias[product.id] ?? 0) * (understood.specific ? 0.15 : 0.55);
      personal += (model.categoryBias[product.category] ?? 0) * (understood.specific ? 0.1 : 0.35);
      personal += (model.customerProduct[customer.id]?.[product.id] ?? 0) * (understood.specific ? 0.25 : 1.2);
      personal +=
        (model.customerCategory[customer.id]?.[product.category] ?? 0) * (understood.specific ? 0.2 : 1);
      personal += preferenceBoost(product, customer) * (understood.specific ? 0.25 : 1);
      for (const token of tokens) {
        personal += (model.tokenProduct[token]?.[product.id] ?? 0) * 0.6;
        personal += (model.tokenCategory[token]?.[product.category] ?? 0) * 0.5;
      }
      if (product.featured) personal += 0.3;
      if (product.isNew) personal += 0.15;

      let score = understood.specific ? relevance * 3 + personal : personal + relevance * 0.5;

      // Pedido específico: descartar peças sem relação com o que foi pedido.
      if (understood.specific && relevance < 6 && !understood.productIds.includes(product.id)) {
        score -= 80;
      }

      if (understood.priceMode === "cheap") {
        score += Math.max(0, 80 - product.price) * 0.35;
      }

      return { product, score, relevance };
    })
    .sort((a, b) => b.score - a.score);

  if (understood.priceMode === "cheap") {
    const pool = scored.filter((s) => s.relevance >= 0 || !understood.specific).slice(0, 12);
    pool.sort((a, b) => a.product.price - b.product.price || b.score - a.score);
    return pool.slice(0, limit);
  }

  // Dúvida com peça citada: garantir a peça no topo.
  if (understood.intent === "duvida" && understood.productIds.length) {
    const focus = scored.filter((s) => understood.productIds.includes(s.product.id));
    const rest = scored.filter((s) => !understood.productIds.includes(s.product.id));
    return [...focus, ...rest].slice(0, limit);
  }

  return scored.slice(0, limit);
}

function preferenceSummary(customer: Customer, model: AiModel) {
  const cats = model.customerCategory[customer.id] ?? {};
  const top = Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => categories.find((c) => c.id === id)?.label ?? id);
  const explicit = customer.preferences ?? [];
  return [...new Set([...explicit, ...top])].slice(0, 4);
}

/** Camada generativa local: interpreta o pedido e compõe resposta a partir do ranking. */
export function generateChatReply(
  model: AiModel,
  catalog: Product[],
  customer: Customer,
  query: string
): ChatMessageResult {
  const understanding = understandQuery(query, catalog);
  const ranked = scoreProducts(model, catalog, customer, query, 3, understanding);
  const products = ranked.map((r) => r.product);
  const prefs = preferenceSummary(customer, model);
  const names = products.map((p) => p.name);
  const messageId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const firstName = customer.name.split(" ")[0] ?? "olá";
  const understoodLine = `Entendi: ${understanding.summary}.`;

  let reply: string;
  if (understanding.intent === "preferencia" || understanding.intent === "personalizada") {
    reply = prefs.length
      ? `${understoodLine} Olá, ${firstName}! Com base no seu histórico de compras e preferências (${prefs.join(", ")}), eu sugeriria: ${names.join("; ") || "os destaques da loja"}. Posso afinar se você disser o ambiente (mesa, games, cozinha…).`
      : `${understoodLine} Ainda estou calibrando seu perfil. Enquanto isso, estas peças se destacam: ${names.join("; ")}.`;
  } else if (understanding.intent === "preco") {
    const cheap = [...products].sort((a, b) => a.price - b.price);
    reply = `${understoodLine} Olhando custo-benefício no catálogo, estas opções cabem bem: ${cheap
      .map((p) => `${p.name} (R$ ${p.price.toFixed(2).replace(".", ",")})`)
      .join("; ")}.`;
  } else if (understanding.intent === "duvida") {
    const focus = products[0];
    reply = focus
      ? `${understoodLine} ${focus.name} é impresso em ${focus.material}, na categoria ${categories.find((c) => c.id === focus.category)?.label}. ${focus.description} Outras peças relacionadas: ${names.slice(1).join("; ") || "veja o catálogo"}.`
      : `${understoodLine} Posso esclarecer material, uso e tamanho. Diga o nome da peça ou a categoria.`;
  } else if (understanding.intent === "busca") {
    reply = names.length
      ? `${understoodLine} Para “${query.trim()}”, encontrei: ${names.join("; ")}. Quer que eu filtre por cor, preço ou categoria?`
      : `${understoodLine} Não achei um match direto para “${query.trim()}”. Tente vasos, games, luminária ou dinossauro.`;
  } else {
    reply = names.length
      ? `${understoodLine} Sugestões: ${names.join("; ")}. Se quiser, diga categoria, preço ou “recomenda algo para mim”.`
      : `${understoodLine} Me diga o que procura (vaso, headset, luminária…) ou peça uma recomendação personalizada.`;
  }

  const prefMatch = query.match(/gosto de ([a-zà-ú\s-]+)|prefiro ([a-zà-ú\s-]+)|quero mais ([a-zà-ú\s-]+)/i);
  if (prefMatch) {
    const raw = (prefMatch[1] || prefMatch[2] || prefMatch[3] || "").trim();
    if (raw) {
      reply += ` Anotei a preferência “${raw}” no seu perfil para as próximas recomendações.`;
    }
  }

  return {
    messageId,
    reply,
    productIds: products.map((p) => p.id),
    modelVersion: model.version,
    intent: understanding.intent,
    understanding,
  };
}

export function extractPreference(query: string): string | null {
  const prefMatch = query.match(/gosto de ([a-zà-ú0-9\s-]+)|prefiro ([a-zà-ú0-9\s-]+)|quero mais ([a-zà-ú0-9\s-]+)/i);
  if (!prefMatch) return null;
  return (prefMatch[1] || prefMatch[2] || prefMatch[3] || "").trim().toLowerCase() || null;
}

export function modelPublicSummary(model: AiModel) {
  const topCategories = Object.entries(model.categoryBias)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, weight]) => ({
      id: id as CategoryId,
      label: categories.find((c) => c.id === id)?.label ?? id,
      weight: Number(weight.toFixed(2)),
    }));
  const topProducts = Object.entries(model.productBias)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, weight]) => ({ id, weight: Number(weight.toFixed(2)) }));
  return {
    version: model.version,
    trainedAt: model.trainedAt,
    salesSamples: model.salesSamples,
    feedbackSamples: model.feedbackSamples,
    topCategories,
    topProducts,
    engine:
      "Pipeline: NLU local + ajuste fino (pesos persistidos de ENTREGUE/feedback) + LLM generativo (Gemini/OpenAI) para a resposta. Sem chave de API, a geração local entra como fallback. A consulta específica tem prioridade sobre o perfil no ranking.",
  };
}
