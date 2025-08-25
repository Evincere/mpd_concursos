#!/bin/bash

BASE_PATH="/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents"
SCRIPT_DIR=$(pwd)

echo "=== CREACIÓN DE ARCHIVOS FALTANTES ==="
echo "Ruta base: $BASE_PATH"
echo ""

# Lista de archivos faltantes identificados
missing_files=(
    "24207375/ba10448d-076b-4077-aff6-d619b02c3693_Certificado_Sin_Sanciones_Disciplinarias_1754488062322.pdf"
    "24207375/c759d9d9-1e2d-40a4-977d-2fa98c7dd645_Certificado_de_Antig_edad_Profesional_1754487957010.pdf"
    "24467884/1ce53371-e9ae-4b0f-8090-d28ff8536b7c_T_tulo_Universitario_y_Certificado_Anal_tico_1754486896327.pdf"
    "24866484/07ab017c-ff96-48c1-b417-af15a21f4c24_Constancia_de_CUIL_1753984074408.pdf"
    "24866484/4e4ff179-6a3b-4fd9-923d-07bfa234d1d7_Certificado_Sin_Sanciones_Disciplinarias_1753984201704.pdf"
    "24866484/57cbf552-b58b-437b-80f1-40459309e8df_DNI__Frontal__1753984101938.pdf"
    "24866484/8f2dd7ca-dbf0-4256-8bc2-792d12d3b446_Certificado_de_Antig_edad_Profesional_1753984018951.pdf"
    "24866484/c2520d9c-e3cd-4f59-806f-9be9a4b7d80d_Certificado_Ley_Micaela_1753984247394.pdf"
    "24866484/d3a0390e-5906-4fe9-83ce-e3dfb054a8b2_DNI__Dorso__1753983965082.pdf"
    "24866484/fd711e67-6ac2-402d-93e8-b9a83e1bafda_Documento_Adicional_1753984488945.pdf"
    "26132438/137a901c-3dd8-485f-affb-21dbd19788cf_DNI__Frontal__1754097438238.pdf"
    "26132438/809b5521-1101-4197-a9b2-28c5d729f1b3_DNI__Dorso__1754097406425.pdf"
    "26132438/b7e9dcfb-7f60-4a40-ae24-f754516dba1a_Certificado_de_Antecedentes_Penales_1754097625809.pdf"
    "26132438/fff23265-8bb4-4efd-83c0-99b10ceca907_T_tulo_Universitario_y_Certificado_Anal_tico_1754097475718.pdf"
)

created_count=0
error_count=0

# Función para extraer información del nombre del archivo
extract_document_info() {
    local filename="$1"
    local dni=$(echo "$filename" | cut -d'/' -f1)
    local file_part=$(basename "$filename")
    
    # Extraer tipo de documento del nombre del archivo
    local doc_type=""
    if [[ $file_part == *"DNI__Frontal"* ]]; then
        doc_type="DNI (Frontal)"
    elif [[ $file_part == *"DNI__Dorso"* ]]; then
        doc_type="DNI (Dorso)"  
    elif [[ $file_part == *"Certificado_Sin_Sanciones"* ]]; then
        doc_type="Certificado Sin Sanciones Disciplinarias"
    elif [[ $file_part == *"Certificado_de_Antig_edad"* ]]; then
        doc_type="Certificado de Antigüedad Profesional"
    elif [[ $file_part == *"Certificado_de_Antecedentes"* ]]; then
        doc_type="Certificado de Antecedentes Penales"
    elif [[ $file_part == *"Constancia_de_CUIL"* ]]; then
        doc_type="Constancia de CUIL"
    elif [[ $file_part == *"T_tulo_Universitario"* ]]; then
        doc_type="Título Universitario y Certificado Analítico"
    elif [[ $file_part == *"Certificado_Ley_Micaela"* ]]; then
        doc_type="Certificado Ley Micaela"
    elif [[ $file_part == *"Documento_Adicional"* ]]; then
        doc_type="Documento Adicional"
    else
        doc_type="Documento"
    fi
    
    echo "$dni|$doc_type"
}

echo "Iniciando creación de archivos placeholder..."
echo ""

for file_path in "${missing_files[@]}"; do
    full_path="$BASE_PATH/$file_path"
    dir_path=$(dirname "$full_path")
    
    echo "Procesando: $file_path"
    
    # Crear directorio si no existe
    if [ ! -d "$dir_path" ]; then
        echo "  Creando directorio: $dir_path"
        mkdir -p "$dir_path"
        if [ $? -ne 0 ]; then
            echo "  ❌ ERROR: No se pudo crear el directorio"
            error_count=$((error_count + 1))
            continue
        fi
    fi
    
    # Verificar si el archivo ya existe
    if [ -f "$full_path" ]; then
        echo "  ⚠️  ADVERTENCIA: El archivo ya existe, saltando..."
        continue
    fi
    
    # Extraer información del documento
    info=$(extract_document_info "$file_path")
    dni=$(echo "$info" | cut -d'|' -f1)
    doc_type=$(echo "$info" | cut -d'|' -f2)
    
    # Crear archivo placeholder PDF
    echo "  Generando PDF placeholder para: $doc_type (DNI: $dni)"
    python3 "$SCRIPT_DIR/create_placeholder_pdf.py" "$full_path" "$doc_type" "$dni"
    
    if [ $? -eq 0 ] && [ -f "$full_path" ]; then
        echo "  ✅ Archivo creado exitosamente"
        created_count=$((created_count + 1))
        
        # Establecer permisos apropiados
        chmod 644 "$full_path"
        chown root:root "$full_path"
    else
        echo "  ❌ ERROR: No se pudo crear el archivo"
        error_count=$((error_count + 1))
    fi
    
    echo ""
done

echo "=== RESUMEN DE CREACIÓN ==="
echo "Total de archivos procesados: ${#missing_files[@]}"
echo "Archivos creados exitosamente: $created_count"
echo "Errores encontrados: $error_count"
echo ""

if [ $created_count -gt 0 ]; then
    echo "✅ Archivos placeholder creados. El sistema ahora puede detectar estos archivos."
    echo "   Los documentos reales deberán ser procesados por el área administrativa."
fi
