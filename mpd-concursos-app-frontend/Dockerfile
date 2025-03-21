# Build stage
FROM node:20-slim AS build
WORKDIR /app

# Install system dependencies and certificates (combined in one layer)
RUN apt-get update && apt-get install -y \
    python3 \
    python-is-python3 \
    make \
    g++ \
    ca-certificates \
    openssl \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Configure npm and certificates (combined in one layer)
ENV NODE_TLS_REJECT_UNAUTHORIZED=0 \
    PYTHON=/usr/bin/python3 \
    NPM_CONFIG_PYTHON=/usr/bin/python3

# Configure npm securely and install global packages (combined in one layer)
RUN npm config set strict-ssl false \
    && npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install -g npm@latest \
    && npm install -g @angular/cli@latest

# Copy package files for better layer caching
COPY package*.json ./

# Clean npm cache and install dependencies
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install --legacy-peer-deps

# Copy source files and build with optimized settings
COPY . .
RUN npm cache clean --force && \
    rm -rf /tmp/* && \
    NODE_OPTIONS="--max_old_space_size=8192" npm run build -- --configuration production --progress=false --optimization=true --aot=true

# Production stage
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Configure nginx with security best practices and create necessary directories
RUN apk add --no-cache curl && \
    mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
             /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/run && \
    chmod -R 755 /var/cache/nginx /var/run && \
    chown -R nginx:nginx /usr/share/nginx && \
    chmod -R 755 /usr/share/nginx && \
    rm -rf /var/cache/apk/*

# Copy build artifacts and config
COPY --from=build /app/dist/browser .
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER nginx
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]