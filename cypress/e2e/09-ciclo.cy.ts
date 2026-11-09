const ANA = { email: "ana.souza@email.com", password: "123456" };
const ADMIN = { email: "admin@3dstore.com", password: "admin123" };

function goCheckoutPickup() {
  cy.visit("/carrinho");
  cy.get('[data-testid="go-checkout"]').click();
  cy.get('[data-testid="checkout-form"]').should("exist");
  cy.get('[data-testid="shipping-retirada"]').click();
}

function applyCoupon(code: string) {
  cy.get('[data-testid="coupon-code"]').clear().type(code);
  cy.get('[data-testid="apply-coupon"]').click();
  cy.get(`[data-testid="coupon-chip-${code}"]`).should("exist");
}

describe("Ciclo de venda, estoque e troca", () => {
  it("compra aprovada com um cartao da baixa no estoque", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/produto/gancho-trex");
    cy.get('[data-testid="product-stock"]').should("contain", "8");
    cy.addToCart("gancho-trex");
    goCheckoutPickup();
    cy.get('[data-testid="address-Casa"]').click();
    cy.payCard("1111", "3490");
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="order-status"]').should("contain", "Em processamento");
    cy.get('[data-testid="order-current-status"]').should("contain", "Aprovada");
    cy.visit("/produto/gancho-trex");
    cy.get('[data-testid="product-stock"]').should("contain", "7");
  });

  it("bloqueia valor inferior a R$ 10,00 em um dos cartoes e aceita a divisao valida", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.addToCart("porta-alho");
    goCheckoutPickup();
    cy.payCard("1111", "500");
    cy.payCard("4444", "3790");
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="checkout-error"]').should("contain", "R$ 10,00");
    cy.get('[data-testid="split-even"]').click();
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="order-current-status"]').should("contain", "Aprovada");
  });

  it("permite cartao abaixo de R$ 10,00 com cupom promocional (RN0035)", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.addToCart("gancho-trex");
    goCheckoutPickup();
    applyCoupon("PROMO30");
    cy.get('[data-testid="checkout-total"]').should("contain", "4,90");
    cy.payCard("1111", "490");
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="order-current-status"]').should("contain", "Aprovada");
  });

  it("gera cupom de diferenca quando cupons de troca superam a compra", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.addToCart("gancho-trex");
    goCheckoutPickup();
    applyCoupon("TROCA40");
    cy.get('[data-testid="checkout-total"]').should("contain", "0,00");
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="generated-coupon"]').should("contain", "TROCA-");
    cy.get('[data-testid="generated-coupon"]').invoke("text").then((text) => {
      const code = text.match(/TROCA-[A-Z0-9-]+/)?.[0];
      expect(code).to.be.ok;
      cy.visit("/conta/cupons");
      cy.get(`[data-testid="coupon-${code}"]`).should("exist");
    });
  });

  it("reprova pagamento com CVV 000, desbloqueia itens e nao da baixa no estoque", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/produto/gancho-trex");
    cy.get('[data-testid="product-stock"]').should("contain", "8");
    cy.addToCart("gancho-trex");
    goCheckoutPickup();
    cy.payCard("1111", "3490");
    cy.get('[data-testid="pay-cvv-1111"]').clear().type("000");
    cy.get('[data-testid="confirm-order"]').click();
    cy.get('[data-testid="order-status"]').should("contain", "Em processamento");
    cy.get('[data-testid="order-current-status"]').should("contain", "Reprovada");
    cy.visit("/produto/gancho-trex");
    cy.get('[data-testid="product-stock"]').should("contain", "8");
    cy.visit("/carrinho");
    cy.contains("vazio");
  });

  it("expira o bloqueio, remove os itens e desabilita a compra", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.addToCart("gancho-trex");
    cy.addToCart("porta-alho");
    cy.expireLocks();
    cy.visit("/carrinho");
    cy.get('[data-testid="cart-expired"]').should("contain", "expiração");
    cy.get('[data-testid="cart-item-gancho-trex"]').should("not.exist");
    cy.get('[data-testid="go-checkout"]').should("be.disabled");
    cy.get('[data-testid="dismiss-expired"]').click();
    cy.get('[data-testid="cart-expired"]').should("not.exist");
  });

  it("administrador despacha APROVADA para EM TRANSPORTE e confirma ENTREGUE", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin/pedidos/3DS-100002");
    cy.get('[data-testid="admin-order-status"]').should("contain", "Aprovada");
    cy.get('[data-testid="admin-status-EM_TRANSPORTE"]').click();
    cy.get('[data-testid="admin-order-status"]').should("contain", "Em transporte");
    cy.get('[data-testid="admin-status-ENTREGUE"]').click();
    cy.get('[data-testid="admin-order-status"]').should("contain", "Entregue");
  });

  it("bloqueia troca de pedido que nao esta ENTREGUE", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/conta/pedidos/3DS-100002");
    cy.get('[data-testid="order-status-pill"]').should("contain", "Aprovada");
    cy.get('[data-testid="exchange-blocked"]').should("contain", "após a entrega");
    cy.get('[data-testid="request-exchange"]').should("not.exist");
  });

  it("troca um item de um pedido ENTREGUE e a compra inteira de outro", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin/pedidos/3DS-100002");
    cy.get('[data-testid="admin-status-EM_TRANSPORTE"]').click();
    cy.get('[data-testid="admin-status-ENTREGUE"]').click();

    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/conta/pedidos/3DS-100002");
    cy.get('[data-testid="request-exchange"]').click();
    cy.get('[data-testid="order-status-pill"]').should("contain", "Em troca");

    cy.visit("/conta/pedidos/3DS-100001");
    cy.get('[data-testid="request-exchange-whole"]').click();
    cy.get('[data-testid="order-status-pill"]').should("contain", "Em troca");
  });

  it("autoriza troca com notificacao, confirma recebimento, emite cupom e reentra estoque", () => {
    cy.resetStore();
    cy.visit("/produto/suporte-headset");
    cy.get('[data-testid="product-stock"]').invoke("text").then((beforeText) => {
      const before = Number(beforeText.replace(/\D/g, "")) || 20;

      cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
      cy.visit("/admin/pedidos");
      cy.get('[data-testid="admin-order-3DS-100004"]').should("contain", "Em troca");
      cy.visit("/admin/pedidos/3DS-100004");
      cy.get('[data-testid="admin-status-TROCA_AUTORIZADA"]').click();
      cy.get('[data-testid="admin-order-status"]').should("contain", "Troca autorizada");

      cy.loginAs("carla.mendes@email.com", "123456");
    cy.get('[data-testid="logout"]').should("exist");
      cy.visit("/conta/pedidos/3DS-100004");
      cy.get('[data-testid="exchange-notification"]').should("contain", "autorizada");
      cy.get('[data-testid="nav-notifications"]').should("contain", "aviso");

      cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
      cy.visit("/admin/pedidos/3DS-100004");
      cy.get('[data-testid="admin-status-TROCADO"]').click();
      cy.get('[data-testid="admin-order-status"]').should("contain", "Trocado");

      cy.loginAs("carla.mendes@email.com", "123456");
    cy.get('[data-testid="logout"]').should("exist");
      cy.visit("/conta/pedidos/3DS-100004");
      cy.get('[data-testid="exchange-coupon"]').should("contain", "TROCA-");
      cy.get('[data-testid="exchange-coupon"]').invoke("text").then((text) => {
        const code = text.match(/TROCA-[A-Z0-9-]+/)?.[0];
        expect(code).to.be.ok;
        cy.visit("/conta/cupons");
        cy.get(`[data-testid="coupon-${code}"]`).should("exist");
        cy.visit("/produto/suporte-headset");
        cy.get('[data-testid="product-stock"]').should("contain", String(before + 1));
      });
    });
  });

  it("usa o cupom de troca gerado em uma nova compra", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin/pedidos/3DS-100005");
    cy.get('[data-testid="admin-status-TROCADO"]').click();
    cy.get('[data-testid="admin-order-status"]').should("contain", "Trocado");

    cy.loginAs("carla.mendes@email.com", "123456");
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/conta/pedidos/3DS-100005");
    cy.get('[data-testid="exchange-coupon"]').invoke("text").then((text) => {
      const code = text.match(/TROCA-[A-Z0-9-]+/)?.[0];
      expect(code).to.be.ok;
      cy.addToCart("gancho-trex");
      goCheckoutPickup();
      applyCoupon(code!);
      cy.get('[data-testid="checkout-total"]').should("not.contain", "34,90");
      cy.get('[data-testid="confirm-order"]').click();
      cy.get('[data-testid="order-current-status"]').should("contain", "Aprovada");
    });
  });

  it("impede dois cupons promocionais e o uso de cupom de outro cliente", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.addToCart("porta-alho");
    goCheckoutPickup();
    applyCoupon("PRINT10");
    cy.get('[data-testid="coupon-code"]').clear().type("BEMVINDO20");
    cy.get('[data-testid="apply-coupon"]').click();
    cy.get('[data-testid="coupon-msg"]').should("contain", "promocional");
  });
});
