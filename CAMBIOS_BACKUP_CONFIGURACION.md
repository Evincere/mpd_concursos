# Cambios en Configuración de Backups

## Cambios Realizados

### 1. Modificación del Cron Job de Backups

**ANTES:**
```bash
# Backup cada 6 horas
0 0 * * * /opt/mpd-monitor/backup-complete.sh >> /var/log/mpd-backup.log 2>&1
0 6 * * * /opt/mpd-monitor/backup-complete.sh >> /var/log/mpd-backup.log 2>&1
0 12 * * * /opt/mpd-monitor/backup-complete.sh >> /var/log/mpd-backup.log 2>&1
0 18 * * * /opt/mpd-monitor/backup-complete.sh >> /var/log/mpd-backup.log 2>&1
```

**AHORA:**
```bash
# Backup cada 24 horas a las 2:00 AM
0 2 * * * /opt/mpd-monitor/backup-complete.sh >> /var/log/mpd-backup.log 2>&1
```

### 2. Impacto en el Almacenamiento

**ANTES:**
- 4 backups por día
- ~4.8GB generados diariamente
- Acumulación rápida de archivos

**AHORA:**
- 1 backup por día
- ~1.2GB generados diariamente
- Reducción del 75% en generación de backups

### 3. Archivos Creados

- `cleanup_old_backups.sh` - Script para limpiar backups antiguos
- `LISTA_ARCHIVOS_BACKUP.md` - Lista completa de archivos para descarga
- `.gitignore` actualizado - Excluye carpetas de backup del repositorio

### 4. Próximos Pasos

1. **Ejecutar limpieza de backups antiguos:**
   ```bash
   ./cleanup_old_backups.sh
   ```

2. **Eliminar carpetas de backup del proyecto:**
   ```bash
   rm -rf backups/
   rm -rf backup_limpieza_raiz_20250809_105820/
   ```

3. **Hacer push al repositorio sin archivos de backup**

## Configuración Actual del Cron

```bash
# Renovación SSL diaria a las 12:00 PM
0 12 * * * /root/concursos/mpd_concursos/ssl-setup/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1

# Backup completo diario a las 2:00 AM
0 2 * * * /opt/mpd-monitor/backup-complete.sh >> /var/log/mpd-backup.log 2>&1
```

## Beneficios

- ✅ Reducción del 75% en generación de backups
- ✅ Menor uso de espacio en disco
- ✅ Backups más manejables
- ✅ Mantenimiento más sencillo
- ✅ Repositorio más limpio (sin archivos de backup)