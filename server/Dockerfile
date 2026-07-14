# Multi-stage build for backend
# Stage 1: Dependencies installation
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Validate critical environment variables at startup
RUN echo '#!/bin/sh' > /startup.sh && \
    echo 'if [ -z "$GROQ_API_KEY" ]; then echo "ERROR: GROQ_API_KEY is not set" >&2; exit 1; fi' >> /startup.sh && \
    echo 'if [ -z "$MONGODB_URL" ]; then echo "ERROR: MONGODB_URL is not set" >&2; exit 1; fi' >> /startup.sh && \
    echo 'if [ -z "$JWT_SECRET" ]; then echo "ERROR: JWT_SECRET is not set" >&2; exit 1; fi' >> /startup.sh && \
    echo 'exec node server.js' >> /startup.sh && \
    chmod +x /startup.sh

# Switch to non-root user
USER nodejs

# Expose backend port
EXPOSE 5000

# Health check: polls server readiness
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# ESM-compatible entrypoint with env var validation
CMD ["/startup.sh"]
