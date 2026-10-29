# ------------------------------------------------------------------------------
# Stage 1: Build Vite React Production Bundle
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Cache package dependencies
COPY package*.json ./
RUN npm ci || npm install

# Build arguments for Vite client environment
ARG VITE_API_URL=http://localhost:8000/api/v1
ARG VITE_CLERK_PUBLISHABLE_KEY=pk_test_aW5jbHVkZWQtZWxlcGhhbnQtODYwMC5jbGVyay5hY2NvdW50cy5kZXYk

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Copy frontend source and build static artifacts
COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Nginx Server (Lightweight, ~25MB)
# ------------------------------------------------------------------------------
FROM nginx:alpine

# Clear default static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy optimized SPA nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
