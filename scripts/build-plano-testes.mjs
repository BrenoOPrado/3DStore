import fs from "node:fs";
import path from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

const ROOT = path.resolve(".");
const MEDIA = path.join(ROOT, "docs", "_testplan_work", "template", "word", "media");
const LOGO_FATEC = path.join(MEDIA, "0fa16decfd361ac9500408f81e9cab2aba020cad.png");
const LOGO_MOGI = path.join(MEDIA, "8db98977ad6b2784f42fa22770bcbb3e2fcf0970.png");
const OUT_DOCS = path.join(ROOT, "docs", "PlanoTestes_Grupo.docx");
const OUT_DL = "C:\\Users\\breno\\Downloads\\PlanoTestes_Grupo.docx";

const BURG = "632423";
const NAVY = "1B365D";
const ROW = "F7F3F2";
const WHITE = "FFFFFF";
const BLACK = "222222";
const MUTED = "555555";
const W = 10080;

const thin = { style: BorderStyle.SINGLE, size: 4, color: "C5B7B6" };
const borders = { top: thin, bottom: thin, left: thin, right: thin };

function cell(text, opts = {}) {
  const {
    bold = false,
    fill = WHITE,
    width = 2340,
    align = AlignmentType.LEFT,
    color = BLACK,
    header = false,
    span,
  } = opts;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    borders,
    shading: { type: ShadingType.CLEAR, fill: header ? BURG : fill },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 50, bottom: 50, left: 70, right: 70 },
    children: String(text)
      .split("\n")
      .map(
        (line, i) =>
          new Paragraph({
            alignment: align,
            spacing: { after: i === 0 ? 0 : 40 },
            children: [
              new TextRun({
                text: line,
                bold: bold || header,
                font: "Arial",
                size: header ? 16 : 18,
                color: header ? WHITE : color,
              }),
            ],
          })
      ),
  });
}

function table(headers, rows, widths) {
  const w = widths ?? headers.map(() => Math.floor(W / headers.length));
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: w,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => cell(h, { header: true, width: w[i] })),
      }),
      ...rows.map((r, ri) =>
        new TableRow({
          children: r.map((c, i) => cell(c, { fill: ri % 2 ? ROW : WHITE, width: w[i], bold: i === 0 })),
        })
      ),
    ],
  });
}

function kvTable(pairs, widths = [2800, 7280]) {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: widths,
    rows: pairs.map(
      ([k, v], i) =>
        new TableRow({
          children: [
            cell(k, { bold: true, fill: i % 2 ? ROW : "F3EDED", width: widths[0], color: BURG }),
            cell(v, { fill: i % 2 ? ROW : WHITE, width: widths[1] }),
          ],
        })
    ),
  });
}

function p(text, extra = {}) {
  return new Paragraph({
    spacing: { after: extra.after ?? 160, line: 276 },
    alignment: extra.align ?? AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: extra.size ?? 22,
        bold: extra.bold,
        italics: extra.italics,
        color: extra.color ?? BLACK,
      }),
    ],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BURG, space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: BURG })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: NAVY })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: BURG })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
  });
}

