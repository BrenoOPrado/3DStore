import { chromium } from "playwright";
import { join } from "path";

const media = join(
  "C:/Users/breno/OneDrive/Documentos/Projetos/LES/3Dproducts/docs/_pptx_work/extracted/ppt/media"
);
const base = "http://127.0.0.1:5173";

async function login(page, email, password) {
  await page.goto(`${base}/entrar`);
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="submit-login"]');
  await page.waitForSelector('[data-testid="logout"]');
}

async function shot(page, file) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(media, file), type: "png" });
  console.log("saved", file);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.addInitScript(() => {});
await page.request.post(`${base}/api/dev/reset`);
page.on("load", async () => {
  await page.addStyleTag({ content: ".chatbot{display:none!important}" }).catch(() => {});
});

await login(page, "admin@3dstore.com", "admin123");
await page.goto(`${base}/admin`);
await page.waitForSelector('[data-testid="sales-line-chart"]');
await page.click('[data-testid="chart-cat-vasos"]');
await page.click('[data-testid="chart-cat-decoracao"]');
await page.waitForTimeout(300);
await shot(page, "image25.png");

await page.goto(`${base}/admin/produtos`);
await page.waitForSelector('[data-testid="product-list"]');
await shot(page, "image28.png");

await page.goto(`${base}/admin/pedidos`);
await page.waitForSelector('[data-testid="admin-order-3DS-100001"]');
await shot(page, "image27.png");

await page.goto(`${base}/admin/cupons`);
await page.waitForSelector("text=Cupons");
await shot(page, "image29.png");

await page.goto(`${base}/admin/clientes`);
await page.waitForSelector('[data-testid="customer-filters"]');
await shot(page, "image26.png");

await page.click('[data-testid="logout"]');

await login(page, "ana.souza@email.com", "123456");
await page.goto(`${base}/produto/filtro-dino`);
await page.waitForSelector('[data-testid="add-to-cart"]');
await page.click('[data-testid="add-to-cart"]');
await page.waitForSelector("text=Adicionado");
await page.goto(`${base}/carrinho`);
await page.waitForSelector('[data-testid="cart-item-filtro-dino"]');
await shot(page, "image18.png");

await page.goto(`${base}/conta/pedidos`);
await page.waitForSelector('[data-testid="order-3DS-100001"]');
await shot(page, "image22.png");

await browser.close();
console.log("done");
