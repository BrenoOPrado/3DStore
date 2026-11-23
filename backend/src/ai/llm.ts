import type { Product } from "../data/products";
import type { ChatMessageResult, QueryUnderstanding } from "./recommender";

export type LlmStatus = {
  provider: "gemini" | "openai" | "local";
  configured: boolean;
  model: string;
  label: string;
};

type LlmProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
};

function env(name: string) {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/** Desliga LLM (Cypress / demo offline). */
export function llmForcedLocal() {
  const flag = env("AI_PROVIDER").toLowerCase();
  return flag === "local" || env("AI_DISABLE_LLM") === "1" || env("CYPRESS") === "1";
}

export function getLlmStatus(): LlmStatus {
  if (llmForcedLocal()) {
    return {
      provider: "local",
      configured: false,
      model: "nlu+ajuste-fino",
      label: "Local (NLU + ajuste fino) — LLM desligado por AI_PROVIDER/AI_DISABLE_LLM",
    };
  }
  if (env("GEMINI_API_KEY") || env("GOOGLE_API_KEY")) {
    const model = env("GEMINI_MODEL") || "gemini-3.5-flash-lite";
    return {
      provider: "gemini",
      configured: true,
      model,
      label: `Google Gemini (${model})`,
    };
  }
  if (env("OPENAI_API_KEY")) {
    const model = env("OPENAI_MODEL") || "gpt-4o-mini";
    return {
      provider: "openai",
      configured: true,
      model,
      label: `OpenAI (${model})`,
    };
  }
  return {
    provider: "local",
    configured: false,
    model: "nlu+ajuste-fino",
    label: "Local (NLU + ajuste fino) — defina GEMINI_API_KEY ou OPENAI_API_KEY no .env",
  };
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1]!.trim() : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildPrompt(input: {
  query: string;
  customerName: string;
  preferences: string[];
  understanding: QueryUnderstanding;
  ranked: LlmProduct[];
  catalogLite: LlmProduct[];
}) {
  return `Você é a assistente de recomendações da 3D Store (e-commerce de peças impressas em 3D).
Responda SEMPRE em português do Brasil, de forma natural e útil.
Use o entendimento NLU e o ranking do ajuste fino (vendas ENTREGUE + feedback) como base — não invente produtos fora da lista.

Cliente: ${input.customerName}
Preferências do perfil: ${input.preferences.join(", ") || "(ainda vazias)"}
Pedido do cliente: ${input.query}
NLU local: intent=${input.understanding.intent}; ${input.understanding.summary}

Candidatos ranqueados (priorize estes, nesta ordem salvo se o pedido pedir outra coisa clara):
${JSON.stringify(input.ranked, null, 0)}

Catálogo permitido (só estes ids):
${JSON.stringify(input.catalogLite, null, 0)}

Regras:
1. Escolha até 3 productIds existentes no catálogo.
2. Se o pedido for personalizado ("para mim"), cite a palavra "preferências" e personalize pelo perfil.
3. Se for dúvida sobre uma peça, explique material/uso com base na description.
4. Se for preço/barato, priorize menor price.
5. Não invente links, estoque ou preços diferentes dos fornecidos.
6. Responda APENAS um JSON válido, sem markdown:
{"reply":"texto ao cliente","productIds":["id1","id2"],"intent":"personalizada|busca|duvida|preco|preferencia|geral"}`;
}

async function callGeminiOnce(prompt: string, model: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 700,
          responseMimeType: "application/json",
        },
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      throw new Error(`Gemini HTTP ${res.status} (${model}): ${body.slice(0, 280)}`);
    }
    const data = JSON.parse(body) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) throw new Error(`Gemini resposta vazia (${model})`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(prompt: string, preferredModel: string, apiKey: string) {
  // Modelo estável para contas novas; 1 retry curto em 503.
  const model = preferredModel || "gemini-3.5-flash-lite";
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await callGeminiOnce(prompt, model, apiKey);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message.includes("HTTP 503") && attempt === 0) {
        await new Promise((r) => setTimeout(r, 700));
        continue;
      }
      break;
    }
  }
  throw lastError ?? new Error("Gemini indisponível");
}

async function callOpenAi(prompt: string, model: string, apiKey: string) {
  const base = env("OPENAI_BASE_URL") || "https://api.openai.com/v1";
  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Você recomenda produtos da 3D Store. Responda só JSON válido.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${body.slice(0, 240)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

function sanitizeLlmResult(
  parsed: Record<string, unknown>,
  allowedIds: Set<string>,
  fallback: ChatMessageResult
): ChatMessageResult | null {
  const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
  if (reply.length < 8) return null;
  const rawIds = Array.isArray(parsed.productIds) ? parsed.productIds.map(String) : [];
  const productIds = rawIds.filter((id) => allowedIds.has(id)).slice(0, 3);
  const intent =
    typeof parsed.intent === "string" && parsed.intent
      ? parsed.intent
      : fallback.intent;
  return {
    ...fallback,
    reply,
    productIds: productIds.length ? productIds : fallback.productIds,
    intent,
  };
}

/**
 * Enriquece a resposta local com um LLM (Gemini ou OpenAI).
 * Retorna null se não houver chave, se estiver forçado local, ou se a chamada falhar.
 */
export async function enhanceChatWithLlm(input: {
  query: string;
  customerName: string;
  preferences: string[];
  understanding: QueryUnderstanding;
  rankedProducts: Product[];
  catalog: Product[];
  fallback: ChatMessageResult;
}): Promise<(ChatMessageResult & { llmProvider: string }) | null> {
  const status = getLlmStatus();
  if (!status.configured || status.provider === "local") return null;

  const ranked: LlmProduct[] = input.rankedProducts.slice(0, 8).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    description: p.description.slice(0, 180),
  }));
  const catalogLite: LlmProduct[] = input.catalog
    .filter((p) => (p.status ?? "ativo") === "ativo")
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
    }));
  const allowed = new Set(catalogLite.map((p) => p.id));
  const prompt = buildPrompt({
    query: input.query,
    customerName: input.customerName,
    preferences: input.preferences,
    understanding: input.understanding,
    ranked,
    catalogLite,
  });

  try {
    let text = "";
    if (status.provider === "gemini") {
      text = await callGemini(
        prompt,
        status.model,
        env("GEMINI_API_KEY") || env("GOOGLE_API_KEY")
      );
    } else {
      text = await callOpenAi(prompt, status.model, env("OPENAI_API_KEY"));
    }
    const parsed = extractJsonObject(text);
    if (!parsed) return null;
    const cleaned = sanitizeLlmResult(parsed, allowed, input.fallback);
    if (!cleaned) return null;
    return { ...cleaned, llmProvider: status.label };
  } catch (err) {
    console.warn("[ai] LLM falhou, usando fallback local:", err instanceof Error ? err.message : err);
    return null;
  }
}
