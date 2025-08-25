#!/bin/bash
set -euo pipefail

# SCRIPT DE REPORTE PRELIMINAR PARA ADMINISTRACIÓN
# Genera estadísticas y análisis sin copiar archivos

FECHA_ACTUAL=$(date +%Y%m%d_%H%M%S)
DIR_DOCUMENTOS="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents"
REPORTE_FILE="/root/concursos/mpd_concursos/REPORTE_PRELIMINAR_ADMIN_$FECHA_ACTUAL.md"

echo "📊 GENERANDO REPORTE PRELIMINAR PARA ADMINISTRACIÓN"
echo "📅 Fecha: $(date)"
echo ""

# Verificar que existe el directorio
if [ ! -d "$DIR_DOCUMENTOS" ]; then
    echo "❌ ERROR: No se encuentra el directorio de documentos"
    exit 1
fi

# Contar datos básicos
echo "📈 Calculando estadísticas básicas..."

TOTAL_USUARIOS=$(find "$DIR_DOCUMENTOS" -maxdepth 1 -type d ! -path "$DIR_DOCUMENTOS" | wc -l)
echo "   - Usuarios: $TOTAL_USUARIOS"

TOTAL_DOCUMENTOS=$(find "$DIR_DOCUMENTOS" -type f -name "*.pdf" 2>/dev/null | wc -l)
echo "   - PDFs: $TOTAL_DOCUMENTOS"

TOTAL_IMAGENES=$(find "$DIR_DOCUMENTOS" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l)
echo "   - Imágenes: $TOTAL_IMAGENES"

TOTAL_ARCHIVOS=$(find "$DIR_DOCUMENTOS" -type f 2>/dev/null | wc -l)
echo "   - Total archivos: $TOTAL_ARCHIVOS"

# Contar usuarios con y sin documentos
echo "🔍 Analizando usuarios con/sin documentos..."
USUARIOS_CON_DOCS=0
USUARIOS_SIN_DOCS=0

