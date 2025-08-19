#!/usr/bin/env node
import { execFile } from "child_process";
import { argv, exit } from "process";

if (argv.length < 3) {
  console.error("uso: ocr-cli.js /caminho/para/nota.jpg");
  exit(2);
}

const imgPath = argv[2];

function runTesseract(img) {
  return new Promise((resolve, reject) => {
    const args = ["-l", "por+eng", "--psm", "6", img, "stdout", "--dpi", "300"];
    execFile("tesseract", args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      resolve(stdout.toString());
    });
  });
}

function parseFields(text) {
  const cnpjMatch = text.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
  const valorMatch = text.match(/(?:R?\$?\s*)(\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2})/);

  const cnpjCompact = cnpjMatch ? cnpjMatch[0].replace(/[^\d]/g, "") : null;
  const cnpj =
    cnpjCompact
      ? cnpjCompact.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
      : null;

  const valor = valorMatch
    ? parseFloat(valorMatch[1].replace(/\./g, "").replace(",", "."))
    : null;

  return { text, cnpj, cnpj_compact: cnpjCompact, valor, ok: Boolean(cnpj && valor) };
}

const text = await runTesseract(imgPath);
const out = parseFields(text);
console.log(JSON.stringify(out));
