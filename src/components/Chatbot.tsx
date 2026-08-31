import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { categories, formatPrice, searchProducts, type Product } from "../data/products";
import { useStore } from "../context/StoreContext";

type Msg = { role: "bot" | "user"; text: string; products?: Product[] };

const INTRO =
  "Olá! Sou o assistente da 3D Store. Diga o que você procura — vaso, luminária, games, dinossauro, cozinha — que eu indico peças do catálogo.";

function recommend(query: string, catalog: Product[]): { text: string; products: Product[] } {
  const q = query.toLowerCase();
  const cat = categories.find(
    (c) => q.includes(c.label.toLowerCase()) || q.includes(c.id.replace("-", " "))
  );
  if (cat) {
    const list = catalog.filter((p) => p.category === cat.id).slice(0, 3);
    return {
      text: `Em ${cat.label} estas são boas pedidas:`,
      products: list,
    };
  }

  const hits = searchProducts(query, catalog).slice(0, 3);
  if (hits.length) {
    return { text: "Encontrei isto no catálogo:", products: hits };
  }

  if (/barat|preço|promo|oferta/.test(q)) {
    const list = [...catalog].sort((a, b) => a.price - b.price).slice(0, 3);
    return { text: "As peças mais em conta agora:", products: list };
  }

  if (/presente|namor|amiga|casa nova/.test(q)) {
    return {
      text: "Para presentear, gosto destas:",
      products: catalog.filter((p) => p.featured).slice(0, 3),
    };
  }

  return {
    text: "Não cravei a categoria. Que tal os destaques da casa?",
    products: catalog.filter((p) => p.featured).slice(0, 3),
  };
}

export function Chatbot() {
  const { catalog } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([{ role: "bot", text: INTRO }]);

  const suggestions = useMemo(
    () => ["vaso para suculenta", "luminária geek", "utilitário de cozinha", "suporte de headset"],
    []
  );

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const rec = recommend(trimmed, catalog);
    setMessages((m) => [
      ...m,
      { role: "user", text: trimmed },
      { role: "bot", text: rec.text, products: rec.products },
    ]);
    setInput("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="chatbot">
      {open && (
        <div className="chatbot__panel card-surface">
          <div className="chatbot__head">
            <strong>Recomendação</strong>
            <button type="button" className="icon-muted" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>
          <div className="chatbot__body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg--${m.role}`}>
                <p>{m.text}</p>
                {m.products && (
                  <ul className="chat-recs">
                    {m.products.map((p) => (
                      <li key={p.id}>
                        <Link to={`/produto/${p.id}`} onClick={() => setOpen(false)}>
                          <img src={p.image} alt="" />
                          <span>
                            {p.name}
                            <small>{formatPrice(p.price)}</small>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div className="chip-row">
              {suggestions.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <form className="chatbot__form" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="O que você quer imprimir?"
              className="field__control"
            />
            <button type="submit" className="btn-primary btn-primary--sm" aria-label="Enviar">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className="chatbot__fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir chatbot de recomendação"
      >
        <MessageCircle size={22} />
      </button>
    </div>
  );
}
