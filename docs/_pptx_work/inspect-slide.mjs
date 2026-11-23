import { readFileSync } from "fs";
const file = process.argv[2] || "slide3.xml";
const xml = readFileSync(
  `C:/Users/breno/OneDrive/Documentos/Projetos/LES/3Dproducts/docs/_pptx_work/extracted/ppt/slides/${file}`,
  "utf8"
);
const texts = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map((m) => m[1]);
texts.forEach((t, i) => console.log(`${i}: ${t}`));
