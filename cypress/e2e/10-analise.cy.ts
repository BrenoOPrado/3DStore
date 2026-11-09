const ANA = { email: "ana.souza@email.com", password: "123456" };
const ADMIN = { email: "admin@3dstore.com", password: "admin123" };

describe("Analise grafica de vendas por categoria", () => {
  it("consulta uma categoria no periodo e soma so as vendas ENTREGUE", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin");
    cy.get('[data-testid="chart-start"]').clear().type("2026-01-01");
    cy.get('[data-testid="chart-end"]').clear().type("2026-12-31");
    cy.get('[data-testid="chart-cat-vasos"]').click();
    cy.get('[data-testid="chart-total-vasos"]').should("contain", "149,80");
    cy.get('[data-testid="sales-line-chart"]').should("exist");
    cy.get('[data-testid="chart-values-vasos"]').should("not.contain", "79,90");
    cy.get('[data-testid="chart-values-toggle-vasos"]').click();
    cy.get('[data-testid="chart-values-vasos"]').should("contain", "79,90");
    cy.get('[data-testid="chart-values-vasos"]').should("contain", "69,90");
    cy.get('[data-testid="chart-values-vasos"]').should("not.contain", "0,00");
  });

  it("compara duas ou mais categorias no periodo", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin");
    cy.get('[data-testid="chart-cat-vasos"]').click();
    cy.get('[data-testid="chart-cat-decoracao"]').click();
    cy.get('[data-testid="chart-series-vasos"]').should("exist");
    cy.get('[data-testid="chart-series-decoracao"]').should("exist");
    cy.get('[data-testid="chart-legend"]').should("contain", "Vasos");
    cy.get('[data-testid="chart-legend"]').should("contain", "Decoração");
    cy.get('[data-testid="chart-total-vasos"]').should("contain", "149,80");
    cy.get('[data-testid="chart-total-decoracao"]').should("contain", "159,90");
  });

  it("apresenta grafico de linhas com valores em reais agrupados por mes", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin");
    cy.get('[data-testid="sales-line-chart"]').should("exist");
    cy.get('[data-testid="chart-values"]').should("exist");
    cy.get('[data-testid="chart-values-toggle-vasos"]').click();
    cy.get('[data-testid="chart-values-vasos"]').should("contain", "R$");
    cy.get('[data-testid="chart-values-vasos"]').should("not.contain", "0,00");
  });

  it("alterar a data de inicio ou fim atualiza o grafico", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin");
    cy.get('[data-testid="chart-cat-vasos"]').click();
    cy.get('[data-testid="chart-total-vasos"]').should("contain", "149,80");
    cy.get('[data-testid="chart-end"]').clear().type("2026-01-31");
    cy.get('[data-testid="chart-total-vasos"]').should("contain", "79,90");
    cy.get('[data-testid="chart-total-vasos"]').should("not.contain", "149,80");
  });

  it("compra com status diferente de ENTREGUE nao entra no grafico", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin");
    cy.get('[data-testid="chart-cat-utilitarios"]').click();
    cy.get('[data-testid="chart-total-utilitarios"]').should("contain", "89,90");
    cy.get('[data-testid="chart-total-utilitarios"]').should("not.contain", "179,80");
  });

  it("compra que passa a ENTREGUE no periodo aparece na consulta seguinte", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin");
    cy.get('[data-testid="chart-cat-utilitarios"]').click();
    cy.get('[data-testid="chart-total-utilitarios"]').should("contain", "89,90");

    cy.visit("/admin/pedidos/3DS-100002");
    cy.get('[data-testid="admin-status-EM_TRANSPORTE"]').click();
    cy.get('[data-testid="admin-status-ENTREGUE"]').click();

    cy.visit("/admin");
    cy.get('[data-testid="chart-cat-utilitarios"]').click();
    cy.get('[data-testid="chart-total-utilitarios"]').should("contain", "179,80");
  });

  it("acesso ao grafico e permitido ao administrador e negado a outros perfis", () => {
    cy.resetStore();
    cy.loginAs(ANA.email, ANA.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin");
    cy.url().should("include", "/conta");
    cy.request({
      url: "/api/admin/chart?start=2026-01-01&end=2026-12-31",
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403);
    });

    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.visit("/admin");
    cy.get('[data-testid="sales-line-chart"]').should("exist");
  });

  it("consulta responde em no maximo 1 segundo", () => {
    cy.resetStore();
    cy.loginAs(ADMIN.email, ADMIN.password);
    cy.get('[data-testid="logout"]').should("exist");
    cy.request("/api/admin/chart?start=2026-01-01T00:00:00.000Z&end=2026-12-31T23:59:59.000Z").then((res) => {
      expect(res.status).to.eq(200);
      const header = String(res.headers["x-response-time"] ?? "");
      expect(header).to.match(/\d+ms/);
      expect(Number.parseInt(header, 10)).to.be.lessThan(1000);
      expect(res.body.revenue).to.be.a("number");
    });
    cy.visit("/admin");
    cy.get('[data-testid="chart-timing"]').invoke("text").then((text) => {
      const ms = Number(text.replace(/\D/g, ""));
      expect(ms).to.be.lessThan(1000);
    });
  });
});
