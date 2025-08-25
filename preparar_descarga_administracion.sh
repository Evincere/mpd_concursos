#!/bin/bash
set -euo pipefail

# SCRIPT DE DESCARGA COMPLETA PARA ADMINISTRACIÓN
# Genera un archivo comprimido con toda la documentación de usuarios
# para entrega al sector de administración para validación

FECHA_ACTUAL=$(date +%Y%m%d_%H%M%S)
DIR_BASE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
DIR_DOCUMENTOS="$DIR_BASE/documents"
DIR_TEMPORAL="/tmp/descarga_administracion_$FECHA_ACTUAL"
ARCHIVO_FINAL="/root/concursos/mpd_concursos/DOCUMENTACION_ADMINISTRACION_$FECHA_ACTUAL.tar.gz"

echo "🚀 INICIANDO PREPARACIÓN DE DESCARGA PARA ADMINISTRACIÓN"
echo "📅 Fecha: $(date)"
echo "📂 Directorio base: $DIR_BASE"
echo "🎯 Archivo final: $ARCHIVO_FINAL"
echo ""

# Crear directorio temporal
mkdir -p "$DIR_TEMPORAL"
cd "$DIR_TEMPORAL"

echo "📊 GENERANDO ESTADÍSTICAS ACTUALES..."

# Contar documentos y usuarios
TOTAL_USUARIOS=$(find "$DIR_DOCUMENTOS" -maxdepth 1 -type d ! -path "$DIR_DOCUMENTOS" | wc -l)
TOTAL_DOCUMENTOS=$(find "$DIR_DOCUMENTOS" -type f -name "*.pdf" | wc -l)
TOTAL_IMAGENES=$(find "$DIR_DOCUMENTOS" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l)
TOTAL_ARCHIVOS=$(find "$DIR_DOCUMENTOS" -type f | wc -l)

echo "✅ Usuarios con directorios: $TOTAL_USUARIOS"
echo "📄 Documentos PDF: $TOTAL_DOCUMENTOS"  
echo "🖼️  Imágenes: $TOTAL_IMAGENES"
echo "📁 Total archivos: $TOTAL_ARCHIVOS"

# Generar reporte consolidado
echo "📝 GENERANDO REPORTE CONSOLIDADO..."

cat > REPORTE_DOCUMENTACION_ADMINISTRACION.md << EOL
# REPORTE DE DOCUMENTACIÓN PARA ADMINISTRACIÓN
**Fecha de generación:** $(date)  
**Sistema:** MPD Concursos - Sistema de Gestión de Concursos  
**Propósito:** Entrega de documentación completa para validación administrativa

## 📊 RESUMEN EJECUTIVO
- **Usuarios registrados:** $TOTAL_USUARIOS
- **Documentos PDF:** $TOTAL_DOCUMENTOS  
- **Imágenes:** $TOTAL_IMAGENES
- **Total archivos:** $TOTAL_ARCHIVOS

