import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const out = path.resolve("docs/_uc_work/screens");
fs.mkdirSync(out, { recursive: true });
await fetch("http://127.0.0.1:5173/api/dev/reset", { method: "POST" });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const page = await context.newPage();

async function shot(name) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: false });
}

await page.goto("http://127.0.0.1:5173/catalogo", { waitUntil: "networkidle" });
await shot("01-catalogo");

await page.goto("http://127.0.0.1:5173/produto/vaso-zen", { waitUntil: "networkidle" });
await shot("02-produto");

await page.goto("http://127.0.0.1:5173/entrar", { waitUntil: "networkidle" });
await page.getByTestId("email").fill("ana.souza@email.com");
await page.getByTestId("password").fill("123456");
await page.getByTestId("submit-login").click();
await page.waitForTimeout(800);

await page.goto("http://127.0.0.1:5173/produto/vaso-zen", { waitUntil: "networkidle" });
const add = page.getByRole("button", { name: /adicionar|comprar|carrinho/i }).first();
if (await add.count()) await add.click();
await page.waitForTimeout(400);

await page.goto("http://127.0.0.1:5173/carrinho", { waitUntil: "networkidle" });
await shot("03-carrinho");

await page.goto("http://127.0.0.1:5173/checkout", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await shot("04-checkout");
await page.evaluate(() => window.scrollTo(0, 700));
await shot("05-checkout-pagamento");

await page.goto("http://127.0.0.1:5173/conta/pedidos", { waitUntil: "networkidle" });
await shot("06-pedidos-cliente");

const firstOrder = page.locator("a.order-row, a.panel").first();
if (await firstOrder.count()) {
  await firstOrder.click();
  await page.waitForTimeout(500);
  await shot("07-pedido-detalhe");
}

await page.goto("http://127.0.0.1:5173/conta/cupons", { waitUntil: "networkidle" });
await shot("08-cupons");

await page.goto("http://127.0.0.1:5173/entrar", { waitUntil: "networkidle" });
if (await page.getByTestId("logout").count()) await page.getByTestId("logout").click();
await page.waitForTimeout(300);
await page.goto("http://127.0.0.1:5173/entrar", { waitUntil: "networkidle" });
await page.getByTestId("email").fill("admin@3dstore.com");
await page.getByTestId("password").fill("admin123");
await page.getByTestId("submit-login").click();
await page.waitForURL(/\/admin/);
await page.waitForTimeout(500);

await page.goto("http://127.0.0.1:5173/admin/pedidos", { waitUntil: "networkidle" });
await shot("09-admin-pedidos");

const adminOrder = page.locator("a.order-row, a.panel").first();
if (await adminOrder.count()) {
  await adminOrder.click();
  await page.waitForTimeout(500);
  await shot("10-admin-pedido-detalhe");
}

await browser.close();
console.log(fs.readdirSync(out).join("\n"));
