FROM node:20-slim

# Avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install tesseract and languages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      tesseract-ocr tesseract-ocr-por tesseract-ocr-eng ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./

# Default port (can be overridden by platform)
ENV PORT=8080
EXPOSE 8080

# Healthcheck using node (works with any PORT)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "http=require('http');p=process.env.PORT||8080;http.get('http://127.0.0.1:'+p+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["npm", "start"]
