import { useEffect, useState } from "react";
import { api, apiMutate } from "../../api/client";
import { formatDateTimeBr } from "../../data/dates";

type AiSummary = {
  version: number;
  trainedAt: string;
  salesSamples: number;
  feedbackSamples: number;
  topCategories: { id: string; label: string; weight: number }[];
  topProducts: { id: string; weight: number }[];
  engine: string;
};

type LlmInfo = {
  provider: string;
  configured: boolean;
  model: string;
  label: string;
};

type FeedbackRow = {
  id: string;
  customerId: string;
  query: string;
  useful: boolean;
  productIds: string[];
  at: string;
};

export function AdminAiPage() {
  const [model, setModel] = useState<AiSummary | null>(null);
  const [llm, setLlm] = useState<LlmInfo | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [policy, setPolicy] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const data = await api<{
      model: AiSummary;
      llm?: LlmInfo;
      feedback: FeedbackRow[];
      preferencePolicy: string;
    }>("/api/admin/ai");
    setModel(data.model);
    setLlm(data.llm ?? null);
    setFeedback(data.feedback ?? []);
    setPolicy(data.preferencePolicy ?? "");
  };

  useEffect(() => {
    void load().catch(() => setMsg("Não foi possível carregar o modelo."));
  }, []);

  const retrain = async () => {
    const data = await apiMutate("/api/admin/ai/retrain", { method: "POST" });
    if (typeof data.error === "string" && data.error) {
      setMsg(data.error);
      return;
    }
    setMsg(`Modelo retreinado para v${(data.model as AiSummary)?.version}.`);
    await load();
  };

  return (
    <div>
      <p className="eyebrow">IA generativa · RNF0044</p>
      <h1 className="page-title">Ajuste fino e feedback</h1>
      <p className="page-lead">
        LLM generativo (Gemini/OpenAI) redige a resposta; NLU + ajuste fino ranqueiam o catálogo. Vendas ENTREGUE e feedback
        útil/não útil atualizam os pesos — não entram só como contexto da pergunta.
      </p>

      <section className="panel card-surface" data-testid="ai-model-panel">
        <h2 className="panel__title">1) Modelo atual (integração)</h2>
        {model ? (
          <>
            <p data-testid="ai-llm-status">
              LLM: <strong>{llm?.label ?? "Local"}</strong>
              {llm?.configured ? " · conectado" : " · fallback local (configure GEMINI_API_KEY no .env)"}
            </p>
            <p>
              Versão <strong>v{model.version}</strong> · treinado em {formatDateTimeBr(model.trainedAt)} ·{" "}
              {model.salesSamples} vendas · {model.feedbackSamples} feedbacks
            </p>
            <p className="muted">{model.engine}</p>
            <p className="muted">{policy}</p>
            <h3 className="panel__kicker">Categorias com maior peso</h3>
            <ul className="stack-list">
              {model.topCategories.map((c) => (
                <li key={c.id} className="muted">
                  {c.label}: {c.weight}
                </li>
              ))}
            </ul>
            <h3 className="panel__kicker">Produtos com maior peso</h3>
            <ul className="stack-list">
              {model.topProducts.map((p) => (
                <li key={p.id} className="muted">
                  {p.id}: {p.weight}
                </li>
              ))}
            </ul>
            <button type="button" className="btn-primary" data-testid="ai-retrain" onClick={() => void retrain()}>
              Retreinar agora
            </button>
          </>
        ) : (
          <p className="muted">Carregando…</p>
        )}
        {msg && (
          <p className="form-ok" data-testid="ai-retrain-msg">
            {msg}
          </p>
        )}
      </section>

      <section className="panel card-surface">
        <h2 className="panel__title">2) Procedimento de treinamento</h2>
        <ol className="stack-list" data-testid="ai-training-steps">
          <li className="muted">Dados: pedidos com status ENTREGUE + avaliações do chat (útil / não útil).</li>
          <li className="muted">
            Ajuste fino: `trainAiModel` recalcula vieses de produto, categoria e tokens (e pesos por cliente).
          </li>
          <li className="muted">Persistência: o resultado fica em `aiModel` no `store.json` (versão sobe a cada treino).</li>
          <li className="muted">
            Incorporação contínua: feedback no chat e mudança de pedido para ENTREGUE disparam retreino; o admin
            também pode forçar aqui.
          </li>
        </ol>
      </section>

      <section className="panel card-surface">
        <h2 className="panel__title">3) Feedback registrado ({feedback.length})</h2>
        <ul className="stack-list" data-testid="ai-feedback-list">
          {feedback
            .slice()
            .reverse()
            .slice(0, 40)
            .map((f) => (
              <li key={f.id} className="muted">
                {formatDateTimeBr(f.at)} · {f.customerId} · {f.useful ? "útil" : "não útil"} · “{f.query}” ·{" "}
                {(f.productIds ?? []).join(", ")}
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
