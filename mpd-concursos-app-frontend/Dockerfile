FROM node:20-slim AS build
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Actualizar npm y limpiar cache
RUN npm install -g npm@latest && \
    npm cache clean --force

# Configuraciones críticas de entorno
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV PYTHON=/usr/bin/python3

# Instalar Angular CLI específico para el proyecto
RUN npm install -g @angular/cli@latest

# Copiar SOLO package.json (ignorar lock file)
COPY package.json .

# Instalación robusta de dependencias con limpieza
RUN for i in 1 2 3; \
    do \
      echo "Intento de instalación $i"; \
      rm -rf node_modules package-lock.json && \
      npm install --no-optional --legacy-peer-deps --no-audit --no-fund && break || \
      (echo "Falló intento $i, reintentando..." && sleep 10); \
    done

# Copiar código fuente después de instalar dependencias
COPY . .

# Compilación con parámetros de optimización
RUN CI=true NODE_OPTIONS="--max-old-space-size=4096" \
    npx ng build --configuration production --aot --build-optimizer

# Etapa de producción
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Configurar nginx y permisos
RUN apk add --no-cache curl && \
    chown -R nginx:nginx /usr/share/nginx && \
    chmod -R 755 /usr/share/nginx && \
    rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/browser .
COPY nginx.conf /etc/nginx/conf.d/

USER nginx
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]