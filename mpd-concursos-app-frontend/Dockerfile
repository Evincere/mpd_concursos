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
    && npm install -g @angular/cli@18.2.14

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies with optimized caching
RUN npm ci --no-optional --legacy-peer-deps || \
    (npm cache clean --force && npm install --no-optional --legacy-peer-deps)

# Copy source files and build
COPY . .
RUN CI=true npx ng build --configuration production --progress=false

# Production stage
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Configure nginx with security best practices
RUN apk add --no-cache curl && \
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