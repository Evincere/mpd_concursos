#!/bin/bash
# Script para integrar todos los documentos recuperados

echo "🔄 [$(date)] INTEGRANDO DOCUMENTOS RECUPERADOS"

# Buscar archivos de recuperación
RECOVERY_4=$(ls /root/recovery_4agosto_*.tar.gz 2>/dev/null | head -1)
RECOVERY_5=$(ls /root/recovery_5agosto_*.tar.gz 2>/dev/null | head -1)

if [ -z "$RECOVERY_4" ] || [ -z "$RECOVERY_5" ]; then
    echo "❌ Error: No se encontraron archivos de recuperación"
    echo "Archivos esperados:"
    echo "  - /root/recovery_4agosto_*.tar.gz"
    echo "  - /root/recovery_5agosto_*.tar.gz"
    exit 1
fi

echo "📦 Archivos de recuperación encontrados:"
echo "  - 4 agosto: $RECOVERY_4"
echo "  - 5 agosto: $RECOVERY_5"

# Crear directorio de integración
INTEGRATION_DIR="/tmp/final_integration"
mkdir -p "$INTEGRATION_DIR"

echo "📁 Extrayendo archivos recuperados..."

# Extraer archivos del 4 agosto
mkdir -p "$INTEGRATION_DIR/4agosto"
tar -xzf "$RECOVERY_4" -C "$INTEGRATION_DIR/4agosto/"

# Extraer archivos del 5 agosto
mkdir -p "$INTEGRATION_DIR/5agosto"
tar -xzf "$RECOVERY_5" -C "$INTEGRATION_DIR/5agosto/"

# Consolidar documentos únicos
echo "🔄 Consolidando documentos únicos..."
mkdir -p "$INTEGRATION_DIR/consolidated/documents"
mkdir -p "$INTEGRATION_DIR/consolidated/cv-documents"
mkdir -p "$INTEGRATION_DIR/consolidated/profile-images"

# Función para copiar sin sobrescribir
copy_unique() {
    local source="$1"
    local target="$2"
    
    if [ -d "$source" ]; then
        for item in "$source"/*; do
            if [ -d "$item" ]; then
                item_name=$(basename "$item")
                if [ ! -d "$target/$item_name" ]; then
                    cp -r "$item" "$target/"
                    echo "✅ Copiado: $item_name"
                else
                    # Copiar archivos individuales si el directorio existe
                    for file in "$item"/*; do
                        if [ -f "$file" ]; then
                            file_name=$(basename "$file")
                            if [ ! -f "$target/$item_name/$file_name" ]; then
                                mkdir -p "$target/$item_name"
                                cp "$file" "$target/$item_name/"
                                echo "✅ Archivo recuperado: $item_name/$file_name"
                            fi
                        fi
                    done
                fi
            fi
        done
    fi
}

# Consolidar documentos de inscripción
copy_unique "$INTEGRATION_DIR/4agosto/documents" "$INTEGRATION_DIR/consolidated/documents"
copy_unique "$INTEGRATION_DIR/5agosto/documents" "$INTEGRATION_DIR/consolidated/documents"

# Consolidar documentos CV
copy_unique "$INTEGRATION_DIR/4agosto/cv-documents" "$INTEGRATION_DIR/consolidated/cv-documents"
copy_unique "$INTEGRATION_DIR/5agosto/cv-documents" "$INTEGRATION_DIR/consolidated/cv-documents"

# Consolidar fotos de perfil
copy_unique "$INTEGRATION_DIR/4agosto/profile-images" "$INTEGRATION_DIR/consolidated/profile-images"
copy_unique "$INTEGRATION_DIR/5agosto/profile-images" "$INTEGRATION_DIR/consolidated/profile-images"

# Copiar al contenedor
echo "📤 Copiando al contenedor..."
docker cp "$INTEGRATION_DIR/consolidated" mpd-concursos-backend-prod:/app/final_recovery

# Ejecutar integración usando el script probado
echo "🔄 Ejecutando integración inteligente..."
docker exec mpd-concursos-backend-prod bash -c '
integrate_documents() {
    local source_dir="$1"
    local target_dir="$2"
    local type="$3"
    
    echo "Integrando $type..."
    
    for user_dir in "$source_dir"/*; do
        if [ -d "$user_dir" ]; then
            user_id=$(basename "$user_dir")
            target_user_dir="$target_dir/$user_id"
            
            if [ ! -d "$target_user_dir" ]; then
                cp -r "$user_dir" "$target_user_dir"
                echo "✅ Usuario $user_id: Directorio completo copiado"
            else
                for file in "$user_dir"/*; do
                    if [ -f "$file" ]; then
                        filename=$(basename "$file")
                        if [ ! -f "$target_user_dir/$filename" ]; then
                            cp "$file" "$target_user_dir/"
                            echo "✅ Usuario $user_id: Archivo $filename recuperado"
                        fi
                    fi
                done
            fi
        fi
    done
}

integrate_documents "/app/final_recovery/documents" "/app/storage/documents" "documentos de inscripción"
integrate_documents "/app/final_recovery/cv-documents" "/app/storage/cv-documents" "documentos CV"
integrate_documents "/app/final_recovery/profile-images" "/app/storage/profile-images" "fotos de perfil"
'

# Estadísticas finales
echo "📊 ESTADÍSTICAS FINALES:"
FINAL_DOCS=$(docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" | wc -l)
FINAL_CV=$(docker exec mpd-concursos-backend-prod find /app/storage/cv-documents -name "*.pdf" | wc -l)
FINAL_IMAGES=$(docker exec mpd-concursos-backend-prod find /app/storage/profile-images -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | wc -l)
FINAL_USERS=$(docker exec mpd-concursos-backend-prod ls /app/storage/documents | wc -l)

echo "   📄 Documentos totales: $FINAL_DOCS"
echo "   📋 Documentos CV: $FINAL_CV"
echo "   🖼️ Fotos de perfil: $FINAL_IMAGES"
echo "   👥 Usuarios con documentos: $FINAL_USERS"

# Limpiar archivos temporales
rm -rf "$INTEGRATION_DIR"

echo "✅ RECUPERACIÓN HÍBRIDA COMPLETADA"
echo ""
echo "🎯 VERIFICACIONES RECOMENDADAS:"
echo "1. Probar acceso de usuarios específicos"
echo "2. Verificar integridad de documentos"
echo "3. Validar funcionalidad completa del sistema"
