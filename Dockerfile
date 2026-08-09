FROM node:20-slim

WORKDIR /app

# Install lighter set of system dependencies (Render free tier has build time limit)
# We skip metasploit-framework (huge) and tshark (heavy) for now — they can be installed
# at runtime via the Real Shell if needed.
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
      build-essential \
      python3-dev \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV DEBIAN_FRONTEND=noninteractive

COPY package*.json ./
RUN npm install --omit=dev || npm install

COPY . .
RUN npm run build

ENV PORT=10000
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "server/index.js"]
