#!/bin/bash

# Script de investigación automatizada para usuarios
# Uso: ./investigar_usuario.sh [DNI_USUARIO]

set -e

DNI_USUARIO="$1"
if [ -z "$DNI_USUARIO" ]; then
    echo "❌ Error: Debe proporcionar un DNI de usuario"
    echo "Uso: $0 [DNI_USUARIO]"
    exit 1
fi

echo "🔍 INICIANDO INVESTIGACIÓN PARA USUARIO DNI: $DNI_USUARIO"
echo "==============================================="

# Función para consultar base de datos
consultar_bd() {
    local query="$1"
    docker exec mpd-concursos-mysql mysql -u root -proot1234 -D mpd_concursos -e "$query" 2>/dev/null
}

# 1. INFORMACIÓN BÁSICA DEL USUARIO
echo "📋 1. INFORMACIÓN DEL USUARIO"
echo "------------------------------"
user_info=$(consultar_bd "
SELECT 
    HEX(u.id) as user_id,
    u.dni,
    u.first_name,
    u.last_name,
    u.email,
    u.status as user_status,
    u.created_at
FROM user_entity u 
WHERE u.dni = '$DNI_USUARIO';
")

if [ -z "$user_info" ] || [ "$user_info" = "user_id	dni	first_name	last_name	email	user_status	created_at" ]; then
    echo "❌ Usuario con DNI $DNI_USUARIO no encontrado en la base de datos"
    exit 1
fi

echo "$user_info"

# Extraer USER_ID para consultas posteriores
USER_ID=$(echo "$user_info" | tail -n 1 | cut -f1)
echo "🔑 USER_ID: $USER_ID"

# 2. INFORMACIÓN DE INSCRIPCIÓN
echo -e "\n📝 2. INFORMACIÓN DE INSCRIPCIÓN"
echo "--------------------------------"
consultar_bd "
SELECT 
    HEX(i.id) as inscription_id,
    i.status as inscription_status,
    i.current_step,
    i.inscription_date,
    i.centro_de_vida,
    i.documentos_completos
FROM inscriptions i 
WHERE i.user_id = UNHEX('$USER_ID');
"

# 3. DOCUMENTOS EN BASE DE DATOS
echo -e "\n📄 3. DOCUMENTOS EN BASE DE DATOS"
echo "----------------------------------"
consultar_bd "
SELECT 
    HEX(d.id) as document_id,
    d.file_name,
    d.file_path,
    d.status,
    d.processing_status,
    d.upload_date,
    d.validated_at,
    d.is_archived,
    dt.name as document_type
FROM documents d
LEFT JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.user_id = UNHEX('$USER_ID')
ORDER BY d.upload_date;
"

# 4. VERIFICACIÓN DE ARCHIVOS FÍSICOS
echo -e "\n💾 4. VERIFICACIÓN DE ARCHIVOS FÍSICOS"
echo "--------------------------------------"
user_dir="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents/$DNI_USUARIO"

if [ -d "$user_dir" ]; then
    echo "✅ Directorio del usuario existe: $user_dir"
    echo "📊 Contenido del directorio:"
    ls -la "$user_dir/"
    
    echo -e "\n📊 Estadísticas de archivos:"
    total_files=$(find "$user_dir" -type f | wc -l)
    total_size=$(du -sh "$user_dir" | cut -f1)
    echo "Total archivos: $total_files"
    echo "Tamaño total: $total_size"
else
    echo "❌ Directorio del usuario NO existe: $user_dir"
fi

# 5. BÚSQUEDA EN DIRECTORIOS DE RECOVERY
echo -e "\n🔄 5. BÚSQUEDA EN DIRECTORIOS DE RECOVERY"
echo "-----------------------------------------"
recovery_dir="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/recovered_documents/$DNI_USUARIO"

if [ -d "$recovery_dir" ]; then
    echo "✅ Directorio de recovery existe: $recovery_dir"
    ls -la "$recovery_dir/"
else
    echo "ℹ️ No se encontró directorio de recovery para este usuario"
fi

# 6. AUDITORÍA DE DOCUMENTOS
echo -e "\n📋 6. AUDITORÍA DE DOCUMENTOS"
echo "-----------------------------"
consultar_bd "
SELECT 
    da.action,
    da.timestamp,
    da.details,
    da.performed_by
FROM document_audit da
WHERE da.user_id = UNHEX('$USER_ID')
ORDER BY da.timestamp DESC
LIMIT 10;
"

echo -e "\n✅ INVESTIGACIÓN COMPLETADA PARA USUARIO DNI: $DNI_USUARIO"
