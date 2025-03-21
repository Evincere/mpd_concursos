FROM node:20 AS build
WORKDIR /app

# Instalar dependencias del sistema con arquitectura explícita
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Configurar entorno para compilación multiplataforma
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV npm_config_arch=x64
ENV npm_config_platform=linux
ENV npm_config_target_arch=x64

# Forzar instalación limpia de npm
RUN corepack enable && corepack prepare npm@10.2.4 --activate

# Instalar Angular CLI específico
RUN npm install -g @angular/cli@16.2.0 --force

# Copiar solo package.json
COPY package.json .

# Instalación de dependencias con limpieza forzada
RUN for i in 1 2 3 4 5; do \
      echo "Intento $i/5"; \
      rm -rf node_modules package-lock.json && \
      npm install --legacy-peer-deps --force --no-audit --no-fund --loglevel verbose && \
      npx ngcc --properties es2015 browser module main && break || \
      (echo "Falló intento $i" && sleep 20); \
    done

# Copiar código fuente
COPY . .

# Compilación Angular con ajustes específicos
RUN ng build --configuration production --aot --build-optimizer --vendor-chunk

# Etapa de producción
FROM nginx:1.24-alpine
WORKDIR /usr/share/nginx/html

RUN apk add --no-cache curl && \
    chown -R nginx:nginx /usr/share/nginx && \
    chmod -R 755 /usr/share/nginx && \
    rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/browser .
COPY nginx.conf /etc/nginx/conf.d/

# Etapa de producción modificada
FROM nginx:1.24-alpine
WORKDIR /usr/share/nginx/html

# Configurar permisos antes de cambiar de usuario
RUN apk add --no-cache curl && \
    mkdir -p /var/cache/nginx /var/run/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/run/nginx && \
    chmod -R 755 /var/cache/nginx /var/run/nginx && \
    chown -R nginx:nginx /usr/share/nginx && \
    chmod -R 755 /usr/share/nginx && \
    rm -rf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/browser .
COPY nginx.conf /etc/nginx/conf.d/

# Cambiar usuario después de configurar los permisos
USER nginx

EXPOSE 80

# Healthcheck mejorado
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD nc -z localhost 80 || exit 1

CMD ["nginx", "-g", "daemon off;"]