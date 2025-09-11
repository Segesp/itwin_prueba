# Multi-stage build for Urban Digital Twin Platform
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx cache directories
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp

# Set proper permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Labels for metadata
LABEL maintainer="Segesp" \
      version="1.0.0" \
      description="Urban Digital Twin Platform for Buenos Aires" \
      org.opencontainers.image.title="Gemelo Digital Urbano Buenos Aires" \
      org.opencontainers.image.description="Web platform for Buenos Aires urban digital twin" \
      org.opencontainers.image.source="https://github.com/Segesp/itwin_prueba" \
      org.opencontainers.image.version="1.0.0"

# Run nginx
CMD ["nginx", "-g", "daemon off;"]