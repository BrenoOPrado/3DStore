export type TestClient = {
  name: string;
  email: string;
  cpf: string;
  password: string;
  birthDate: string;
  phoneDdd: string;
  phoneNumber: string;
};

export type TestAddress = {
  label: string;
  street: string;
  number: string;
  neighborhood: string;
  cep: string;
  city: string;
  state: string;
  country?: string;
};

function cpfDigit(base: string, factor: number) {
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factor - i);
  const rest = (sum * 10) % 11;
  return String(rest === 10 ? 0 : rest);
}

export function cpfFromBase(base9: string) {
  const n = base9.replace(/\D/g, "").padStart(9, "0").slice(-9);
  const d1 = cpfDigit(n, 10);
  const d2 = cpfDigit(n + d1, 11);
  return n + d1 + d2;
}

export function uniqueClient(prefix = "maria"): TestClient {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 999)}`;
  return {
    name: "Maria QA Silva",
    email: `${prefix}.${stamp}@email.com`,
    cpf: cpfFromBase(stamp.slice(-9)),
    password: "Senha@123",
    birthDate: "1995-04-18",
    phoneDdd: "11",
    phoneNumber: "988776655",
  };
}

export const casaAddress: TestAddress = {
  label: "Casa",
  street: "Augusta",
  number: "1500",
  neighborhood: "Consolacao",
  cep: "01310100",
  city: "Sao Paulo",
  state: "SP",
  country: "Brasil",
};

export const trabalhoAddress: TestAddress = {
  label: "Trabalho",
  street: "Paulista",
  number: "1000",
  neighborhood: "Bela Vista",
  cep: "01311100",
  city: "Sao Paulo",
  state: "SP",
  country: "Brasil",
};

export const apartamentoAddress: TestAddress = {
  label: "Apartamento",
  street: "Oscar Freire",
  number: "200",
  neighborhood: "Jardins",
  cep: "01426001",
  city: "Sao Paulo",
  state: "SP",
  country: "Brasil",
};

declare global {
  namespace Cypress {
    interface Chainable {
      resetStore(): Chainable<void>;
      fillAddress(address?: Partial<TestAddress>): Chainable<void>;
      fillSignup(client: TestClient, address?: Partial<TestAddress>): Chainable<void>;
      signupClient(client: TestClient, address?: Partial<TestAddress>): Chainable<void>;
      loginAs(email: string, password: string): Chainable<void>;
      logoutUi(): Chainable<void>;
      addToCart(productId: string, qty?: number): Chainable<void>;
      payCard(last4: string, amountDigits: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("resetStore", () => {
  cy.request("POST", "/api/dev/reset");
  cy.visit("/", {
    onBeforeLoad(win) {
      win.localStorage.clear();
      win.sessionStorage.clear();
    },
  });
});

Cypress.Commands.add("fillAddress", (address = {}) => {
  const a = { ...casaAddress, ...address };
  cy.get('[data-testid="addr-label"]').clear().type(a.label);
  cy.get('[data-testid="addr-street"]').clear().type(a.street);
  cy.get('[data-testid="addr-number"]').clear().type(a.number);
  cy.get('[data-testid="addr-neighborhood"]').clear().type(a.neighborhood);
  cy.get('[data-testid="addr-cep"]').clear().type(a.cep);
  cy.get('[data-testid="addr-city"]').clear().type(a.city);
  cy.get('[data-testid="addr-state"]').clear().type(a.state);
  if (a.country) {
    cy.get('[data-testid="addr-country"]').clear().type(a.country);
  }
});

Cypress.Commands.add("fillSignup", (client, address) => {
  cy.get('[data-testid="name"]').clear().type(client.name);
  cy.get('[data-testid="email"]').clear().type(client.email);
  cy.get('[data-testid="cpf"]').clear().type(client.cpf);
  cy.get('[data-testid="gender"]').select("Feminino");
  cy.get('[data-testid="birth-date"]').clear().type(client.birthDate);
  cy.get('[data-testid="phone-type"]').select("celular");
  cy.get('[data-testid="phone-ddd"]').clear().type(client.phoneDdd);
  cy.get('[data-testid="phone-number"]').clear().type(client.phoneNumber);
  cy.get('[data-testid="password"]').clear().type(client.password, { log: false });
  cy.get('[data-testid="password-confirm"]').clear().type(client.password, { log: false });
  cy.fillAddress(address);
});

Cypress.Commands.add("signupClient", (client, address) => {
  cy.visit("/cadastro");
  cy.fillSignup(client, address);
  cy.get('[data-testid="submit-signup"]').click();
  cy.contains("Consultar e alterar cadastro");
  cy.get('[data-testid="profile-summary"]').should("contain", client.email);
});

Cypress.Commands.add("loginAs", (email, password) => {
  cy.visit("/entrar");
  cy.get('[data-testid="email"]').clear().type(email);
  cy.get('[data-testid="password"]').clear().type(password, { log: false });
  cy.get('[data-testid="submit-login"]').click();
});

Cypress.Commands.add("logoutUi", () => {
  cy.get('[data-testid="logout"]').click();
});

Cypress.Commands.add("addToCart", (productId, qty = 1) => {
  cy.visit(`/produto/${productId}`);
  cy.get('[data-testid="add-to-cart"]').should("exist");
  if (qty > 1) {
    for (let i = 1; i < qty; i++) {
      cy.get('[data-testid="qty-plus"]').click();
    }
  }
  cy.get('[data-testid="qty-value"]').should("contain", String(qty));
  cy.get('[data-testid="add-to-cart"]').click();
  cy.contains("Adicionado");
});

Cypress.Commands.add("payCard", (last4, amountDigits) => {
  cy.get(`[data-testid="pay-amount-${last4}"]`).clear().type(amountDigits);
});

export {};
