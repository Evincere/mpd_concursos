#!/bin/bash
# Script de análisis diferencial - Comparar estado de referencia vs estado actual

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Debe proporcionar el directorio de estado de referencia"
    echo "📋 Uso: $0 /ruta/al/estado_referencia_YYYYMMDD_HHMM"
    exit 1
fi

REFERENCIA_DIR="$1"
ACTUAL_DIR="estado_actual_$(date +%Y%m%d_%H%M)"

echo "🔍 ANÁLISIS DIFERENCIAL DEL SISTEMA MPD"
echo "======================================"
echo "📅 Fecha análisis: $(date)"
echo "📁 Estado referencia: $REFERENCIA_DIR"
echo "📁 Estado actual: $ACTUAL_DIR"
echo ""

# Crear directorio para estado actual
mkdir -p "$ACTUAL_DIR"
cd "$ACTUAL_DIR"

# Obtener estado actual de usuarios
echo "👥 Analizando diferencias en usuarios..."
docker exec mpd-concursos-mysql-prod mysql -u root -p$(grep MYSQL_ROOT_PASSWORD ../.env.production | cut -d'=' -f2) mpd_concursos -e "
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as usuarios_hoy,
    MIN(created_at) as primer_usuario,
    MAX(created_at) as ultimo_usuario
FROM user_entity;
" > usuarios_actual.txt

# Obtener estado actual de documentos
echo "📄 Analizando diferencias en documentos..."
docker exec mpd-concursos-mysql-prod mysql -u root -p$(grep MYSQL_ROOT_PASSWORD ../.env.production | cut -d'=' -f2) mpd_concursos -e "
SELECT 
    COUNT(*) as total_documentos,
    COUNT(CASE WHEN DATE(upload_date) = CURDATE() THEN 1 END) as documentos_hoy,
    COUNT(CASE WHEN file_path IS NOT NULL THEN 1 END) as docs_con_archivo,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as docs_pendientes,
    MIN(upload_date) as primer_documento,
    MAX(upload_date) as ultimo_documento
FROM documents;
" > documentos_actual.txt

# Análisis diferencial
echo ""
echo "📊 GENERANDO REPORTE DE DIFERENCIAS..."

echo "=== COMPARACIÓN DE ESTADOS ===" > reporte_diferencias.txt
echo "Referencia: $(basename $REFERENCIA_DIR)" >> reporte_diferencias.txt  
echo "Actual: $(basename $ACTUAL_DIR)" >> reporte_diferencias.txt
echo "Fecha análisis: $(date)" >> reporte_diferencias.txt
echo "" >> reporte_diferencias.txt

# Comparar usuarios
USUARIOS_REF=$(tail -n 1 "$REFERENCIA_DIR/usuarios_referencia.txt" | cut -f1)
USUARIOS_ACT=$(tail -n 1 "usuarios_actual.txt" | cut -f1)
DIFF_USUARIOS=$((USUARIOS_ACT - USUARIOS_REF))

echo "👥 USUARIOS:" >> reporte_diferencias.txt
echo "  Referencia: $USUARIOS_REF" >> reporte_diferencias.txt
echo "  Actual: $USUARIOS_ACT" >> reporte_diferencias.txt
echo "  Diferencia: +$DIFF_USUARIOS usuarios nuevos" >> reporte_diferencias.txt
echo "" >> reporte_diferencias.txt

# Comparar documentos  
DOCS_REF=$(tail -n 1 "$REFERENCIA_DIR/documentos_referencia.txt" | cut -f1)
DOCS_ACT=$(tail -n 1 "documentos_actual.txt" | cut -f1)
DIFF_DOCS=$((DOCS_ACT - DOCS_REF))

echo "📄 DOCUMENTOS:" >> reporte_diferencias.txt
echo "  Referencia: $DOCS_REF" >> reporte_diferencias.txt  
echo "  Actual: $DOCS_ACT" >> reporte_diferencias.txt
echo "  Diferencia: +$DIFF_DOCS documentos nuevos" >> reporte_diferencias.txt

echo "✅ Reporte de diferencias generado: reporte_diferencias.txt"
cat reporte_diferencias.txt

echo ""
echo "🎯 ESTOS DATOS DEBEN PRESERVARSE EN LA RECUPERACIÓN HÍBRIDA"
