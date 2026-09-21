import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("docs/_pptx_extract");
const SCREENS = path.resolve("docs/pptx-screens");
const MEDIA = path.join(ROOT, "ppt/media");
const SLIDES = path.join(ROOT, "ppt/slides");

function escapeXml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleBody(title, size = 2800) {
  return `<a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0" anchor="t"><a:normAutofit/></a:bodyPr>
<a:lstStyle/>
<a:p>
  <a:pPr algn="l"><a:defRPr sz="${size}" b="1"/></a:pPr>
  <a:r>
    <a:rPr lang="pt-BR" sz="${size}" b="1" dirty="0">
      <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
    </a:rPr>
    <a:t>${escapeXml(title)}</a:t>
  </a:r>
</a:p>`;
}

function descShape(id, x, y, cx, cy, lines) {
  const paras = lines
    .map((line, i) => {
      const sz = i === 0 ? 1400 : 1300;
      return `<a:p>
  <a:pPr><a:spcAft><a:spcPts val="500"/></a:spcAft><a:defRPr sz="${sz}"/></a:pPr>
  <a:r>
    <a:rPr lang="pt-BR" sz="${sz}" dirty="0">
      <a:solidFill><a:srgbClr val="C9D1D9"/></a:solidFill>
    </a:rPr>
    <a:t>${escapeXml(line)}</a:t>
  </a:r>
</a:p>`;
    })
    .join("");
  return `<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="${id}" name="Descricao ${id}"/>
    <p:cNvSpPr txBox="1"/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm>
      <a:off x="${x}" y="${y}"/>
      <a:ext cx="${cx}" cy="${cy}"/>
    </a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    <a:noFill/>
  </p:spPr>
  <p:txBody>
    <a:bodyPr wrap="square" lIns="91440" tIns="0" rIns="45720" bIns="0"><a:spAutoFit/></a:bodyPr>
    <a:lstStyle/>
    ${paras}
  </p:txBody>
</p:sp>`;
}

function setTitle(xml, title) {
  xml = xml.replace(
    /(<p:cNvPr [^>]*name="Title 1"[\s\S]*?<p:txBody>)([\s\S]*?)(<\/p:txBody>)/,
    (_, a, _b, c) => a + titleBody(title) + c
  );
  xml = xml.replace(
    /(<p:cNvPr [^>]*name="Title 1"[\s\S]*?<a:xfrm>\s*<a:off )x="[^"]+" y="[^"]+"(\/>\s*<a:ext )cx="[^"]+" cy="[^"]+"/,
    `$1x="7780000" y="720000"$2cx="4000000" cy="900000"`
  );
  return xml;
}

function insertDesc(xml, lines) {
  if (xml.includes('name="Descricao ')) return xml;
  const shape = descShape(80, 7780000, 1650000, 4000000, 4500000, lines);
  return xml.replace("</p:spTree>", `${shape}</p:spTree>`);
}

function replaceTextBox(xml, name, paragraphs) {
  const body = paragraphs
    .map((p, i) => {
      const bullet = p.startsWith("• ") || p.startsWith("- ");
      const text = bullet ? p.replace(/^• |^- /, "") : p;
      const mar = bullet ? ' marL="285750" indent="-285750"' : "";
      const bu = bullet
        ? `<a:buFont typeface="Arial"/><a:buChar char="•"/>`
        : "";
      return `<a:p>
  <a:pPr${mar}><a:spcAft><a:spcPts val="800"/></a:spcAft>${bu}<a:defRPr sz="1600"/></a:pPr>
  <a:r>
    <a:rPr lang="pt-BR" sz="${i === 0 && !bullet ? 1800 : 1600}" dirty="0"/>
    <a:t>${escapeXml(text)}</a:t>
  </a:r>
</a:p>`;
    })
    .join("");
  const re = new RegExp(
    `(<p:cNvPr [^>]*name="${name}"[\\s\\S]*?<p:txBody>)([\\s\\S]*?)(</p:txBody>)`
  );
  if (!re.test(xml)) return xml;
  return xml.replace(re, `$1<a:bodyPr wrap="square"><a:spAutoFit/></a:bodyPr><a:lstStyle/>${body}$3`);
}

