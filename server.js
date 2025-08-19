import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import tmp from "tmp";

const app = express();
app.use(express.json({ limit: "10mb" }));

const upload = multer({ dest: os.tmpdir() });

// ---- Helpers ----
function runTesseract(imgPath) {
  return new Promise((resolve, reject) => {
    // lang: Portuguese + English; psm 6 = uniform block of text
    const args = ["-l", "por+eng", "--psm", "6", imgPath, "stdout", "--dpi", "300"];
    execFile("tesseract", args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.toString());
    });
  });
}

function parseFields(text) {
  const cnpjMatch = text.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
  const valorMatch = text.match(/(?:R?\$?\s*)(\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2})/);

  const cnpjCompact = cnpjMatch ? cnpjMatch[0].replace(/[^\d]/g, "") : null;
  const cnpj = cnpjCompact
    ? cnpjCompact.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    : null;

  const valor = valorMatch
    ? parseFloat(valorMatch[1].replace(/\./g, "").replace(",", "."))
    : null;

  return { text, cnpj, cnpj_compact: cnpjCompact, valor, ok: Boolean(cnpj && valor) };
}

// ---- Routes ----
// Healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "sindpan-ocr-service" });
});

// POST /ocr with multipart (file) OR JSON { url: "https://..." }
app.post("/ocr", upload.single("file"), async (req, res) => {
  try {
    let imgPath = req.file?.path;

    if (!imgPath && req.body?.url) {
      const r = await fetch(req.body.url);
      if (!r.ok) throw new Error("Falha ao baixar imagem");
      const buf = Buffer.from(await r.arrayBuffer());
      const tmpFile = tmp.fileSync({ postfix: ".jpg" });
      fs.writeFileSync(tmpFile.name, buf);
      imgPath = tmpFile.name;
    }

    if (!imgPath) return res.status(400).json({ error: "Envie 'file' (multipart) ou { url } em JSON" });

    // TODO (opcional): pré-processamento para melhorar contraste usando ImageMagick
    // Exemplo: binarização/normalize
    // await new Promise((resolve, reject) => {
    //   execFile("convert", [imgPath, "-colorspace", "Gray", "-normalize", "-threshold", "55%", imgPath],
    //     (err) => (err ? reject(err) : resolve()));
    // });

    const text = await runTesseract(imgPath);
    const out = parseFields(text);

    // Limpeza do arquivo temporário de upload
    if (req.file?.path) fs.unlink(req.file.path, () => {});

    return res.json(out);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Erro OCR" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`OCR server on :${PORT}`));
