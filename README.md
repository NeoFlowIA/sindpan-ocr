# SINDPAN OCR Service (v2)

- Liga em `PORT` (padrão 8080) e responde em `/health` e `/ocr`.
- Corrige restart loop causado por healthcheck: agora o healthcheck é em Node e respeita `PORT`.
- `SIGTERM`/`SIGINT` fazem shutdown gracioso (logs mais claros).

## Docker
```bash
docker build -t sindpan-ocr-service:v2 .
docker run --rm -e PORT=8080 -p 8080:8080 sindpan-ocr-service:v2
# se sua plataforma força PORT=80:
# docker run --rm -e PORT=80 -p 8080:80 sindpan-ocr-service:v2
```

## Teste
```bash
curl http://localhost:8080/health
curl -X POST http://localhost:8080/ocr -H "Content-Type: application/json" -d '{"url":"https://exemplo.com/nota.jpg"}'
```
