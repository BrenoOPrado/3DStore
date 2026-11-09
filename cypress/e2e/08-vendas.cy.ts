import { uniqueClient, apartamentoAddress } from "../support/commands";

const ANA = { email: "ana.souza@email.com", password: "123456" };

function applyCoupon(code: string) {
  cy.get('[data-testid="coupon-code"]').clear().type(code);
  cy.get('[data-testid="apply-coupon"]').click();
  cy.get(`[data-testid="coupon-chip-${code}"]`).should("exist");
}

function goCheckoutPickup() {
  cy.visit("/carrinho");
  cy.get('[data-testid="go-checkout"]').click();
  cy.get('[data-testid="checkout-form"]').should("exist");
  cy.get('[data-testid="shipping-retirada"]').click();
  cy.get('[data-testid="freight-note"]').should("contain", "4,90");
}

describe("Gestao de vendas", () => {
  it("inclui mais de um produto no carrinho, altera quantidade e impede estoque excedido", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");

    cy.addToCart("gancho-trex", 2);
    cy.addToCart("porta-alho", 1);

    cy.visit("/carrinho");
    cy.get('[data-testid="cart-item-gancho-trex"]').should("exist");
    cy.get('[data-testid="cart-item-porta-alho"]').should("exist");
    cy.get('[data-testid="qty-value-gancho-trex"]').should("contain", "2");
    cy.get('[data-testid="qty-plus-gancho-trex"]').click();
    cy.get('[data-testid="qty-value-gancho-trex"]').should("contain", "3");
    cy.get('[data-testid="qty-minus-gancho-trex"]').click();
    cy.get('[data-testid="qty-value-gancho-trex"]').should("contain", "2");

    cy.visit("/produto/escorredor-elefante");
    cy.get('[data-testid="product-stock"]').should("contain", "1");
    cy.get('[data-testid="qty-plus"]').should("be.disabled");
    cy.get('[data-testid="add-to-cart"]').click();
    cy.contains("Adicionado");
    cy.get('[data-testid="add-to-cart"]').click();
    cy.get('[data-testid="cart-error"]').should("contain", "estoque");

    cy.visit("/carrinho");
    cy.get('[data-testid="qty-plus-escorredor-elefante"]').should("be.disabled");
    cy.get('[data-testid="remove-escorredor-elefante"]').click();
    cy.get('[data-testid="cart-item-escorredor-elefante"]').should("not.exist");
  });

  it("compra com endereco e cartao previamente cadastrados e registra EM PROCESSAMENTO", () => {
    cy.resetStore();
    cy.request("/api/bootstrap").then((res) => {
      const header = String(res.headers["x-response-time"] ?? "");
      expect(header).to.match(/\d+ms/);
      expect(Number.parseInt(header, 10)).to.be.lessThan(1000);
    });

    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.addToCart("gancho-trex");
    goCheckoutPickup();
    cy.get('[data-testid="address-Casa"]').click();
    cy.payCard("1111", "3490");
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="order-status"]').should("contain", "Em processamento");
    cy.get('[data-testid="order-status-title"]').should("contain", "processamento");
    cy.get('[data-testid="order-current-status"]').should("contain", "Aprovada");

    cy.request("POST", "/api/auth/login", { email: "admin@3dstore.com", password: "admin123" });
    cy.request("/api/admin/logs").then((res) => {
      const logs = res.body.logs as { action: string; entity: string; userEmail: string }[];
      expect(logs.some((log) => log.entity === "pedido" && log.action === "insert")).to.eq(true);
      expect(logs.some((log) => log.userEmail === ANA.email)).to.eq(true);
    });
  });

  it("cadastra novo endereco e novo cartao durante a compra e incorpora ao perfil", () => {
    const client = uniqueClient("venda");
    cy.resetStore();
    cy.signupClient(client);
    cy.addToCart("gancho-trex");
    goCheckoutPickup();

    cy.get('[data-testid="address-new"]').click();
    cy.fillAddress(apartamentoAddress);
    cy.get('[data-testid="save-address"]').should("be.checked");
    cy.get('[data-testid="shipping-retirada"]').click();

    cy.get('[data-testid="toggle-new-card"]').click();
    cy.get('[data-testid="card-holder"]').type("MARIA QA SILVA");
    cy.get('[data-testid="card-number"]').type("4111111111111111");
    cy.get('[data-testid="card-brand"]').select("Visa");
    cy.get('[data-testid="card-expiry"]').type("1228");
    cy.get('[data-testid="card-cvv"]').type("123");
    cy.get('[data-testid="save-card"]').should("be.checked");
    cy.get('[data-testid="save-new-card"]').click();
    cy.get('[data-testid="pay-card-1111"]').should("exist");
    cy.payCard("1111", "3490");
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="order-status"]').should("contain", "Em processamento");
    cy.get('[data-testid="order-current-status"]').should("contain", "Aprovada");

    cy.visit("/conta/enderecos");
    cy.get('[data-testid="address-Apartamento"]').should("contain", "Oscar Freire");
    cy.visit("/conta/cartoes");
    cy.get('[data-testid="card-1111"]').should("contain", "Visa");
  });

  it("paga com mais de um cartao respeitando o minimo de R$ 10,00", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.addToCart("porta-alho");
    goCheckoutPickup();
    cy.get('[data-testid="address-Casa"]').click();
    cy.payCard("1111", "500");
    cy.payCard("4444", "3790");
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="checkout-error"]').should("contain", "R$ 10,00");

    cy.get('[data-testid="split-even"]').click();
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="order-status"]').should("contain", "Em processamento");
    cy.get('[data-testid="order-current-status"]').should("contain", "Aprovada");
  });

  it("paga com cupom e cartao abaixo de R$ 10,00 (RN0035)", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.addToCart("porta-alho");
    goCheckoutPickup();
    applyCoupon("TROCA35");
    cy.get('[data-testid="checkout-total"]').should("contain", "7,90");
    cy.payCard("1111", "790");
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="order-status"]').should("contain", "Em processamento");
    cy.get('[data-testid="order-current-status"]').should("contain", "Aprovada");
  });

  it("recusa cupons desnecessarios e gera cupom de troca da diferenca (RN0036)", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.addToCart("gancho-trex");
    goCheckoutPickup();
    applyCoupon("TROCA40");
    cy.get('[data-testid="coupon-code"]').clear().type("TROCA20");
    cy.get('[data-testid="apply-coupon"]').click();
    cy.get('[data-testid="coupon-msg"]').should("contain", "desnecessariamente");
    cy.get('[data-testid="coupon-chip-TROCA20"]').click();
    cy.get('[data-testid="coupon-excess"]').should("contain", "cupom de troca");
    cy.get('[data-testid="checkout-total"]').should("contain", "0,00");
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="order-status"]').should("contain", "Em processamento");
    cy.get('[data-testid="order-current-status"]').should("contain", "Aprovada");
    cy.get('[data-testid="generated-coupon"]').should("contain", "TROCA-");
    cy.get('[data-testid="generated-coupon"]').invoke("text").then((text) => {
      const code = text.match(/TROCA-[A-Z0-9-]+/)?.[0];
      expect(code).to.be.ok;
      cy.visit("/conta/cupons");
      cy.get(`[data-testid="coupon-${code}"]`).should("exist");
    });
  });
});
