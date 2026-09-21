import { uniqueClient, trabalhoAddress } from "../support/commands";

describe("Enderecos do cliente", () => {
  it("cadastra, consulta, altera e impede excluir o ultimo endereco de cobranca/entrega", () => {
    const client = uniqueClient("end");
    cy.resetStore();
    cy.signupClient(client);
    cy.visit("/conta/enderecos");
    cy.get('[data-testid="address-Casa"]').should("contain", "ambos");

    cy.get('[data-testid="new-address"]').click();
    cy.fillAddress(trabalhoAddress);
    cy.get('[data-testid="addr-kind"]').select("entrega");
    cy.get('[data-testid="submit-address"]').click();
    cy.get('[data-testid="address-Trabalho"]').should("contain", "Paulista");

    cy.get('[data-testid="edit-address-Trabalho"]').click();
    cy.get('[data-testid="addr-number"]').clear().type("2000");
    cy.get('[data-testid="submit-address"]').click();
    cy.get('[data-testid="address-Trabalho"]').should("contain", "2000");

    cy.get('[data-testid="new-address"]').click();
    cy.fillAddress({ ...trabalhoAddress, label: "Trabalho" });
    cy.get('[data-testid="submit-address"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "apelido");

    cy.get('[data-testid="remove-address-Casa"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "entrega");
    cy.get('[data-testid="address-Casa"]').should("exist");
  });
});
