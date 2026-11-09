import fs from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const src = "C:\\Users\\breno\\Downloads\\ANEXO D - Relatorio Parcial - Breno Oliveira do Prado.docx";
const tmp = path.join(os.tmpdir(), "anexo-d.zip");
const dest = path.join(os.tmpdir(), "anexo-d");
fs.copyFileSync(src, tmp);
try {
  execFileSync("powershell.exe", [
    "-NoProfile",
    "-Command",
    `Expand-Archive -LiteralPath '${tmp}' -DestinationPath '${dest}' -Force`,
  ]);
} catch {
  /* ignore */
}
const xml = fs.readFileSync(path.join(dest, "word", "document.xml"), "utf8");
const texts = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" ");
const hits = texts.match(/RA[:\s]*[\d.]+|\d{11}|\d{13}/g);
console.log(texts.slice(0, 1500));
console.log("HITS", hits);
