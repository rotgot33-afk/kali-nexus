FROM node:20-slim

WORKDIR /app

# Minimal system dependencies for runtime (no build tools — using prebuilt node-pty or fallback)
RUN apt-get update && apt-get install -y --no-install-recommends \
      nmap \
      python3 \
      curl \
      iputils-ping \
      net-tools \
      iproute2 \
      dnsutils \
      whois \
      git \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV DEBIAN_FRONTEND=noninteractive

# Install node deps (node-pty will use prebuilt binaries or fallback gracefully)
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts || npm install --omit=dev

COPY . .
RUN npm run build

ENV PORT=10000
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "server/index.js"]
