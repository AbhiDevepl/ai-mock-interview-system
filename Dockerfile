# ===========================================
# PrepWise - Single Container Production Dockerfile
# Runs Next.js + Python AI Agent in one container
# ===========================================

# ─── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# ─── Stage 2: Python Dependencies ──────────────────────────────────────────────
FROM python:3.11-slim AS python-deps

WORKDIR /app

COPY agent/requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install Python and runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    dumb-init \
    ffmpeg \
    curl \
    && rm -rf /var/cache/apk/*

# Set non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Copy Next.js standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Python dependencies
COPY --from=python-deps --chown=nextjs:nodejs /app/.local /home/nextjs/.local
COPY --from=python-deps --chown=nextjs:nodejs /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy Python agent files
COPY --chown=nextjs:nodejs agent/interview_agent.py .
COPY --chown=nextjs:nodejs start.sh .

# Create logs directory
RUN mkdir -p /app/logs && chown nextjs:nodejs /app/logs

# Switch to non-root user
USER nextjs

# Add Python binaries to PATH
ENV PATH="/home/nextjs/.local/bin:$PATH"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["sh", "start.sh"]
