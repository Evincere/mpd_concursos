FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias necesarias para compilación nativa
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    openssl

# Configurar entorno crítico
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Actualizar núcleo de npm y limpiar cache
RUN corepack enable && \
    corepack prepare npm@latest --activate && \
    npm cache clean --force

# Instalar Angular CLI específico
RUN npm install -g @angular/cli@latest --force

# Copiar solo package.json
COPY package.json .

# Instalación robusta de dependencias
RUN for i in 1 2 3; do \
      echo "Intento $i/3"; \
      rm -rf node_modules package-lock.json && \
      npm install --legacy-peer-deps --force --loglevel verbose && break || \
      (echo "Falló intento $i" && sleep 15); \
    done

# Copiar código fuente
COPY . .

# Compilación Angular optimizada
RUN ng config -g cli.cache.enabled false && \
    ng build --configuration production --aot --build-optimizer --progress=false

# Etapa de producción
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

RUN apk add --no-cache curl && \
    chown -R nginx:nginx /usr/share/nginx && \
    chmod -R 755 /usr/share/nginx && \
    rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/browser .
COPY nginx.conf /etc/nginx/conf.d/

USER nginx
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]