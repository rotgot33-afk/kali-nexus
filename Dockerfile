# ===============================================================
#  Kali Nexus — Heavy Compute Dockerfile
#  Built via GitHub Actions → pushed to ghcr.io
#  Render pulls the pre-built image (no build on Render)
# ===============================================================
FROM node:20-bookworm-slim

WORKDIR /app

# Install system dependencies needed for:
# 1. node-pty compilation (build-essential + python3)
# 2. Kali tools (nmap, tshark, tcpdump, etc.)
# 3. Common shell utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
      # Build tools for native Node modules
      build-essential \
      python3 \
      python3-dev \
      # Kali tools
      nmap \
      tshark \
      tcpdump \
      iputils-ping \
      iputils-tracepath \
      net-tools \
      iproute2 \
      dnsutils \
      whois \
      traceroute \
      netcat-openbsd \
      socat \
      curl \
      wget \
      git \
      jq \
      # Shell & utilities
      bash \
      zsh \
      fish \
      vim \
      nano \
      less \
      tree \
      htop \
      procps \
      psmisc \
      file \
      unzip \
      zip \
      ca-certificates \
      # Python pip + tools
      python3-pip \
      python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Set environment
ENV DEBIAN_FRONTEND=noninteractive
ENV TERM=xterm-256color
ENV COLORTERM=truecolor
ENV SHELL=/bin/bash

# Copy package files
COPY package*.json ./

# Install Node dependencies (including dev for node-pty compilation)
RUN npm install --include=dev || npm install

# Compile node-pty specifically (it needs build tools)
RUN npm rebuild node-pty 2>/dev/null || echo "[WARN] node-pty rebuild skipped"

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Clean dev dependencies to reduce image size
RUN npm prune --omit=dev || true

# Verify tools are installed
RUN echo "=== Installed tools verification ===" \
    && which nmap && nmap --version | head -1 \
    && which tshark && tshark --version | head -1 \
    && which tcpdump && tcpdump --version | head -1 \
    && which python3 && python3 --version \
    && which curl && curl --version | head -1 \
    && which bash && bash --version | head -1 \
    && echo "=== Node-pty check ===" \
    && node -e "import('node-pty').then(p => { const pty = (p.default || p); const t = pty.spawn('echo', ['pty_ok'], {name:'xterm',cols:80,rows:24}); t.onData(d => process.stdout.write(d)); t.onExit(() => process.exit(0)); setTimeout(() => process.exit(0), 1000); }).catch(e => { console.error('node-pty FAILED:', e.message); process.exit(1); })"

ENV PORT=10000
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Run the server
CMD ["node", "server/index.js"]
