FROM node:20-slim AS build
WORKDIR /app

# Instalar dependencias del sistema y certificados
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

# Configurar npm y certificados
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV PYTHON=/usr/bin/python3
ENV NPM_CONFIG_PYTHON=/usr/bin/python3

# Configurar npm de forma segura
RUN npm config set strict-ssl false && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install -g npm@latest && \
    npm install -g @angular/cli

# Copiar package.json y realizar instalación de dependencias
COPY package*.json ./

# Instalar dependencias con retry
RUN for i in 1 2 3; \
    do \
      npm install --no-optional --legacy-peer-deps --force && break || \
      if [ $i -lt 3 ]; then \
        sleep 5; \
        continue; \
      fi; \
      exit 1; \
    done

# Construir aplicación
COPY . .
RUN ng build --configuration production --verbose

# Etapa de producción
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Configurar nginx
RUN apk add --no-cache curl && \
    chown -R nginx:nginx /usr/share/nginx && \
    chmod -R 755 /usr/share/nginx

COPY --from=build /app/dist/browser .
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER nginx
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]