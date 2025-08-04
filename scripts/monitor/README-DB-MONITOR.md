# 🔍 MPD Concursos - Sistema de Monitoreo de Base de Datos

Sistema de monitoreo y consultas para el proyecto MPD Concursos en producción.

## 📋 Descripción

Este conjunto de scripts proporciona herramientas especializadas para:
- **Monitoreo de base de datos** con consultas interactivas
- **Visualización de logs** en tiempo real
- **Backup automático** de la base de datos
- **Limpieza de recursos** Docker
- **Estadísticas del sistema** en tiempo real

> **Nota**: Este sistema complementa tu script de deploy existente `deploy-production.sh` y se enfoca exclusivamente en monitoreo y consultas.

## 🚀 Instalación Rápida

### 1. Crear estructura de directorios en el servidor
```bash
# Conectar al servidor
ssh root@vps-4778464-x

# Navegar al directorio del proyecto
cd /root/concursos/mpd_concursos

# Crear directorio para scripts de monitoreo
mkdir -p scripts/monitor
```

### 2. Subir archivos al servidor
```bash
# Copiar scripts de monitoreo al directorio correcto
scp db-monitor.sh log-monitor.sh install-monitor.sh root@vps-4778464-x:/root/concursos/mpd_concursos/scripts/monitor/
scp README-DB-MONITOR.md root@vps-4778464-x:/root/concursos/mpd_concursos/scripts/monitor/
```

### 3. Ejecutar instalador
```bash
# En el servidor, navegar al directorio de monitoreo
cd /root/concursos/mpd_concursos/scripts/monitor

# Dar permisos y ejecutar instalador
chmod +x install-monitor.sh
./install-monitor.sh
```

### 4. ¡Listo para usar!
```bash
# Comandos principales disponibles globalmente
db-monitor      # Monitor de base de datos
log-monitor     # Monitor de logs en tiempo real
```

## 🛠️ Herramientas Disponibles

### 📊 DB Monitor (`db-monitor`)
Monitor interactivo de base de datos con las siguientes funciones:

#### Estadísticas Generales
- Total de usuarios registrados
- Inscripciones activas/completadas
- Documentos pendientes de validación
- Estado general del sistema

#### Búsquedas Específicas
- **Buscar por DNI**: Encuentra usuario y muestra teléfono, email, estado
- **Búsqueda avanzada**: Por email, nombre, teléfono, CUIT
- **Documentos por usuario**: Lista todos los documentos de un usuario específico

#### Reportes de Estado
- **Inscripciones por concurso**: Estadísticas detalladas por concurso
- **Documentos pendientes**: Lista de documentos esperando validación
- **Usuarios por período**: Registros por fecha específica o rango
- **Notificaciones no leídas**: Mensajes pendientes por usuario
- **Estado de exámenes**: Información de exámenes programados
- **Usuarios inactivos**: Lista de usuarios bloqueados o inactivos

#### Actividad Reciente
- Últimas inscripciones realizadas
- Documentos subidos recientemente
- Nuevos usuarios registrados

### 📋 Log Monitor (`log-monitor`)
Monitor de logs en tiempo real:

- **Logs en tiempo real** de Backend, Frontend y Base de Datos
- **Búsqueda en logs** con filtros por servicio
- **Últimas líneas** de cada servicio
- **Estado de contenedores** y recursos
- **Estadísticas de CPU/Memoria** por contenedor



### 💾 Backup Automático (`backup-db`)
- Backup manual de la base de datos
- **Backup automático diario** a las 2:00 AM
- Retención de 7 días de backups
- Logs de backup en `/var/log/mpd-backup.log`

### 🧹 Limpieza Docker (`cleanup-docker`)
- Elimina imágenes sin etiqueta
- Limpia volúmenes no utilizados
- Remueve redes no utilizadas
- Limpieza general del sistema Docker

## 📁 Estructura de Archivos

```
/root/concursos/mpd_concursos/           # Directorio del proyecto
├── deploy-production.sh                 # Tu script de deploy existente
├── scripts/
│   └── monitor/                         # Scripts de monitoreo
│       ├── db-monitor.sh                # Monitor de base de datos
│       ├── log-monitor.sh               # Monitor de logs
│       ├── install-monitor.sh           # Instalador de monitoreo
│       └── README-DB-MONITOR.md         # Esta documentación
├── concurso-backend/                    # Backend del proyecto
├── concurso-frontend/                   # Frontend del proyecto
└── docker compose.yml                   # Configuración Docker

/opt/mpd-monitor/                        # Directorio de instalación
├── db-monitor.sh                        # Script principal de monitoreo
├── log-monitor.sh                       # Monitor de logs
├── backup-db.sh                         # Script de backup
├── cleanup-docker.sh                    # Script de limpieza
├── config.conf                          # Configuración
└── backups/                             # Directorio de backups
    ├── backup_20250730_020001.sql
    └── ...

/usr/local/bin/                          # Enlaces simbólicos globales
├── db-monitor                           # Monitor de base de datos
├── log-monitor                          # Monitor de logs
├── backup-db                            # Backup manual
└── cleanup-docker                       # Limpieza Docker

/var/log/
├── mpd-backup.log                       # Logs de backup
└── mpd-monitor/                         # Logs del sistema de monitoreo
```

