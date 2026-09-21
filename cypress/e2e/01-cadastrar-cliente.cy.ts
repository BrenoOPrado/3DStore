import { uniqueClient } from "../support/commands";

describe("Cadastrar cliente", () => {
  beforeEach(() => {
    cy.resetStore();
    cy.visit("/cadastro");
  });

  it("cadastra cliente com telefone, CPF e endereco de cobranca e entrega", () => {
    const client = uniqueClient("cadastro");
    cy.fillSignup(client);
    cy.get('[data-testid="submit-signup"]').click();
    cy.contains("Consultar e alterar cadastro");
    cy.get('[data-testid="profile-summary"]')
      .should("contain", client.email)
      .and("contain", "ativo")
      .and("contain", "ranking");
  });

  it("recusa senha fraca", () => {
    const client = uniqueClient("fraca");
    cy.fillSignup({ ...client, password: "senha123" });
    cy.get('[data-testid="password"]').clear().type("senha123");
    cy.get('[data-testid="password-confirm"]').clear().type("senha123");
    cy.get('[data-testid="submit-signup"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "8 caracteres");
  });

  it("recusa confirmacao de senha divergente", () => {
    const client = uniqueClient("confirma");
    cy.fillSignup(client);
    cy.get('[data-testid="password-confirm"]').clear().type("Senha@999");
    cy.get('[data-testid="submit-signup"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "confere");
  });

  it("recusa CPF invalido", () => {
    const client = uniqueClient("cpf");
    cy.fillSignup(client);
    cy.get('[data-testid="cpf"]').clear().type("11111111111");
    cy.get('[data-testid="submit-signup"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "CPF");
  });

  it("recusa cadastro so com endereco de entrega", () => {
    const client = uniqueClient("soentrega");
    cy.fillSignup(client);
    cy.get('[data-testid="addr-kind"]').select("entrega");
    cy.get('[data-testid="submit-signup"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "ambos");
  });

  it("recusa endereco sem logradouro", () => {
    const client = uniqueClient("logr");
    cy.fillSignup(client);
    cy.get('[data-testid="addr-street"]').clear();
    cy.get('[data-testid="submit-signup"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "Informe o logradouro.");
  });

  it("recusa e-mail duplicado", () => {
    cy.fillSignup({
      name: "Ana Souza",
      email: "ana.souza@email.com",
      cpf: "39053344705",
      password: "Senha@123",
      birthDate: "1994-05-12",
      phoneDdd: "11",
      phoneNumber: "988776655",
    });
    cy.get('[data-testid="submit-signup"]').click();
    cy.get('[data-testid="form-error"]').should("contain", "e-mail");
  });
});
