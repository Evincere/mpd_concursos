# Sistema de Backups Automáticos - MPD Concursos

## 📋 Información General

El sistema MPD Concursos cuenta con un **sistema completo de backups automáticos** que protege tanto la base de datos como los archivos del sistema, garantizando la continuidad del servicio y la protección de datos críticos.

### 🎯 Objetivos de Protección

- **RPO (Recovery Point Objective)**: Máximo 6 horas de pérdida de datos
- **RTO (Recovery Time Objective)**: Sistema operativo en menos de 1 hora
- **Disponibilidad**: 99.9% uptime con recuperación rápida
- **Integridad**: 100% de datos recuperables hasta el último backup

## ⚙️ Configuración Actual

### 🕐 Horarios de Backup Automático

El sistema ejecuta backups automáticos **cada 6 horas**:

| Horario | Descripción | Cron Expression |
|---------|-------------|-----------------|
| **00:00** | Backup de medianoche | `0 0 * * *` |
| **06:00** | Backup de madrugada | `0 6 * * *` |
| **12:00** | Backup de mediodía | `0 12 * * *` |
| **18:00** | Backup de tarde | `0 18 * * *` |

### 📊 Configuración de Retención

```bash
# Variables de configuración
RETENTION_DAYS=30                    # Mantener backups por 30 días
COMPRESSION_ENABLED=true             # Compresión automática con gzip
NOTIFICATION_ENABLED=true            # Notificaciones por email
BACKUP_LOCATION=/app/backups         # Directorio de almacenamiento
```

### 🗂️ Estructura de Archivos de Backup

```
/app/backups/
├── db_backup_20250130_000000.sql.gz      # Base de datos (medianoche)
├── files_backup_20250130_000000.tar.gz   # Archivos (medianoche)
├── db_backup_20250130_060000.sql.gz      # Base de datos (6:00 AM)
├── files_backup_20250130_060000.tar.gz   # Archivos (6:00 AM)
├── db_backup_20250130_120000.sql.gz      # Base de datos (12:00 PM)
├── files_backup_20250130_120000.tar.gz   # Archivos (12:00 PM)
├── db_backup_20250130_180000.sql.gz      # Base de datos (6:00 PM)
└── files_backup_20250130_180000.tar.gz   # Archivos (6:00 PM)
```

## 🛡️ Alcance de la Protección

### 📊 Base de Datos Completa

**Datos protegidos:**
- ✅ **Usuarios**: Perfiles, credenciales, roles, configuraciones
- ✅ **Concursos**: Configuraciones, bases, fechas, requisitos, estados
- ✅ **Inscripciones**: Estados, documentos asociados, fechas, validaciones
- ✅ **Documentos**: Metadata, referencias, tipos, estados de validación
- ✅ **Configuraciones**: Settings del sistema, parámetros de administración
- ✅ **Auditoría**: Logs de acciones, cambios de estado, trazabilidad
- ✅ **Notificaciones**: Historial de comunicaciones, templates

### 📁 Sistema de Archivos

**Archivos protegidos:**
- 📄 **Documentos de usuarios**: DNI (frontal/dorso), CUIL, certificados
- 🎓 **Documentación profesional**: Títulos, certificaciones, antecedentes
- 📋 **CVs y documentación complementaria**
- 🖼️ **Imágenes de perfil** de usuarios
- 📑 **Bases de concursos** (PDFs oficiales)
- ⚙️ **Archivos de configuración** del sistema
- 🗂️ **Documentos temporales** en proceso de validación

### 📈 Métricas de Protección

| Métrica | Valor | Descripción |
|---------|-------|-------------|
| **Frecuencia** | Cada 6 horas | 4 backups diarios |
| **Retención** | 30 días | ~120 backups simultáneos |
| **Compresión** | ~70% reducción | Optimización de espacio |
| **Espacio total** | ~31 GB | Para 30 días de retención |
| **Tiempo backup** | 5-15 minutos | Dependiendo del volumen |

## 🚀 Configuración Automática

### 📦 Durante el Deployment

El sistema se configura automáticamente durante el deployment:

```bash
# Ejecutar deployment completo (incluye configuración de backups)
./deploy-production.sh deploy
```

**Proceso automático:**
1. ✅ Validación de configuración
2. ✅ Backup manual pre-deployment
3. ✅ Deployment de servicios
4. ✅ **Configuración automática de backups cada 6 horas**
5. ✅ Verificación de estado

### 🔧 Configuración Manual

Si necesitas configurar manualmente:

