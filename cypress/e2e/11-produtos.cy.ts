const ADMIN = { email: "admin@3dstore.com", password: "admin123" };

function openNewProduct() {
  cy.visit("/admin/produtos");
  cy.get('[data-testid="product-new"]').click();
  cy.get('[data-testid="product-form"]').should("exist");
}

function fillProduct(data: {
  name?: string;
  price?: string;
  category?: string;
  material?: string;
  colors?: string;
  stock?: string;
  description?: string;
}) {
  if (data.name != null) {
    cy.get('[data-testid="product-name"]').clear();
    if (data.name) cy.get('[data-testid="product-name"]').type(data.name);
  }
  if (data.price != null) {
    cy.get('[data-testid="product-price"]').clear();
    if (data.price) cy.get('[data-testid="product-price"]').type(data.price);
  }
  if (data.category) cy.get('[data-testid="product-category"]').select(data.category);
  if (data.material != null) {
    cy.get('[data-testid="product-material"]').clear();
    if (data.material) cy.get('[data-testid="product-material"]').type(data.material);
  }
  if (data.colors != null) {
    cy.get('[data-testid="product-colors"]').clear();
    if (data.colors) cy.get('[data-testid="product-colors"]').type(data.colors);
  }
  if (data.stock != null) {
    cy.get('[data-testid="product-stock"]').clear();
    if (data.stock) cy.get('[data-testid="product-stock"]').type(data.stock);
  }
  if (data.description != null) {
    cy.get('[data-testid="product-description"]').clear();
    if (data.description) cy.get('[data-testid="product-description"]').type(data.description);
  }
}

function validProduct(overrides: Parameters<typeof fillProduct>[0] = {}) {
  fillProduct({
    name: "Vaso QA Hexagonal",
    price: "100",
    category: "vasos",
    material: "PLA",
    colors: "Verde, Azul",
    stock: "5",
    description: "Vaso de teste para o cadastro administrativo de produtos.",
    ...overrides,
  });
}

describe("Cadastro, edicao e exclusao de produtos", () => {
  it("recusa cadastro sem as informacoes essenciais", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    openNewProduct();
    validProduct({ name: " ", description: "curta", colors: "", price: "0" });
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="product-error"]').should("contain", "Informe o nome");
    validProduct({ price: "0" });
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="product-error"]').should("contain", "preço válido");
    validProduct({ colors: "" });
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="product-error"]').should("contain", "ao menos uma cor");
    validProduct({ description: "curta", material: " " });
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="product-error"]').should("be.visible");
  });

  it("cadastra um produto completo e ele aparece na loja", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    openNewProduct();
    validProduct();
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="product-ok"]').should("contain", "Produto adicionado");
    cy.get('[data-testid="product-row-vaso-qa-hexagonal"]').should("contain", "Vaso QA Hexagonal");
    cy.get('[data-testid="product-status-vaso-qa-hexagonal"]').should("contain", "ativo");
    cy.visit("/catalogo");
    cy.contains("Vaso QA Hexagonal");
    cy.visit("/produto/vaso-qa-hexagonal");
    cy.contains("Vaso QA Hexagonal");
    cy.contains("R$ 100,00");
  });

  it("edicao abaixo de 10% salva sem confirmacao extra", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    openNewProduct();
    validProduct();
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="product-ok"]').should("contain", "Produto adicionado");
    cy.get('[data-testid="product-edit-vaso-qa-hexagonal"]').click();
    cy.get('[data-testid="product-price"]').clear().type("105");
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="price-confirm"]').should("not.exist");
    cy.get('[data-testid="product-ok"]').should("contain", "Produto atualizado");
    cy.get('[data-testid="product-row-vaso-qa-hexagonal"]').should("contain", "105,00");
  });

  it("edicao acima de 10% pede duas confirmacoes e cancela na segunda", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    openNewProduct();
    validProduct();
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="product-ok"]').should("contain", "Produto adicionado");
    cy.get('[data-testid="product-edit-vaso-qa-hexagonal"]').click();
    cy.get('[data-testid="product-price"]').clear().type("80");
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="price-confirm"]').should("exist");
    cy.get('[data-testid="price-confirm-step"]').should("contain", "1 de 2");
    cy.get('[data-testid="price-confirm-yes"]').click();
    cy.get('[data-testid="price-confirm-step"]').should("contain", "2 de 2");
    cy.get('[data-testid="price-confirm-no"]').click();
    cy.get('[data-testid="price-confirm"]').should("not.exist");
    cy.get('[data-testid="product-cancel"]').click();
    cy.get('[data-testid="product-row-vaso-qa-hexagonal"]').should("contain", "100,00");
    cy.get('[data-testid="product-row-vaso-qa-hexagonal"]').should("not.contain", "80,00");
  });

  it("edicao acima de 10% so grava depois das duas confirmacoes", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    openNewProduct();
    validProduct();
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="product-ok"]').should("contain", "Produto adicionado");
    cy.get('[data-testid="product-edit-vaso-qa-hexagonal"]').click();
    cy.get('[data-testid="product-price"]').clear().type("130");
    cy.get('[data-testid="product-save"]').click();
    cy.get('[data-testid="price-confirm-step"]').should("contain", "1 de 2");
    cy.get('[data-testid="price-confirm-yes"]').click();
    cy.get('[data-testid="price-confirm-step"]').should("contain", "2 de 2");
    cy.get('[data-testid="price-confirm-yes"]').click();
    cy.get('[data-testid="product-ok"]').should("contain", "Produto atualizado");
    cy.get('[data-testid="product-row-vaso-qa-hexagonal"]').should("contain", "130,00");
  });

  it("exclusao tira o produto da loja e preserva historico e analises", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin");
    cy.get('[data-testid="chart-cat-vasos"]').click();
    cy.get('[data-testid="chart-total-vasos"]').should("contain", "149,80");

    cy.visit("/admin/produtos");
    cy.get('[data-testid="product-row-vasos-dino"]').should("contain", "ativo");
    cy.get('[data-testid="product-delete-vasos-dino"]').click();
    cy.get('[data-testid="product-delete-confirm"]').should("contain", "não serão alterados");
    cy.get('[data-testid="product-delete-yes"]').click();
    cy.get('[data-testid="product-ok"]').should("contain", "preservados");
    cy.get('[data-testid="product-status-vasos-dino"]').should("contain", "excluído");

    cy.visit("/catalogo");
    cy.contains("Vasos dinossauro (kit)").should("not.exist");
    cy.visit("/produto/vasos-dino");
    cy.contains("Produto não encontrado");

    cy.visit("/admin/pedidos/3DS-100013");
    cy.get('[data-testid="order-item-vasos-dino"]').should("contain", "Vasos dinossauro (kit)");
    cy.contains("R$ 79,90");

    cy.visit("/admin");
    cy.get('[data-testid="chart-cat-vasos"]').click();
    cy.get('[data-testid="chart-total-vasos"]').should("contain", "149,80");
  });
});
