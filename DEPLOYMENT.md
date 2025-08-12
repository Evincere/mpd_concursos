# Guía de Deployment en Producción - MPD Concursos

## Problemas Resueltos

### 1. Inconsistencias en Configuración
- ✅ **Corregido**: `docker compose.prod.yml` ahora usa perfil `prod` correctamente
- ✅ **Corregido**: Variables de entorno con valores por defecto seguros
- ✅ **Corregido**: Configuración JPA más flexible (`update` en lugar de `validate`)

### 2. Variables de Entorno Mejoradas
- ✅ **Agregado**: Soporte para todas las variables de configuración necesarias
- ✅ **Agregado**: Valores por defecto seguros para desarrollo
- ✅ **Agregado**: Configuración de pool de conexiones de base de datos

### 3. Script de Deployment Automatizado
- ✅ **Creado**: Script `deploy-production.sh` con validaciones
- ✅ **Agregado**: Backup automático de base de datos
- ✅ **Agregado**: Validación de variables de entorno
- ✅ **Agregado**: Logging mejorado y manejo de errores

## Requisitos Previos

1. **Docker y Docker Compose** instalados
2. **Archivo `.env.production`** configurado correctamente
3. **Acceso al servidor** de producción
4. **Base de datos MySQL** disponible

## Configuración de Variables de Entorno

### Archivo `.env.production`

El archivo `.env.production` debe contener las siguientes variables:

```bash
# Base de datos MySQL
MYSQL_ROOT_PASSWORD=tu_password_root_seguro
MYSQL_DATABASE=mpd_concursos
MYSQL_USER=mpd_user
MYSQL_PASSWORD=tu_password_usuario_seguro

# Configuración del servidor
SERVER_HOST=149.50.132.23
SERVER_PORT_FRONTEND=8000
SERVER_PORT_BACKEND=8080
SERVER_PORT_MYSQL=3307

# Configuración de seguridad JWT
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro_minimo_256_bits
JWT_EXPIRATION=86400000

# Configuración CORS
CORS_ALLOWED_ORIGINS=https://149.50.132.23:8000,http://149.50.132.23:8000

# Configuración de base de datos
DB_POOL_SIZE=10
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=600000

# Configuración de memoria Java
JAVA_OPTS=-Xmx1g -Xms512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200
```

## Comandos de Deployment

### 1. Deployment Completo
```bash
./deploy-production.sh deploy
```

### 2. Solo Validar Configuración
```bash
./deploy-production.sh validate
```

### 3. Solo Hacer Backup
```bash
./deploy-production.sh backup
```

### 4. Ver Logs
```bash
./deploy-production.sh logs
```

### 5. Ver Estado de Servicios
```bash
./deploy-production.sh status
```

## Proceso de Deployment

1. **Validación**: El script valida que todas las variables de entorno estén configuradas
2. **Backup**: Se crea un backup automático de la base de datos existente
3. **Limpieza**: Se detienen servicios existentes y se limpian imágenes antiguas
4. **Build**: Se construyen las nuevas imágenes Docker
5. **Deploy**: Se levantan los servicios en producción
6. **Verificación**: Se verifica el estado de los servicios y se muestran los logs

## Solución de Problemas

### Error: Variables de entorno faltantes
```bash
# Ejecutar validación para ver qué variables faltan
./deploy-production.sh validate
```

### Error: Conexión a base de datos
1. Verificar que las credenciales en `.env.production` sean correctas
2. Verificar que el puerto de MySQL (3307) esté disponible
3. Revisar logs del contenedor MySQL:
```bash
docker compose -f docker compose.prod.yml logs mysql
```

### Error: CORS en frontend
1. Verificar que `CORS_ALLOWED_ORIGINS` incluya la URL correcta del frontend
2. Verificar que el frontend esté configurado para usar la URL correcta del backend

### Error: JWT Token
1. Verificar que `JWT_SECRET` tenga al menos 256 bits (32 caracteres)
2. Verificar que `JWT_EXPIRATION` esté configurado correctamente

## Monitoreo

### Ver logs en tiempo real
```bash
docker compose -f docker compose.prod.yml logs -f
```

### Ver logs específicos del backend
```bash
docker compose -f docker compose.prod.yml logs -f backend
```

### Ver estado de recursos
```bash
docker stats
```

## Rollback

En caso de problemas, puedes hacer rollback:

1. **Detener servicios actuales**:
```bash
docker compose -f docker compose.prod.yml down
```

2. **Restaurar backup de base de datos**:
```bash
# Encontrar el backup más reciente en ./backups/
# Restaurar usando docker exec
```

3. **Levantar versión anterior**:
```bash
# Usar imagen anterior o código anterior
docker compose -f docker compose.prod.yml up -d
```

## URLs de Producción

Después del deployment exitoso, los servicios estarán disponibles en:

- **Frontend**: http://149.50.132.23:8000
- **Backend**: http://149.50.132.23:8080
- **API**: http://149.50.132.23:8080/api
- **Health Check**: http://149.50.132.23:8080/actuator/health

