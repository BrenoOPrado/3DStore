import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PPTX_BASE_URL ?? "http://127.0.0.1:5173";
const OUT = path.resolve("docs/pptx-screens");
fs.mkdirSync(OUT, { recursive: true });
const HIDE = `.chatbot, .chatbot__fab { display: none !important; }`;

async function shot(page, name) {
  await page.addStyleTag({ content: HIDE }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), type: "png" });
  console.log("saved", name, page.url());
}

async function fillLogin(page, email, password) {
  await page.goto(BASE + "/entrar", { waitUntil: "networkidle", timeout: 60000 });
  await page.locator('[data-testid="email"]').fill(email);
  await page.locator('[data-testid="password"]').fill(password);
  await page.locator('[data-testid="submit-login"]').click();
  await page.waitForTimeout(800);
}

const browser = await chromium.launch({
  headless: true,
  channel: process.env.PPTX_BROWSER ?? "msedge",
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: "pt-BR",
});
const page = await context.newPage();

try {
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await shot(page, "image9");
  await page.goto(BASE + "/entrar", { waitUntil: "networkidle" });
  await shot(page, "image10");
  await page.goto(BASE + "/cadastro", { waitUntil: "networkidle" });
  await shot(page, "image11");
  await page.goto(BASE + "/catalogo", { waitUntil: "networkidle" });
  await shot(page, "image12");
  await page.goto(BASE + "/produto/filtro-dino", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "image13");

  await fillLogin(page, "ana.souza@email.com", "123456");
  await page.goto(BASE + "/produto/filtro-dino", { waitUntil: "networkidle" });
  const addBtn = page.getByRole("button", { name: /Adicionar|adicionar/i });
  if (await addBtn.count()) await addBtn.first().click();
  await page.waitForTimeout(400);
  await page.goto(BASE + "/carrinho", { waitUntil: "networkidle" });
  await shot(page, "image14");
  await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
  await shot(page, "image15");
  await page.locator("text=Cartões").first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  await shot(page, "image16");
  await page.evaluate(() => sessionStorage.setItem("3dstore-last-order-id", "3DS-100001"));
  await page.goto(BASE + "/pedido-confirmado", { waitUntil: "networkidle" });
  await shot(page, "image17");
  await page.goto(BASE + "/conta/pedidos/3DS-100001", { waitUntil: "networkidle" });
  await shot(page, "image18");
  await page.goto(BASE + "/conta/cartoes", { waitUntil: "networkidle" });
  await shot(page, "image19");
  await page.goto(BASE + "/conta/enderecos", { waitUntil: "networkidle" });
  await shot(page, "image20");

  await page.getByTestId("logout").click().catch(async () => {
    await page.getByRole("button", { name: "Sair" }).click();
  });
  await page.waitForTimeout(400);
  await fillLogin(page, "admin@3dstore.com", "admin123");
  await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
  await shot(page, "image21");
  await page.goto(BASE + "/admin/clientes", { waitUntil: "networkidle" });
  await shot(page, "image22");
  await page.goto(BASE + "/admin/pedidos", { waitUntil: "networkidle" });
  await shot(page, "image23");
  await page.goto(BASE + "/admin/produtos", { waitUntil: "networkidle" });
  await shot(page, "image24");
  await page.goto(BASE + "/admin/cupons", { waitUntil: "networkidle" });
  await shot(page, "image25");
} finally {
  await context.close();
  await browser.close();
}
