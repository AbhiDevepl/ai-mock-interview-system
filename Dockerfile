# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app/server

# Copy only manifests first for layer-cache efficiency
COPY server/package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: production image ──────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app/server

# Copy pruned node_modules from deps stage
COPY --from=deps /app/server/node_modules ./node_modules

# Copy server source
COPY server/ .

# Ownership
RUN chown -R appuser:appgroup /app/server

USER appuser

EXPOSE 8000

# Healthcheck — relies on /api/user/current-user returning 401 (not 5xx)
# which proves server + DB are up even without a valid token.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8000/api/user/current-user || exit 1

CMD ["node", "server.js"]
