import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const src = path.resolve("docs/PlanoTestes_Grupo.docx");
const dest = path.join(os.tmpdir(), "plano-testes-out");
const zip = path.join(os.tmpdir(), "plano-testes-out.zip");
fs.copyFileSync(src, zip);
execFileSync("powershell.exe", [
  "-NoProfile",
  "-Command",
  `if (Test-Path '${dest}') { Remove-Item -Recurse -Force '${dest}' }; Expand-Archive -LiteralPath '${zip}' -DestinationPath '${dest}' -Force`,
]);
const xml = fs.readFileSync(path.join(dest, "word", "document.xml"), "utf8");
const paras = [...xml.matchAll(/<w:p[\s\S]*?<\/w:p>/g)].map((m) =>
  [...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]).join("")
);
const nonempty = paras.filter((t) => t.trim());
const joined = nonempty.join("\n");
fs.writeFileSync("docs/_testplan_work/plano_paras.txt", nonempty.map((t, i) => `${String(i).padStart(4, " ")}| ${t}`).join("\n"));
console.log("paras", nonempty.length);
console.log("has EXEMPLO", /EXEMPLO/.test(joined));
console.log("has [Texto]", /\[Texto\]/.test(joined));
console.log("has [Funcionalidade]", /\[Funcionalidade\]/.test(joined));
console.log("CT count", (joined.match(/CT0\d\d  /g) || []).length);
console.log("RNF0035 in matrix", joined.includes("Código único de cliente"));
console.log("RF0038", joined.includes("EM PROCESSAMENTO"));
console.log("21,8 or 21,9", /21,[89]/.exec(joined)?.[0]);
