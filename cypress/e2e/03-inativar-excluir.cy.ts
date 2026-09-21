import { uniqueClient } from "../support/commands";

describe("Inativar e excluir cliente", () => {
  it("admin inativa, o cliente nao entra, admin reativa e o cadastro permanece", () => {
    const client = uniqueClient("inativa");
    cy.resetStore();
    cy.signupClient(client);
    cy.logoutUi();

    cy.loginAs("admin@3dstore.com", "admin123");
    cy.visit("/admin/clientes");
    cy.get('[data-testid="filter-email"]').clear().type(client.email);
    cy.get(`[data-testid="status-${client.email}"]`).should("contain", "ativo");
    cy.get(`[data-testid="toggle-status-${client.email}"]`).click();
    cy.get(`[data-testid="status-${client.email}"]`).should("contain", "inativo");
    cy.get('[data-testid="form-ok"]').should("contain", "Cliente inativado.");
    cy.get('[data-testid="logout"]').click();

    cy.loginAs(client.email, client.password);
    cy.get('[data-testid="form-error"]').should("contain", "inativa");

    cy.loginAs("admin@3dstore.com", "admin123");
    cy.visit("/admin/clientes");
    cy.get('[data-testid="filter-email"]').clear().type(client.email);
    cy.get(`[data-testid="toggle-status-${client.email}"]`).click();
    cy.get(`[data-testid="status-${client.email}"]`).should("contain", "ativo");
    cy.get('[data-testid="logout"]').click();

    cy.loginAs(client.email, client.password);
    cy.visit("/conta");
    cy.contains("Consultar e alterar cadastro");
    cy.get('[data-testid="profile-summary"]').should("contain", client.email);
  });

  it("exclusao do cliente remove o cadastro e nao e inativacao", () => {
    const client = uniqueClient("exclui");
    cy.resetStore();
    cy.signupClient(client);
    cy.on("window:confirm", () => true);
    cy.get('[data-testid="delete-account"]').click();
    cy.loginAs(client.email, client.password);
    cy.get('[data-testid="form-error"]').should("contain", "senha");
  });
});
