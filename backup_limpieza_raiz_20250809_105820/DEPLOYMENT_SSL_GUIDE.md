# Guía de Deployment con SSL - MPD Concursos

## ✅ Cambios Implementados

### 🔒 Seguridad Mejorada
- **SSL/HTTPS habilitado** con certificados automáticos de Let's Encrypt
- **Reverse proxy Nginx** con configuraciones de seguridad robustas
- **Rate limiting** para prevenir ataques de fuerza bruta
- **Headers de seguridad** (HSTS, XSS Protection, etc.)

### 🛡️ Preservación de Datos Críticos
- **Volúmenes preservados**: 
  - `mpd_concursos_mysql_data_prod` (Base de datos)
  - `mpd_concursos_storage_data_prod` (Documentos de usuarios)
- **Nombres de contenedores mantenidos** para compatibilidad
- **Backup automático** antes de cada deployment

### 🔧 Mejoras de Configuración
- **Variables sensibles** movidas fuera del control de versiones
- **Docker Compose moderno** (sin guiones)
- **Configuración unificada** en `docker-compose.production.yml`
- **WebSockets** funcionando a través del proxy SSL

## 🚀 Como Deployar

### 1. Configurar Variables de Entorno

```bash
# Copiar el template
cp .env.production.example .env.production

# Editar con valores reales
nano .env.production
```

### 2. Validar Configuración

```bash
./deploy-production.sh validate
```

### 3. Ejecutar Deployment

```bash
./deploy-production.sh deploy
```

### 4. Verificar Estado

```bash
./deploy-production.sh status
```

## 🌐 URLs de Acceso

### Producción (Recomendado)
- **Frontend**: https://vps-4778464-x.dattaweb.com
- **API**: https://vps-4778464-x.dattaweb.com/api
- **WebSockets**: wss://vps-4778464-x.dattaweb.com/ws

### Acceso Directo (Solo para desarrollo)
- **Frontend**: http://149.50.132.23:8000
- **Backend**: http://149.50.132.23:8080

## 🔄 Comandos Útiles

```bash
# Ver logs
./deploy-production.sh logs

# Renovar SSL
./deploy-production.sh ssl

# Backup manual
./deploy-production.sh backup

# Estado detallado
./deploy-production.sh status
```

## ⚠️ Consideraciones Importantes

### Durante el Deployment
- El tráfico se interrumpe brevemente (~2-3 minutos)
- Los datos críticos se preservan automáticamente
- Se crea backup automático antes de cambios

### Post-Deployment
- Verificar que SSL funciona correctamente
- Comprobar que WebSockets se conectan
- Revisar logs por errores

### Rollback de Emergencia
Si hay problemas, usar el stack anterior temporalmente:

```bash
# Detener nuevo stack
docker compose -f docker-compose.production.yml down

# Levantar stack anterior
docker compose -f docker-compose.yml up -d
```

## 📝 Archivos Modificados

- ✅ `docker-compose.production.yml` - Configuración unificada con SSL
- ✅ `ssl-setup/nginx.conf` - Configuración del reverse proxy
- ✅ `mpd-concursos-app-frontend/src/environments/environment.prod.ts` - URLs relativas
- ✅ `deploy-production.sh` - Script actualizado para SSL
- ✅ `.env.production.example` - Template para variables sensibles
- ✅ `.gitignore` - Exclusión de `.env.production`

## 🎯 Beneficios Implementados

1. **Seguridad**: HTTPS obligatorio, headers de seguridad, rate limiting
2. **Performance**: Caching de recursos estáticos, compresión
3. **Mantenibilidad**: Scripts automatizados, backups automáticos
4. **Escalabilidad**: Configuración preparada para crecimiento
5. **Monitoreo**: Logs estructurados, health checks mejorados

## 🚨 Datos Críticos Protegidos

Los siguientes elementos están **garantizados** de preservarse:
- 📊 **Base de datos MySQL completa**
- 📄 **Todos los documentos de usuarios**
- 👥 **Registros de concursantes**
- 📋 **Historiales de exámenes**
- 🎯 **Configuraciones de concursos**

El sistema está diseñado para **cero pérdida de datos** durante el deployment.
