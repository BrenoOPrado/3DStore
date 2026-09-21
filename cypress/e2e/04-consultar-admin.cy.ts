describe("Consultar clientes e transacoes no admin", () => {
  beforeEach(() => {
    cy.resetStore();
    cy.loginAs("admin@3dstore.com", "admin123");
    cy.visit("/admin/clientes");
  });

  it("filtra clientes de forma isolada por nome, CPF, situacao e genero", () => {
    cy.get('[data-testid="filter-name"]').clear().type("Ana Souza");
    cy.get('[data-testid="customer-list"]').should("contain", "ana.souza@email.com");
    cy.get('[data-testid="filter-name"]').clear();

    cy.get('[data-testid="filter-cpf"]').clear().type("52998224725");
    cy.get('[data-testid="customer-list"]').should("contain", "Ana Souza");
    cy.get('[data-testid="filter-cpf"]').clear();

    cy.get('[data-testid="filter-status"]').select("inativo");
    cy.get('[data-testid="customer-list"]').should("contain", "bruno.lima@email.com");
    cy.get('[data-testid="customer-list"]').should("not.contain", "ana.souza@email.com");
    cy.get('[data-testid="filter-status"]').select("Todas");

    cy.get('[data-testid="filter-gender"]').select("Masculino");
    cy.get('[data-testid="customer-list"]').should("contain", "Bruno Lima");
  });

  it("combina filtros de genero e nome", () => {
    cy.get('[data-testid="filter-gender"]').select("Feminino");
    cy.get('[data-testid="filter-name"]').type("Carla");
    cy.get('[data-testid="customer-list"]').should("contain", "carla.mendes@email.com");
    cy.get('[data-testid="customer-list"]').should("not.contain", "ana.souza@email.com");
  });

  it("consulta pedidos e ranking do cliente", () => {
    cy.contains("a", "Ana Souza").click();
    cy.get('[data-testid="customer-detail"]')
      .should("contain", "ana.souza@email.com")
      .and("contain", "ranking")
      .and("contain", "cust-ana");
    cy.get('[data-testid="customer-orders"]').find("a").should("have.length.at.least", 1);
  });
});
