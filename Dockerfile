FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      nmap curl iputils-ping ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build

ENV PORT=10000
EXPOSE 10000

CMD ["node", "server/index.js"]
