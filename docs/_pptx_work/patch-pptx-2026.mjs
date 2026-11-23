import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const dir = join(
  "C:/Users/breno/OneDrive/Documentos/Projetos/LES/3Dproducts/docs/_pptx_work/extracted/ppt/slides"
);

function patch(file, pairs) {
  const path = join(dir, file);
  let xml = readFileSync(path, "utf8");
  for (const [from, to] of pairs) {
    if (!xml.includes(from)) {
      console.error("MISSING in", file, "=>", from.slice(0, 100));
      process.exitCode = 1;
      continue;
    }
    xml = xml.replace(from, to);
  }
  writeFileSync(path, xml);
  console.log("patched", file);
}

patch("slide2.xml", [
  [
    "Chat de recomendação e Cypress (clientes, vendas, ciclo, análise e produtos)",
    "Chat Gemini + ajuste fino (RNF0044) e Cypress (12 specs · 52+ casos)",
  ],
]);

patch("slide3.xml", [
  [
    "Front-end: React 19, TypeScript e Vite 7",
    "Front: React 19, TS, Vite 7, Router 7, Recharts 3, Lucide",
  ],
  [
    "Testes de interface: Cypress (11 especificações e2e)",
    "Testes e2e: Cypress 15 (12 specs · clientes→IA)",
  ],
  [
    "Back-end: Node.js (Express 5) e TypeScript, JSON em store.json",
    "API: Node.js, Express 5, TS, store.json, cookies, dotenv",
  ],
  [
    "Visão de destino: PostgreSQL, Recharts e OpenAI",
    "IA: Google Gemini + fine-tune local; datas dd/mm/aaaa",
  ],
]);

const screens = [
  [
    "slide9.xml",
    "A navegação leva a catálogo, lançamentos e autenticação.",
    "Stack: React Router, Layout/Header, CSS da SPA, FAB do chatbot Gemini.",
  ],
  [
    "slide10.xml",
    "Há contas de demonstração para apresentar o fluxo em sala.",
    "Stack: AuthContext, cookie de sessão, API Express /api/auth.",
  ],
  [
    "slide11.xml",
    "O primeiro endereço precisa servir de cobrança e de entrega.",
    "Stack: DateField (dd/mm/aaaa), customerRules, POST /api/customers.",
  ],
  [
    "slide12.xml",
    "É o ponto de partida da jornada de compra.",
    "Stack: filtros React, ProductCard, StoreContext/API de catálogo.",
  ],
  [
    "slide13.xml",
    "A descrição explica o uso da peça no dia a dia.",
    "Stack: rota /produto/:id, CartContext, estoque validado na API.",
  ],
  [
    "slide14.xml",
    "Comprar fica desabilitado se houver item expirado na listagem.",
    "Stack: CartContext, bloqueio temporário de estoque no backend.",
  ],
  [
    "slide15.xml",
    "Cupons promocionais e de troca entram nesta mesma etapa.",
    "Stack: AddressFields, frete PAC/Sedex/retirada na API.",
  ],
  [
    "slide16.xml",
    "O resumo à direita confirma itens, frete e total.",
    "Stack: RN0033–RN0036 na API (cupons, multi-cartão, mínimo R$ 10).",
  ],
  [
    "slide17.xml",
    "APROVADA segue o ciclo; REPROVADA devolve o estoque ao catálogo.",
    "Stack: OrderSuccessPage, status DRS, auditoria RNF0012.",
  ],
  [
    "slide18.xml",
    "Cada transição fica registrada na linha do tempo.",
    "Stack: AccountOrdersPage, ciclo ENTREGUE/troca na API.",
  ],
  [
    "slide19.xml",
    "Os mesmos cartões ficam disponíveis no checkout.",
    "Stack: AccountCardsPage, bandeira/CVV (CVV não persistido).",
  ],
  [
    "slide20.xml",
    "O checkout reutiliza esses registros sem reeditar o cadastro.",
    "Stack: AccountAddressesPage, RN0021–RN0023, API isolada.",
  ],
  [
    "slide21.xml",
    "A consulta responde em até 1 segundo e meses zerados não poluem a lista.",
    "Stack: Recharts LineChart, DateField, filtro ENTREGUE, RNF0011.",
  ],
  [
    "slide22.xml",
    "O detalhe reúne ranking, endereços, cartões e pedidos.",
    "Stack: AdminCustomersPage, filtros RF0024, ranking RN0027.",
  ],
  [
    "slide23.xml",
    "O fluxo evita o trânsito quando a modalidade é retirada.",
    "Stack: AdminOrdersPage, APROVADA→TRANSPORTE→ENTREGUE/troca.",
  ],
  [
    "slide24.xml",
    "Variação de preço acima de 10% pede duas confirmações seguidas.",
    "Stack: AdminProductsPage, soft-delete, validação de preço.",
  ],
  [
    "slide25.xml",
    "No checkout, o código é digitado e o desconto incide sobre o subtotal.",
    "Stack: AdminCouponsPage, cupons em R$, vínculo ao cliente.",
  ],
];

for (const [file, from, to] of screens) {
  patch(file, [[from, to]]);
}

console.log("done");
