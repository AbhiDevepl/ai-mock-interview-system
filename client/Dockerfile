# Multi-stage build for frontend
# Stage 1: Build with Vite
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Accept build-time env vars for Vite
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# Stage 2: Serve static files with Caddy
FROM caddy:2-alpine AS runtime

# Copy custom Caddyfile for SPA routing and compression
COPY Caddyfile /etc/caddy/Caddyfile

# Copy built dist files to Caddy's file root
COPY --from=builder /app/dist /srv

# Caddy will auto-read Caddyfile on startup
EXPOSE 80

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

# Start Caddy with default config
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