```bash
# Configurar backups cada 6 horas
./scripts/setup-backup-cron.sh -f daily -t 00:00
./scripts/setup-backup-cron.sh -f daily -t 06:00
./scripts/setup-backup-cron.sh -f daily -t 12:00
./scripts/setup-backup-cron.sh -f daily -t 18:00

# Ver estado actual
./scripts/setup-backup-cron.sh -s

# Remover configuración
./scripts/setup-backup-cron.sh -r
```

## 📋 Gestión y Monitoreo

### 🔍 Verificar Estado del Sistema

```bash
# Ver configuración actual de cron
./scripts/setup-backup-cron.sh -s

# Listar backups disponibles
./scripts/restore-system.sh -l

# Ver logs de backup
tail -f /app/logs/cron-backup.log

# Ver logs de errores
tail -f /app/logs/backup-error.log
```

### 📊 Información de Backups

```bash
# Ejecutar backup manual para testing
./scripts/backup-system.sh

# Ver espacio utilizado por backups
du -sh /app/backups/

# Contar número de backups
ls /app/backups/*.gz | wc -l
```

## 🛠️ Tutorial de Recuperación

### 🚨 Escenarios de Recuperación

#### **Escenario 1: Falla Completa del Servidor**
- Corrupción total del disco
- Falla de hardware
- Desastre natural
- Ataque de ransomware

#### **Escenario 2: Corrupción de Base de Datos**
- Error en actualización
- Corrupción de índices
- Pérdida de transacciones

#### **Escenario 3: Pérdida de Archivos**
- Eliminación accidental
- Corrupción de sistema de archivos
- Error en migración de datos

### 🔄 Proceso de Recuperación Completa

#### **Paso 1: Preparar Entorno de Recuperación**

```bash
# 1. Preparar servidor limpio (si es necesario)
sudo apt update && sudo apt install docker.io docker compose git

# 2. Clonar repositorio
git clone <repositorio-mpd-concursos>
cd concursos-mpd

# 3. Configurar variables de entorno
cp .env.production.example .env.production
# Editar .env.production con configuraciones correctas
```

#### **Paso 2: Identificar Backup a Restaurar**

```bash
# Listar todos los backups disponibles
./scripts/restore-system.sh -l
```

**Salida esperada:**
```
📋 Backups disponibles en /app/backups:

=== BASE DE DATOS ===
📅 20250130_180000 - 30/01/2025 18:00:00 (15.3 MB) ⭐ MÁS RECIENTE
📅 20250130_120000 - 30/01/2025 12:00:00 (15.2 MB)
📅 20250130_060000 - 30/01/2025 06:00:00 (15.1 MB)
📅 20250130_000000 - 30/01/2025 00:00:00 (15.0 MB)
📅 20250129_180000 - 29/01/2025 18:00:00 (14.9 MB)

=== ARCHIVOS ===
📁 20250130_180000 - 30/01/2025 18:00:00 (247.2 MB) ⭐ MÁS RECIENTE
📁 20250130_120000 - 30/01/2025 12:00:00 (246.8 MB)
📁 20250130_060000 - 30/01/2025 06:00:00 (246.1 MB)
📁 20250130_000000 - 30/01/2025 00:00:00 (245.5 MB)
📁 20250129_180000 - 29/01/2025 18:00:00 (244.8 MB)

💡 Para restaurar: ./scripts/restore-system.sh <TIMESTAMP>
💡 Ejemplo: ./scripts/restore-system.sh 20250130_180000
```

#### **Paso 3: Ejecutar Restauración**

##### **Opción A: Restauración Completa (Recomendado)**
```bash
# Restaurar base de datos + archivos del backup más reciente
./scripts/restore-system.sh 20250130_180000
```

##### **Opción B: Restauración Selectiva**
```bash
# Solo base de datos
./scripts/restore-system.sh -d 20250130_180000

# Solo archivos
./scripts/restore-system.sh -f 20250130_180000

# Restauración automática (sin confirmación)
./scripts/restore-system.sh -y 20250130_180000
```

**Proceso interactivo:**
```
🔄 SISTEMA DE RESTAURACIÓN - MPD CONCURSOS

📋 Información del backup seleccionado:
   Timestamp: 20250130_180000
   Fecha: 30/01/2025 18:00:00
   
📊 Archivos encontrados:
   ✅ Base de datos: db_backup_20250130_180000.sql.gz (15.3 MB)
   ✅ Archivos: files_backup_20250130_180000.tar.gz (247.2 MB)

⚠️  ADVERTENCIA: Esta operación sobrescribirá los datos actuales.
   ¿Desea continuar? (s/N): s

🗄️  Restaurando base de datos...
   ✅ Descomprimiendo backup de base de datos...
   ✅ Conectando a MySQL...
   ✅ Restaurando datos... (15.3 MB procesados)
   ✅ Base de datos restaurada exitosamente

📁 Restaurando archivos...
   ✅ Descomprimiendo backup de archivos...
   ✅ Restaurando estructura de directorios...
   ✅ Copiando archivos... (247.2 MB procesados)
   ✅ Archivos restaurados exitosamente

✅ RESTAURACIÓN COMPLETADA EXITOSAMENTE
   Tiempo total: 8 minutos 32 segundos
   Datos restaurados al estado del: 30/01/2025 18:00:00
```

