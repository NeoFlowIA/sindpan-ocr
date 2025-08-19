# SINDPAN OCR Service (Express + Tesseract)

Microserviço HTTP para OCR de notas (CNPJ + Valor) usando **tesseract-ocr nativo**.

## Endpoints

- `GET /health` → healthcheck `{ ok: true }`
- `POST /ocr` → envia **arquivo** (multipart) em `file` **ou** JSON `{ "url": "https://.../nota.jpg" }`

### Exemplo (curl)
```bash
# via URL
curl -X POST http://localhost:8080/ocr \
  -H "Content-Type: application/json" \
  -d '{"url":"https://exemplo.com/nota.jpg"}'

# via arquivo local
curl -X POST http://localhost:8080/ocr \
  -F "file=@/caminho/nota.jpg"
```

Resposta:
```json
{
  "text": "...texto completo extraído...",
  "cnpj": "12.345.678/0001-90",
  "cnpj_compact": "12345678000190",
  "valor": 60.0,
  "ok": true
}
```

## Rodando com Docker

```bash
docker build -t sindpan-ocr-service .
docker run --rm -p 8080:8080 sindpan-ocr-service
# Health: http://localhost:8080/health
```

## Integração com n8n

1. **HTTP Request (POST)** → `http://seu-host:8080/ocr`
2. Body:
   - **Multipart** com `file` **ou** JSON `{ "url": "https://..." }`
3. Parseie o JSON de resposta e siga com sua lógica (lookup padaria, ticket médio, etc.).

## Observações

- Para melhorar a acurácia, considere **pré-processar** a imagem (binarização/contraste). Um exemplo com ImageMagick está comentado no `server.js`.
- Idiomas Tesseract: `por+eng` já instalados no Dockerfile. Ajuste conforme sua necessidade.
- Se quiser rodar **sem Docker**, instale no host:
  ```bash
  sudo apt-get update && sudo apt-get install -y tesseract-ocr tesseract-ocr-por tesseract-ocr-eng imagemagick
  npm install
  npm start
  ```
