import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, MessageCircle, Send, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { formatPrice, type Product } from "../data/products";
import { api, apiMutate } from "../api/client";
import { useStore } from "../context/StoreContext";

type Msg = {
  id: string;
  role: "bot" | "user";
  text: string;
  products?: Product[];
  query?: string;
  feedback?: "useful" | "not" | null;
  messageId?: string;
};

const INTRO =
  "Olá! Sou a IA generativa da 3D Store: entendo seu pedido, uso o ajuste fino do catálogo e respondo em linguagem natural. Experimente “vaso para suculenta”, “algo barato” ou “recomenda algo para mim”.";

export function Chatbot() {
  const { user, catalog } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ id: "intro", role: "bot", text: INTRO }]);
  const [modelVersion, setModelVersion] = useState<number | null>(null);
  const [llmLabel, setLlmLabel] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const isClient = user?.role === "client";

  useEffect(() => {
    setMessages([{ id: "intro", role: "bot", text: INTRO }]);
    setInput("");
  }, [user?.id]);

  useEffect(() => {
    if (!open || !isClient) return;
    void api<{
      model?: { version: number };
      llm?: { label?: string; configured?: boolean; provider?: string };
    }>("/api/chat/model")
      .then((data) => {
        setModelVersion(data.model?.version ?? null);
        setLlmLabel(data.llm?.label ?? null);
      })
      .catch(() => undefined);
  }, [open, isClient, user?.id]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, open]);

  const suggestions = useMemo(() => {
    if (!user) return ["Entrar para recomendações personalizadas"];
    if (user.id === "cust-ana") {
      return ["recomenda algo para mim", "suporte de headset", "filtro dinossauro", "gosto de games"];
    }
    if (user.id === "cust-carla") {
      return ["recomenda algo para mim", "vaso para suculenta", "luminária para mesa", "gosto de vasos"];
    }
    return ["recomenda algo para mim", "vaso para suculenta", "luminária geek", "gosto de decoracao"];
  }, [user]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (!isClient) {
      setMessages((m) => [
        ...m,
        { id: `u-${Date.now()}`, role: "user", text: trimmed },
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: "O chatbot personalizado é exclusivo do perfil cliente. Entre na sua conta para receber recomendações com base no seu histórico e preferências.",
        },
      ]);
      setInput("");
      return;
    }

    setBusy(true);
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: trimmed }]);
    setInput("");
    try {
      const data = await apiMutate("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });
      if (typeof data.error === "string" && data.error) {
        setMessages((m) => [
          ...m,
          { id: `b-${Date.now()}`, role: "bot", text: data.error as string },
        ]);
        return;
      }
      const productIds = Array.isArray(data.productIds) ? (data.productIds as string[]) : [];
      const products =
        (Array.isArray(data.products) ? (data.products as Product[]) : null) ??
        productIds.map((id) => catalog.find((p) => p.id === id)).filter(Boolean);
      setModelVersion(typeof data.modelVersion === "number" ? data.modelVersion : modelVersion);
      setMessages((m) => [
        ...m,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: String(data.reply ?? "Pronto."),
          products: products as Product[],
          query: trimmed,
          messageId: String(data.messageId ?? ""),
          feedback: null,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `b-${Date.now()}`, role: "bot", text: "Não consegui falar com a IA agora. Tente de novo." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const rate = async (msg: Msg, useful: boolean) => {
    if (!msg.messageId || msg.feedback) return;
    const { data, error } = await (async () => {
      const data = await apiMutate("/api/chat/feedback", {
        method: "POST",
        body: JSON.stringify({
          messageId: msg.messageId,
          query: msg.query ?? "",
          reply: msg.text,
          useful,
          productIds: (msg.products ?? []).map((p) => p.id),
        }),
      });
      return { data, error: typeof data.error === "string" ? data.error : null };
    })();
    if (error) return;
    const version = (data.model as { version?: number } | undefined)?.version;
    if (typeof version === "number") setModelVersion(version);
    setMessages((list) =>
      list.map((m) => (m.id === msg.id ? { ...m, feedback: useful ? "useful" : "not" } : m))
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="chatbot">
      {open && (
        <div className="chatbot__panel" data-testid="chatbot-panel">
          <div className="chatbot__head">
            <div className="chatbot__brand">
              <span className="chatbot__avatar" aria-hidden>
                <Bot size={18} />
              </span>
              <div>
                <strong>IA · Recomendação</strong>
                <p className="chatbot__status">
                  <span className="chatbot__pulse" aria-hidden />
                  {llmLabel
                    ? `${llmLabel}${modelVersion != null ? ` · fine-tune v${modelVersion}` : ""}`
                    : modelVersion != null
                      ? `Modelo v${modelVersion} · ajuste fino`
                      : "Online · recomendações 3D"}
                </p>
              </div>
            </div>
            <button type="button" className="chatbot__close" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>

          <div className="chatbot__body" ref={scrollerRef}>
            {!isClient && (
              <div className="chatbot__gate" data-testid="chatbot-login-hint">
                <Sparkles size={16} />
                <p>
                  Entre como <Link to="/entrar">cliente</Link> para recomendações personalizadas.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-msg chat-msg--${m.role}`}
                data-testid={m.role === "bot" ? "chat-bot-msg" : "chat-user-msg"}
              >
                {m.role === "bot" && (
                  <span className="chat-msg__avatar" aria-hidden>
                    <Bot size={14} />
                  </span>
                )}
                <div className="chat-msg__bubble">
                  <p>{m.text}</p>
                  {m.products && m.products.length > 0 && (
                    <ul className="chat-recs">
                      {m.products.map((p) => (
                        <li key={p.id}>
                          <Link to={`/produto/${p.id}`} onClick={() => setOpen(false)} className="chat-rec">
                            <img src={p.image} alt="" />
                            <span className="chat-rec__meta">
                              <span className="chat-rec__name">{p.name}</span>
                              <small>{formatPrice(p.price)}</small>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.role === "bot" && m.messageId && (
                    <div className="chat-feedback" data-testid={`chat-feedback-${m.messageId}`}>
                      <span className="muted">Esta resposta foi útil?</span>
                      <button
                        type="button"
                        className={`chip chip--sm${m.feedback === "useful" ? " is-active" : ""}`}
                        data-testid="chat-useful"
                        disabled={Boolean(m.feedback)}
                        onClick={() => void rate(m, true)}
                      >
                        <ThumbsUp size={12} /> Útil
                      </button>
                      <button
                        type="button"
                        className={`chip chip--sm${m.feedback === "not" ? " is-active" : ""}`}
                        data-testid="chat-not-useful"
                        disabled={Boolean(m.feedback)}
                        onClick={() => void rate(m, false)}
                      >
                        <ThumbsDown size={12} /> Não útil
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="chat-msg chat-msg--bot chat-msg--typing" aria-live="polite">
                <span className="chat-msg__avatar" aria-hidden>
                  <Bot size={14} />
                </span>
                <div className="chat-msg__bubble chat-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chatbot__suggest">
            <div className="chip-row chip-row--scroll">
              {suggestions.map((s) => (
                <button key={s} type="button" className="chip chip--sm" disabled={busy} onClick={() => void send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <form className="chatbot__form" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ou peça uma recomendação"
              className="chatbot__input"
              data-testid="chatbot-input"
              disabled={busy}
            />
            <button
              type="submit"
              className="chatbot__send"
              aria-label="Enviar"
              data-testid="chatbot-send"
              disabled={busy || !input.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className={`chatbot__fab${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar chatbot" : "Abrir chatbot de recomendação"}
        data-testid="chatbot-fab"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
