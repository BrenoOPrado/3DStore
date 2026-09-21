import { spawn } from "node:child_process";
import http from "node:http";

const vite = spawn("npx vite --host 127.0.0.1 --port 5173 --strictPort", {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

function waitFor(url, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const ping = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      req.on("error", retry);
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timeout waiting for ${url}`));
        return;
      }
      setTimeout(ping, 300);
    };
    ping();
  });
}

try {
  await waitFor("http://127.0.0.1:5173/");
  const code = await new Promise((resolve) => {
    const cypress = spawn("npx cypress run", { stdio: "inherit", shell: true, env: process.env });
    cypress.on("exit", (c) => resolve(c ?? 1));
  });
  vite.kill("SIGTERM");
  process.exit(code);
} catch (err) {
  vite.kill("SIGTERM");
  console.error(err);
  process.exit(1);
}