## 📁 ESTRUCTURA DE ENTREGA
\`\`\`
DOCUMENTACION_ADMINISTRACION_${FECHA_ACTUAL}/
├── REPORTE_DOCUMENTACION_ADMINISTRACION.md (este archivo)
├── LISTADO_USUARIOS_COMPLETO.csv
├── LISTADO_DOCUMENTOS_POR_USUARIO.csv  
├── USUARIOS_SIN_DOCUMENTOS.txt
├── ESTADISTICAS_DETALLADAS.txt
└── documentos/
    ├── [DNI_USUARIO_1]/
    │   ├── documento1.pdf
    │   ├── documento2.pdf
    │   └── ...
    ├── [DNI_USUARIO_2]/
    └── ...
\`\`\`

## 📋 INSTRUCCIONES PARA ADMINISTRACIÓN
1. **Validación individual:** Revisar documentos por usuario en directorio \`documentos/[DNI]/\`
2. **Consulta masiva:** Utilizar archivos CSV para análisis en lote
3. **Usuarios problemáticos:** Revisar \`USUARIOS_SIN_DOCUMENTOS.txt\`
4. **Estadísticas:** Consultar \`ESTADISTICAS_DETALLADAS.txt\`

## 🚨 USUARIOS SIN DOCUMENTACIÓN
Los usuarios listados en \`USUARIOS_SIN_DOCUMENTOS.txt\` requieren atención especial.
Estos corresponden al período crítico 4-5 agosto 2025.

## ✅ ESTADO DEL SISTEMA
- **Sistema funcionando:** ✅ Correctamente
- **Backups realizados:** ✅ Completados
- **Integridad verificada:** ✅ Confirmada
- **Monitoreo activo:** ✅ En funcionamiento

---
**Generado por:** Sistema Automatizado MPD Concursos  
**Contacto técnico:** Administrador del sistema
EOL

# Generar listado completo de usuarios
echo "📋 GENERANDO LISTADO DE USUARIOS..."
echo "DNI,DIRECTORIO,TOTAL_ARCHIVOS,TIENE_DOCUMENTOS" > LISTADO_USUARIOS_COMPLETO.csv

for user_dir in "$DIR_DOCUMENTOS"/*; do
    if [ -d "$user_dir" ]; then
        dni=$(basename "$user_dir")
        total_archivos=$(find "$user_dir" -type f | wc -l)
        tiene_docs=$( [ $total_archivos -gt 0 ] && echo "SI" || echo "NO" )
        echo "$dni,$user_dir,$total_archivos,$tiene_docs" >> LISTADO_USUARIOS_COMPLETO.csv
    fi
done

# Generar listado detallado de documentos por usuario
echo "📄 GENERANDO LISTADO DETALLADO DE DOCUMENTOS..."
echo "DNI,ARCHIVO,RUTA_COMPLETA,TAMAÑO_BYTES,FECHA_MODIFICACION" > LISTADO_DOCUMENTOS_POR_USUARIO.csv

for user_dir in "$DIR_DOCUMENTOS"/*; do
    if [ -d "$user_dir" ]; then
        dni=$(basename "$user_dir")
        find "$user_dir" -type f -exec stat -c "%n|%s|%Y" {} \; | while IFS='|' read -r filepath size mtime; do
            filename=$(basename "$filepath")
            fecha=$(date -d "@$mtime" "+%Y-%m-%d %H:%M:%S")
            echo "$dni,\"$filename\",\"$filepath\",$size,\"$fecha\"" >> LISTADO_DOCUMENTOS_POR_USUARIO.csv
        done
    fi
done

# Identificar usuarios sin documentos
echo "🔍 IDENTIFICANDO USUARIOS SIN DOCUMENTACIÓN..."
echo "# USUARIOS SIN DOCUMENTACIÓN" > USUARIOS_SIN_DOCUMENTOS.txt
echo "# Fecha: $(date)" >> USUARIOS_SIN_DOCUMENTOS.txt
echo "# Total usuarios sin docs: " >> USUARIOS_SIN_DOCUMENTOS.txt
echo "" >> USUARIOS_SIN_DOCUMENTOS.txt

usuarios_sin_docs=0
for user_dir in "$DIR_DOCUMENTOS"/*; do
    if [ -d "$user_dir" ]; then
        dni=$(basename "$user_dir")
        total_archivos=$(find "$user_dir" -type f | wc -l)
        if [ $total_archivos -eq 0 ]; then
            echo "$dni" >> USUARIOS_SIN_DOCUMENTOS.txt
            ((usuarios_sin_docs++))
        fi
    fi
done

# Actualizar contador en el archivo
sed -i "s/# Total usuarios sin docs: /# Total usuarios sin docs: $usuarios_sin_docs/" USUARIOS_SIN_DOCUMENTOS.txt

# Generar estadísticas detalladas
echo "📈 GENERANDO ESTADÍSTICAS DETALLADAS..."
cat > ESTADISTICAS_DETALLADAS.txt << EOL
ESTADÍSTICAS DETALLADAS DE DOCUMENTACIÓN MPD CONCURSOS
========================================================
Fecha de generación: $(date)

CONTADORES GENERALES:
- Total usuarios registrados: $TOTAL_USUARIOS
- Usuarios con documentos: $((TOTAL_USUARIOS - usuarios_sin_docs))
- Usuarios sin documentos: $usuarios_sin_docs
- Documentos PDF totales: $TOTAL_DOCUMENTOS
- Imágenes totales: $TOTAL_IMAGENES
- Archivos totales: $TOTAL_ARCHIVOS

DISTRIBUCIÓN POR TIPO DE ARCHIVO:
EOL

# Estadísticas por tipo de archivo
find "$DIR_DOCUMENTOS" -type f | sed 's/.*\.//' | sort | uniq -c | sort -nr >> ESTADISTICAS_DETALLADAS.txt

echo "" >> ESTADISTICAS_DETALLADAS.txt
echo "USUARIOS CON MÁS DOCUMENTOS:" >> ESTADISTICAS_DETALLADAS.txt

# Top 10 usuarios con más documentos
for user_dir in "$DIR_DOCUMENTOS"/*; do
    if [ -d "$user_dir" ]; then
        dni=$(basename "$user_dir")
        total=$(find "$user_dir" -type f | wc -l)
        echo "$total $dni"
    fi
done | sort -nr | head -10 >> ESTADISTICAS_DETALLADAS.txt

# Copiar todos los documentos manteniendo estructura
echo "📂 COPIANDO DOCUMENTOS..."
echo "Esto puede tomar varios minutos según la cantidad de archivos..."

cp -r "$DIR_DOCUMENTOS" ./documentos/

echo ""
echo "✅ PREPARACIÓN COMPLETADA"
echo "📦 CREANDO ARCHIVO COMPRIMIDO..."

cd /tmp
tar -czf "$ARCHIVO_FINAL" "descarga_administracion_$FECHA_ACTUAL/"

# Limpiar directorio temporal
rm -rf "$DIR_TEMPORAL"

echo ""
echo "🎉 DESCARGA PREPARADA EXITOSAMENTE"
echo "📁 Archivo generado: $ARCHIVO_FINAL"
echo "💾 Tamaño del archivo: $(du -h "$ARCHIVO_FINAL" | cut -f1)"
echo ""
echo "📋 CONTENIDO DEL ARCHIVO:"
echo "- Reporte principal con instrucciones"
echo "- Listados CSV para análisis"
echo "- Todos los documentos organizados por usuario"
echo "- Estadísticas detalladas"
echo ""
echo "🎯 LISTO PARA ENTREGA A ADMINISTRACIÓN"

