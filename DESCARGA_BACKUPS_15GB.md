# Descarga de Backups Automáticos (15GB)

## Información de la Carpeta

- **Ubicación**: `/opt/mpd-monitor/backups/`
- **Tamaño total**: 15GB
- **Número de archivos**: 84 archivos
- **Período**: Backups desde agosto 1 hasta agosto 10, 2025
- **Frecuencia**: Cada 6 horas (antes del cambio)

## Comando para Descarga Completa

```bash
# Descargar toda la carpeta (15GB)
scp -r root@vps-4778464-x.dattaweb.com:/opt/mpd-monitor/backups ./mpd-monitor-backups
```

## Verificación de Integridad

### 1. Descargar archivo de checksums
```bash
scp root@vps-4778464-x.dattaweb.com:/root/concursos/mpd_concursos/mpd-monitor-backups-checksums.md5 ./
```

### 2. Verificar integridad después de la descarga
```bash
# En tu máquina local, después de la descarga:
cd mpd-monitor-backups

# Crear checksums de los archivos descargados
find . -type f -exec md5sum {} \; > checksums-local.md5

# Comparar con los checksums originales
# Nota: Ajustar las rutas en el archivo original
sed 's|/opt/mpd-monitor/backups/|./|g' ../mpd-monitor-backups-checksums.md5 > checksums-server.md5

# Verificar que coincidan
diff checksums-local.md5 checksums-server.md5

# Si no hay output, la integridad está verificada ✅
```

### 3. Script de verificación automática
```bash
#!/bin/bash
echo "🔍 Verificando integridad de backups descargados..."

if [ ! -f "../mpd-monitor-backups-checksums.md5" ]; then
    echo "❌ Archivo de checksums no encontrado"
    exit 1
fi

# Crear checksums locales
find . -type f -exec md5sum {} \; | sort > checksums-local.md5

# Preparar checksums del servidor
sed 's|/opt/mpd-monitor/backups/|./|g' ../mpd-monitor-backups-checksums.md5 | sort > checksums-server.md5

# Comparar
if diff checksums-local.md5 checksums-server.md5 > /dev/null; then
    echo "✅ Integridad verificada - Todos los archivos coinciden"
    echo "📊 Archivos verificados: $(wc -l < checksums-local.md5)"
else
    echo "❌ Error de integridad - Algunos archivos no coinciden"
    echo "🔍 Diferencias encontradas:"
    diff checksums-local.md5 checksums-server.md5
    exit 1
fi
```

## Tipos de Archivos en el Backup

### Backups de Base de Datos (.sql.gz)
- Archivos comprimidos con dumps de la BD
- Tamaño promedio: ~750KB cada uno
- Frecuencia: Cada 6 horas

### Backups de Archivos (.tar/.tar.gz)
- Archivos del sistema y documentos
- Tamaño promedio: ~1.2GB cada uno
- Contiene: storage/, uploads/, documentos de usuarios

### Reportes de Backup (.txt)
- Logs de cada proceso de backup
- Información sobre éxito/errores
- Tamaño: ~1.7KB cada uno

## Estimación de Tiempo de Descarga

- **Conexión 100 Mbps**: ~20-25 minutos
- **Conexión 50 Mbps**: ~40-50 minutos
- **Conexión 25 Mbps**: ~1.5-2 horas

## Después de la Descarga

1. **Verificar integridad** usando los checksums
2. **Confirmar descarga exitosa**
3. **Proceder con eliminación del servidor**

## Comando de Eliminación (SOLO después de verificar)

```bash
# ⚠️ PELIGRO: Solo ejecutar después de verificar la descarga
rm -rf /opt/mpd-monitor/backups/*
```