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

# Stage 2: Serve static files with nginx
FROM nginx:alpine AS runtime

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built dist files to nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