function spacer(after = 200) {
  return new Paragraph({ spacing: { after }, children: [] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function logo(file, width, height) {
  return new ImageRun({
    type: "png",
    data: fs.readFileSync(file),
    transformation: { width, height },
  });
}

function ctBlock(ct) {
  return [
    h3(`${ct.id}  ${ct.title}`),
    kvTable([
      ["Requisitos rastreados", ct.reqs],
      ["Caso de uso relacionado", ct.uc],
      ["Nível / Tipo", ct.level],
      ["Técnica de projeto", ct.tech],
      ["Prioridade", ct.prio],
      ["Pré-condições", ct.pre],
      ["Dados de teste", ct.data],
    ]),
    spacer(120),
    table(["Passo", "Ação", "Resultado esperado"], ct.steps, [900, 3960, 5220]),
    spacer(120),
    kvTable([
      ["Pós-condições", ct.post],
      ["Automatizado?", ct.auto],
      [
        "Resultado da execução",
        "Não executado nesta entrega. A execução completa dos testes e a implementação residual de scripts estão fora do escopo desta atividade.",
      ],
    ]),
    spacer(80),
  ];
}

const reqs = [
  ["RF0021", "O sistema deve possibilitar o cadastro de clientes."],
  ["RF0022", "O sistema deve possibilitar a alteração de dados cadastrais de clientes."],
  ["RF0023", "O sistema deve possibilitar que clientes sejam inativados."],
  ["RF0024", "Consulta de clientes com filtro isolado ou combinado pelos campos de identificação."],
  ["RF0025", "Disponibilizar no cadastro de clientes a consulta de todas as transações já realizadas."],
  ["RF0026", "Associar diversos endereços de entrega ao cliente, cada um identificado por uma frase curta."],
  ["RF0027", "Associar diversos cartões de crédito, com um cartão configurado como preferencial."],
  ["RF0028", "Alterar a senha sem exigir a alteração de todos os dados cadastrais."],
  ["RF0031", "Gerenciar carrinho: adicionar, alterar, excluir e visualizar itens."],
  ["RF0032", "Editar a quantidade ao adicionar o produto e na visualização do carrinho."],
  ["RF0033", "A partir de um carrinho de compra, realizar uma compra."],
  ["RF0034", "Calcular o frete com base nos itens selecionados e no endereço apontado pelo cliente."],
  ["RF0035", "Selecionar endereço cadastrado ou cadastrar um novo, com opção de incorporar ao perfil."],
  ["RF0036", "Selecionar cartão cadastrado ou cadastrar um novo, com cupom de troca ou promocional válido."],
  ["RF0037", "Permitir pagamento com cupons de troca, promocionais e cartão de crédito."],
  ["RF0038", "Finalizar a compra após pagamento e endereço; status inicial EM PROCESSAMENTO."],
  ["RN0021", "Todo cliente cadastrado deve ter ao menos um endereço de cobrança."],
  ["RN0022", "Todo cliente cadastrado deve ter ao menos um endereço de entrega."],
  ["RN0023", "Endereço com tipo de residência, tipo logradouro, logradouro, número, bairro, CEP, cidade, estado e país obrigatórios."],
  ["RN0024", "Cartão com número, nome impresso, bandeira e código de segurança."],
  ["RN0025", "Cartão deve ser de bandeira registrada no sistema."],
  ["RN0026", "Cliente com gênero, nome, data de nascimento, CPF, telefone (tipo, DDD e número), e-mail, senha e endereço."],
  ["RN0027", "O cliente deve receber um ranking numérico com base no perfil de compra."],
  ["RN0031", "Não adicionar ao carrinho item indisponível nem quantidade acima do estoque."],
  ["RN0033", "Apenas um cupom promocional pode ser utilizado por compra."],
  ["RN0034", "Pagamento com mais de um cartão, com valor mínimo de R$ 10,00 em cada cartão."],
  ["RN0035", "Com cupons e cartão, usar o valor máximo dos cupons; cartão pode ficar abaixo de R$ 10,00 nesse caso."],
  ["RN0036", "Gerar cupom de troca se os cupons superarem a compra; não aceitar conjunto desnecessário de cupons."],
  ["RNF0011", "Toda consulta de usuário deve ter resposta em no máximo 1 segundo."],
  ["RNF0012", "Toda escrita deve registrar data, hora, usuário responsável e os dados alterados."],
  ["RNF0031", "Senha com pelo menos 8 caracteres, letras maiúsculas e minúsculas e caracteres especiais."],
  ["RNF0032", "O usuário deve digitar duas vezes a mesma senha no registro."],
  ["RNF0033", "A senha deve ser criptografada."],
  ["RNF0034", "Alterar ou adicionar endereços de entrega ou cobrança sem editar os demais dados cadastrais."],
  ["RNF0035", "Todo cliente cadastrado deve receber um código único no sistema."],
];

const cases = [
  {
    id: "CT001",
    title: "Cadastrar cliente com dados obrigatórios válidos",
    reqs: "RF0021, RN0021, RN0022, RN0023, RN0026, RN0027, RNF0031, RNF0032, RNF0035",
    uc: "Cadastro de clientes (fluxo principal)",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (classe válida para todos os campos obrigatórios)",
    prio: "Alta",
    pre: "Base restaurada (cy.resetStore); e-mail ainda não cadastrado.",
    data: "Nome: Maria QA Silva; e-mail único; CPF válido gerado; senha Senha@123 (confirmação idêntica); nascimento 18/04/1995; telefone celular DDD 11 988776655; endereço Casa, Rua Augusta 1500, Consolação, CEP 01310-100, São Paulo/SP/Brasil, tipo ambos (cobrança e entrega).",
    steps: [
      ["1", "Acessar /cadastro", "Formulário de cadastro é exibido."],
      ["2", "Preencher os dados de teste, incluindo endereço de cobrança e de entrega", "Campos aceitam os valores sem mensagem de erro."],
      ["3", "Acionar o envio do cadastro", "Cliente autentica e a área da conta exibe e-mail, situação ativo, ranking e código único."],
    ],
    post: "Cliente ativo, com código único, ranking numérico e ao menos um endereço de cobrança e um de entrega.",
    auto: "Sim, Cypress (cypress/e2e/01-cadastrar-cliente.cy.ts)",
  },
  {
    id: "CT002",
    title: "Recusar cadastro com senha fraca",
    reqs: "RF0021, RNF0031",
    uc: "Cadastro de clientes (exceção: senha)",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (classe inválida: senha sem maiúscula e sem especial) e valor limite (menos de 8 caracteres)",
    prio: "Alta",
    pre: "Base restaurada; formulário de cadastro aberto.",
    data: "Senha e confirmação: senha123; demais campos válidos como no CT001.",
    steps: [
      ["1", "Preencher o cadastro com senha senha123 e confirmação idêntica", "Campos preenchidos."],
      ["2", "Acionar o envio", "Mensagem de erro informa a regra de 8 caracteres / composição da senha (RNF0031)."],
      ["3", "Tentar autenticar com o e-mail informado", "Conta não é criada."],
    ],
    post: "Nenhum cliente persistido.",
    auto: "Sim, Cypress (cypress/e2e/01-cadastrar-cliente.cy.ts)",
  },
  {
    id: "CT003",
    title: "Recusar cadastro com confirmação de senha divergente",
    reqs: "RF0021, RNF0032",
    uc: "Cadastro de clientes (exceção: confirmação)",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (classe inválida: senhas diferentes)",
    prio: "Alta",
    pre: "Base restaurada; formulário de cadastro aberto.",
    data: "Senha Senha@123; confirmação Senha@999; demais campos válidos.",
    steps: [
      ["1", "Preencher o cadastro com senha e confirmação divergentes", "Campos preenchidos."],
      ["2", "Acionar o envio", "Mensagem informa que a confirmação não confere (RNF0032)."],
    ],
    post: "Nenhum cliente persistido.",
    auto: "Sim, Cypress (cypress/e2e/01-cadastrar-cliente.cy.ts)",
  },
  {
    id: "CT004",
    title: "Recusar CPF inválido e endereço sem logradouro",
    reqs: "RF0021, RN0023, RN0026",
    uc: "Cadastro de clientes (exceção: dados obrigatórios)",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (CPF com dígitos iguais; logradouro vazio) e valor limite (campo obrigatório em branco)",
    prio: "Alta",
    pre: "Base restaurada; formulário de cadastro aberto com demais campos válidos.",
    data: "CPF 111.111.111-11; na segunda tentativa, logradouro vazio.",
    steps: [
      ["1", "Informar CPF 11111111111 e enviar", "Mensagem de erro referente ao CPF."],
      ["2", "Corrigir o CPF, limpar o logradouro e enviar", "Mensagem solicita o logradouro (RN0023)."],
    ],
    post: "Nenhum cliente persistido.",
    auto: "Sim, Cypress (cypress/e2e/01-cadastrar-cliente.cy.ts)",
  },
  {
    id: "CT005",
    title: "Recusar cadastro somente com endereço de entrega",
    reqs: "RF0021, RN0021, RN0022",
    uc: "Cadastro de clientes (exceção: endereços obrigatórios)",
    level: "Sistema (E2E) / Funcional",
    tech: "Tabela de decisão (cobrança ausente × entrega presente)",
    prio: "Alta",
    pre: "Base restaurada; formulário de cadastro aberto.",
    data: "Endereço marcado apenas como entrega; demais campos válidos.",
    steps: [
      ["1", "Preencher um único endereço com tipo entrega", "Formulário aceita a seleção."],
      ["2", "Enviar o cadastro", "Mensagem exige ambos os tipos (cobrança e entrega)."],
    ],
    post: "Nenhum cliente persistido.",
    auto: "Sim, Cypress (cypress/e2e/01-cadastrar-cliente.cy.ts)",
  },
  {
    id: "CT006",
    title: "Consultar e alterar dados cadastrais do cliente",
    reqs: "RF0022, RN0026",
    uc: "Alterar cliente (fluxo principal e exceção de CPF)",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (alteração válida; CPF inválido na alteração)",
    prio: "Alta",
    pre: "Cliente recém-cadastrado autenticado em /conta.",
    data: "Novo nome: Maria QA Alterada; novo telefone 977665544; CPF inválido 12345678900 na tentativa de erro.",
    steps: [
      ["1", "Abrir o cadastro e conferir nome, CPF e ranking", "Dados atuais e ranking são exibidos."],
      ["2", "Alterar nome e telefone e salvar", "Mensagem de cadastro atualizado; campos persistem os novos valores."],
      ["3", "Informar CPF 12345678900 e salvar", "Mensagem de erro de CPF; o cadastro válido anterior permanece."],
    ],
    post: "Nome e telefone atualizados; CPF original mantido.",
    auto: "Sim, Cypress (cypress/e2e/02-consultar-alterar.cy.ts)",
  },
  {
    id: "CT007",
    title: "Consultar clientes com filtro isolado e combinado",
    reqs: "RF0024",
    uc: "Consulta administrativa de clientes",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (filtro isolado e combinação de filtros)",
    prio: "Alta",
    pre: "Administrador autenticado (admin@3dstore.com / admin123); massa padrão com Ana Souza, Bruno Lima e Carla Mendes.",
    data: "Nome Ana Souza; CPF 52998224725; situação inativo; gênero Masculino; combinação Feminino + Carla.",
    steps: [
      ["1", "Filtrar por nome Ana Souza", "Lista contém ana.souza@email.com."],
      ["2", "Filtrar por CPF 52998224725", "Ana Souza é retornada."],
      ["3", "Filtrar por situação inativo", "Bruno Lima aparece; Ana Souza não."],
      ["4", "Combinar gênero Feminino e nome Carla", "carla.mendes@email.com aparece; Ana Souza não."],
    ],
    post: "Nenhum dado cadastral alterado.",
    auto: "Sim, Cypress (cypress/e2e/04-consultar-admin.cy.ts)",
  },
  {
    id: "CT008",
    title: "Consultar transações e ranking no cadastro do cliente",
    reqs: "RF0025, RN0027, RNF0035",
    uc: "Consulta de transações do cliente",
    level: "Sistema (E2E) / Funcional",
    tech: "Teste baseado em cenário",
    prio: "Alta",
    pre: "Administrador autenticado; cliente Ana Souza com pedidos na massa.",
    data: "Cliente Ana Souza (ana.souza@email.com).",
    steps: [
      ["1", "Abrir o detalhe de Ana Souza em /admin/clientes", "Exibe e-mail, ranking numérico e código único (cust-ana)."],
      ["2", "Inspecionar a lista de pedidos", "Há ao menos uma transação consultável."],
    ],
    post: "Consulta sem alteração de status de pedido.",
    auto: "Sim, Cypress (cypress/e2e/04-consultar-admin.cy.ts)",
  },
  {
    id: "CT009",
    title: "Inativar cliente e impedir autenticação",
    reqs: "RF0023",
    uc: "Inativar cadastro de cliente",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (cliente ativo × inativo)",
    prio: "Alta",
    pre: "Cliente de teste cadastrado e ativo; administrador disponível.",
    data: "Cliente recém-criado via cadastro; admin@3dstore.com.",
    steps: [
      ["1", "No admin, localizar o cliente e inativar", "Situação passa a inativo."],
      ["2", "Tentar login com o e-mail e a senha do cliente", "Acesso recusado com mensagem de conta inativa."],
      ["3", "Reativar no admin e autenticar novamente", "Cliente acessa /conta com o mesmo cadastro."],
    ],
    post: "Cadastro permanece; apenas o status muda.",
    auto: "Sim, Cypress (cypress/e2e/03-inativar-excluir.cy.ts)",
  },
  {
    id: "CT010",
    title: "Manter endereços sem editar o restante do cadastro",
    reqs: "RF0026, RN0021, RN0022, RN0023, RNF0034",
    uc: "Cadastro de endereços de entrega",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (apelido único) e valor limite (último endereço de entrega/cobrança)",
    prio: "Alta",
    pre: "Cliente autenticado com endereço Casa (ambos).",
    data: "Novo endereço Trabalho, Avenida Paulista 1000, Bela Vista, CEP 01311-100, tipo entrega; tentativa de apelido duplicado Trabalho.",
    steps: [
      ["1", "Abrir /conta/enderecos e cadastrar Trabalho", "Endereço aparece sem exigir edição de nome/CPF (RNF0034)."],
      ["2", "Alterar o número de Trabalho para 2000", "Lista exibe 2000."],
      ["3", "Tentar cadastrar outro endereço com apelido Trabalho", "Sistema impede apelido repetido."],
      ["4", "Tentar excluir Casa (último de cobrança/entrega combinado)", "Exclusão é recusada para preservar RN0021/RN0022."],
    ],
    post: "Casa e Trabalho persistidos; apelidos únicos.",
    auto: "Sim, Cypress (cypress/e2e/05-enderecos.cy.ts)",
  },
  {
    id: "CT011",
    title: "Cadastrar cartões com bandeira e cartão preferencial",
    reqs: "RF0027, RN0024, RN0025",
    uc: "Cadastro de cartões de crédito",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (bandeira registrada) e tabela de decisão (preferencial único)",
    prio: "Alta",
    pre: "Cliente autenticado sem cartão extra além do fluxo de conta.",
    data: "Visa 4111111111111111, titular MARIA QA SILVA, validade 12/28, CVV 123; Mastercard 5555555555554444, validade 08/27, CVV 321.",
    steps: [
      ["1", "Cadastrar o cartão Visa com todos os campos de RN0024 e bandeira da lista", "Cartão final 1111 fica preferencial (primeiro)."],
      ["2", "Cadastrar Mastercard marcado como preferencial", "4444 passa a preferencial; 1111 deixa de ser."],
      ["3", "Acionar preferencial em 1111", "Apenas 1111 permanece preferencial."],
    ],
    post: "Dois cartões persistidos; um único preferencial.",
    auto: "Sim, Cypress (cypress/e2e/06-cartoes.cy.ts)",
  },
  {
    id: "CT012",
    title: "Recusar cartão com campos obrigatórios vazios ou validade inválida",
    reqs: "RF0027, RN0024, RN0025",
    uc: "Cadastro de cartões (exceção)",
    level: "Sistema (E2E) / Funcional",
    tech: "Valor limite (campos vazios) e partição de equivalência (validade fora de MM/AA)",
    prio: "Média",
    pre: "Cliente autenticado em /conta/cartoes.",
    data: "Envio sem nome impresso; validade em formato inválido.",
    steps: [
      ["1", "Abrir novo cartão e enviar sem nome impresso", "Mensagem exige o nome impresso (RN0024)."],
      ["2", "Informar validade fora de MM/AA e enviar", "Validação recusa o formato."],
    ],
    post: "Nenhum cartão incompleto persistido.",
    auto: "Sim, Cypress (cypress/e2e/06-cartoes.cy.ts)",
  },
  {
    id: "CT013",
    title: "Alterar somente a senha, com regras de força e confirmação",
    reqs: "RF0028, RNF0031, RNF0032",
    uc: "Alteração isolada de senha",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (senha atual incorreta; fraca; confirmação divergente; válida)",
    prio: "Alta",
    pre: "Cliente autenticado; senha atual Senha@123.",
    data: "Nova senha válida Nova@1234.",
    steps: [
      ["1", "Em /conta/senha, informar senha atual errada", "Mensagem de senha incorreta."],
      ["2", "Informar nova senha fraca", "Mensagem da regra de 8 caracteres / composição."],
      ["3", "Informar nova e confirmação diferentes", "Mensagem de confirmação."],
      ["4", "Informar senha atual correta e Nova@1234 confirmada; sair e entrar com a senha antiga e com a nova", "Senha antiga falha; a nova autentica em /conta."],
    ],
    post: "Demais dados cadastrais inalterados; apenas a senha muda.",
    auto: "Sim, Cypress (cypress/e2e/07-senha.cy.ts)",
  },
  {
    id: "CT014",
    title: "Gerenciar carrinho e recusar quantidade acima do estoque",
    reqs: "RF0031, RF0032, RN0031",
    uc: "CDU003 — Gerenciar vendas eletrônicas (carrinho)",
    level: "Sistema (E2E) / Funcional",
    tech: "Valor limite (quantidade = estoque; quantidade = estoque + 1)",
    prio: "Alta",
    pre: "Cliente Ana Souza autenticada; base restaurada; produto escorredor-elefante com estoque 1.",
    data: "gancho-trex qtd 2; porta-alho qtd 1; escorredor-elefante estoque 1.",
    steps: [
      ["1", "Adicionar gancho-trex (2) e porta-alho (1) e abrir /carrinho", "Os dois itens são listados com as quantidades."],
      ["2", "Aumentar e diminuir a quantidade de gancho-trex no carrinho", "Quantidade vai a 3 e retorna a 2 (RF0032)."],
      ["3", "No detalhe de escorredor-elefante, adicionar 1 e tentar adicionar de novo", "A segunda tentativa informa falta de estoque (RN0031); o botão de incremento fica desabilitado."],
      ["4", "Remover escorredor-elefante do carrinho", "Item desaparece da lista."],
    ],
    post: "Carrinho contém gancho-trex e porta-alho dentro do estoque.",
    auto: "Sim, Cypress (cypress/e2e/08-vendas.cy.ts)",
  },
  {
    id: "CT015",
    title: "Finalizar compra com endereço e cartão cadastrados em EM PROCESSAMENTO",
    reqs: "RF0033, RF0035, RF0036, RF0038, RNF0011, RNF0012",
    uc: "CDU003 — Realizar e finalizar compra",
    level: "Sistema (E2E) / Funcional",
    tech: "Teste baseado em cenário (fluxo principal)",
    prio: "Alta",
    pre: "Ana Souza autenticada; endereço Casa e cartão final 1111 cadastrados; gancho-trex no carrinho.",
    data: "Frete retirada no ateliê; cartão 1111, valor integral, CVV 3490.",
    steps: [
      ["1", "Consultar /api/bootstrap e ler o cabeçalho X-Response-Time", "Cabeçalho no formato Nms e valor < 1000 (RNF0011)."],
      ["2", "Ir ao checkout, selecionar Casa e retirada, pagar com 1111 e confirmar", "Pedido criado com status Em processamento (RF0038)."],
      ["3", "Como admin, consultar /api/admin/logs", "Há log de insert em pedido com o e-mail da cliente (RNF0012)."],
    ],
    post: "Pedido em EM PROCESSAMENTO; carrinho da compra esvaziado.",
    auto: "Sim, Cypress (cypress/e2e/08-vendas.cy.ts)",
  },
  {
    id: "CT016",
    title: "Cadastrar novo endereço e novo cartão no checkout e incorporar ao perfil",
    reqs: "RF0035, RF0036, RF0038",
    uc: "CDU003 — Seleção de endereço e forma de pagamento",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (novo cadastro durante a compra)",
    prio: "Alta",
    pre: "Cliente novo autenticado; gancho-trex no carrinho.",
    data: "Endereço Apartamento, Rua Oscar Freire 200, Jardins, CEP 01426-001; cartão Visa 4111...1111, titular MARIA QA SILVA, validade 12/28, CVV 123; opções de salvar no perfil marcadas.",
    steps: [
      ["1", "No checkout, escolher novo endereço, preencher e manter salvar endereço", "Endereço entra no fluxo da compra."],
      ["2", "Cadastrar novo cartão, salvar no perfil e pagar", "Cartão final 1111 fica disponível para pagamento."],
      ["3", "Confirmar o pedido e abrir /conta/enderecos e /conta/cartoes", "Apartamento e Visa 1111 constam no perfil; pedido em processamento."],
    ],
    post: "Perfil incorpora endereço e cartão usados na compra.",
    auto: "Sim, Cypress (cypress/e2e/08-vendas.cy.ts)",
  },
  {
    id: "CT017",
    title: "Calcular frete conforme itens e endereço, com retirada gratuita",
    reqs: "RF0034",
    uc: "CDU003 — Calcular frete",
    level: "Sistema (E2E) / Funcional",
    tech: "Partição de equivalência (retirada × entrega com CEP) e valor limite (quantidade de itens na tarifa por unidade)",
    prio: "Alta",
    pre: "Cliente autenticado no checkout com itens no carrinho e endereço Casa (CEP 01310-100).",
    data: "Critério documentado no sistema: tarifa regional pelo CEP + R$ 4,90 por unidade; retirada no ateliê a R$ 0,00.",
    steps: [
      ["1", "Selecionar retirada no ateliê", "Frete da retirada é R$ 0,00; a nota do critério permanece visível."],
      ["2", "Selecionar entrega no endereço Casa", "Frete passa a considerar o CEP e a quantidade de unidades."],
      ["3", "Alterar a quantidade de um item no carrinho e recalcular", "O componente por unidade (R$ 4,90) varia com a quantidade (RF0034)."],
    ],
    post: "Totais de frete coerentes com endereço e itens; compra ainda não finalizada neste caso.",
    auto: "Sim, Cypress (cobertura parcial em cypress/e2e/08-vendas.cy.ts; passo de variação de quantidade previsto na automação desta sprint)",
  },
  {
    id: "CT018",
    title: "Respeitar o mínimo de R$ 10,00 por cartão em pagamento dividido",
    reqs: "RF0036, RF0037, RN0034",
    uc: "CDU003 — Forma de pagamento",
    level: "Sistema (E2E) / Funcional",
    tech: "Análise de valor limite (R$ 5,00 < 10,00; divisão igual ≥ 10,00)",
    prio: "Alta",
    pre: "Ana Souza autenticada; porta-alho no carrinho; cartões 1111 e 4444 cadastrados; retirada.",
    data: "Tentativa 1111 = R$ 5,00 e 4444 = restante; em seguida divisão igualitária.",
    steps: [
      ["1", "Alocar R$ 5,00 no cartão 1111 e o restante no 4444 e confirmar", "Mensagem exige mínimo de R$ 10,00 por cartão (RN0034)."],
      ["2", "Acionar a divisão igualitária e confirmar", "Pedido é criado em Em processamento."],
    ],
    post: "Somente a alocação válida gera pedido.",
    auto: "Sim, Cypress (cypress/e2e/08-vendas.cy.ts)",
  },
  {
    id: "CT019",
    title: "Pagar com cupom e cartão abaixo de R$ 10,00",
    reqs: "RF0036, RF0037, RN0033, RN0035",
    uc: "CDU003 — Cupons e cartão em conjunto",
    level: "Sistema (E2E) / Funcional",
    tech: "Tabela de decisão (cupom presente × valor restante < 10) e valor limite (restante R$ 7,90)",
    prio: "Alta",
    pre: "Ana Souza autenticada; porta-alho no carrinho; cupom TROCA35 disponível; retirada.",
    data: "Cupom TROCA35; restante esperado R$ 7,90 no cartão 1111.",
    steps: [
      ["1", "Aplicar TROCA35 no checkout", "Chip do cupom aparece; total restante 7,90."],
      ["2", "Tentar um segundo cupom promocional, se houver", "Sistema impede mais de um promocional (RN0033)."],
      ["3", "Pagar R$ 7,90 no cartão 1111 e confirmar", "Pedido em processamento; exceção de RN0034 autorizada por RN0035."],
    ],
    post: "Cupom TROCA35 consumido; pedido em EM PROCESSAMENTO.",
    auto: "Sim, Cypress (cypress/e2e/08-vendas.cy.ts)",
  },
  {
    id: "CT020",
    title: "Recusar cupons desnecessários e gerar cupom de troca da diferença",
    reqs: "RF0037, RN0036, RF0038",
    uc: "CDU003 — Uso de cupons (RN0036)",
    level: "Sistema (E2E) / Funcional",
    tech: "Tabela de decisão (subconjunto de cupons já cobre o total × conjunto completo)",
    prio: "Alta",
    pre: "Ana Souza autenticada; gancho-trex no carrinho; cupons TROCA40 e TROCA20 disponíveis; retirada.",
    data: "Primeiro TROCA40; tentativa de adicionar TROCA20.",
    steps: [
      ["1", "Aplicar TROCA40", "Cupom aceito."],
      ["2", "Tentar aplicar TROCA20", "Mensagem informa uso desnecessário de cupons (RN0036)."],
      ["3", "Confirmar a compra coberta pelo TROCA40", "Pedido em processamento; cupom de troca da diferença (TROCA-…) é gerado e listado em /conta/cupons."],
    ],
    post: "Novo cupom de troca disponível ao cliente.",
    auto: "Sim, Cypress (cypress/e2e/08-vendas.cy.ts)",
  },
  {
    id: "CT021",
    title: "Consultas de usuário respondem em no máximo 1 segundo",
    reqs: "RNF0011",
    uc: "Requisito transversal de consulta",
    level: "Sistema (E2E) / Não funcional",
    tech: "Teste baseado em cenário, com medição de tempo",
    prio: "Média",
    pre: "API em execução em http://127.0.0.1:3001.",
    data: "GET /api/bootstrap (consulta usada na abertura da loja).",
    steps: [
      ["1", "Disparar a consulta e ler X-Response-Time", "Cabeçalho presente no formato Nms."],
      ["2", "Converter o valor para inteiro", "Tempo menor que 1000 ms (RNF0011)."],
    ],
    post: "Nenhuma escrita realizada.",
    auto: "Sim, Cypress (cypress/e2e/08-vendas.cy.ts)",
  },
  {
    id: "CT022",
    title: "Registrar log de escrita na finalização do pedido",
    reqs: "RNF0012",
    uc: "Requisito transversal de auditoria",
    level: "Integração / Não funcional",
    tech: "Teste baseado em cenário",
    prio: "Alta",
    pre: "Pedido recém-finalizado (CT015); sessão de administrador.",
    data: "GET /api/admin/logs após insert de pedido da Ana Souza.",
    steps: [
      ["1", "Consultar os logs administrativos", "Existe registro com entidade pedido e ação insert."],
      ["2", "Conferir usuário, data/hora e dados", "userEmail da compradora e payload da alteração estão presentes (RNF0012)."],
    ],
    post: "Log persistido; pedido inalterado.",
    auto: "Sim, Cypress (cypress/e2e/08-vendas.cy.ts)",
  },
  {
    id: "CT023",
    title: "Persistir senha de forma não reversível em claro",
    reqs: "RNF0033",
    uc: "Cadastro de clientes (persistência da senha)",
    level: "Integração / Não funcional",
    tech: "Inspeção do dado persistido após o CT001",
    prio: "Média",
    pre: "Cliente cadastrado no CT001 com senha Senha@123.",
    data: "Registro do cliente em backend/data/store.json (ou GET autenticado que não devolva a senha).",
    steps: [
      ["1", "Abrir o registro persistido do cliente", "O campo password não contém o texto Senha@123."],
      ["2", "Autenticar com a senha original", "Login ocorre, comprovando que o valor armazenado é o derivado da senha (RNF0033)."],
    ],
    post: "Senha em claro não é exposta na API pública do cliente.",
    auto: "Não em Cypress de interface. Automatização prevista via inspeção de API/persistência; fora do conjunto Selenium/Cypress desta entrega.",
  },
];

const matrix = [
  ["RF0021", "Cadastrar cliente", "CT001, CT002, CT003, CT004, CT005", "Coberto"],
  ["RF0022", "Alterar cliente", "CT006", "Coberto"],
  ["RF0023", "Inativar cadastro de cliente", "CT009", "Coberto"],
  ["RF0024", "Consulta de clientes", "CT007", "Coberto"],
  ["RF0025", "Consulta de transações", "CT008", "Coberto"],
  ["RF0026", "Cadastro de endereços de entrega", "CT010, CT016", "Coberto"],
  ["RF0027", "Cadastro de cartões de crédito", "CT011, CT012, CT016", "Coberto"],
  ["RF0028", "Alteração apenas de senha", "CT013", "Coberto"],
  ["RF0031", "Gerenciar carrinho de compra", "CT014", "Coberto"],
  ["RF0032", "Quantidade no produto e no carrinho", "CT014", "Coberto"],
  ["RF0033", "Realizar compra", "CT015", "Coberto"],
  ["RF0034", "Calcular frete", "CT017", "Coberto"],
  ["RF0035", "Selecionar endereço de entrega", "CT015, CT016", "Coberto"],
  ["RF0036", "Selecionar forma de pagamento", "CT015, CT016, CT018, CT019", "Coberto"],
  ["RF0037", "Uso de cupom para pagamento", "CT018, CT019, CT020", "Coberto"],
  ["RF0038", "Finalizar compra em EM PROCESSAMENTO", "CT015, CT016, CT018, CT019, CT020", "Coberto"],
  ["RN0021", "Endereço de cobrança obrigatório", "CT001, CT005, CT010", "Coberto"],
  ["RN0022", "Endereço de entrega obrigatório", "CT001, CT005, CT010", "Coberto"],
  ["RN0023", "Composição do endereço", "CT001, CT004, CT010", "Coberto"],
  ["RN0024", "Composição do cartão", "CT011, CT012", "Coberto"],
  ["RN0025", "Bandeiras permitidas", "CT011", "Coberto"],
  ["RN0026", "Dados obrigatórios do cliente", "CT001, CT004, CT006", "Coberto"],
  ["RN0027", "Ranking do cliente", "CT001, CT006, CT008", "Coberto"],
  ["RN0031", "Estoque na adição ao carrinho", "CT014", "Coberto"],
  ["RN0033", "Um cupom promocional por compra", "CT019", "Coberto"],
  ["RN0034", "Mínimo de R$ 10,00 por cartão", "CT018", "Coberto"],
  ["RN0035", "Cupons com cartão abaixo de R$ 10,00", "CT019", "Coberto"],
  ["RN0036", "Cupom de troca da diferença / conjunto necessário", "CT020", "Coberto"],
  ["RNF0011", "Consulta em até 1 segundo", "CT021, CT015", "Coberto"],
  ["RNF0012", "Log de escrita", "CT022, CT015", "Coberto"],
  ["RNF0031", "Senha forte", "CT001, CT002, CT013", "Coberto"],
  ["RNF0032", "Confirmação de senha", "CT001, CT003, CT013", "Coberto"],
  ["RNF0033", "Senha criptografada", "CT023", "Coberto"],
  ["RNF0034", "Alteração isolada de endereços", "CT010", "Coberto"],
  ["RNF0035", "Código único de cliente", "CT001, CT008", "Coberto"],
];

const doc = new Document({
  creator: "Breno Oliveira do Prado",
  title: "Plano de Testes — 3D Store",
  description: "Plano de testes do e-commerce 3D Store conforme Template_Plano_de_Testes e DRS_LES_2_2026",
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: "bullet",
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 420, hanging: 220 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
      },
      headers: {
        default: new Header({
          children: [
            new Table({
              width: { size: W, type: WidthType.DXA },
              columnWidths: [2200, 5680, 2200],
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                      width: { size: 2200, type: WidthType.DXA },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [logo(LOGO_MOGI, 90, 48)],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                      shading: { type: ShadingType.CLEAR, fill: "F3F3F3" },
                      width: { size: 5680, type: WidthType.DXA },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: "Plano de Testes", italics: true, font: "Arial", size: 20, color: BURG })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: "3D Store — E-commerce", italics: true, font: "Arial", size: 18, color: MUTED })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                      width: { size: 2200, type: WidthType.DXA },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [logo(LOGO_FATEC, 110, 48)],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 8, color: BURG, space: 6 } },
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Plano de Testes — 3D Store  ·  Página ", font: "Arial", size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: MUTED }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          spacing: { before: 200, after: 80 },
          alignment: AlignmentType.CENTER,
          children: [logo(LOGO_FATEC, 220, 96)],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "Faculdade de Tecnologia do Estado de São Paulo", font: "Arial", size: 18, color: MUTED })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
          children: [new TextRun({ text: "FATEC Mogi das Cruzes  ·  Análise e Desenvolvimento de Sistemas  ·  LES 2º semestre de 2026", font: "Arial", size: 18, color: MUTED })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 80 },
          children: [new TextRun({ text: "Plano de Testes", font: "Arial", size: 48, bold: true, color: BURG })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "3D Store — E-commerce de peças impressas em 3D", font: "Arial", size: 28, bold: true, color: NAVY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Incremento: cadastro de clientes e gestão de vendas eletrônicas", font: "Arial", size: 22, italics: true, color: MUTED })],
        }),
        h2("Histórico de Versões"),
        table(
          ["Data", "Versão", "Descrição", "Autor", "Revisor"],
          [["19/10/26", "1.0", "Versão inicial: escopo, estratégia, casos, matriz e cronograma PERT do incremento de clientes e vendas.", "Breno Oliveira do Prado", "Professor da disciplina"]],
          [1400, 1000, 4080, 2000, 1600]
        ),
        spacer(200),
        kvTable([
          ["Cliente", "Ateliê 3D Store (cliente simulado da disciplina LES)"],
          ["Documento", "Plano de Testes: 3D Store — E-commerce de peças impressas em 3D"],
          ["Data", "19 de outubro de 2026"],
          ["Autor(es)", "Breno Oliveira do Prado"],
          ["Documento base", "DRS_LES_2_2026, versão 0.7 (10/08/2026)"],
        ]),
        spacer(200),
        h2("Página de Assinaturas"),
        table(
          ["Papel", "Nome", "Data"],
          [
            ["Elaborado por", "Breno Oliveira do Prado", "19.10.26"],
            ["Revisado e aprovado por", "Professor responsável pela disciplina", "dd.mm.aa"],
          ],
          [3360, 4360, 2360]
        ),
        pageBreak(),
        h1("Índice"),
        p("Para atualizar o índice no Word, clique com o botão direito sobre ele e escolha \"Atualizar campo\". A lista abaixo reflete a estrutura do template."),
        ...[
          "1. Introdução",
          "1.1 Objetivo",
          "1.2 Escopo",
          "1.3 Documentos de referência",
          "1.4 Definições e siglas",
          "2. Itens a serem testados",
          "3. Itens fora do escopo",
          "4. Estratégia de testes",
          "4.1 Níveis de teste",
          "4.2 Tipos de teste",
          "4.3 Técnicas de projeto de casos de teste",
          "5. Ambiente de testes",
          "6. Critérios",
          "7. Casos de teste",
          "7.1 Resumo dos casos de teste",
          "7.2 Especificação dos casos de teste",
          "8. Matriz de rastreabilidade",
          "9. Cronograma e responsabilidades",
          "10. Riscos e contingências",
          "11. Gestão de defeitos",
          "11.1 Classificação de severidade",
          "11.2 Registro de defeitos",
          "12. Entregáveis",
        ].map((t) => p(t, { align: AlignmentType.LEFT, after: 40 })),
        h1("1. Introdução"),
        h2("1.1 Objetivo"),
        p("Este documento define o planejamento dos testes do incremento de cadastro de clientes e gestão de vendas eletrônicas do e-commerce 3D Store, desenvolvido no Laboratório de Engenharia de Software. O plano estabelece o que será verificado, as técnicas e ferramentas, os responsáveis e os critérios que determinam se o incremento está apto a ser apresentado ao professor. A execução completa e a implementação residual de scripts não fazem parte desta entrega."),
        h2("1.2 Escopo"),
        p("Estão cobertos os requisitos RF0021 a RF0028 e RF0031 a RF0038, as regras RN0021 a RN0027 e RN0031 / RN0033 a RN0036, e os RNF0011, RNF0012 e RNF0031 a RNF0035 do DRS_LES_2_2026 versão 0.7. Os identificadores são os do DRS original (e-commerce de livros); no protótipo os livros foram adaptados a peças impressas em 3D, sem criação de novos IDs. Os testes abrangem os níveis unitário/integração (regras isoladas e API), sistema (Cypress) e aceitação (demonstração)."),
        h2("1.3 Documentos de referência"),
        table(
          ["Documento", "Versão", "Observação"],
          [
            ["DRS_LES_2_2026 — Documento de Requisitos de Software", "0.7", "Fonte exclusiva dos RF, RN e RNF rastreados"],
            ["CDU003 — Gerenciar Vendas Eletrônicas", "1.0", "Fluxos de carrinho, checkout, frete, cupons e finalização"],
            ["DVP — Documento de Visão do Projeto (3D Store)", "vigente", "Contexto do ateliê de impressão 3D"],
            ["Template_Plano_de_Testes.docx", "atividade LES", "Estrutura obrigatória deste plano"],
          ],
          [4200, 1400, 4480]
        ),
        h2("1.4 Definições e siglas"),
        table(
          ["Termo", "Definição"],
          [
            ["RF / RN / RNF", "Requisito Funcional / Regra de Negócio / Requisito Não Funcional, conforme o DRS_LES_2_2026"],
            ["CT", "Caso de Teste"],
            ["E2E", "End to End: teste que percorre o fluxo completo pela interface do usuário"],
            ["EM PROCESSAMENTO", "Status inicial da compra após a finalização, conforme RF0038"],
            ["Cupom de troca / promocional", "Instrumentos de pagamento descritos em RF0036, RF0037 e RN0033 a RN0036"],
            ["3D Store", "Nome do protótipo; o DRS trata de livros, adaptados aqui a produtos 3D sem novos requisitos"],
          ],
          [2800, 7280]
        ),
        h1("2. Itens a serem testados"),
        p("As funcionalidades abaixo correspondem a grupos do DRS já implementados no protótipo. Nenhum identificador foi inventado."),
        table(
          ["Funcionalidade", "Requisitos (DRS)", "Caso de uso", "Prioridade"],
          [
            ["Cadastro de clientes", "RF0021, RN0021, RN0022, RN0023, RN0026, RN0027, RNF0031, RNF0032, RNF0033, RNF0035", "Cadastro de clientes", "Alta"],
            ["Consulta, alteração e inativação", "RF0022, RF0023, RF0024, RF0025, RN0027", "Manutenção e consulta de clientes", "Alta"],
            ["Endereços de entrega e cobrança", "RF0026, RN0021, RN0022, RN0023, RNF0034", "Cadastro de endereços", "Alta"],
            ["Cartões de crédito", "RF0027, RN0024, RN0025", "Cadastro de cartões", "Alta"],
            ["Alteração isolada de senha", "RF0028, RNF0031, RNF0032", "Alterar senha", "Alta"],
            ["Carrinho de compra", "RF0031, RF0032, RN0031", "CDU003 — Carrinho", "Alta"],
            ["Checkout, frete, pagamento e cupons", "RF0033, RF0034, RF0035, RF0036, RF0037, RF0038, RN0033, RN0034, RN0035, RN0036", "CDU003 — Compra", "Alta"],
            ["Requisitos transversais", "RNF0011, RNF0012", "Consultas e logs de escrita", "Alta"],
          ],
          [2200, 4200, 2280, 1400]
        ),
        spacer(160),
        p("Requisitos do DRS_LES_2_2026 considerados neste plano (descrição resumida a partir do documento oficial):"),
        table(["ID", "Descrição"], reqs, [1400, 8680]),
        h1("3. Itens fora do escopo"),
        p("Os itens seguintes existem no DRS, mas não fazem parte deste ciclo de testes. Motivos: não implementados neste incremento, ou explicitamente excluídos da atividade."),
        table(
          ["Item", "Motivo da exclusão"],
          [
            ["RF0011 a RF0016, RN0011 a RN0017, RNF0021 — cadastro, inativação e código único de livro/produto", "Fora do incremento de clientes e vendas; RF0015 ainda está em andamento no quadro do projeto."],
            ["RF0039, RF0040, RN0038, RN0039, RN0040 — despacho, entrega e status APROVADA/REPROVADA/EM TRANSPORTE/ENTREGUE", "Transições de status do pedido após EM PROCESSAMENTO; exemplo de exclusão da própria atividade."],
            ["RF0041 a RF0045, RN0041 a RN0043, RN0046 — troca, autorização, recebimento e cupom de troca pós-recebimento", "Fluxos de troca e devolução fora deste ciclo."],
            ["RF0051, RF0053, RF0054, RN0028, RN0050, RN0051, RN0061, RN0062, RNF0064 — entrada, baixa e reentrada de estoque", "Controle de estoque além da validação de quantidade no carrinho (RN0031)."],
            ["RF0052, RN0013, RN0014 — precificação por grupo de margem", "Não pertence ao recorte de testes de clientes e checkout."],
            ["RF0055 a RF0058, RNF0043 a RNF0046, RN0071 a RN0074 — análise gerencial e exportação", "Gráfico analítico ainda em andamento; fora deste plano."],
            ["RN0032, RN0044, RN0045, RNF0042 — bloqueio temporário do carrinho, expiração e listagem de itens retirados por prazo", "Não implementados neste incremento."],
            ["RN0037 — validação da operadora de cartão e dos cupons após a finalização", "Integração com operadora não faz parte deste ciclo."],
            ["RNF0013 — script de tabelas de domínio; RNF0044 (IA generativa) — chatbot com modelo generativo", "Persistência atual em JSON; IA generativa não implementada. Há RNF0044 duplicado no DRS (ver R3)."],
          ],
          [4200, 5880]
        ),
        h1("4. Estratégia de testes"),
        h2("4.1 Níveis de teste"),
        table(
          ["Nível", "Objetivo", "Ferramenta", "Responsável"],
          [
            ["Unitário", "Verificar isoladamente validações de senha, CPF, conjunto de cupons (RN0033/RN0036) e mínimo por cartão (RN0034/RN0035)", "Funções em backend/src/data (execução prevista em script Node; Jest não é a stack atual)", "Breno Oliveira do Prado"],
            ["Integração", "Verificar API Express, persistência JSON, log de escrita (RNF0012) e hash de senha (RNF0033)", "HTTP contra /api e inspeção de store.json", "Breno Oliveira do Prado"],
            ["Sistema (E2E)", "Verificar os fluxos completos pela interface React", "Cypress 15", "Breno Oliveira do Prado"],
            ["Aceitação", "Demonstrar os fluxos ao professor na revisão do incremento", "Execução manual guiada por este plano", "Breno Oliveira do Prado"],
          ],
          [1600, 3800, 2680, 2000]
        ),
        h2("4.2 Tipos de teste"),
        bullet("Funcional: os casos CT001 a CT020 verificam o comportamento definido pelos RF e RN do escopo."),
        bullet("Regressão: a suíte Cypress em cypress/e2e deve ser reexecutada após cada alteração do incremento (npm run test:e2e)."),
        bullet("Não funcional: tempo de consulta (RNF0011, CT021), log de escrita (RNF0012, CT022) e persistência da senha (RNF0033, CT023)."),
        h2("4.3 Técnicas de projeto de casos de teste"),
        table(
          ["Técnica", "Onde foi aplicada"],
          [
            ["Partição de equivalência", "Senha (CT002, CT013), CPF (CT004), filtros da consulta (CT007), bandeira/preferencial (CT011), cupons (CT019, CT020)"],
            ["Análise de valor limite", "Quantidade = estoque e estoque+1 (CT014); parcela de cartão < R$ 10,00 e = divisão válida (CT018); restante R$ 7,90 (CT019); tempo < 1000 ms (CT021)"],
            ["Tabela de decisão", "Cobrança × entrega no cadastro (CT005); cupom presente × restante < 10 (CT019); subconjunto de cupons que já cobre o total (CT020); cartão preferencial único (CT011)"],
            ["Teste baseado em cenário", "Fluxo principal de compra até EM PROCESSAMENTO (CT015) e medição de consulta (CT021)"],
          ],
          [2800, 7280]
        ),
        h1("5. Ambiente de testes"),
        kvTable([
          ["Sistema operacional", "Windows 11 (ambiente local do grupo)"],
          ["Navegadores e versões", "Google Chrome na versão estável vigente; Cypress utiliza o Chrome/Electron do runner"],
          ["Banco de dados", "Não há SGBD neste incremento. Persistência em JSON em backend/data/store.json, recriada a cada cy.resetStore"],
          ["Ferramentas", "Cypress 15, Node.js 18+, Vite 7 (front em :5173), Express (API em :3001). Defeitos: GitHub Issues do repositório"],
          ["URL / servidor", "http://127.0.0.1:5173 (interface) com proxy /api para http://127.0.0.1:3001"],
          ["Massa de dados", "Seed do backend (Ana Souza / 123456, admin@3dstore.com / admin123, produtos gancho-trex, porta-alho, escorredor-elefante, cupons TROCA20, TROCA35, TROCA40). Restauração por cy.resetStore() antes de cada caso automatizado."],
        ]),
        h1("6. Critérios"),
        kvTable([
          ["Critérios de entrada", "Incremento de clientes e vendas implantado em localhost; massa seed carregada; este plano revisado; npm run dev em execução."],
          ["Critérios de saída", "100% dos casos de prioridade Alta projetados; todos os requisitos da seção 2 associados a pelo menos um CT; nenhum requisito do escopo sem justificativa na matriz. A aprovação formal da execução fica para o ciclo seguinte, pois a execução completa está fora desta atividade."],
          ["Critérios de suspensão", "API ou front indisponíveis, ou falha de autenticação que impeça mais de 50% dos casos E2E."],
          ["Critérios de retomada", "Serviços restabelecidos e massa restaurada; reteste do caso que evidenciou o bloqueio."],
        ]),
        h1("7. Casos de teste"),
        h2("7.1 Resumo dos casos de teste"),
        table(
          ["ID", "Título", "Requisitos", "Prioridade", "Automatizado"],
          cases.map((c) => [
            c.id,
            c.title,
            c.reqs,
            c.prio,
            c.auto.startsWith("Sim") ? "Sim" : "Não",
          ]),
          [1000, 2800, 3480, 1200, 1600]
        ),
        spacer(120),
        p("Vinte e dois dos vinte e três casos estão indicados para automação com Cypress. O CT023 é inspeção de persistência/API, não de interface."),
        h2("7.2 Especificação dos casos de teste"),
        p("Cada ficha cobre fluxo principal ou cenário de erro (dado inválido, obrigatório vazio ou violação de regra). Os caminhos Cypress citados já existem no repositório, salvo a extensão pontual do CT017."),
        ...cases.flatMap((c) => ctBlock(c)),
        h1("8. Matriz de rastreabilidade"),
        p("Todo requisito da seção 2 aparece abaixo com pelo menos um caso de teste."),
        table(["Requisito", "Descrição resumida", "Casos de teste", "Situação"], matrix, [1400, 3000, 4080, 1600]),
        h1("9. Cronograma e responsabilidades"),
        p("As estimativas usam PERT: E = (O + 4M + P) / 6, em horas. O total estimado é 21,9 h, de 19/10 a 26/10/2026. A execução completa permanece planejada, embora não seja entregável desta atividade."),
        table(
          ["Atividade", "Responsável", "O", "M", "P", "E (h)", "Prazo"],
          [
            ["Projeto dos casos de teste", "Breno Oliveira do Prado", "3", "5", "8", "5,2", "19/10"],
            ["Preparação do ambiente e da massa de dados", "Breno Oliveira do Prado", "1", "2", "3", "2,0", "20/10"],
            ["Implementação dos testes automatizados (indicação Cypress)", "Breno Oliveira do Prado", "4", "6", "10", "6,3", "22/10"],
            ["Execução e registro de resultados (ciclo seguinte)", "Breno Oliveira do Prado", "3", "5", "8", "5,2", "24/10"],
            ["Reteste e regressão (ciclo seguinte)", "Breno Oliveira do Prado", "2", "3", "5", "3,2", "26/10"],
          ],
          [2800, 2200, 800, 800, 800, 1000, 1680]
        ),
        h1("10. Riscos e contingências"),
        p("Ambiguidades e inconsistências do DRS foram registradas para comunicação ao professor, sem criação de requisitos."),
        table(
          ["ID", "Risco", "Probabilidade", "Impacto", "Ação de contingência"],
          [
            ["R1", "O DRS descreve livros; o protótipo vende peças 3D. Não há RF novo: a adaptação reusa os IDs oficiais.", "Alta", "Médio", "Manter rastreabilidade estrita aos IDs do DRS e declarar a adaptação neste plano."],
            ["R2", "RN0026 exige \"endereço residencial\", enquanto RN0021 e RN0022 exigem cobrança e entrega.", "Alta", "Médio", "Ambiguidade comunicada ao professor. Os testes exigem cobrança e entrega (CT001, CT005), que atendem o conjunto mais restritivo."],
            ["R3", "Há dois itens RNF0044 no DRS (formatação monetária do gráfico e IA generativa).", "Alta", "Baixo", "Inconsistência comunicada ao professor. Ambos estão fora do escopo deste ciclo."],
            ["R4", "RN0074 usa EM TRÂNSITO/TRANSPORTE; RF0039 e RN0039 usam EM TRANSPORTE.", "Média", "Médio", "Fora deste ciclo (status após EM PROCESSAMENTO). Comunicado ao professor; este plano testa apenas EM PROCESSAMENTO (RF0038)."],
            ["R5", "RNF0033 pede senha \"criptografada\" sem algoritmo. O protótipo armazena um hash, não cifra reversível.", "Média", "Médio", "Comunicado ao professor. CT023 verifica ausência da senha em claro, sem inferir AES ou similar."],
            ["R6", "RN0036 exemplifica \"apenas dois cupons\" e também a diferença gerada; o critério de subconjunto já cobertor é o que o sistema aplica.", "Média", "Médio", "CT020 usa o exemplo TROCA40 + TROCA20 do próprio enunciado de RN0036."],
            ["R7", "Indisponibilidade do ambiente local no dia da demonstração.", "Baixa", "Alto", "Manter npm run dev documentado no README e massa seed reproduzível via cy.resetStore."],
          ],
          [800, 3600, 1400, 1200, 3080]
        ),
        h1("11. Gestão de defeitos"),
        h2("11.1 Classificação de severidade"),
        table(
          ["Severidade", "Critério"],
          [
            ["Crítica", "Impede o uso de uma funcionalidade essencial, sem alternativa de contorno (ex.: compra não finaliza)."],
            ["Alta", "Funcionalidade com resultado incorreto, com alternativa de contorno."],
            ["Média", "Falha em regra secundária ou mensagem incorreta."],
            ["Baixa", "Problema cosmético (layout, texto, alinhamento)."],
          ],
          [1800, 8280]
        ),
        h2("11.2 Registro de defeitos"),
        p("Os defeitos encontrados na execução futura serão registrados no GitHub Issues do repositório do grupo, com o rótulo \"defeito\", e referenciados na tabela abaixo. Esta entrega não inclui execução; portanto não há defeito aberto originado deste ciclo."),
        table(
          ["ID", "Caso de teste", "Descrição", "Severidade", "Situação"],
          [["—", "—", "Nenhum defeito registrado nesta entrega (execução fora do escopo).", "—", "Não se aplica"]],
          [1000, 1600, 4680, 1400, 1400]
        ),
        h1("12. Entregáveis"),
        bullet("Este Plano de Testes, versão 1.0, no arquivo PlanoTestes_Grupo.docx."),
        bullet("Indicação dos casos automatizados com Cypress (CT001 a CT022) e caminhos em cypress/e2e. A implementação residual e a execução completa não fazem parte desta atividade."),
        bullet("Evidências de execução (relatório Cypress, capturas ou vídeo) ficam para o ciclo de execução, fora desta entrega."),
        bullet("Registro de defeitos no GitHub Issues, quando a execução ocorrer."),
        spacer(200),
      ],
    },
  ],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(OUT_DOCS, buf);
fs.copyFileSync(OUT_DOCS, OUT_DL);
console.log(OUT_DOCS, buf.length);
console.log(OUT_DL);
console.log("casos", cases.length, "requisitos", reqs.length, "matriz", matrix.length);
