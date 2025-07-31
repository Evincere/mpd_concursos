# 🚀 Instrucciones Rápidas - Servidor vps-4778464-x

## 📋 Resumen
Scripts de monitoreo para MPD Concursos que complementan tu `deploy-production.sh` existente.

## 🔧 Instalación en el Servidor

### 1. Crear estructura de directorios
```bash
# Conectar al servidor
ssh root@vps-4778464-x

# Navegar al proyecto
cd /root/concursos/mpd_concursos

# Crear directorio de monitoreo
mkdir -p scripts/monitor
```

### 2. Subir archivos
```bash
# Desde tu máquina local, subir archivos
scp db-monitor.sh log-monitor.sh install-monitor.sh INSTRUCCIONES-SERVIDOR.md README-DB-MONITOR.md root@vps-4778464-x:/root/concursos/mpd_concursos/scripts/monitor/
```

### 3. Instalar en el servidor
```bash
# En el servidor
cd /root/concursos/mpd_concursos/scripts/monitor
chmod +x install-monitor.sh
./install-monitor.sh
```

## 🎯 Comandos Disponibles

Una vez instalado, estos comandos estarán disponibles globalmente:

```bash
db-monitor      # Monitor de base de datos (12 funciones)
log-monitor     # Monitor de logs en tiempo real
backup-db       # Backup manual de BD
cleanup-docker  # Limpieza de Docker
update-monitor  # Actualizar herramientas
```

## 📊 Funciones del Monitor de BD

1. **Estadísticas Generales** - Total usuarios, inscripciones, documentos
2. **Buscar Usuario por DNI** - Encuentra teléfono, email, estado
3. **Estado de Inscripciones** - Por concurso y estado
4. **Documentos Pendientes** - Lista de validaciones pendientes
5. **Usuarios por Período** - Registros por fecha
6. **Notificaciones No Leídas** - Mensajes pendientes
7. **Estado de Exámenes** - Información de exámenes
8. **Usuarios Inactivos** - Lista de usuarios bloqueados
9. **Inscripciones por Estado** - Estadísticas detalladas
10. **Búsqueda Avanzada** - Por email, nombre, teléfono, CUIT
11. **Documentos por Usuario** - Lista completa por DNI
12. **Actividad Reciente** - Últimas acciones del sistema

## 🔍 Funciones del Monitor de Logs

1. **Logs Backend** - Tiempo real con colores
2. **Logs Frontend** - Tiempo real
3. **Logs Base de Datos** - Tiempo real
4. **Todos los Servicios** - Monitoreo conjunto
5. **Últimas 100 líneas** - Por servicio
6. **Búsqueda en Logs** - Por término específico
7. **Estado de Contenedores** - Información detallada
8. **Estadísticas de Recursos** - CPU, memoria, disco

## 📁 Estructura Final

```
/root/concursos/mpd_concursos/
├── deploy-production.sh          # Tu script existente (sin cambios)
├── scripts/
│   └── monitor/                  # Scripts de monitoreo
│       ├── db-monitor.sh
│       ├── log-monitor.sh
│       ├── install-monitor.sh
│       └── README-DB-MONITOR.md
└── [resto del proyecto...]

/opt/mpd-monitor/                 # Instalación de herramientas
├── db-monitor.sh
├── log-monitor.sh
├── backup-db.sh
├── cleanup-docker.sh
├── config.conf
└── backups/

/usr/local/bin/                   # Comandos globales
├── db-monitor
├── log-monitor
├── backup-db
├── cleanup-docker
└── update-monitor
```

## ⚡ Ejemplos de Uso

### Buscar usuario por DNI
```bash
db-monitor
# Opción 2 → Ingresar DNI
```

### Ver logs del backend en tiempo real
```bash
log-monitor
# Opción 1
```

### Backup manual
```bash
backup-db
```

### Buscar error en logs
```bash
log-monitor
# Opción 8 → Ingresar "ERROR"
```

## 🔄 Mantenimiento

### Backup automático
- Se ejecuta diariamente a las 2:00 AM
- Retiene 7 días de backups
- Logs en `/var/log/mpd-backup.log`

### Actualizar herramientas
```bash
# Subir nuevas versiones y ejecutar
update-monitor
```

## ✅ Verificación

Después de la instalación, verifica que todo funcione:

```bash
# Verificar comandos
which db-monitor log-monitor backup-db

# Probar conexión a BD
db-monitor
# Opción 1 (Estadísticas Generales)

# Verificar logs
log-monitor
# Opción 9 (Estado de Contenedores)
```

## 📞 Información del Servidor

- **Servidor**: vps-4778464-x
- **Proyecto**: /root/concursos/mpd_concursos
- **Contenedores**:
  - mpd-concursos-backend-prod:8080
  - mpd-concursos-frontend-prod:8000
  - mpd-concursos-mysql-prod:3307
- **Sistema**: Ubuntu 22.04.5 LTS
- **Docker**: 28.3.3

---

**¡Listo para usar!** 🎉
