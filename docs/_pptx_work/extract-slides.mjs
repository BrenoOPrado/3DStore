import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const dir = "C:/Users/breno/OneDrive/Documentos/Projetos/LES/3Dproducts/docs/_pptx_work/extracted/ppt/slides";
const files = readdirSync(dir)
  .filter((f) => /^slide\d+\.xml$/.test(f))
  .sort((a, b) => parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10));

let out = "";
for (const f of files) {
  const xml = readFileSync(join(dir, f), "utf8");
  const texts = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map((m) => decode(m[1]));
  const relsPath = join(dir, "_rels", `${f}.rels`);
  let images = [];
  try {
    const rels = readFileSync(relsPath, "utf8");
    images = [...rels.matchAll(/Target="([^"]+)"/g)].map((m) => m[1]);
  } catch {}
  out += `===== ${f} =====\n`;
  out += texts.join("\n") + "\n";
  out += `RELS: ${images.join(", ")}\n\n`;
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

writeFileSync("C:/Users/breno/OneDrive/Documentos/Projetos/LES/3Dproducts/docs/_pptx_work/slides.txt", out);
console.log("slides", files.length);
