# Etapa de construcción
FROM node:20-slim AS build
WORKDIR /app

# Instalar Python y herramientas de compilación necesarias
RUN apt-get update && apt-get install -y \
    python3 \
    python-is-python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copiar package*.json para la instalación inicial
COPY package*.json ./

# Eliminar package-lock.json si existe y hacer una instalación limpia
RUN rm -f package-lock.json && \
    npm cache clean --force && \
    npm install --no-optional

# Solucionar problema específico de rollup
RUN npm install @rollup/rollup-linux-x64-gnu || echo "Continuando sin @rollup/rollup-linux-x64-gnu"

# Copiar código fuente
COPY . .

# Compilar con CI=true para evitar problemas de interactividad
RUN CI=true npm run build

# Etapa de producción
FROM nginx:stable-alpine
COPY --from=build /app/dist/browser /usr/share/nginx/html

# Configuración de Nginx para Angular (manejo de rutas SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
