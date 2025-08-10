# Lista de Archivos de Backup para Descarga

## Carpetas principales de backup:
- `backups/` - 43MB
- `backup_limpieza_raiz_20250809_105820/` - 1.1GB
- `/opt/mpd-monitor/backups/` - **15GB** (¡BACKUP AUTOMÁTICO CADA 6 HORAS!)

## Comandos SCP para descargar desde máquina externa:

### 1. Carpeta backups del proyecto:
```bash
scp -r root@vps-4778464-x.dattaweb.com:/root/concursos/mpd_concursos/backups ./
```

### 2. Carpeta backup_limpieza_raiz completa:
```bash
scp -r root@vps-4778464-x.dattaweb.com:/root/concursos/mpd_concursos/backup_limpieza_raiz_20250809_105820 ./
```

### 3. **IMPORTANTE - Backups automáticos (15GB):**
```bash
# ⚠️ CUIDADO: Esta carpeta tiene 15GB de backups automáticos cada 6 horas
scp -r root@vps-4778464-x.dattaweb.com:/opt/mpd-monitor/backups ./mpd-monitor-backups
```

### 4. Solo archivos más recientes e importantes:
```bash
# Backup completo más reciente (809MB)
scp root@vps-4778464-x.dattaweb.com:/root/concursos/mpd_concursos/backup_limpieza_raiz_20250809_105820/backup_completo_antes_limpieza_20250809_104904.tar.gz ./

# Backup de archivos más reciente (1.2GB)
scp root@vps-4778464-x.dattaweb.com:/opt/mpd-monitor/backups/files_backup_20250810_060001.tar ./

# Backup de BD más reciente (773KB comprimido)
scp root@vps-4778464-x.dattaweb.com:/opt/mpd-monitor/backups/db_backup_20250810_060001.sql.gz ./
```

## Archivos individuales más importantes:

### Backups de base de datos recientes:
```bash
scp root@vps-4778464-x.dattaweb.com:/root/concursos/mpd_concursos/backups/pre_deployment_20250809_202246/database_backup.sql ./
scp root@vps-4778464-x.dattaweb.com:/root/concursos/mpd_concursos/backups/20250809_092045_pre_timezone_fix/database_before_timezone_fix.sql ./
```

## ⚠️ ESPACIO TOTAL A LIBERAR: ~16.14GB

### Desglose:
- Backups del proyecto: 1.14GB
- Backups automáticos del monitor: 15GB

### Recomendación:
1. Descargar solo los backups más recientes (últimos 2-3 días)
2. Los backups automáticos se pueden limpiar manteniendo solo los últimos 7 días