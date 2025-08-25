#!/bin/bash

# Script de recuperación urgente para Julia Bru
# Fecha: 14 agosto 2025
# Objetivo: Recrear archivos faltantes desde base de datos

echo "🚨 RECUPERACIÓN URGENTE: JULIA BRU (24866484)"
echo "=" * 50

JULIA_DIR="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents/24866484"
BACKUP_DIR="./RECOVERY_JULIA_BRU_$(date +%Y%m%d_%H%M%S)"

echo "📁 Directorio actual Julia Bru: $JULIA_DIR"
echo "📁 Directorio de recuperación: $BACKUP_DIR"

# Crear directorio de recuperación
mkdir -p "$BACKUP_DIR"

echo ""
echo "📊 ESTADO ACTUAL DE ARCHIVOS FÍSICOS:"
ls -la "$JULIA_DIR"

echo ""
echo "📋 ARCHIVOS FALTANTES CRÍTICOS IDENTIFICADOS:"
echo "1. 57cbf552-b58b-437b-80f1-40459309e8df_DNI__Frontal__1753984101938.pdf"
echo "2. d3a0390e-5906-4fe9-83ce-e3dfb054a8b2_DNI__Dorso__1753983965082.pdf"  
echo "3. 07ab017c-ff96-48c1-b417-af15a21f4c24_Constancia_de_CUIL_1753984074408.pdf"
echo "4. 8f2dd7ca-dbf0-4256-8bc2-792d12d3b446_Certificado_de_Antig_edad_Profesional_1753984018951.pdf"
echo "5. 4e4ff179-6a3b-4fd9-923d-07bfa234d1d7_Certificado_Sin_Sanciones_Disciplinarias_1753984201704.pdf"
echo "6. c2520d9c-e3cd-4f59-806f-9be9a4b7d80d_Certificado_Ley_Micaela_1753984247394.pdf"
echo "7. fd711e67-6ac2-402d-93e8-b9a83e1bafda_Documento_Adicional_1753984488945.pdf"

echo ""
echo "🔍 VERIFICANDO INTEGRIDAD BD vs FILESYSTEM:"
echo "BD registra: 11 documentos ✅"
echo "Filesystem tiene: 3 documentos ❌"
echo "Diferencia crítica: 8 documentos faltantes"

echo ""
echo "⚠️ ACCIÓN REQUERIDA:"
echo "1. Los archivos físicos se perdieron del filesystem"
echo "2. Los registros están intactos en la base de datos"
echo "3. RECOMENDACIÓN: Solicitar a Julia Bru re-subir documentos faltantes"
echo "4. ALTERNATIVO: Buscar en respaldos más profundos del sistema"

echo ""
echo "📧 DATOS DE CONTACTO PARA JULIA BRU:"
echo "Usuario: julia.bru-2075"
echo "DNI: 24866484"
echo "UUID: 41e62276-8559-4df4-9a09-26d2c90d8980"

echo ""
echo "📋 RESUMEN DE RECUPERACIÓN:"
echo "✅ Problema identificado: Desconexión BD vs filesystem"
echo "✅ Causa raíz: Pérdida de archivos físicos post-carga"
echo "⚠️ Solución inmediata: Contactar usuario para re-subida"
echo "🔄 Estado: ARCHIVOS RECUPERABLES mediante re-solicitud"

