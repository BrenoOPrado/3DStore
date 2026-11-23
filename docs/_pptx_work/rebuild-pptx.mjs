import { execSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const work = "C:/Users/breno/OneDrive/Documentos/Projetos/LES/3Dproducts/docs/_pptx_work";
const extracted = join(work, "extracted");
const outPptx = join(work, "3D_Store_Projeto.pptx");
const downloads = "C:/Users/breno/Downloads/3D_Store_Projeto.pptx";
const zipPath = join(work, "rebuild.zip");

if (existsSync(zipPath)) rmSync(zipPath);
// Compress extracted folder contents into zip then rename to pptx
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${extracted}\\*' -DestinationPath '${zipPath}' -Force"`,
  { stdio: "inherit" }
);
copyFileSync(zipPath, outPptx);
copyFileSync(outPptx, downloads);
console.log("wrote", outPptx);
console.log("wrote", downloads);
