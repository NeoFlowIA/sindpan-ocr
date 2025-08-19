FROM node:20-slim

# Install native tesseract and languages (Portuguese + English) and ImageMagick (optional)
RUN apt-get update && \
    apt-get install -y tesseract-ocr tesseract-ocr-por tesseract-ocr-eng imagemagick && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./

EXPOSE 8080

# Healthcheck (simple curl to /health)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health | grep -q '"ok":true' || exit 1

CMD ["npm", "start"]
