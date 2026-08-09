FROM node:20-slim

WORKDIR /app

# Install system dependencies:
#  - nmap: network scanner
#  - metasploit-framework: real msfconsole
#  - tshark: packet capture (wireshark CLI)
#  - python3, curl, iputils-ping: common tools
#  - build-essential + python3: required to compile node-pty native module
RUN apt-get update && apt-get install -y --no-install-recommends \
      nmap \
      metasploit-framework \
      tshark \
      tcpdump \
      python3 \
      python3-pip \
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

# Allow tshark to run as non-root (cap_add NET_RAW on Render will handle permissions)
ENV DEBIAN_FRONTEND=noninteractive

COPY package*.json ./
RUN npm install --omit=dev || npm install

COPY . .
RUN npm run build

ENV PORT=10000
EXPOSE 10000

# Healthcheck hits /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "server/index.js"]
