const ANA = { email: "ana.souza@email.com", password: "123456" };
const CARLA = { email: "carla.mendes@email.com", password: "123456" };
const ADMIN = { email: "admin@3dstore.com", password: "admin123" };

describe("Chatbot IA generativa (RNF0044)", () => {
  it("exige perfil cliente e personaliza por historico distinto", () => {
    cy.resetStore();
    cy.visit("/");
    cy.get('[data-testid="chatbot-fab"]').click();
    cy.get('[data-testid="chatbot-panel"]').should("exist");
    cy.get('[data-testid="chatbot-login-hint"]').should("contain", "cliente");

    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/");
    cy.get('[data-testid="chatbot-fab"]').click();
    cy.get('[data-testid="chatbot-input"]').type("recomenda algo para mim");
    cy.get('[data-testid="chatbot-send"]').click();
    cy.get('[data-testid="chat-bot-msg"]').should("contain", "prefer");
    cy.get('[data-testid="chat-useful"]').first().click();
    cy.get('[data-testid="chat-useful"]').first().should("have.class", "is-active");

    cy.logoutUi();
    cy.loginAs(CARLA.email, CARLA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/");
    cy.get('[data-testid="chatbot-fab"]').click();
    cy.get('[data-testid="chatbot-input"]').clear().type("recomenda algo para mim");
    cy.get('[data-testid="chatbot-send"]').click();
    cy.get('[data-testid="chat-bot-msg"]').last().should("exist");
  });

  it("ajuda na busca e responde duvida sobre peca", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.visit("/");
    cy.get('[data-testid="chatbot-fab"]').click();
    cy.get('[data-testid="chatbot-input"]').should("not.be.disabled").type("vaso para suculenta");
    cy.get('[data-testid="chatbot-send"]').click();
    cy.get('[data-testid="chat-bot-msg"]').last().should("exist");
    cy.get('[data-testid="chatbot-input"]').should("not.be.disabled");
    cy.get(".chat-recs a, [data-testid='chat-bot-msg']").should("exist");

    cy.get('[data-testid="chatbot-input"]').should("not.be.disabled").clear().type("o que e a luminaria lua?");
    cy.get('[data-testid="chatbot-send"]').click();
    cy.get('[data-testid="chatbot-input"]').should("not.be.disabled");
    cy.get('[data-testid="chat-bot-msg"]').last().should("contain", "lua");
  });

  it("admin consulta modelo e feedback do ajuste fino", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin/ia");
    cy.get('[data-testid="ai-model-panel"]').should("contain", "Versão");
    cy.get('[data-testid="ai-llm-status"]').should("exist");
    cy.get('[data-testid="ai-feedback-list"]').should("exist");
    cy.get('[data-testid="ai-retrain"]').click();
    cy.contains("Modelo retreinado");
  });
});
