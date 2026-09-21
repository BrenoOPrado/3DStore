import { uniqueClient } from "../support/commands";

describe("Cartoes do cliente", () => {
  it("cadastra cartao com bandeira, nome, numero, CVV e preferencial", () => {
    const client = uniqueClient("card");
    cy.resetStore();
    cy.signupClient(client);
    cy.visit("/conta/cartoes");

    cy.get('[data-testid="new-card"]').click();
    cy.get('[data-testid="submit-card"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "impresso");

    cy.get('[data-testid="card-holder"]').type("MARIA QA SILVA");
    cy.get('[data-testid="card-number"]').type("4111111111111111");
    cy.get('[data-testid="card-brand"]').select("Visa");
    cy.get('[data-testid="card-expiry"]').type("1228");
    cy.get('[data-testid="card-cvv"]').type("123");
    cy.get('[data-testid="submit-card"]').click();
    cy.get('[data-testid="card-1111"]').should("contain", "preferencial");

    cy.get('[data-testid="new-card"]').click();
    cy.get('[data-testid="card-holder"]').type("MARIA QA SILVA");
    cy.get('[data-testid="card-number"]').type("5555555555554444");
    cy.get('[data-testid="card-brand"]').select("Mastercard");
    cy.get('[data-testid="card-expiry"]').type("0827");
    cy.get('[data-testid="card-cvv"]').type("321");
    cy.get('[data-testid="card-preferred"]').check();
    cy.get('[data-testid="submit-card"]').click();
    cy.get('[data-testid="card-4444"]').should("contain", "preferencial");
    cy.get('[data-testid="card-1111"]').should("not.contain", "preferencial");

    cy.get('[data-testid="prefer-card-1111"]').click();
    cy.get('[data-testid="card-1111"]').should("contain", "preferencial");
  });

  it("recusa validade fora do formato MM/AA", () => {
    const client = uniqueClient("val");
    cy.resetStore();
    cy.signupClient(client);
    cy.visit("/conta/cartoes");
    cy.get('[data-testid="new-card"]').click();
    cy.get('[data-testid="card-holder"]').type("MARIA QA");
    cy.get('[data-testid="card-number"]').type("4111111111111111");
    cy.get('[data-testid="card-expiry"]').type("13");
    cy.get('[data-testid="card-cvv"]').type("123");
    cy.get('[data-testid="submit-card"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "MM/AA");
  });
});
