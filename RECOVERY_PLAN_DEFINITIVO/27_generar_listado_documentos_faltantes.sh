#!/bin/bash

# ============================================================================
# SCRIPT: Generar Listado de Documentos Faltantes para Re-carga
# PROPÓSITO: Crear listado detallado para que usuarios vuelvan a cargar documentos
# FECHA: 2025-08-07
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LISTADO_CSV="DOCUMENTOS_FALTANTES_PARA_RECARGA_${TIMESTAMP}.csv"
LISTADO_DETALLADO="LISTADO_DETALLADO_USUARIOS_${TIMESTAMP}.txt"
EMAILS_NOTIFICACION="EMAILS_NOTIFICACION_${TIMESTAMP}.txt"

echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}📋 GENERANDO LISTADO DE DOCUMENTOS FALTANTES${NC}"
echo -e "${CYAN}============================================================================${NC}"

echo "📋 Generando listado para re-carga de usuarios..." | tee "$LISTADO_DETALLADO"
echo "Timestamp: $TIMESTAMP" | tee -a "$LISTADO_DETALLADO"
echo | tee -a "$LISTADO_DETALLADO"

# Variables
DOCKER_STORAGE="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data"
MYSQL_CONTAINER="mpd-concursos-mysql"
DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS="root1234"

# ============================================================================
# 1. CREAR ENCABEZADOS DE ARCHIVOS
# ============================================================================
echo "DNI,EMAIL,USERNAME,DOCUMENTO_FALTANTE,TIPO_DOCUMENTO,FECHA_CARGA,ID_DOCUMENTO" > "$LISTADO_CSV"
echo "# EMAILS PARA NOTIFICACIÓN MASIVA - $TIMESTAMP" > "$EMAILS_NOTIFICACION"
echo "# Formato: email@domain.com" >> "$EMAILS_NOTIFICACION"
echo >> "$EMAILS_NOTIFICACION"

# ============================================================================
# 2. OBTENER USUARIOS CON DOCUMENTOS FALTANTES
# ============================================================================
echo -e "${BLUE}📊 1. IDENTIFICANDO USUARIOS CON DOCUMENTOS FALTANTES:${NC}" | tee -a "$LISTADO_DETALLADO"
echo "===========================================" | tee -a "$LISTADO_DETALLADO"

# Query para obtener usuarios con documentos que no tienen archivo físico
USERS_QUERY="
SELECT DISTINCT 
    u.dni,
    u.email,
    u.username,
    HEX(u.id) as user_uuid
FROM user_entity u 
INNER JOIN documents d ON d.user_id = u.id 
WHERE d.is_archived = 0
ORDER BY u.dni;
"

echo "🔍 Ejecutando consulta de usuarios..." | tee -a "$LISTADO_DETALLADO"

TEMP_USERS_FILE="/tmp/users_for_check_${TIMESTAMP}.txt"
docker exec "$MYSQL_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$USERS_QUERY" 2>/dev/null | tail -n +2 > "$TEMP_USERS_FILE"

TOTAL_USUARIOS=$(wc -l < "$TEMP_USERS_FILE")
echo "✅ Encontrados $TOTAL_USUARIOS usuarios con documentos" | tee -a "$LISTADO_DETALLADO"
echo | tee -a "$LISTADO_DETALLADO"

# ============================================================================
# 3. ANALIZAR CADA USUARIO
# ============================================================================
echo -e "${BLUE}📊 2. ANALIZANDO DOCUMENTOS FALTANTES:${NC}" | tee -a "$LISTADO_DETALLADO"
echo "===========================================" | tee -a "$LISTADO_DETALLADO"

contador=0
usuarios_con_faltantes=0
total_documentos_faltantes=0

