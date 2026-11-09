import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const dir = "C:/Users/breno/OneDrive/Documentos/Projetos/LES/3Dproducts/docs/_pptx_work/extracted/ppt/slides";

function patch(file, pairs) {
  const path = join(dir, file);
  let xml = readFileSync(path, "utf8");
  for (const [from, to] of pairs) {
    if (!xml.includes(from)) {
      console.error("MISSING in", file, "=>", from);
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
    "A 3D Store é um e-commerce de peças físicas produzidas por impressão 3D. O cliente consulta o catálogo, compra e acompanha a entrega; o ateliê gerencia cadastros, vendas e cupons.",
    "A 3D Store é um e-commerce de peças físicas produzidas por impressão 3D. O cliente consulta o catálogo, compra e acompanha a entrega; o ateliê gerencia cadastros, vendas, estoque e análises.",
  ],
  [
    "Catálogo e cadastro de produtos impressos em 3D",
    "Catálogo e CRUD de produtos 3D, com exclusão que preserva o histórico",
  ],
  [
    "Carrinho, checkout, frete e gestão de pedidos",
    "Carrinho com bloqueio temporário, checkout, frete e ciclo de pedidos",
  ],
  [
    "Trocas com geração de cupom",
    "Trocas com cupom, reentrada em estoque e notificações",
  ],
  [
    "Cupons promocionais e de troca",
    "Cupons promocionais e de troca em reais",
  ],
  [
    "Dashboard de receita no painel administrativo",
    "Análise gráfica por categoria e período, só vendas ENTREGUE",
  ],
  [
    "Chat de recomendação e testes de interface automatizados",
    "Chat de recomendação e Cypress (clientes, vendas, ciclo, análise e produtos)",
  ],
]);

patch("slide3.xml", [
  [
    "Front-end: React 19, TypeScript e Vite",
    "Front-end: React 19, TypeScript e Vite 7",
  ],
  [
    "Back-end: Node.js (Express) e TypeScript, com persistência em JSON",
    "Back-end: Node.js (Express 5) e TypeScript, JSON em store.json",
  ],
  [
    "Testes de interface: Cypress",
    "Testes de interface: Cypress (11 especificações e2e)",
  ],
]);

patch("slide14.xml", [
  [
    "Repositório temporário da compra: alterar quantidade, remover item e ver o subtotal.",
    "Repositório temporário: quantidade, estoque visível, remoção e subtotal.",
  ],
  [
    "O cliente segue para o checkout quando o pedido está conferido.",
    "O item fica bloqueado por prazo; se expirar, volta ao estoque.",
  ],
  [
    "O carrinho fica associado à sessão de quem está logado.",
    "Comprar fica desabilitado se houver item expirado na listagem.",
  ],
]);

patch("slide17.xml", [
  [
    "Após finalizar, o pedido nasce em aberto e aguarda o ateliê processar.",
    "Após finalizar, o pedido nasce EM PROCESSAMENTO e a operadora valida o pagamento.",
  ],
  [
    "O cliente vê o resumo, o endereço e a forma de envio.",
    "O cliente vê itens, endereço, frete e a forma de pagamento.",
  ],
  [
    "Quando o admin processa, o sistema confirma o pagamento.",
    "APROVADA segue o ciclo; REPROVADA devolve o estoque ao catálogo.",
  ],
]);

patch("slide18.xml", [
  [
    "Na conta, o cliente acompanha status, itens, endereço e histórico.",
    "Na conta, o cliente acompanha o status DRS, os itens e o histórico.",
  ],
  [
    "Daqui saem o cancelamento (enquanto permitido), o recebimento e o pedido de troca.",
    "A troca só é pedida após ENTREGUE; o admin autoriza e emite cupom.",
  ],
]);

patch("slide21.xml", [
  ["Gráficos de vendas", "Histórico de vendas"],
  [
    "O painel administrativo mostra a receita ao longo dos meses em gráfico de linha.",
    "Gráfico de linhas por categoria: eixo X mês/ano e eixo Y em reais.",
  ],
  [
    "Há também o recorte por categoria para o ateliê acompanhar o mix vendido.",
    "O admin informa o período e compara categorias; só compras ENTREGUE entram.",
  ],
  [
    "Os dados vêm dos pedidos já registrados no protótipo.",
    "A consulta responde em até 1 segundo e meses zerados não poluem a lista.",
  ],
]);

patch("slide23.xml", [
  [
    "Central de vendas do ateliê: filtrar, abrir o pedido e avançar o status.",
    "Central de vendas: filtrar, abrir o pedido e avançar o status DRS.",
  ],
  [
    "Daqui o admin processa pagamento, despacha e trata trocas.",
    "O admin despacha (EM TRANSPORTE), confirma ENTREGUE e trata trocas.",
  ],
]);

patch("slide24.xml", [
  [
    "CRUD administrativo do catálogo: incluir, editar e remover peças.",
    "Incluir, editar e excluir peças. A exclusão não altera pedidos nem o gráfico.",
  ],
  [
    "Nome, preço, categoria, cores e mídia alimentam a loja imediatamente.",
    "Nome, preço, categoria, descrição, material, cores e estoque são obrigatórios.",
  ],
  [
    "É o equivalente ao cadastro de livros do DRS, adaptado à impressão 3D.",
    "Variação de preço acima de 10% pede duas confirmações seguidas.",
  ],
]);

patch("slide25.xml", [
  [
    "O admin cria cupons promocionais ou de troca, com código e percentual.",
    "O admin cria cupons promocionais ou de troca, com código e valor em reais.",
  ],
  [
    "Cupons de troca ficam vinculados ao cliente após uma troca aceita.",
    "Cupons de troca ficam vinculados ao cliente após o recebimento da troca.",
  ],
]);

patch("slide13.xml", [
  [
    "Página com fotos, material, cores e quantidade antes de ir ao carrinho.",
    "Página com fotos, material, cores, estoque e quantidade antes do carrinho.",
  ],
]);
