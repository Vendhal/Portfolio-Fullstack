# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Build arguments
ARG VITE_API_BASE_URL
ARG VITE_ENVIRONMENT=production

# Environment variables
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ENVIRONMENT=${VITE_ENVIRONMENT}
ENV NODE_ENV=production

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm install

# Copy source code and build
COPY . .
RUN npm run build

# Development stage
FROM nginx:alpine AS development
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Production stage
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built application
COPY --from=build /app/dist .

# Copy optimized nginx configuration
COPY nginx-prod.conf /etc/nginx/conf.d/default.conf

# Add non-root user
RUN addgroup -g 1001 -S nginx && adduser -u 1001 -S nginx -G nginx

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Create nginx.pid file
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