while IFS=$'\t' read -r dni email username user_uuid; do
    ((contador++))
    
    # Mostrar progreso cada 25 usuarios
    if [ $((contador % 25)) -eq 0 ] || [ $contador -eq 1 ]; then
        echo -e "${YELLOW}🔍 Progreso: $contador/$TOTAL_USUARIOS usuarios procesados${NC}"
    fi
    
    # Obtener documentos de este usuario
    DOCS_QUERY="
    SELECT 
        HEX(d.id) as doc_id,
        d.file_name,
        dt.name as document_type,
        d.upload_date
    FROM documents d 
    LEFT JOIN document_types dt ON d.document_type_id = dt.id
    INNER JOIN user_entity u ON d.user_id = u.id
    WHERE u.dni = '$dni' AND d.is_archived = 0
    ORDER BY d.upload_date;
    "
    
    TEMP_DOCS_FILE="/tmp/docs_${dni}_${TIMESTAMP}.txt"
    docker exec "$MYSQL_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$DOCS_QUERY" 2>/dev/null | tail -n +2 > "$TEMP_DOCS_FILE"
    
    usuario_tiene_faltantes=false
    documentos_faltantes_usuario=0
    
    # Verificar cada documento
    while IFS=$'\t' read -r doc_id file_name doc_type upload_date; do
        if [ -n "$file_name" ]; then
            # Buscar archivo físico
            archivo_fisico=$(find "$DOCKER_STORAGE/documents/$dni/" -name "*$file_name*" 2>/dev/null | head -1)
            
            if [ -z "$archivo_fisico" ]; then
                # Documento faltante encontrado
                if [ "$usuario_tiene_faltantes" = false ]; then
                    usuario_tiene_faltantes=true
                    ((usuarios_con_faltantes++))
                    
                    echo "❌ Usuario: $dni ($username)" | tee -a "$LISTADO_DETALLADO"
                    echo "   📧 Email: $email" | tee -a "$LISTADO_DETALLADO"
                    
                    # Agregar email a lista de notificación
                    if [ -n "$email" ] && [ "$email" != "NULL" ]; then
                        echo "$email" >> "$EMAILS_NOTIFICACION"
                    fi
                fi
                
                # Registrar documento faltante
                doc_type_clean=$(echo "$doc_type" | tr -d '\r\n' | sed 's/NULL/Tipo no especificado/')
                upload_date_clean=$(echo "$upload_date" | tr -d '\r\n')
                
                echo "      📄 FALTANTE: $file_name ($doc_type_clean)" | tee -a "$LISTADO_DETALLADO"
                
                # Agregar a CSV
                echo "$dni,$email,$username,$file_name,$doc_type_clean,$upload_date_clean,$doc_id" >> "$LISTADO_CSV"
                
                ((documentos_faltantes_usuario++))
                ((total_documentos_faltantes++))
            fi
        fi
    done < "$TEMP_DOCS_FILE"
    
    if [ "$usuario_tiene_faltantes" = true ]; then
        echo "   📊 Total documentos faltantes: $documentos_faltantes_usuario" | tee -a "$LISTADO_DETALLADO"
        echo | tee -a "$LISTADO_DETALLADO"
    fi
    
    # Limpiar archivo temporal
    rm -f "$TEMP_DOCS_FILE" 2>/dev/null || true
    
done < "$TEMP_USERS_FILE"

echo | tee -a "$LISTADO_DETALLADO"

# ============================================================================
# 4. ESTADÍSTICAS FINALES
# ============================================================================
echo -e "${BLUE}📊 3. ESTADÍSTICAS FINALES:${NC}" | tee -a "$LISTADO_DETALLADO"
echo "===========================================" | tee -a "$LISTADO_DETALLADO"

echo "📈 RESUMEN:" | tee -a "$LISTADO_DETALLADO"
echo "   • Total usuarios analizados: $TOTAL_USUARIOS" | tee -a "$LISTADO_DETALLADO"
echo "   • Usuarios con documentos faltantes: $usuarios_con_faltantes" | tee -a "$LISTADO_DETALLADO"
echo "   • Total documentos faltantes: $total_documentos_faltantes" | tee -a "$LISTADO_DETALLADO"

if [ $TOTAL_USUARIOS -gt 0 ]; then
    porcentaje_afectados=$((usuarios_con_faltantes * 100 / TOTAL_USUARIOS))
    echo "   • Porcentaje de usuarios afectados: $porcentaje_afectados%" | tee -a "$LISTADO_DETALLADO"
fi

echo | tee -a "$LISTADO_DETALLADO"

# ============================================================================
# 5. GENERAR TEMPLATE DE NOTIFICACIÓN
# ============================================================================
echo -e "${BLUE}📊 4. GENERANDO TEMPLATE DE NOTIFICACIÓN:${NC}" | tee -a "$LISTADO_DETALLADO"
echo "===========================================" | tee -a "$LISTADO_DETALLADO"

TEMPLATE_EMAIL="TEMPLATE_EMAIL_NOTIFICACION_${TIMESTAMP}.html"

