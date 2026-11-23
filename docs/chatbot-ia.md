# RNF0044 — Recomendação com IA generativa (3D Store)

Adaptação do DRS de *livros* para o e-commerce de **peças impressas em 3D**.

## Checklist da atividade

| Critério | Como atendemos |
| --- | --- |
| a) Chatbot no perfil cliente | FAB só recomenda de verdade com `role === "client"`; visitante/admin são orientados a entrar |
| b) IA de livre escolha + justificativa | **Google Gemini** (`gemini-3.5-flash-lite`) + NLU/ranking local (`llm.ts` + `recommender.ts`). Justificativa na seção abaixo; fallback local se a API cair |
| c) Treino/ajuste fino (não só contexto) | Pesos de produto/categoria/token/cliente são **retreinados e persistidos** em `aiModel`; o LLM recebe o ranking fine-tuned como contexto estruturado |
| d) Feedback útil / não útil no chat | Botões no chat → `POST /api/chat/feedback` → retreino imediato |
| e) Preferências documentadas | Histórico ENTREGUE + tags no chat (“gosto de vasos”) + seed no perfil |

## Justificativa da IA

1. **Google Gemini** (`gemini-3.5-flash-lite`) — IA generativa escolhida: gratuita no AI Studio, boa latência para demo presencial, API estável em PT-BR. OpenAI permanece como alternativa via `.env`.
2. Cumpre o item “não basta enviar vendas/feedback no prompt”: há **treino real de pesos** (`trainAiModel`) que ranqueia o catálogo antes do LLM.
3. Se a API Gemini estiver indisponível (ex.: HTTP 503), o fallback NLU+templates mantém a demo utilizável.

## Configurar o LLM

1. Copie `.env.example` → `.env`.
2. Crie uma chave em [Google AI Studio](https://aistudio.google.com/apikey) e preencha `GEMINI_API_KEY=...`.
3. Use `GEMINI_MODEL=gemini-3.5-flash-lite` (padrão atual para contas novas).
4. Reinicie `npm run dev`. No admin **IA** e no FAB do chat deve aparecer **Google Gemini**.
5. Para forçar só o motor local: `AI_PROVIDER=local`.

## Preferências (decisão do grupo)

1. **Histórico ENTREGUE** — amostras supervisionadas por cliente no treino.
2. **Chat** — “gosto de / prefiro / quero mais …” grava `customer.preferences`.
3. **Seed** — Ana: games / dinossauro / utilitários · Carla: vasos / decoração / luminária.

## Massa para teste

- Clientes: `ana.souza@email.com` e `carla.mendes@email.com` (senhas `123456`).
- Dezenas de vendas ENTREGUE no seed + 10 feedbacks iniciais.
- Admin: `admin@3dstore.com` / `admin123` → menu **IA**.

## Roteiro presencial (itens 1–8)

1. **Admin → IA**: mostrar engine, versão, amostras de venda/feedback e justificativa.
2. Login **Ana** → chat “recomenda algo para mim” (perfil games/dino/utilitários).
3. Sair → login **Carla** → mesma pergunta (perfil vasos/decoração) — recomendações diferentes.
4. Busca: “vaso para suculenta” / “suporte de headset”.
5. Dúvida: “o que é a luminária lua?” / “serve o filtro dinossauro?”.
6. Sugestão: “presente para escritório” / “recomenda algo para mim”.
7. Marcar **Útil** ou **Não útil** → Admin → IA mostra o feedback e a versão sobe.
8. Explicar o procedimento na tela **Procedimento de treinamento** + botão **Retreinar agora**; citar que ENTREGUE e feedback também retreinam sozinhos.

## Endpoints

| Método | Rota | Quem |
| --- | --- | --- |
| POST | `/api/chat` | cliente |
| POST | `/api/chat/feedback` | cliente |
| GET | `/api/chat/model` | autenticado |
| GET | `/api/admin/ai` | admin |
| POST | `/api/admin/ai/retrain` | admin |

## Fora de escopo (respeitado)

Sem recomendação fora do chat e sem outros canais de atendimento.
