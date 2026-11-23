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

async function shot(page, file, fullPage = false) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(media, file), type: "png", fullPage });
  console.log("saved", file);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.request.post(`${base}/api/dev/reset`);

await page.goto(`${base}/`);
await page.waitForSelector("text=3D Store");
await shot(page, "image13.png");

await page.goto(`${base}/entrar`);
await shot(page, "image14.png");

await page.goto(`${base}/cadastro`);
await shot(page, "image15.png");

await page.goto(`${base}/catalogo`);
await page.waitForSelector("text=Catálogo");
await shot(page, "image16.png");

await page.goto(`${base}/produto/filtro-dino`);
await page.waitForSelector('[data-testid="add-to-cart"]');
await shot(page, "image17.png");

await login(page, "ana.souza@email.com", "123456");
await page.goto(`${base}/produto/filtro-dino`);
await page.click('[data-testid="add-to-cart"]');
await page.waitForTimeout(400);
await page.goto(`${base}/carrinho`);
await page.waitForSelector('[data-testid="cart-item-filtro-dino"]');
await shot(page, "image18.png");

await page.goto(`${base}/checkout`);
await page.waitForTimeout(500);
await shot(page, "image19.png");
await shot(page, "image20.png");

await page.goto(`${base}/conta/pedidos`);
await page.waitForSelector('[data-testid="order-3DS-100001"]');
await shot(page, "image22.png");

await page.goto(`${base}/conta/cartoes`);
await shot(page, "image23.png");

await page.goto(`${base}/conta/enderecos`);
await shot(page, "image24.png");

await page.goto(`${base}/`);
await page.getByTestId("chatbot-fab").click();
await page.waitForSelector('[data-testid="chatbot-panel"]');
await page.getByTestId("chatbot-input").fill("recomenda algo para mim");
await page.getByTestId("chatbot-send").click();
await page.waitForSelector('[data-testid="chat-bot-msg"]');
await page.waitForTimeout(2500);
await shot(page, "image30.png"); // novo: chatbot

await page.click('[data-testid="logout"]');
await login(page, "admin@3dstore.com", "admin123");

await page.goto(`${base}/admin`);
await page.waitForSelector('[data-testid="sales-line-chart"]');
await page.click('[data-testid="chart-cat-vasos"]');
await page.click('[data-testid="chart-cat-decoracao"]');
await page.waitForTimeout(400);
await shot(page, "image25.png");

await page.goto(`${base}/admin/clientes`);
await page.waitForSelector('[data-testid="customer-filters"]');
await shot(page, "image26.png");

await page.goto(`${base}/admin/pedidos`);
await shot(page, "image27.png");

await page.goto(`${base}/admin/produtos`);
await page.waitForSelector('[data-testid="product-list"]');
await shot(page, "image28.png");

await page.goto(`${base}/admin/cupons`);
await shot(page, "image29.png");

await page.goto(`${base}/admin/ia`);
await page.waitForSelector('[data-testid="ai-model-panel"]');
await shot(page, "image31.png"); // novo: admin IA

await browser.close();
console.log("done capture-screens-2026");