const kanban = {
  4: {
    title: "Kanban — clientes e produtos",
    lines: [
      "O quadro organiza o DRS em três colunas: a fazer, em andamento e concluído.",
      "Nesta vista aparecem o CRUD de clientes já entregue e o backlog de cadastro/inativação de produtos.",
      "Cada card corresponde a um requisito, com labels de área (cliente, admin, vendas).",
    ],
  },
  5: {
    title: "Kanban — estoque e compra",
    lines: [
      "A coluna A fazer concentra entrada, baixa e reentrada de estoque — fora do recorte atual.",
      "Em Concluído estão o carrinho, a quantidade e a realização da compra.",
      "O andamento permanece na consulta de produtos, ainda sem todos os filtros do DRS.",
    ],
  },
  6: {
    title: "Kanban — checkout e cupons",
    lines: [
      "O checkout com endereço, cartão e combinação de cupons já está no protótipo.",
      "Ainda faltam validação da operadora, bloqueio de estoque no carrinho e o limite de um cupom promocional.",
      "O desconto atual é percentual, aplicado no momento da compra.",
    ],
  },
  7: {
    title: "Kanban — sessão e troca",
    lines: [
      "Sessões independentes por aba, cupons na conta e compra pelo admin já funcionam.",
      "A troca ainda depende de notificações e da confirmação de entrega pelo administrador.",
      "Endereço de cobrança e entrega no cadastro passaram a ser exigidos no protótipo.",
    ],
  },
  8: {
    title: "Kanban — pedido e ranking",
    lines: [
      "Finalizar, despachar e solicitar troca já seguem o fluxo do ateliê.",
      "Telefone com tipo e DDD, ranking e composição completa do endereço foram incorporados ao cadastro.",
      "Precificação por grupo de margem permanece no backlog de estoque.",
    ],
  },
  9: {
    title: "Kanban — análise e troca",
    lines: [
      "O admin já aceita ou recusa a troca, acompanha os pedidos e gera o cupom correspondente.",
      "Logs de auditoria, tempo de consulta e o gráfico analítico completo ainda estão em aberto.",
      "O frete existe por CEP; falta o cálculo por peso e dimensão dos itens.",
    ],
  },
  10: {
    title: "Kanban — senha, IA e painel",
    lines: [
      "Login, painel administrativo e área da conta já sustentam a operação do protótipo.",
      "Alteração isolada de senha e cartão preferencial foram implementados depois deste recorte visual.",
      "IA generativa e o dashboard analítico com exportação seguem como evolução.",
    ],
  },
};

const proto = {
  11: {
    title: "Tela inicial",
    lines: [
      "Vitrine da 3D Store: proposta da marca, atalho para o catálogo e busca no topo.",
      "O visitante conhece o ateliê antes de entrar na conta.",
      "A navegação leva a catálogo, lançamentos e autenticação.",
    ],
  },
  12: {
    title: "Login",
    lines: [
      "Acesso único para cliente e administrador, com validação de e-mail e senha.",
      "Contas inativas são bloqueadas até o ateliê reativar o cadastro.",
      "Há contas de demonstração para apresentar o fluxo em sala.",
    ],
  },
  13: {
    title: "Cadastro de cliente",
    lines: [
      "Coleta nome, e-mail, CPF, gênero, nascimento e telefone (tipo, DDD e número).",
      "A senha exige confirmação e complexidade mínima.",
      "O primeiro endereço precisa servir de cobrança e de entrega.",
    ],
  },
  14: {
    title: "Catálogo",
    lines: [
      "Listagem das peças impressas, com categorias, busca e cards de produto.",
      "Preço, avaliação e atalho para o detalhe ficam visíveis em cada item.",
      "É o ponto de partida da jornada de compra.",
    ],
  },
  15: {
    title: "Detalhe do produto",
    lines: [
      "Página com fotos, material, cores e quantidade antes de ir ao carrinho.",
      "Somente quem está autenticado consegue adicionar o item.",
      "A descrição explica o uso da peça no dia a dia.",
    ],
  },
  16: {
    title: "Carrinho",
    lines: [
      "Repositório temporário da compra: alterar quantidade, remover item e ver o subtotal.",
      "O cliente segue para o checkout quando o pedido está conferido.",
      "O carrinho fica associado à sessão de quem está logado.",
    ],
  },
  17: {
    title: "Checkout — entrega",
    lines: [
      "Escolha de endereço salvo ou cadastro de um novo, com opção de gravar no perfil.",
      "O frete é calculado pelo CEP: PAC, Sedex ou retirada no ateliê.",
      "Cupons promocionais e de troca entram nesta mesma etapa.",
    ],
  },
  18: {
    title: "Checkout — pagamento",
    lines: [
      "É possível pagar com um ou mais cartões, inclusive um recém-cadastrado.",
      "A soma dos valores deve cobrir o total após o desconto dos cupons.",
      "O resumo à direita confirma itens, frete e total.",
    ],
  },
  19: {
    title: "Pedido confirmado",
    lines: [
      "Após finalizar, o pedido nasce em aberto e aguarda o ateliê processar.",
      "O cliente vê o resumo, o endereço e a forma de envio.",
      "Quando o admin processa, o sistema confirma o pagamento.",
    ],
  },
  20: {
    title: "Consulta do pedido",
    lines: [
      "Na conta, o cliente acompanha status, itens, endereço e histórico.",
      "Daqui saem o cancelamento (enquanto permitido), o recebimento e o pedido de troca.",
      "Cada transição fica registrada na linha do tempo.",
    ],
  },
  21: {
    title: "Cartões",
    lines: [
      "A conta guarda vários cartões, com bandeira e um marcado como preferencial.",
      "Número, nome, validade e CVV são validados; o CVV não é armazenado.",
      "Os mesmos cartões ficam disponíveis no checkout.",
    ],
  },
  22: {
    title: "Endereços",
    lines: [
      "Endereços ficam em tela própria, cada um com um apelido único.",
      "É obrigatório manter cobrança e entrega, com tipo de residência, logradouro, CEP e país.",
      "O checkout reutiliza esses registros sem reeditar o cadastro.",
    ],
  },
  23: {
    title: "Gráficos de vendas",
    lines: [
      "O painel administrativo mostra a receita ao longo dos meses em gráfico de linha.",
      "Há também o recorte por categoria para o ateliê acompanhar o mix vendido.",
      "Os dados vêm dos pedidos já registrados no protótipo.",
    ],
  },
  24: {
    title: "Lista de clientes",
    lines: [
      "O admin consulta clientes por nome, e-mail, CPF, telefone, gênero, situação ou código.",
      "Inativar preserva o cadastro; a exclusão continua sendo do próprio cliente.",
      "O detalhe reúne ranking, endereços, cartões e pedidos.",
    ],
  },
  25: {
    title: "Lista de pedidos",
    lines: [
      "Central de vendas do ateliê: filtrar, abrir o pedido e avançar o status.",
      "Daqui o admin processa pagamento, despacha e trata trocas.",
      "O fluxo evita o trânsito quando a modalidade é retirada.",
    ],
  },
  26: {
    title: "Lista de produtos",
    lines: [
      "CRUD administrativo do catálogo: incluir, editar e remover peças.",
      "Nome, preço, categoria, cores e mídia alimentam a loja imediatamente.",
      "É o equivalente ao cadastro de livros do DRS, adaptado à impressão 3D.",
    ],
  },
  27: {
    title: "Lista de cupons",
    lines: [
      "O admin cria cupons promocionais ou de troca, com código e percentual.",
      "Cupons de troca ficam vinculados ao cliente após uma troca aceita.",
      "No checkout, o código é digitado e o desconto incide sobre o subtotal.",
    ],
  },
};

