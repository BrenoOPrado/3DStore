# 3D Store

Loja virtual de peças impressas em 3D. O **frontend** (React) só exibe a interface e chama a API. O **backend** guarda os dados e aplica as regras de negócio.

## Como rodar

Requisito: Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Isso sobe a API em [http://127.0.0.1:3001](http://127.0.0.1:3001) e o site em [http://127.0.0.1:5173](http://127.0.0.1:5173/). O Vite encaminha `/api` para o backend.

```bash
npm run dev:api   # só a API
npm run dev:web   # só o frontend (precisa da API)
npm run build     # typecheck + bundle
npm run test:e2e  # Cypress
```

Contas de demonstração: `ana.souza@email.com` / `123456` e `admin@3dstore.com` / `admin123`.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite 7 |
| Gráficos | Recharts 3 |
| Backend | Express + TypeScript (`backend/`) |
| Sessão | cookie HTTP-only |
| Dados | JSON em `backend/data/store.json` (gerado na primeira execução) |
| Chatbot (RNF0044) | LLM (Gemini/OpenAI via `.env`) + ajuste fino local — ver `docs/chatbot-ia.md` |

O catálogo, clientes, pedidos, cupons, frete, descontos e transições de status vivem no backend. O navegador não persiste o comércio em `localStorage` — só o carrinho da sessão de compra.

## Estrutura

```
backend/src/          API, regras e persistência
src/                  interface React
public/products/      fotos do catálogo
cypress/              testes de ponta a ponta
docs/especificacao.md
```

## Licença e contexto

Projeto acadêmico do LES (Laboratório de Engenharia de Software). As fotos de produto são material de referência para o catálogo de demonstração.
