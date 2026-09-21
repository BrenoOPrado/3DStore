import { uniqueClient } from "../support/commands";

describe("Consultar e alterar cliente", () => {
  it("consulta o cadastro e altera nome e telefone", () => {
    const client = uniqueClient("alterar");
    cy.resetStore();
    cy.signupClient(client);
    cy.get('[data-testid="name"]').should("have.value", client.name);
    cy.get('[data-testid="cpf"]').should("have.value", client.cpf);
    cy.get('[data-testid="profile-summary"]').should("contain", "ranking");

    cy.get('[data-testid="name"]').clear().type("Maria QA Alterada");
    cy.get('[data-testid="phone-number"]').clear().type("977665544");
    cy.get('[data-testid="submit-profile"]').click();
    cy.get('[data-testid="form-ok"]').should("contain", "Cadastro atualizado.");
    cy.get('[data-testid="name"]').should("have.value", "Maria QA Alterada");
  });

  it("recusa CPF invalido na alteracao", () => {
    const client = uniqueClient("altcpf");
    cy.resetStore();
    cy.signupClient(client);
    cy.get('[data-testid="cpf"]').clear().type("12345678900");
    cy.get('[data-testid="submit-profile"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "CPF");
  });
});