#### **Paso 4: Levantar Servicios**

```bash
# Ejecutar deployment completo
./deploy-production.sh deploy
```

#### **Paso 5: Verificación Post-Recuperación**

```bash
# 1. Verificar estado de servicios
./deploy-production.sh status

# 2. Verificar logs por errores
./deploy-production.sh logs

# 3. Probar conectividad
curl -f http://servidor:8000/health
curl -f http://servidor:8080/api/health

# 4. Verificar base de datos
docker exec mpd-concursos-mysql-prod mysql -u root -p -e "SHOW DATABASES;"

# 5. Verificar archivos
ls -la /app/storage/
```

### ⏱️ Tiempos de Recuperación Estimados

| Componente | Tiempo | Descripción |
|------------|--------|-------------|
| **Preparación** | 15-30 min | Setup servidor, configuración |
| **Identificación backup** | 2-5 min | Listar y seleccionar backup |
| **Restauración BD** | 3-8 min | Descompresión + restauración |
| **Restauración archivos** | 8-20 min | Descompresión + copia |
| **Deployment servicios** | 5-10 min | Build + startup contenedores |
| **Verificación** | 5-10 min | Testing y validación |
| **TOTAL** | **38-83 minutos** | **Recuperación completa** |

### 🎯 Casos de Uso Específicos

#### **Recuperación Rápida (Solo BD)**
```bash
# Para problemas solo de datos, mantener archivos actuales
./scripts/restore-system.sh -d 20250130_180000
# Tiempo: ~10-15 minutos
```

#### **Recuperación de Archivos Específicos**
```bash
# Para problemas solo de archivos, mantener BD actual
./scripts/restore-system.sh -f 20250130_180000
# Tiempo: ~15-25 minutos
```

#### **Recuperación a Punto Específico**
```bash
# Volver al estado de esta mañana
./scripts/restore-system.sh 20250130_060000

# Volver al estado de ayer
./scripts/restore-system.sh 20250129_180000
```

## 🔒 Medidas de Seguridad

### 🛡️ Protección de Backups

- ✅ **Compresión**: Reduce espacio y mejora transferencia
- ✅ **Validación**: Verificación de integridad automática
- ✅ **Rotación**: Eliminación automática de backups antiguos
- ✅ **Logs detallados**: Trazabilidad completa de operaciones
- ✅ **Notificaciones**: Alertas automáticas de estado

### 📊 Monitoreo Continuo

```bash
# Script de monitoreo personalizado
#!/bin/bash
# Verificar último backup exitoso
last_backup=$(ls -t /app/backups/db_backup_*.gz | head -1)
backup_age=$(stat -c %Y "$last_backup")
current_time=$(date +%s)
age_hours=$(( (current_time - backup_age) / 3600 ))

if [ $age_hours -gt 8 ]; then
    echo "⚠️ ALERTA: Último backup tiene $age_hours horas"
    # Enviar notificación
fi
```

## 📞 Soporte y Troubleshooting

### 🔧 Problemas Comunes

#### **Error: "Backup script not found"**
```bash
# Verificar existencia del script
ls -la ./scripts/setup-backup-cron.sh
# Si no existe, verificar permisos o reinstalar
```

#### **Error: "MySQL connection failed"**
```bash
# Verificar variables de entorno
echo $MYSQL_ROOT_PASSWORD
echo $MYSQL_DATABASE
# Verificar contenedor MySQL
docker ps | grep mysql
```

#### **Error: "Insufficient disk space"**
```bash
# Verificar espacio disponible
df -h /app/backups
# Limpiar backups antiguos manualmente si es necesario
find /app/backups -name "*.gz" -mtime +30 -delete
```

### 📧 Contacto

Para soporte técnico o consultas sobre el sistema de backups:
- **Email**: sistemas@defensamendoza.gob.ar
- **Logs**: `/app/logs/backup.log` y `/app/logs/backup-error.log`
- **Documentación**: Este archivo y scripts en `/scripts/`

---

**Última actualización**: 30 de Enero de 2025  
**Versión del sistema**: 1.0  
**RPO actual**: 6 horas  
**RTO objetivo**: < 1 hora