cat > "$TEMPLATE_EMAIL" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Actualización de Documentos - Sistema de Concursos MPD</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert { background-color: #f39c12; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .document-list { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { background-color: #34495e; color: white; padding: 15px; text-align: center; }
        .btn { background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏛️ Ministerio Público de la Defensa</h1>
        <h2>Sistema de Concursos - Actualización de Documentos</h2>
    </div>
    
    <div class="content">
        <p>Estimado/a <strong>[NOMBRE_USUARIO]</strong>,</p>
        
        <div class="alert">
            <strong>⚠️ Acción Requerida:</strong> Necesitamos que vuelva a cargar algunos documentos en su perfil.
        </div>
        
        <p>Durante una actualización reciente de nuestro sistema, hemos identificado que algunos de sus documentos requieren ser cargados nuevamente para garantizar su correcta visualización y procesamiento.</p>
        
        <h3>📄 Documentos que necesita volver a cargar:</h3>
        <div class="document-list">
            <ul>
                [LISTA_DOCUMENTOS_FALTANTES]
            </ul>
        </div>
        
        <h3>📋 Instrucciones:</h3>
        <ol>
            <li>Ingrese al sistema de concursos con sus credenciales habituales</li>
            <li>Vaya a su perfil de usuario</li>
            <li>Localice la sección de documentos</li>
            <li>Vuelva a cargar los documentos listados arriba</li>
            <li>Verifique que los documentos se visualicen correctamente</li>
        </ol>
        
        <a href="[URL_SISTEMA]" class="btn">🔗 Acceder al Sistema</a>
        
        <p><strong>Importante:</strong></p>
        <ul>
            <li>Esta actualización no afecta su participación en concursos activos</li>
            <li>Sus datos personales y postulaciones están seguros</li>
            <li>Solo necesita volver a cargar los documentos específicos mencionados</li>
        </ul>
        
        <p>Si tiene alguna consulta o dificultad técnica, no dude en contactarnos.</p>
        
        <p>Gracias por su colaboración.</p>
    </div>
    
    <div class="footer">
        <p>Ministerio Público de la Defensa - Sistema de Concursos</p>
        <p>Este es un mensaje automático, por favor no responda a este email.</p>
    </div>
</body>
</html>
EOF

echo "✅ Template de email generado: $TEMPLATE_EMAIL" | tee -a "$LISTADO_DETALLADO"

# ============================================================================
# 6. GENERAR SCRIPT DE LIMPIEZA (OPCIONAL)
# ============================================================================
SCRIPT_LIMPIEZA="SCRIPT_LIMPIEZA_REGISTROS_FANTASMA_${TIMESTAMP}.sql"

cat > "$SCRIPT_LIMPIEZA" << EOF
-- ============================================================================
-- SCRIPT DE LIMPIEZA DE REGISTROS FANTASMA (USAR CON PRECAUCIÓN)
-- Generado automáticamente: $TIMESTAMP
-- ============================================================================

-- IMPORTANTE: EJECUTAR SOLO DESPUÉS DE QUE LOS USUARIOS HAYAN RECARGADO SUS DOCUMENTOS

-- Crear tabla de respaldo antes de eliminar
CREATE TABLE documents_backup_$TIMESTAMP AS 
SELECT * FROM documents WHERE id IN (
    SELECT HEX(d.id) FROM documents d 
    INNER JOIN user_entity u ON d.user_id = u.id 
    WHERE d.is_archived = 0 
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'archivo_fisico_existe'
    )
);

-- NOTA: Este script requiere verificación manual antes de ejecutar
-- Recomendación: NO ejecutar automáticamente
-- Contactar al administrador del sistema antes de proceder

EOF

echo "⚠️  Script de limpieza generado (NO EJECUTAR): $SCRIPT_LIMPIEZA" | tee -a "$LISTADO_DETALLADO"

# Limpiar archivos temporales
rm -f "$TEMP_USERS_FILE" 2>/dev/null || true

echo | tee -a "$LISTADO_DETALLADO"

echo -e "${GREEN}✅ GENERACIÓN DE LISTADO COMPLETADA${NC}"
echo -e "${CYAN}📄 Listado CSV: $LISTADO_CSV${NC}"
echo -e "${CYAN}📋 Listado detallado: $LISTADO_DETALLADO${NC}"
echo -e "${CYAN}📧 Lista de emails: $EMAILS_NOTIFICACION${NC}"
echo -e "${CYAN}📨 Template de email: $TEMPLATE_EMAIL${NC}"

echo
echo -e "${YELLOW}🎯 RESUMEN EJECUTIVO:${NC}"
echo "• Usuarios analizados: $TOTAL_USUARIOS"
echo "• Usuarios con documentos faltantes: $usuarios_con_faltantes"
echo "• Total documentos faltantes: $total_documentos_faltantes"
if [ $TOTAL_USUARIOS -gt 0 ]; then
    echo "• Porcentaje afectado: $porcentaje_afectados%"
fi

echo
echo -e "${BLUE}📋 PRÓXIMOS PASOS RECOMENDADOS:${NC}"
echo "1. Revisar listado CSV para validar información"
echo "2. Personalizar template de email según necesidades"
echo "3. Enviar notificaciones a usuarios afectados"
echo "4. Monitorear re-carga de documentos"
echo "5. Ejecutar nueva auditoría después de re-cargas"

echo
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}🎉 ¡LISTADO DE DOCUMENTOS FALTANTES GENERADO!${NC}"
echo -e "${CYAN}============================================================================${NC}"