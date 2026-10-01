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

const ROOT = path.resolve("docs/_uc_work");
const SCREEN = path.join(ROOT, "screens");
const OUT_DOCS = path.resolve("docs/CDU003_Gestao_de_Vendas_Breno_Oliveira_do_Prado.docx");
const OUT_DL = "C:\\Users\\breno\\Downloads\\CDU003_Gestao_de_Vendas_Breno_Oliveira_do_Prado.docx";

const NAVY = "1B365D";
const GOLD = "C4A574";
const ROW = "F4F1EA";
const WHITE = "FFFFFF";
const BLACK = "222222";
const MUTED = "555555";

const thin = { style: BorderStyle.SINGLE, size: 4, color: "B8B8B8" };
const borders = { top: thin, bottom: thin, left: thin, right: thin };
const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function cell(text, opts = {}) {
  const {
    bold = false,
    fill = WHITE,
    width = 2340,
    align = AlignmentType.LEFT,
    color = BLACK,
    header = false,
  } = opts;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    shading: { type: ShadingType.CLEAR, fill: header ? NAVY : fill },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text: String(text),
            bold: bold || header,
            font: "Calibri",
            size: header ? 18 : 20,
            color: header ? WHITE : color,
          }),
        ],
      }),
    ],
  });
}

function table(headers, rows, widths) {
  const w = widths ?? headers.map(() => Math.floor(9360 / headers.length));
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: w,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => cell(h, { header: true, width: w[i] })),
      }),
      ...rows.map((r, ri) =>
        new TableRow({
          children: r.map((c, i) =>
            cell(c, { fill: ri % 2 ? ROW : WHITE, width: w[i], bold: i === 0 && headers[0] === "ID" })
          ),
        })
      ),
    ],
  });
}

function p(text, extra = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    alignment: extra.align ?? AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: extra.size ?? 22,
        bold: extra.bold,
        italics: extra.italics,
        color: extra.color ?? BLACK,
      }),
    ],
  });
}

function rich(runs, extra = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    alignment: extra.align ?? AlignmentType.JUSTIFIED,
    children: runs.map((r) =>
      new TextRun({
        text: r.text,
        font: "Calibri",
        size: r.size ?? 22,
        bold: r.bold,
        italics: r.italics,
        color: r.color ?? BLACK,
      })
    ),
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 4 } },
    children: [new TextRun({ text, font: "Calibri", size: 28, bold: true, color: NAVY })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: "Calibri", size: 24, bold: true, color: NAVY })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: "Calibri", size: 22, bold: true, color: "3D5A80" })],
  });
}

function step(code, text) {
  return rich(
    [
      { text: `${code}. `, bold: true, color: NAVY },
      { text },
    ],
    { align: AlignmentType.JUSTIFIED }
  );
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Calibri", size: 22 })],
  });
}

function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { data: buf, width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function figure(file, caption, maxW = 540) {
  const abs = path.join(SCREEN, file);
  const { data, width, height } = pngSize(abs);
  const w = Math.min(maxW, width);
  const h = Math.round((height * w) / width);
  return [
    new Paragraph({
      spacing: { before: 120, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({ type: "png", data, transformation: { width: w, height: h } }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: caption, font: "Calibri", size: 18, italics: true, color: MUTED }),
      ],
    }),
  ];
}