for (let i = 9; i <= 25; i++) {
  const src = path.join(SCREENS, `image${i}.png`);
  const dest = path.join(MEDIA, `image${i}.png`);
  if (fs.existsSync(src)) fs.copyFileSync(src, dest);
}

for (const [n, meta] of Object.entries(kanban)) {
  const file = path.join(SLIDES, `slide${n}.xml`);
  let xml = fs.readFileSync(file, "utf8");
  xml = setTitle(xml, meta.title);
  xml = insertDesc(xml, meta.lines);
  fs.writeFileSync(file, xml);
}

for (const [n, meta] of Object.entries(proto)) {
  const file = path.join(SLIDES, `slide${n}.xml`);
  let xml = fs.readFileSync(file, "utf8");
  xml = setTitle(xml, meta.title);
  xml = insertDesc(xml, meta.lines);
  fs.writeFileSync(file, xml);
}

{
  const file = path.join(SLIDES, "slide2.xml");
  let xml = fs.readFileSync(file, "utf8");
  xml = xml.replace(
    /(<p:cNvPr [^>]*name="Title 1"[\s\S]*?<p:txBody>)([\s\S]*?)(<\/p:txBody>)/,
    `$1${titleBody("Tema e proposta", 3200)}$3`
  );
  xml = replaceTextBox(xml, "TextBox 2", [
    "A 3D Store é um e-commerce de peças físicas produzidas por impressão 3D. O cliente consulta o catálogo, compra e acompanha a entrega; o ateliê gerencia cadastros, vendas e cupons.",
    "Escopo do protótipo:",
    "• CRUD completo de clientes, com endereços, cartões e senha",
    "• Catálogo e cadastro de produtos impressos em 3D",
    "• Carrinho, checkout, frete e gestão de pedidos",
    "• Trocas com geração de cupom",
    "• Cupons promocionais e de troca",
    "• Dashboard de receita no painel administrativo",
    "• Chat de recomendação e testes de interface automatizados",
  ]);
  fs.writeFileSync(file, xml);
}

{
  const file = path.join(SLIDES, "slide3.xml");
  let xml = fs.readFileSync(file, "utf8");
  xml = xml.replace(
    /(<p:cNvPr [^>]*name="Title 1"[\s\S]*?<p:txBody>)([\s\S]*?)(<\/p:txBody>)/,
    `$1${titleBody("Tecnologias", 3200)}$3`
  );
  xml = replaceTextBox(xml, "TextBox 2", [
    "O DRS prevê uma arquitetura em camadas. Neste semestre o protótipo é uma SPA que demonstra as regras de negócio na interface.",
    "• Front-end: React 19, TypeScript e Vite",
    "• Testes de interface: Cypress",
    "• Apoio ao desenvolvimento: Cursor",
    "• Versionamento: Git e GitHub",
    "• Visão de destino: API REST em Node.js, PostgreSQL, Recharts e OpenAI",
    "• Recorte atual: persistência local, sessões por aba e gráfico nativo no painel",
  ]);
  fs.writeFileSync(file, xml);
}

{
  const file = path.join(SLIDES, "slide1.xml");
  let xml = fs.readFileSync(file, "utf8");
  xml = xml.replaceAll("Projeto\n de E-commerce", "Projeto de E-commerce");
  fs.writeFileSync(file, xml);
}

console.log("slides patched");