## Notas Importantes

1. **Seguridad**: Nunca commitear el archivo `.env.production` al repositorio
2. **Backups**: Los backups se guardan en `./backups/` con timestamp
3. **Logs**: Los logs de aplicación se guardan en `./logs/`
4. **Certificados**: Para HTTPS, configurar certificados SSL adicionales
5. **Firewall**: Asegurar que los puertos 8000 y 8080 estén abiertos en el servidor

## Contacto

Para problemas con el deployment, revisar:
1. Logs del script de deployment
2. Logs de Docker Compose
3. Logs específicos de cada servicio
4. Estado de la red y conectividad

## Despliegue sin downtime (SSL) usando override de imágenes

Para minimizar interrupciones en producción, en lugar de reconstruir imágenes con `--build` y hacer `down`, fijamos imágenes por tag con un archivo de override y actualizamos servicios de forma aislada.

### Archivo de override
Crea/usa `docker-compose.ssl.override.yml` con el siguiente contenido mínimo:

```
services:
  backend:
    image: mpd_concursos_backend:fix-circunscripciones
    build: null
  frontend:
    image: mpd_concursos-frontend:latest
    build: null
```

- Reemplaza los tags por los que quieras desplegar en cada release.
- `build: null` evita que Compose intente reconstruir.

### Rollout backend primero
```
docker compose -f docker-compose.ssl.yml -f docker-compose.ssl.override.yml up -d --no-deps --force-recreate backend
```
Verificar health del backend (Spring Actuator):
```
curl -k -f https://$DOMAIN/api/actuator/health
```

### Rollout frontend luego
```
docker compose -f docker-compose.ssl.yml -f docker-compose.ssl.override.yml up -d --no-deps --force-recreate frontend
```
Verificar frontend:
```
curl -k -f https://$DOMAIN/
```

### Notas
- Nginx (reverse proxy) y MySQL permanecen activos, por lo que el tráfico sigue fluyendo durante los reemplazos.
- Los volúmenes `mpd_concursos_mysql_data_prod` y `mpd_concursos_storage_data_prod` preservan datos.

### Rollback inmediato
Para revertir el backend a una imagen anterior (ej: pre-fix):
```
# Edita docker-compose.ssl.override.yml
services:
  backend:
    image: mpd_concursos_backend:pre-fix-20250811
    build: null

# Reaplica sólo backend

docker compose -f docker-compose.ssl.yml -f docker-compose.ssl.override.yml up -d --no-deps --force-recreate backend
```

Sugerencias:
- Taguea también el frontend (p. ej. con fecha) para permitir rollback simétrico.
- Evita usar scripts que hagan `down` y `--build` para releases de mínimo impacto.

## Normalización posterior (volver al script de deploy)

Una vez que haya una ventana de baja actividad y se acepte un breve corte de servicio, se puede volver al flujo estándar con `scripts/deploy-production.sh` siguiendo estos pasos:

1) Alinear imágenes y tags
- Opcional pero recomendado: taggear imágenes Docker con el mismo tag del release en Git (p.ej., `deploy-YYYY-MM-DD-ssl`).
- Verifica que las imágenes que querés desplegar están presentes localmente o en el registry.

2) Consolidar Compose para producción
- Quitar la dependencia del archivo `docker-compose.ssl.override.yml` para el día a día.
- Dos opciones válidas:
  a) Definir explícitamente `image:` en `docker-compose.ssl.yml` para `backend` y `frontend` (y remover `build:`), referenciando los tags deseados.
  b) Mantener `build:` en `docker-compose.ssl.yml` y aceptar que el script reconstruya imágenes durante la ventana de mantenimiento.

3) Ejecutar el script estándar durante la ventana
- Aceptando un breve downtime controlado, ejecutar:
  ```bash
  ./scripts/deploy-production.sh
  ```
  Este script:
  - hace `down` (sin borrar volúmenes)
  - limpia recursos no usados
  - hace `up -d --build` con `docker-compose.ssl.yml`

4) Retirar el override de la operación diaria
- No usar `-f docker-compose.ssl.override.yml` en los comandos habituales.
- Podés conservar el archivo en el repo para futuras publicaciones sin downtime o borrarlo si se decide no usarlo más.

5) Rollback en el modelo “script”
- Si algo falla tras el `deploy-production.sh`, ejecutar nuevamente el script con la versión previa (cambiando `image:` a los tags anteriores o con el código anterior) y repetir el `up -d --build` dentro de la ventana.

Notas
- Los volúmenes `mpd_concursos_mysql_data_prod` y `mpd_concursos_storage_data_prod` preservan datos en todos los casos.
- Si se requiere cero-downtime en el futuro, mantener el enfoque de override por tags y actualizar servicio por servicio con `--no-deps --force-recreate`.


> Nota: Para pasos rápidos de normalización post-deploy durante ventana de mantenimiento, ver scripts/README-normalizacion-post-deploy.md.