function captionBox(title, body) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorder,
            shading: { type: ShadingType.CLEAR, fill: "EEF2F7" },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: title, bold: true, font: "Calibri", size: 22, color: NAVY })],
              }),
              new Paragraph({
                children: [new TextRun({ text: body, font: "Calibri", size: 20, color: MUTED })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

const doc = new Document({
  creator: "Breno Oliveira do Prado",
  title: "CDU003 — Gerenciar Vendas Eletrônicas",
  description: "Especificação de caso de uso conforme template UC_FATEC e DRS_LES_2_2026",
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
    default: { document: { run: { font: "Calibri", size: 22 } } },
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 864, right: 864 } },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 6 } },
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: "FATEC  ·  LES 2º semestre de 2026  ·  E-commerce de Livros",
                  font: "Calibri",
                  size: 18,
                  color: NAVY,
                  bold: true,
                }),
                new TextRun({
                  text: "                                                                 Breno Oliveira do Prado",
                  font: "Calibri",
                  size: 18,
                  color: MUTED,
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
              border: { top: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 6 } },
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "CDU003 — Gerenciar Vendas Eletrônicas  ·  Página ", font: "Calibri", size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: MUTED }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "FACULDADE DE TECNOLOGIA", font: "Calibri", size: 20, color: NAVY, bold: true })],
        }),
        new Paragraph({
          spacing: { after: 280 },
          children: [new TextRun({ text: "Análise e Desenvolvimento de Sistemas  ·  Laboratório de Engenharia de Software", font: "Calibri", size: 18, color: MUTED })],
        }),
        new Paragraph({
          spacing: { before: 400, after: 80 },
          children: [new TextRun({ text: "ESPECIFICAÇÃO DE CASO DE USO", font: "Calibri", size: 36, bold: true, color: NAVY })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 8 } },
          children: [new TextRun({ text: "UC_FATEC", font: "Calibri", size: 20, color: GOLD, bold: true })],
        }),
        new Paragraph({
          spacing: { before: 280, after: 80 },
          children: [new TextRun({ text: "CDU003 — Gerenciar Vendas Eletrônicas", font: "Calibri", size: 32, bold: true, color: NAVY })],
        }),
        p("Documento de Requisitos de Software DRS_LES_2_2026 — E-commerce de Livros. A especificação limita-se ao que está previsto no DRS: identificadores, estados, regras e comportamentos não encontrados nesse documento não foram incorporados ao fluxo."),
        new Paragraph({ spacing: { before: 280 }, children: [new TextRun({ text: "Aluno", font: "Calibri", size: 18, color: MUTED })] }),
        new Paragraph({ children: [new TextRun({ text: "Breno Oliveira do Prado", font: "Calibri", size: 26, bold: true, color: NAVY })] }),
        new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: "Data", font: "Calibri", size: 18, color: MUTED })] }),
        new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: "29 de setembro de 2026", font: "Calibri", size: 22 })] }),

        h1("Histórico de Versões"),
        table(
          ["Data", "Versão", "Descrição", "Autor", "Revisores"],
          [["29/09/2026", "1.0", "Especificação inicial do caso de uso de gestão de vendas, elaborada a partir do DRS_LES_2_2026 e do template UC_FATEC.", "Breno Oliveira do Prado", "—"]],
          [1400, 900, 3600, 2100, 1360]
        ),

        h1("Página de Assinaturas"),
        p("Revisado e aprovado por:"),
        table(
          ["Papel", "Nome", "Assinatura", "Data"],
          [
            ["Autor", "Breno Oliveira do Prado", "", "29/09/2026"],
            ["Revisor", "", "", ""],
            ["Aprovador", "", "", ""],
          ],
          [2000, 2800, 2800, 1760]
        ),

        h1("1. Nome do Caso de Uso"),
        p("CDU003 — Gerenciar Vendas Eletrônicas"),

        h1("2. Objetivo"),
        p("Este caso de uso tem como objetivo prover o ciclo completo de venda eletrônica de livros, desde o gerenciamento do carrinho de compra (quantidades, validação e bloqueio temporário de estoque, e remoção por expiração do prazo) até a finalização da compra (endereço, frete e pagamento com cartões, cupom de troca e cupom promocional), a validação da forma de pagamento com aprovação ou reprovação e efeito sobre o estoque, o despacho e a confirmação da entrega, e o processo de troca até a autorização, o recebimento dos itens, a reentrada em estoque e a emissão do cupom de troca."),

        h1("3. Descrição"),
        p("No e-commerce de livros, o cliente autenticado seleciona obras disponíveis, define quantidades e as deposita em um repositório temporário (carrinho). Cada inclusão provoca bloqueio temporário da quantidade correspondente no estoque, para que outra compra simultânea não comprometa a disponibilidade. O prazo do bloqueio é parametrizado e relativo ao último item incluído; próximo do vencimento o cliente é avisado e, se expirar, os itens são removidos, desbloqueados e listados no carrinho como retirados, com a opção de comprar desabilitada até nova inclusão."),
        p("A partir do carrinho, o cliente realiza a compra escolhendo endereço de entrega já cadastrado ou informando um novo (com opção de incorporá-lo ao perfil), obtendo o cálculo do frete sobre os itens e o endereço, e compondo o pagamento com cartões de crédito (inclusive mais de um), cupons de troca e no máximo um cupom promocional. A finalização persiste a compra com status EM PROCESSAMENTO. Em seguida o sistema valida cupons e o aceite da operadora: em sucesso a compra passa a APROVADA e há baixa de estoque; em falha, REPROVADA, com desbloqueio dos itens."),
        p("O administrador seleciona vendas já aprovadas para entrega (EM TRANSPORTE) e confirma a entrega (ENTREGUE). O cliente, somente sobre item de compra ENTREGUE, solicita troca, gerando pedido com status EM TROCA. O administrador visualiza essas solicitações, autoriza (TROCA AUTORIZADA, com notificação ao cliente), confirma o recebimento dos itens (TROCADO), indica se há reentrada em estoque e o sistema gera cupom de troca para uso em compras futuras."),

        h1("4. Requisitos Funcionais"),
        p("Requisitos do DRS realizados neste caso de uso, incluindo os do grupo Gerenciar Vendas Eletrônicas e os de outros grupos que participam diretamente do processo (rastreabilidade)."),
        table(
          ["ID", "Nome", "Grupo no DRS"],
          [
            ["RF0015", "Consulta de livros", "Cadastro de Livros"],
            ["RF0025", "Consulta de transações", "Cadastro de Clientes"],
            ["RF0026", "Cadastro de endereços de entrega", "Cadastro de Clientes"],
            ["RF0027", "Cadastro de cartões de crédito", "Cadastro de Clientes"],
            ["RF0031", "Gerenciar carrinho de compra", "Gerenciar Vendas Eletrônicas"],
            ["RF0032", "Definir quantidade de itens no para o carrinho", "Gerenciar Vendas Eletrônicas"],
            ["RF0033", "Realizar compra", "Gerenciar Vendas Eletrônicas"],
            ["RF0034", "Calcular frete", "Gerenciar Vendas Eletrônicas"],
            ["RF0035", "Selecionar endereço de entrega", "Gerenciar Vendas Eletrônicas"],
            ["RF0036", "Selecionar forma de pagamento", "Gerenciar Vendas Eletrônicas"],
            ["RF0037", "Uso de cupom para pagamento", "Gerenciar Vendas Eletrônicas"],
            ["RF0038", "Finalizar Compra", "Gerenciar Vendas Eletrônicas"],
            ["RF0039", "Despachar produtos para entrega", "Gerenciar Vendas Eletrônicas"],
            ["RF0040", "Produtos entregues", "Gerenciar Vendas Eletrônicas"],
            ["RF0041", "Solicitar troca", "Gerenciar Vendas Eletrônicas"],
            ["RF0042", "Autorizar trocas", "Gerenciar Vendas Eletrônicas"],
            ["RF0043", "Visualização de trocas", "Gerenciar Vendas Eletrônicas"],
            ["RF0044", "Confirmar recebimento de itens para troca", "Gerenciar Vendas Eletrônicas"],
            ["RF0045", "Gerar cupom de troca após recebimento de itens", "Gerenciar Vendas Eletrônicas"],
            ["RF0052", "Calcular valor de venda", "Controle de estoque"],
            ["RF0053", "Dar baixa em estoque", "Controle de estoque"],
            ["RF0054", "Realizar reentrada em estoque", "Controle de estoque"],
          ],
          [1400, 4560, 3400]
        ),
        p("Regras de negócio aplicadas nos fluxos (citadas nos passos pelo identificador): RN0023, RN0024, RN0025, RN0028, RN0031, RN0032, RN0033, RN0034, RN0035, RN0036, RN0037, RN0038, RN0039, RN0040, RN0041, RN0042, RN0043, RN0044, RN0045 e RN0046."),

        h1("5. Tipo de Caso de Uso"),
        p("Concreto (iniciado diretamente por um ator). O Cliente inicia o ciclo pela inclusão de itens no carrinho e pela finalização da compra; o Administrador inicia os trechos de despacho, confirmação de entrega, autorização e recebimento de troca."),

        h1("6. Atores"),
        table(
          ["Ator", "Tipo", "Participação"],
          [
            ["Cliente", "Primário", "Inclui e altera o carrinho, realiza e finaliza a compra, consulta transações e solicita troca."],
            ["Administrador", "Primário", "Despacha vendas aprovadas, confirma entrega, visualiza e autoriza trocas, confirma recebimento dos itens e indica reentrada em estoque."],
          ],
          [1800, 1400, 6160]
        ),
        p("O DRS menciona a operadora de cartão de crédito em RN0037 e RN0028 como entidade externa de aceite da compra. Não a classifica como ator do sistema; a interação é tratada no passo P8 e no fluxo de exceção E5."),

        h1("7. Permissão de Usuário"),
        bullet("Cliente com cadastro ativo: permissão para gerenciar carrinho, realizar compra, consultar as próprias transações e solicitar troca de item ENTREGUE."),
        bullet("Cliente inativado (RF0023): não inicia nova compra; o DRS não detalha o efeito sobre carrinho já montado (ver Observações)."),
        bullet("Administrador: permissão para despachar compras APROVADA, confirmar ENTREGUE, visualizar EM TROCA, autorizar TROCA AUTORIZADA e confirmar recebimento com efeito TROCADO."),

        h1("8. Pré-condições"),
        bullet("O ator está autenticado no sistema com o perfil correspondente à operação (Cliente ou Administrador)."),
        bullet("Existem livros cadastrados e consultáveis (RF0015), com valor de venda calculado (RF0052) e quantidade em estoque suficiente para a operação pretendida."),
        bullet("Para finalizar a compra, o cliente possui ou informará ao menos um endereço de entrega (RN0022, RF0026) e, se o saldo não for coberto só por cupons, ao menos um cartão de crédito (RF0027, RN0024, RN0025)."),
        bullet("Bandeiras de cartão, prazos de bloqueio do carrinho e demais parâmetros citados no DRS estão disponíveis como configuração do sistema. Os valores numéricos desses prazos não estão definidos no DRS (ver Observações)."),
        bullet("Tabelas de domínio necessárias à venda (por exemplo, bandeiras) encontram-se implantadas (RNF0013)."),

        h1("9. Fluxo Principal"),
        p("Os desvios para fluxos alternativos (A) e de exceção (E) são indicados pelo código entre parênteses. As regras de negócio aplicáveis são citadas no passo em que ocorrem. A atribuição de cada status do DRS está marcada no passo correspondente e consolidada na tabela da seção 9.1."),

        h2("P1. Disponibilizar sessão de compra"),
        step("P1.1", "O Cliente autentica-se. O sistema verifica cadastro existente e situação ativa."),
        step("P1.2", "Caso não haja sessão válida ou o cadastro esteja inativo, o sistema impede a inclusão no carrinho (E1)."),
        step("P1.3", "O sistema apresenta a consulta de livros (RF0015) e habilita a montagem do carrinho (RF0031)."),

        h2("P2. Adicionar item ao carrinho"),
        step("P2.1", "O Cliente seleciona um livro e informa a quantidade desejada (RF0032)."),
        step("P2.2", "O sistema valida a disponibilidade em estoque e a quantidade informada (RN0031). Se o item não estiver disponível ou a quantidade superar o estoque, segue E2."),
        step("P2.3", "O sistema bloqueia temporariamente no estoque a quantidade adicionada, para que novas compras não a solicitem (RN0044). O prazo parametrizado é relativo ao momento do bloqueio do último item incluído no carrinho (RN0044)."),
        step("P2.4", "O sistema inclui o item no carrinho (RF0031) e exibe os itens (RF0031). Cinco minutos antes de o bloqueio expirar, o sistema notifica o Cliente (RN0044) (A1)."),
        step("P2.5", "Se o estoque tiver sido alterado entre inclusões anteriores e este momento, o sistema aplica RN0032 (E3)."),

        h2("P3. Gerenciar itens do carrinho"),
        step("P3.1", "O sistema exibe título, quantidade, valor de venda (RF0052) e subtotal dos itens ativos, e, quando couber, os produtos removidos por atingirem o prazo de finalização, com o tempo conforme parâmetro do sistema (RNF0042)."),
        step("P3.2", "Se houver itens removidos por expiração, o sistema desabilita a opção de comprar até que os itens sejam novamente adicionados (RNF0042) (E4)."),
        step("P3.3", "O Cliente altera a quantidade de um item já presente (RF0032). O sistema repete P2.2 e ajusta o bloqueio (RN0031, RN0044)."),
        step("P3.4", "O Cliente exclui um item. O sistema retira o item do carrinho (RF0031) e desbloqueia a quantidade correspondente."),
        step("P3.5", "Se o prazo de bloqueio expirar, o sistema remove os itens, desbloqueia-os para outros clientes (RN0044) e retira do carrinho todos os itens do mesmo produto que gerou o prazo (RN0045), registrando-os como retirados (RNF0042) (E4)."),
        step("P3.6", "O Cliente solicita realizar a compra a partir do carrinho (RF0033). Se o carrinho não possuir itens ativos, segue E4."),

        h2("P4. Selecionar endereço de entrega"),
        step("P4.1", "O sistema apresenta os endereços de entrega previamente associados ao cliente, identificados por nome de frase curta (RF0026, RF0035)."),
        step("P4.2", "O Cliente seleciona um endereço cadastrado. Caso deseje informar um novo, segue A2 (RF0035)."),
        step("P4.3", "O sistema associa o endereço escolhido à compra. A composição do endereço observa RN0023."),

        h2("P5. Calcular frete"),
        step("P5.1", "O sistema calcula o frete com base nos itens selecionados e no endereço apontado pelo cliente (RF0034)."),
        step("P5.2", "O sistema apresenta o valor do frete e o total da compra."),

        h2("P6. Selecionar forma de pagamento"),
        step("P6.1", "O sistema apresenta os cartões de crédito do perfil, inclusive o preferencial (RF0027, RF0036)."),
        step("P6.2", "O Cliente seleciona um ou mais cartões e/ou informa cupom de troca e/ou cupom promocional válido (RF0036, RF0037). Novo cartão segue A3."),
        step("P6.3", "O sistema admite no máximo um cupom promocional por compra (RN0033)."),
        step("P6.4", "Se houver mais de um cartão, o valor mínimo em cada cartão é R$ 10,00 (RN0034), salvo o caso de cupons em conjunto, em que se considera o valor máximo dos cupons e admite-se valor inferior a R$ 10,00 no cartão (RN0035)."),
        step("P6.5", "O sistema não permite combinação de cupons que supere a compra desnecessariamente; se o valor dos cupons admitidos superar o total, gera cupom de troca com a diferença (RN0036). Combinação inválida segue E6."),

        h2("P7. Finalizar a compra"),
        step("P7.1", "O Cliente confirma a finalização após a seleção da forma de pagamento e do endereço (RF0038)."),
        step("P7.2", "O sistema persiste a compra e atribui o status EM PROCESSAMENTO (RF0038). Evento: confirmação da finalização. Ator que provoca: Cliente. Quem atribui o status: o sistema."),
        step("P7.3", "O sistema registra data, hora, usuário responsável e dados gravados (RNF0012)."),

        h2("P8. Validar pagamento e atualizar estoque"),
        step("P8.1", "Após a finalização, o sistema valida validade e veracidade dos cupons utilizados e o aceite da operadora de cartão de crédito (RN0037)."),
        step("P8.2", "Se as formas de pagamento forem validadas com sucesso, o sistema altera o status para APROVADA (RN0038). Evento: validação bem-sucedida. Ator: sistema."),
        step("P8.3", "Com a compra deixando de estar EM PROCESSAMENTO e tendo sido efetivada, o sistema dá baixa no estoque do total de itens vendidos (RF0053, RN0028)."),
        step("P8.4", "Se a validação falhar, segue E5 (status REPROVADA)."),

        h2("P9. Despachar produtos para entrega"),
        step("P9.1", "O Administrador consulta vendas com status APROVADA (RF0039)."),
        step("P9.2", "O Administrador seleciona a venda para ser entregue. O sistema altera o status para EM TRANSPORTE (RF0039, RN0039). Evento: seleção para entrega. Ator: Administrador."),

        h2("P10. Confirmar entrega"),
        step("P10.1", "O Administrador confirma a entrega da compra (RF0040)."),
        step("P10.2", "O sistema altera o status para ENTREGUE (RF0040, RN0040). Evento: confirmação de entrega. Ator: Administrador."),

        h2("P11. Solicitar troca"),
        step("P11.1", "O Cliente consulta as transações já realizadas em seu cadastro (RF0025) e visualiza a compra."),
        step("P11.2", "O Cliente seleciona um item para troca (RF0041). Somente itens de pedidos com status ENTREGUE podem receber solicitação (RN0043); caso contrário, E7."),
        step("P11.3", "O sistema gera pedido de troca com status EM TROCA (RN0041, RF0041). Se o cliente solicitar a troca de toda a compra, o status do pedido passa a EM TROCA (RN0041). Evento: solicitação de troca. Ator: Cliente."),

        h2("P12. Visualizar e autorizar a troca"),
        step("P12.1", "O Administrador visualiza os pedidos de troca ou compras com status EM TROCA (RF0043)."),
        step("P12.2", "O Administrador autoriza a troca. O sistema altera o status para TROCA AUTORIZADA (RF0042). Evento: autorização. Ator: Administrador."),
        step("P12.3", "O sistema gera notificação ao Cliente sobre a autorização (RN0046)."),

        h2("P13. Receber itens, reentrar estoque e emitir cupom"),
        step("P13.1", "O Administrador confirma o recebimento dos itens da troca (RF0044). O DRS descreve essa confirmação sobre pedido de troca ou compra com status EM TROCA (ver Observações quanto a TROCA AUTORIZADA)."),
        step("P13.2", "Nesta confirmação o Administrador informa se os itens devem retornar ao estoque. Em caso positivo, o sistema dá entrada no estoque dos respectivos itens (RF0044, RF0054)."),
        step("P13.3", "O sistema altera o status do pedido ou da compra para TROCADO (RN0042). Evento: confirmação de recebimento. Ator: Administrador."),
        step("P13.4", "Quando o Administrador informa que os itens a serem trocados chegaram, o sistema gera cupom de troca e o disponibiliza ao Cliente para futuras compras (RF0045)."),
        step("P13.5", "O caso de uso encerra com a compra no último status atribuído e o carrinho esvaziado daquela operação de venda, quando a finalização em P7 tiver ocorrido."),

        h2("9.1 Controle de estados"),
        p("Estados definidos no DRS para este caso de uso. Não foram incluídos estados ausentes do DRS."),
        table(
          ["Estado", "Passo em que é atribuído", "Evento que provoca a transição", "Ator que executa"],
          [
            ["EM PROCESSAMENTO", "P7.2", "Finalização da compra após endereço e pagamento (RF0038)", "Cliente provoca; o sistema atribui o status"],
            ["APROVADA", "P8.2", "Validação bem-sucedida de cupons e aceite da operadora (RN0037, RN0038)", "Sistema"],
            ["REPROVADA", "E5", "Falha na validação da forma de pagamento (RN0038)", "Sistema"],
            ["EM TRANSPORTE", "P9.2", "Administrador seleciona venda já aprovada para entrega (RF0039, RN0039)", "Administrador"],
            ["ENTREGUE", "P10.2", "Administrador confirma a entrega (RF0040, RN0040)", "Administrador"],
            ["EM TROCA", "P11.3", "Cliente solicita troca de item ou de toda a compra ENTREGUE (RF0041, RN0041, RN0043)", "Cliente"],
            ["TROCA AUTORIZADA", "P12.2", "Administrador autoriza compra/pedido EM TROCA (RF0042)", "Administrador"],
            ["TROCADO", "P13.3", "Administrador confirma o recebimento dos itens da troca (RN0042, RF0044)", "Administrador"],
          ],
          [1800, 2300, 3100, 2160]
        ),

        h1("10. Fluxos Alternativos"),

        h2("A1. Notificação de expiração iminente do bloqueio"),
        p("Origem: P2.4 e P3, quando faltam 5 minutos para o fim do prazo parametrizado do bloqueio (RN0044)."),
        step("A1.1", "O sistema notifica o Cliente de que o bloqueio dos itens do carrinho expirará em 5 minutos (RN0044)."),
        step("A1.2", "O Cliente pode finalizar a compra (retorna a P3.6) ou permanecer no carrinho. Se o prazo se esgotar sem finalização, segue E4."),
        p("Retorno: P3 (carrinho) ou P3.6 (realizar compra)."),

        h2("A2. Cadastrar novo endereço de entrega na compra"),
        p("Origem: P4.2, quando o Cliente não seleciona endereço prévio e informa um novo (RF0035)."),
        step("A2.1", "O sistema apresenta os campos obrigatórios de endereço (RN0023) e o nome identificador em frase curta (RF0026)."),
        step("A2.2", "O Cliente preenche o endereço. O sistema oferece a possibilidade de incorporá-lo ao perfil (RF0035)."),
        step("A2.3", "Se a incorporação for aceita, o endereço passa a integrar o cadastro do cliente (RF0026). Este passo estende o CDU de manutenção de cliente no ponto P4."),
        p("Retorno: P4.3 e em seguida P5."),

        h2("A3. Cadastrar novo cartão de crédito na compra"),
        p("Origem: P6.2, quando o Cliente cadastra novo cartão (RF0036)."),
        step("A3.1", "O sistema solicita Nº do Cartão, Nome impresso, Bandeira e Código de Segurança (RN0024). A bandeira deve estar registrada no sistema (RN0025)."),
        step("A3.2", "O Cliente indica se o cartão deve ser incorporado ao perfil (RF0036) e, se for o caso, se será o preferencial (RF0027)."),
        p("Retorno: P6.4."),

        h2("A4. Alterar quantidade após mudança de estoque"),
        p("Origem: P2.5 / durante o carrinho, quando o estoque muda entre a adição e a finalização (RN0032)."),
        step("A4.1", "O sistema exibe notificação informando a mudança na disponibilidade (RN0032)."),
        step("A4.2", "O sistema atualiza automaticamente a quantidade disponível no carrinho (RN0032)."),
        step("A4.3", "Se o item ficar indisponível, o sistema o remove e emite alerta (RN0032)."),
        p("Retorno: P3.1, com o carrinho atualizado."),

        h2("A5. Pagamento apenas com cupons"),
        p("Origem: P6, quando cupons de troca e/ou o cupom promocional cobrem o total, observado RN0033 e RN0036."),
        step("A5.1", "O sistema aplica o valor máximo dos cupons (RN0035) e não exige cartão se não houver saldo."),
        step("A5.2", "Se os cupons admitidos superarem o total nos termos de RN0036, o sistema gera cupom de troca com a diferença."),
        p("Retorno: P7."),

        h2("A6. Troca de toda a compra"),
        p("Origem: P11.3, quando o Cliente solicita a troca de toda a compra (RN0041)."),
        step("A6.1", "O sistema atribui à compra o status EM TROCA (RN0041), e não apenas a um item."),
        p("Retorno: P12."),

        h2("A7. Itens da troca sem reentrada em estoque"),
        p("Origem: P13.2, quando o Administrador informa que os itens não devem retornar ao estoque (RF0044)."),
        step("A7.1", "O sistema não executa RF0054 para esses itens."),
        step("A7.2", "O fluxo de status TROCADO (P13.3) e de geração de cupom (P13.4) permanece, pois o DRS condiciona o cupom à informação de que os itens chegaram (RF0045), não à reentrada."),
        p("Retorno: P13.3."),

        h1("11. Fluxos de Exceção"),

        h2("E1. Cliente não autenticado ou inativo"),
        p("Origem: P1.2."),
        step("E1.1", "O sistema impede adicionar itens ao carrinho e convida à autenticação ou informa cadastro inativo (RF0023), conforme o caso."),
        p("Retorno: encerramento da tentativa de venda ou P1.1 após autenticação com cadastro ativo."),

        h2("E2. Estoque insuficiente na adição ao carrinho"),
        p("Origem: P2.2 (RN0031)."),
        step("E2.1", "O sistema recusa a inclusão e informa que o item não está disponível ou que a quantidade excede o estoque (RN0031)."),
        p("Retorno: P2.1, com a quantidade anterior inalterada no carrinho."),

        h2("E3. Estoque alterado antes da finalização"),
        p("Origem: P2.5 e P3.6 (RN0032)."),
        step("E3.1", "O sistema notifica a mudança, atualiza a quantidade no carrinho e remove itens que tenham ficado indisponíveis, com mensagem de alerta (RN0032)."),
        p("Retorno: P3. Se não restar item ativo, E4."),

        h2("E4. Expiração do bloqueio ou carrinho sem itens ativos"),
        p("Origem: P3.2, P3.5 ou P3.6 (RN0044, RN0045, RNF0042)."),
        step("E4.1", "O sistema desbloqueia os itens para outros clientes (RN0044) e retira do carrinho todos os itens do mesmo produto que gerou o prazo (RN0045)."),
        step("E4.2", "O sistema apresenta na listagem os produtos removidos por atingirem o prazo, com o tempo conforme parâmetro (RNF0042), e desabilita a opção comprar até nova adição (RNF0042)."),
        p("Retorno: P2, para nova inclusão, ou encerramento se o Cliente desistir."),

        h2("E5. Pagamento reprovado"),
        p("Origem: P8.4 (RN0037, RN0038, RN0028)."),
        step("E5.1", "O sistema atribui à compra o status REPROVADA (RN0038). Evento: falha de validação de cupom ou recusa da operadora. Ator: sistema."),
        step("E5.2", "O sistema não dá baixa em estoque. Os itens da compra não aprovada são desbloqueados e mantidos em estoque (RN0028)."),
        p("Retorno: o caso de uso termina para essa compra com status REPROVADA. O Cliente pode montar novo carrinho (P2), sujeito novamente a RN0031 e RN0044."),

        h2("E6. Forma de pagamento inconsistente com as regras"),
        p("Origem: P6.5 (RN0033, RN0034, RN0035, RN0036)."),
        step("E6.1", "O sistema recusa a combinação (segundo cupom promocional, cartão abaixo de R$ 10,00 fora da exceção de RN0035, ou conjunto de cupons que supera a compra de modo não admitido por RN0036) e exibe a recusa."),
        p("Retorno: P6.2."),

        h2("E7. Troca não permitida pelo status"),
        p("Origem: P11.2 (RN0043)."),
        step("E7.1", "O sistema recusa a solicitação porque o item não pertence a pedido com status ENTREGUE (RN0043)."),
        p("Retorno: P11.1."),

        h1("12. Protótipos de Tela"),
        p("Os fluxos acima são independentes de um catálogo específico. As figuras a seguir documentam o protótipo acadêmico utilizado pelo aluno para materializar a jornada (consulta, carrinho, checkout, consulta de compra e painel administrativo). A seção Observações registra que os rótulos de status visíveis no protótipo não substituem os oito estados do DRS desta especificação."),

        h2("12.1 Tela de detalhe do livro (P2)"),
        p("Através desta tela o Cliente consulta o livro (RF0015), informa a quantidade (RF0032) e solicita a inclusão no carrinho (RF0031), sujeita a RN0031 e RN0044."),
        ...figure("02-produto.png", "Figura 1 — Protótipo da tela de detalhe do item (correspondente a P2)."),
        table(
          ["Elemento", "Tipo", "Status", "Tamanho", "Comportamento"],
          [
            ["Título e valor de venda", "Texto", "Somente leitura", "Livre", "Exibe identificação e preço calculado (RF0052). Passo P2.1."],
            ["Quantidade (− / +)", "Controle numérico", "Habilitado", "Inteiro ≥ 1", "Define a quantidade a bloquear no estoque (RF0032, RN0031). Passo P2.1."],
            ["Adicionar ao carrinho", "Botão", "Habilitado se autenticado e estoque ok", "Ação primária", "Dispara P2.2–P2.4. Desabilitado na ausência de sessão (E1)."],
            ["Seleção de variação", "Botão de opção", "Habilitado", "Uma seleção", "Complementa a identificação do item no carrinho. Passo P2.1."],
          ],
          [2000, 1600, 2000, 1560, 2200]
        ),

        h2("12.2 Tela do carrinho (P3)"),
        p("Permite visualizar, alterar e excluir itens (RF0031, RF0032), observar itens retirados por prazo (RNF0042) e solicitar a realização da compra (RF0033)."),
        ...figure("03-carrinho.png", "Figura 2 — Protótipo da tela do carrinho de compra (correspondente a P3)."),
        table(
          ["Elemento", "Tipo", "Status", "Tamanho", "Comportamento"],
          [
            ["Lista de itens", "Lista", "Habilitado", "N itens", "Exibe itens ativos e, se houver, os removidos por expiração (RNF0042). P3.1."],
            ["Quantidade do item", "Controle numérico", "Habilitado", "Inteiro ≥ 1", "Altera quantidade com revalidação de estoque (RF0032, RN0031). P3.3."],
            ["Remover item", "Botão ícone", "Habilitado", "Ação", "Exclui o item e desbloqueia estoque (RF0031). P3.4."],
            ["Subtotal / total", "Texto", "Somente leitura", "Moeda BRL", "Consolida valores de venda (RF0052). P3.1."],
            ["Finalizar compra", "Botão / link", "Habilitado só com itens ativos", "Ação primária", "Dispara RF0033 (P3.6). Desabilitado em E4 (RNF0042)."],
            ["Limpar", "Botão", "Habilitado", "Ação", "Remove todos os itens ativos do repositório temporário (RF0031)."],
          ],
          [2000, 1600, 2200, 1560, 2000]
        ),

        h2("12.3 Tela de finalização da compra (P4 a P7)"),
        p("Reúne seleção de endereço (RF0035), cálculo de frete (RF0034), cupons (RF0037) e cartões (RF0036), até a confirmação que atribui EM PROCESSAMENTO (RF0038)."),
        ...figure("04-checkout.png", "Figura 3 — Protótipo da tela de realizar e finalizar a compra (P4, P5, P6 e P7).", 500),
        table(
          ["Elemento", "Tipo", "Status", "Tamanho", "Comportamento"],
          [
            ["Endereços (apelidos)", "Grupo de seleção", "Habilitado", "1..N + novo", "Seleciona endereço prévio ou aciona A2 (RF0026, RF0035). P4."],
            ["Novo endereço", "Botão", "Habilitado", "Ação", "Abre cadastro com RN0023 e opção de incorporar ao perfil. A2."],
            ["Opções de frete", "Lista de opção", "Habilitado após endereço", "1 seleção", "Apresenta o cálculo de RF0034. P5."],
            ["Código do cupom", "Campo texto", "Habilitado", "Até 32", "Aplica cupom de troca ou promocional (RF0037, RN0033). P6."],
            ["Aplicar cupom", "Botão", "Habilitado", "Ação", "Valida cupom; recusa segundo promocional (RN0033) em E6."],
            ["Valor por cartão", "Campo monetário", "Habilitado", "BRL", "Rateio entre cartões (RN0034, RN0035). P6.4."],
            ["Adicionar novo cartão", "Botão", "Habilitado", "Ação", "Aciona A3 (RF0036, RN0024, RN0025)."],
            ["Confirmar pedido", "Botão", "Habilitado se P4–P6 válidos", "Ação primária", "Executa P7.2 (EM PROCESSAMENTO) e P8."],
            ["Resumo (subtotal, frete, cupons, total)", "Painel", "Somente leitura", "Moeda BRL", "Consolida P5 e P6 antes de P7."],
          ],
          [2200, 1600, 2000, 1400, 2160]
        ),

        h2("12.4 Tela de consulta da compra pelo cliente (P11)"),
        p("O Cliente consulta a transação (RF0025) e, se o status for ENTREGUE, solicita troca de item (RF0041, RN0043)."),
        ...figure("07-pedido-detalhe.png", "Figura 4 — Protótipo da consulta da compra e da solicitação de troca (P11)."),
        table(
          ["Elemento", "Tipo", "Status", "Tamanho", "Comportamento"],
          [
            ["Identificador da compra", "Texto", "Somente leitura", "Código", "Localiza a transação (RF0025). P11.1."],
            ["Status da compra", "Selo", "Somente leitura", "Enumeração DRS", "Deve exibir um dos estados da seção 9.1. P11.2 usa ENTREGUE (RN0043)."],
            ["Histórico", "Lista temporal", "Somente leitura", "N eventos", "Rastreia transições; gravação alinhada a RNF0012."],
            ["Item para troca", "Lista de seleção", "Habilitado se ENTREGUE", "Itens da compra", "Escolhe o item (RF0041). P11.2."],
            ["Quantidade da troca", "Campo numérico", "Habilitado se ENTREGUE", "Inteiro ≥ 1", "Delimita o pedido de troca. P11.3."],
            ["Solicitar troca", "Botão", "Habilitado se RN0043", "Ação", "Gera pedido EM TROCA (RN0041). Recusa em E7."],
          ],
          [2000, 1600, 2000, 1760, 2000]
        ),

        h2("12.5 Tela administrativa de compras (P9, P10, P12.1)"),
        p("O Administrador localiza vendas APROVADA para despacho (RF0039), confirma entrega (RF0040) e visualiza EM TROCA (RF0043)."),
        ...figure("09-admin-pedidos.png", "Figura 5 — Protótipo da listagem administrativa de compras (P9, P10 e P12.1)."),
        table(
          ["Elemento", "Tipo", "Status", "Tamanho", "Comportamento"],
          [
            ["Filtro de status", "Lista", "Habilitado", "Enumeração DRS", "Deve permitir isolar APROVADA, EM TRANSPORTE, EM TROCA e demais estados da seção 9.1."],
            ["Lista de compras", "Tabela/lista", "Habilitado", "N registros", "Apresenta código, cliente, data, status e total. Tempo de resposta ≤ 1 s (RNF0011)."],
            ["Abrir compra", "Link", "Habilitado", "Navegação", "Abre o detalhe para P9.2, P10.1, P12.2 ou P13.1."],
          ],
          [2000, 1600, 1600, 1760, 2400]
        ),

        h2("12.6 Tela administrativa de detalhe (P9.2, P10, P12.2, P13)"),
        p("Permite despachar (EM TRANSPORTE), confirmar entrega (ENTREGUE), autorizar troca (TROCA AUTORIZADA) e confirmar recebimento (TROCADO), com indicação de reentrada em estoque."),
        ...figure("10-admin-pedido-detalhe.png", "Figura 6 — Protótipo do detalhe administrativo da compra (P9 a P13)."),
        table(
          ["Elemento", "Tipo", "Status", "Tamanho", "Comportamento"],
          [
            ["Alterar status / ações", "Botões", "Habilitado conforme estado", "Ação", "Só apresenta transições previstas no DRS: APROVADA→EM TRANSPORTE (P9.2); EM TRANSPORTE→ENTREGUE (P10.2); EM TROCA→TROCA AUTORIZADA (P12.2); recebimento→TROCADO (P13.3)."],
            ["Confirmar recebimento da troca", "Botão", "Habilitado em troca", "Ação", "Executa RF0044. Passo P13.1."],
            ["Retornar ao estoque", "Opção sim/não", "Habilitado na confirmação", "Booleano", "Se sim, dispara RF0054. P13.2 / A7."],
            ["Histórico", "Lista", "Somente leitura", "N eventos", "Evidencia ator e momento de cada status (RNF0012)."],
            ["Notificação de autorização", "Mensagem de sistema", "Automático", "Evento", "Gerada em P12.3 (RN0046); não exige campo na tela do cliente, apenas efeito."],
          ],
          [2400, 1600, 2000, 1400, 1960]
        ),

        h2("12.7 Tela de cupons do cliente (P13.4)"),
        p("Disponibiliza ao Cliente o cupom de troca gerado após o recebimento dos itens (RF0045), para uso em P6."),
        ...figure("08-cupons.png", "Figura 7 — Protótipo da consulta de cupons disponíveis ao cliente (P13.4 e P6)."),
        table(
          ["Elemento", "Tipo", "Status", "Tamanho", "Comportamento"],
          [
            ["Cupons disponíveis", "Lista", "Somente leitura", "N códigos", "Exibe cupom de troca e promocional válido para RF0037."],
            ["Valor do cupom", "Texto", "Somente leitura", "Percentual ou moeda conforme DRS", "O DRS trata cupons pelo valor na compra (RN0035, RN0036); a apresentação deve permitir conferência em P6."],
          ],
          [2200, 1800, 1800, 2200, 1360]
        ),

        h1("13. Pós-condições"),
        bullet("Compra persistida em exatamente um dos estados da seção 9.1, conforme o ponto em que o fluxo terminou (EM PROCESSAMENTO apenas no instante anterior à conclusão de P8; ao concluir P8, APROVADA ou REPROVADA)."),
        bullet("Se APROVADA: baixa de estoque efetuada (RF0053, RN0028) e bloqueio de carrinho daquela quantidade convertido em saída definitiva."),
        bullet("Se REPROVADA ou bloqueio expirado sem efetivação: itens desbloqueados e mantidos em estoque (RN0028, RN0044)."),
        bullet("Se ENTREGUE: compra apta a receber solicitação de troca (RN0043)."),
        bullet("Se TROCADO: cupom de troca disponibilizado ao cliente (RF0045) e, se indicado pelo administrador, reentrada em estoque (RF0054)."),
        bullet("Operações de escrita com log de data, hora, usuário e dados (RNF0012)."),

        h1("14. Requisitos Não Funcionais"),
        table(
          ["ID", "Nome", "Aplicação neste caso de uso"],
          [
            ["RNF0011", "Tempo de resposta para consultas", "Consulta de livros, carrinho, transações do cliente, listagem administrativa e visualização de trocas em no máximo 1 segundo."],
            ["RNF0012", "Log de transação", "Inclusão/alteração de carrinho persistido, finalização, mudança de status, baixa/reentrada de estoque e geração de cupom."],
            ["RNF0013", "Cadastro de domínios", "Bandeiras de cartão (RN0025) e demais domínios exigidos na venda devem existir na implantação."],
            ["RNF0034", "Alteração apenas de endereços", "Inclusão de endereço no checkout (A2) sem exigir reedição de todo o cadastro do cliente."],
            ["RNF0042", "Apresentar itens retirados do carrinho", "Listar itens removidos por prazo, exibir o tempo parametrizado, desabilitar comprar e exigir nova adição."],
          ],
          [1400, 2800, 5160]
        ),
        p("RNF0031, RNF0032 e RNF0033 (senha) aplicam-se ao cadastro/autenticação que é pré-condição, não aos passos de venda em si. RNF0043 a RNF0046 e o segundo RNF0044 (IA) pertencem a Análise e Recomendação e não são realizados por este caso de uso."),

        h1("15. Ponto de Extensão"),
        table(
          ["Relacionamento", "Caso de uso / operação", "Ponto nos fluxos"],
          [
            ["Include", "Consulta de livros (RF0015)", "P1.3 e P2.1"],
            ["Include", "Validar estoque e bloqueio (RN0031, RN0044)", "P2.2, P2.3, P3.3, P3.5"],
            ["Include", "Dar baixa em estoque (RF0053)", "P8.3, somente se APROVADA"],
            ["Include", "Reentrada em estoque (RF0054)", "P13.2, quando o administrador indicar retorno"],
            ["Include", "Gerar cupom de troca (RF0045, RN0036)", "P13.4 e, na finalização, P6.5 / A5.2 se couber diferença de cupons"],
            ["Extend", "Cadastrar endereço de entrega no perfil (RF0026)", "A2, a partir de P4.2"],
            ["Extend", "Cadastrar cartão de crédito no perfil (RF0027)", "A3, a partir de P6.2"],
            ["Include", "Consulta de transações do cliente (RF0025)", "P11.1"],
          ],
          [1600, 3880, 3880]
        ),
        p("A validação junto à operadora de cartão (RN0037) é processamento externo invocado em P8.1; o DRS não a nomeia como caso de uso."),

        h1("16. Critérios de Aceite"),
        bullet("Não é possível adicionar ao carrinho quantidade inexistente em estoque (RN0031)."),
        bullet("A inclusão bloqueia temporariamente a quantidade; o prazo considera o último item; há notificação 5 minutos antes; na expiração os itens são removidos, desbloqueados e o mesmo produto sai do carrinho (RN0044, RN0045), aparecendo como retirados, com comprar desabilitado (RNF0042)."),
        bullet("A quantidade pode ser editada na inclusão e na visualização do carrinho (RF0032)."),
        bullet("A compra exige endereço (prévio ou novo, com opção de salvar no perfil) e cálculo de frete sobre itens e endereço (RF0034, RF0035)."),
        bullet("O pagamento aceita cartões prévios ou novo cartão (com opção de salvar), cupom de troca e no máximo um cupom promocional, inclusive em conjunto, respeitando RN0033 a RN0036."),
        bullet("A finalização grava a compra em EM PROCESSAMENTO (RF0038). A validação posterior resulta em APROVADA com baixa de estoque ou REPROVADA sem baixa e com desbloqueio (RN0037, RN0038, RN0028, RF0053)."),
        bullet("Somente Administrador promove APROVADA para EM TRANSPORTE e EM TRANSPORTE para ENTREGUE (RF0039, RF0040)."),
        bullet("Somente item/pedido ENTREGUE aceita troca; o pedido fica EM TROCA; o Administrador lista EM TROCA, autoriza TROCA AUTORIZADA (com notificação), confirma recebimento TROCADO, decide reentrada e o sistema emite cupom de troca (RF0041 a RF0045, RN0041 a RN0046, RF0054)."),
        bullet("Consultas da jornada respondem em no máximo 1 segundo (RNF0011) e escritas são logadas (RNF0012)."),
        bullet("Não existem, neste caso de uso, transições para estados não listados na seção 9.1."),

        h1("17. Observações"),
        h2("Prioridade de desenvolvimento"),
        p("Alta. Sem este caso de uso o e-commerce não conclui a finalidade comercial do DRS (carrinho, pagamento, entrega e troca). Recomenda-se implementar na ordem: P2–P3 (carrinho, estoque e prazo), P4–P8 (compra e aprovação), P9–P10 (transporte e entrega) e P11–P13 (troca)."),

        h2("Inconsistências, lacunas e ambiguidades do DRS"),
        p("Registradas sem resolução por suposição, conforme solicitado na atividade."),
        bullet("RF0044 descreve a confirmação de recebimento sobre status EM TROCA, enquanto RF0042 já teria avançado a TROCA AUTORIZADA. Não está explícito se P13 exige EM TROCA, TROCA AUTORIZADA ou ambos. Identificadores: RF0042, RF0044, RN0042."),
        bullet("RN0074 cita compras “canceladas”, mas o grupo de vendas não define status CANCELADA nem RF de cancelamento. Identificadores: RN0074 versus RF0038–RF0040 e a lista de estados da atividade."),
        bullet("RN0074 usa “EM TRÂNSITO/TRANSPORTE”; RF0039 e RN0039 usam apenas EM TRANSPORTE. Identificadores: RF0039, RN0039, RN0074."),
        bullet("O DRS não define quem é o ator da validação de pagamento: RN0037–RN0038 descrevem processamento após a finalização, sem tela administrativa de aprovar/reprovar. A especificação atribuiu ao sistema (P8, E5)."),
        bullet("RF0040 atribui a confirmação de entrega exclusivamente ao Administrador. Não há RF de confirmação de recebimento pelo Cliente."),
        bullet("Não há RF próprio para “aprovar/reprovar compra”; APROVADA e REPROVADA aparecem em RN0038. A atividade exige esses estados; foram amarrados a P8 e E5."),
        bullet("O prazo de bloqueio do carrinho e o parâmetro de tempo a exibir em RNF0042 não têm valor definido no DRS, apenas “parametrizado” e o aviso de 5 minutos (RN0044)."),
        bullet("RN0028 está no grupo Cadastro de Clientes, embora discipline baixa de estoque e desbloqueio após venda não efetivada. Foi aplicada em P8 e E5 por descrever o comportamento da venda."),
        bullet("RNF0064 (data de entrada) está listado entre regras de negócio de estoque, com prefixo de RNF. Identificador: RNF0064 / grupo Controle de estoque."),
        bullet("Há dois identificadores RNF0044: formatação monetária do gráfico (Análise) e recomendação com IA generativa. Nenhum dos dois é deste caso de uso; o conflito de ID foi apenas registrado."),
        bullet("RF0032 contém o título “Definir quantidade de itens no para o carrinho” (redação)."),
        bullet("RF0045 gera cupom quando o administrador informa que os itens chegaram; RN0042 muda para TROCADO na mesma confirmação. A ordem relativa cupom versus status não está detalhada; P13.3 e P13.4 foram mantidos na sequência do texto do DRS, sem inventar dependência extra."),
        bullet("O DRS não descreve o transporte físico do item pelo Cliente após TROCA AUTORIZADA (coleta, postagem, prazo). Esse trecho não foi incluído no fluxo."),
        bullet("Cliente inativo (RF0023) não tem regra explícita sobre carrinho já bloqueado. E1 cobre apenas nova tentativa."),
        bullet("Os protótipos (Figuras 1 a 7) pertencem ao protótipo acadêmico do aluno, com catálogo de peças em lugar de livros. Rótulos de status nessas telas podem divergir da enumeração da seção 9.1; prevalece o DRS."),

        h1("18. Referências"),
        bullet("DRS_LES_2_2026 — Documento de Requisitos. E-commerce de Livros. LES 2º semestre de 2026. Versão 0.7 (10/08/2026). Única fonte de requisitos, estados e regras desta especificação."),
        bullet("Template UC_FATEC — Especificação de Caso de Uso. Utilizado na estrutura, na numeração hierárquica de passos, na forma dos fluxos A e E, na tabela de elementos de tela e na rastreabilidade de IDs nos passos."),
        bullet("Atividade de elaboração do caso de uso de Gestão de Vendas (grupo Gerenciar Vendas Eletrônicas e requisitos correlatos do DRS)."),
      ],
    },
  ],
});

const buf = await Packer.toBuffer(doc);
fs.mkdirSync(path.dirname(OUT_DOCS), { recursive: true });
fs.writeFileSync(OUT_DOCS, buf);
fs.copyFileSync(OUT_DOCS, OUT_DL);
const st = fs.statSync(OUT_DOCS);
console.log(OUT_DOCS);
console.log(OUT_DL);
console.log("bytes=" + st.size);
