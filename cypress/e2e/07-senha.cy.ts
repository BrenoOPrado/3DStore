import { uniqueClient } from "../support/commands";

describe("Alterar senha", () => {
  it("altera senha forte e autentica com a nova", () => {
    const client = uniqueClient("senha");
    cy.resetStore();
    cy.signupClient(client);
    cy.visit("/conta/senha");

    cy.get('[data-testid="current-password"]').type("errada");
    cy.get('[data-testid="new-password"]').type("Nova@123");
    cy.get('[data-testid="new-password-confirm"]').type("Nova@123");
    cy.get('[data-testid="submit-password"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "incorreta");

    cy.get('[data-testid="current-password"]').clear().type(client.password, { log: false });
    cy.get('[data-testid="new-password"]').clear().type("fraca");
    cy.get('[data-testid="new-password-confirm"]').clear().type("fraca");
    cy.get('[data-testid="submit-password"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "8 caracteres");

    cy.get('[data-testid="current-password"]').clear().type(client.password, { log: false });
    cy.get('[data-testid="new-password"]').clear().type("Nova@1234");
    cy.get('[data-testid="new-password-confirm"]').clear().type("Nova@9999");
    cy.get('[data-testid="submit-password"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "confere");

    cy.get('[data-testid="current-password"]').clear().type(client.password, { log: false });
    cy.get('[data-testid="new-password"]').clear().type("Nova@1234");
    cy.get('[data-testid="new-password-confirm"]').clear().type("Nova@1234");
    cy.get('[data-testid="submit-password"]').click();
    cy.get('[data-testid="form-ok"]').should("contain", "Senha alterada.");

    cy.logoutUi();
    cy.loginAs(client.email, client.password);
    cy.get('[data-testid="form-error"]').should("contain", "senha");
    cy.loginAs(client.email, "Nova@1234");
    cy.visit("/conta");
    cy.contains("Consultar e alterar cadastro");
  });
});