for user_dir in "$DIR_DOCUMENTOS"/*; do
    if [ -d "$user_dir" ]; then
        total_archivos=$(find "$user_dir" -type f 2>/dev/null | wc -l)
        if [ $total_archivos -gt 0 ]; then
            USUARIOS_CON_DOCS=$((USUARIOS_CON_DOCS + 1))
        else
            USUARIOS_SIN_DOCS=$((USUARIOS_SIN_DOCS + 1))
        fi
    fi
done

echo "   - Con documentos: $USUARIOS_CON_DOCS"
echo "   - Sin documentos: $USUARIOS_SIN_DOCS"

# Calcular espacio total
ESPACIO_TOTAL=$(du -sh "$DIR_DOCUMENTOS" 2>/dev/null | cut -f1 || echo "N/A")

# Calcular porcentajes
if [ $TOTAL_USUARIOS -gt 0 ]; then
    PORCENTAJE_CON_DOCS=$(echo "scale=1; $USUARIOS_CON_DOCS * 100 / $TOTAL_USUARIOS" | bc)
else
    PORCENTAJE_CON_DOCS="0.0"
fi

if [ $USUARIOS_CON_DOCS -gt 0 ]; then
    PROMEDIO_ARCHIVOS=$(echo "scale=1; $TOTAL_ARCHIVOS / $USUARIOS_CON_DOCS" | bc)
else
    PROMEDIO_ARCHIVOS="0.0"
fi

echo "📝 Generando reporte..."

# Generar reporte
cat > "$REPORTE_FILE" << EOL
# REPORTE PRELIMINAR - DOCUMENTACIÓN PARA ADMINISTRACIÓN

**📅 Fecha:** $(date)  
**🎯 Propósito:** Análisis previo para entrega a administración  
**📂 Sistema:** MPD Concursos

## 📊 ESTADÍSTICAS GENERALES

| Métrica | Cantidad |
|---------|----------|
| **👥 Usuarios totales** | $TOTAL_USUARIOS |
| **✅ Usuarios con documentos** | $USUARIOS_CON_DOCS |
| **❌ Usuarios sin documentos** | $USUARIOS_SIN_DOCS |
| **📄 Documentos PDF** | $TOTAL_DOCUMENTOS |
| **🖼️ Imágenes** | $TOTAL_IMAGENES |
| **📁 Total archivos** | $TOTAL_ARCHIVOS |
| **💾 Espacio total** | $ESPACIO_TOTAL |

## 📈 ANÁLISIS DE COBERTURA

- **Cobertura documental:** $PORCENTAJE_CON_DOCS% de usuarios tienen documentos
- **Usuarios problemáticos:** $USUARIOS_SIN_DOCS usuarios requieren atención
- **Promedio docs/usuario:** $PROMEDIO_ARCHIVOS archivos por usuario (solo usuarios con docs)

## 🚨 USUARIOS SIN DOCUMENTACIÓN

Los siguientes DNIs no tienen documentos cargados:

EOL

# Agregar lista de usuarios sin documentos
echo "🔍 Listando usuarios sin documentos..."
usuarios_vacios=0
for user_dir in "$DIR_DOCUMENTOS"/*; do
    if [ -d "$user_dir" ]; then
        dni=$(basename "$user_dir")
        total_archivos=$(find "$user_dir" -type f 2>/dev/null | wc -l)
        if [ $total_archivos -eq 0 ]; then
            echo "- $dni" >> "$REPORTE_FILE"
            usuarios_vacios=$((usuarios_vacios + 1))
        fi
    fi
done

cat >> "$REPORTE_FILE" << EOL

**Total usuarios sin documentos:** $usuarios_vacios

## 📋 DISTRIBUCIÓN POR TIPO DE ARCHIVO

EOL

# Estadísticas por extensión
echo "📄 Analizando tipos de archivo..."
find "$DIR_DOCUMENTOS" -type f 2>/dev/null | sed 's/.*\.//' | sort | uniq -c | sort -nr | head -10 | while read count ext; do
    echo "- **.$ext:** $count archivos" >> "$REPORTE_FILE"
done

cat >> "$REPORTE_FILE" << EOL

## 🏆 TOP 10 USUARIOS CON MÁS DOCUMENTOS

EOL

# Top usuarios con más docs
echo "🏆 Identificando usuarios con más documentos..."
temp_file=$(mktemp)
for user_dir in "$DIR_DOCUMENTOS"/*; do
    if [ -d "$user_dir" ]; then
        dni=$(basename "$user_dir")
        total=$(find "$user_dir" -type f 2>/dev/null | wc -l)
        if [ $total -gt 0 ]; then
            echo "$total $dni" >> "$temp_file"
        fi
    fi
done

sort -nr "$temp_file" | head -10 | while read total dni; do
    echo "- **$dni:** $total archivos" >> "$REPORTE_FILE"
done

rm -f "$temp_file"

cat >> "$REPORTE_FILE" << EOL

## 📅 ANÁLISIS TEMPORAL

**Período crítico identificado:** 4-5 agosto 2025  
**Recuperaciones realizadas:** 6 de agosto  
**Estado actual:** Sistema estabilizado y monitoreado

## ✅ RECOMENDACIONES PARA ADMINISTRACIÓN

### Prioridad Alta
1. **Revisar usuarios sin documentos** - $USUARIOS_SIN_DOCS casos pendientes
2. **Validar período crítico** - Verificar documentos del 4-5 agosto
3. **Coordinar re-envío** - Contactar usuarios problemáticos

### Prioridad Media  
1. **Análisis masivo** - Utilizar archivos CSV cuando se genere descarga completa
2. **Validación por lotes** - Procesar usuarios con documentación completa
3. **Control de calidad** - Verificar integridad de documentos PDF

### Prioridad Baja
1. **Optimización** - Revisar casos con exceso de documentos
2. **Consolidación** - Evaluar duplicados en usuarios con muchos archivos

## 🎯 PRÓXIMOS PASOS

1. **Generar descarga completa:** Ejecutar \`./preparar_descarga_administracion.sh\`
2. **Entregar a administración** con este reporte preliminar
3. **Coordinar validación** según prioridades establecidas
4. **Implementar seguimiento** de casos problemáticos

## 📞 INFORMACIÓN DE CONTACTO

**Contacto técnico:** Administrador del sistema  
**Sistema:** MPD Concursos  
**Última actualización:** $(date)

---
*Reporte generado automáticamente por el sistema de gestión documental*
EOL

echo ""
echo "✅ REPORTE PRELIMINAR GENERADO"
echo "📄 Archivo: $REPORTE_FILE"
echo ""
echo "📊 RESUMEN EJECUTIVO:"
echo "   👥 Total usuarios: $TOTAL_USUARIOS"
echo "   ✅ Con documentos: $USUARIOS_CON_DOCS"  
echo "   ❌ Sin documentos: $USUARIOS_SIN_DOCS"
echo "   📁 Total archivos: $TOTAL_ARCHIVOS"
echo "   💾 Espacio total: $ESPACIO_TOTAL"
echo ""
echo "🎯 Siguiente paso: Ejecutar ./preparar_descarga_administracion.sh para descarga completa"

