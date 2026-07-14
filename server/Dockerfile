# Multi-stage build for backend
# Stage 1: Dependencies
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

# Switch to non-root user
USER nodejs

# Expose backend port
EXPOSE 5000

# Health check: polls server startup readiness
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/auth/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# ESM-compatible entrypoint
CMD ["node", "server.js"]