## 🔧 Configuración

### Variables de Entorno
El sistema utiliza la configuración real de tu servidor:

```bash
# Configuración del Servidor VPS-4778464-X
PROJECT_DIR=/root/concursos/mpd_concursos
DB_CONTAINER=mpd-concursos-mysql-prod
DB_NAME=mpd_concursos
DB_USER=root
DB_PASS=root1234
BACKEND_CONTAINER=mpd-concursos-backend-prod
FRONTEND_CONTAINER=mpd-concursos-frontend-prod
```

### Personalización
Edita `/opt/mpd-monitor/config.conf` para cambiar la configuración:

```bash
# Configuración MPD Monitor Tools
PROJECT_DIR=/root/concursos/mpd_concursos
DB_CONTAINER=mpd-concursos-mysql-prod
DB_NAME=mpd_concursos
DB_USER=root
DB_PASS=root1234
BACKUP_RETENTION_DAYS=7
LOG_LEVEL=INFO
```

## 📊 Ejemplos de Uso

### Buscar usuario por DNI
```bash
db-monitor
# Seleccionar opción 2
# Ingresar DNI: 12345678
```

### Ver documentos pendientes
```bash
db-monitor
# Seleccionar opción 4
```

### Monitorear logs del backend en tiempo real
```bash
log-monitor
# Seleccionar opción 1
```

### Buscar en logs por término específico
```bash
log-monitor
# Seleccionar opción 8
# Ingresar término de búsqueda
```

### Realizar backup manual
```bash
backup-db
```

## 🔍 Consultas Disponibles

### Usuarios
- Total de usuarios registrados
- Usuarios activos/inactivos/bloqueados
- Búsqueda por DNI, email, nombre, teléfono, CUIT
- Usuarios registrados por período

### Inscripciones
- Total de inscripciones por concurso
- Inscripciones por estado (ACTIVE, PENDING, COMPLETED, etc.)
- Inscripciones recientes

### Documentos
- Documentos pendientes de validación
- Documentos por usuario específico
- Documentos subidos recientemente
- Estado de validación por tipo

### Sistema
- Notificaciones no leídas
- Estado de exámenes
- Actividad reciente del sistema
- Estadísticas generales

## 🚨 Solución de Problemas

### Error: Contenedor no encontrado
```bash
# Verificar que los contenedores estén ejecutándose en el servidor
ssh root@vps-4778464-x
cd /root/concursos/mpd_concursos
docker ps | grep mpd-concursos
```

### Error de conexión a la base de datos
```bash
# Verificar credenciales en config.conf
cat /opt/mpd-monitor/config.conf

# Probar conexión manual a la base de datos
docker exec -it mpd-concursos-mysql-prod mysql -uroot -proot1234 mpd_concursos
```

### Logs de backup
```bash
# Ver logs de backup
tail -f /var/log/mpd-backup.log
```

## 📞 Soporte

Para reportar problemas o solicitar nuevas funciones:
1. Verificar logs del sistema
2. Comprobar estado de contenedores
3. Revisar configuración en `/opt/mpd-admin/config.conf`

## 🔄 Actualizaciones

Para actualizar el sistema:
```bash
# En el servidor, navegar al directorio de scripts
cd /root/concursos/mpd_concursos/scripts/monitor

# Subir nuevas versiones desde tu máquina local
scp db-monitor.sh log-monitor.sh root@vps-4778464-x:/root/concursos/mpd_concursos/scripts/monitor/

# Ejecutar nuevamente el instalador
./install-monitor.sh
```

## 📊 Información del Servidor

- **Servidor**: vps-4778464-x
- **Ubicación del proyecto**: `/root/concursos/mpd_concursos`
- **Contenedores activos**:
  - `mpd-concursos-backend-prod` (Puerto 8080)
  - `mpd-concursos-frontend-prod` (Puerto 8000)
  - `mpd-concursos-mysql-prod` (Puerto 3307)
- **Sistema**: Ubuntu 22.04.5 LTS
- **Docker**: 28.3.3

---

**Desarrollado para MPD Concursos - Sistema de Monitoreo**
**Servidor**: vps-4778464-x | **Proyecto**: /root/concursos/mpd_concursos
