import fs from "node:fs";

function paras(p) {
  const xml = fs.readFileSync(p, "utf8");
  const ps = [...xml.matchAll(/<w:p[\s\S]*?<\/w:p>/g)];
  const out = [];
  for (const m of ps) {
    const t = [...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((x) => x[1])
      .join("");
    if (t.trim()) {
      out.push(
        t
          .replaceAll("&amp;", "&")
          .replaceAll("&lt;", "<")
          .replaceAll("&gt;", ">")
          .replaceAll("&quot;", '"')
      );
    }
  }
  return out;
}

const t = paras("docs/_testplan_work/template/word/document.xml");
const e = paras("docs/_testplan_work/exemplo/word/document.xml");
fs.writeFileSync(
  "docs/_testplan_work/template_paras.txt",
  t.map((x, i) => String(i).padStart(4, " ") + "| " + x).join("\n")
);
fs.writeFileSync(
  "docs/_testplan_work/exemplo_paras.txt",
  e.map((x, i) => String(i).padStart(4, " ") + "| " + x).join("\n")
);
console.log("template paras", t.length, "exemplo paras", e.length);
