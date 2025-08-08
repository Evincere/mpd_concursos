#!/bin/bash

# ============================================================================
# SCRIPT: Generar Emails Personalizados
# PROPÓSITO: Crear emails individuales para cada usuario con documentos faltantes
# FECHA: 2025-08-07
# ============================================================================

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EMAILS_DIR="EMAILS_PERSONALIZADOS_${TIMESTAMP}"

echo "=== GENERANDO EMAILS PERSONALIZADOS ==="
echo "Timestamp: $TIMESTAMP"
echo

# Crear directorio para emails
mkdir -p "$EMAILS_DIR"

# Verificar que existan los archivos necesarios
if [ ! -f "USUARIOS_PARA_NOTIFICAR.csv" ]; then
    echo "❌ Error: Archivo USUARIOS_PARA_NOTIFICAR.csv no encontrado"
    exit 1
fi

if [ ! -f "TEMPLATE_EMAIL_DOCUMENTOS_FALTANTES.html" ]; then
    echo "❌ Error: Template de email no encontrado"
    exit 1
fi

echo "📧 Generando emails personalizados..."

contador=0
emails_generados=0

# Leer el CSV y generar emails personalizados
tail -n +2 USUARIOS_PARA_NOTIFICAR.csv | while IFS=',' read -r dni email username estado accion; do
    ((contador++))
    
    # Extraer cantidad de documentos de la acción
    cantidad_docs=$(echo "$accion" | sed 's/RECARGAR_//')
    
    # Crear nombre de archivo para el email
    email_file="$EMAILS_DIR/email_${dni}_${username}.html"
    
    # Copiar template y personalizar
    cp "TEMPLATE_EMAIL_DOCUMENTOS_FALTANTES.html" "$email_file"
    
    # Reemplazar placeholders
    sed -i "s/\[NOMBRE_USUARIO\]/$username/g" "$email_file"
    sed -i "s/\[DNI_USUARIO\]/$dni/g" "$email_file"
    sed -i "s/\[CANTIDAD_DOCUMENTOS\]/$cantidad_docs/g" "$email_file"
    sed -i "s/\[URL_SISTEMA\]/localhost:8000/g" "$email_file"
    
    echo "✅ Email generado: $dni ($username) - $cantidad_docs documentos"
    ((emails_generados++))
done

echo
echo "📊 RESUMEN:"
echo "• Emails personalizados generados: $emails_generados"
echo "• Directorio: $EMAILS_DIR"

# Crear script de envío masivo (ejemplo)
cat > "$EMAILS_DIR/SCRIPT_ENVIO_MASIVO.sh" << 'EOF'
#!/bin/bash

# Script de ejemplo para envío masivo de emails
# IMPORTANTE: Configurar servidor SMTP antes de usar

echo "=== SCRIPT DE ENVÍO MASIVO ==="
echo "IMPORTANTE: Este es un script de ejemplo"
echo "Debe configurar su servidor SMTP antes de usar"
echo

# Ejemplo de configuración SMTP (ajustar según su servidor)
SMTP_SERVER="smtp.ejemplo.com"
SMTP_PORT="587"
SMTP_USER="sistema@mpd.gov.ar"
SMTP_PASS="password"

# Función de ejemplo para enviar email
enviar_email() {
    local destinatario=$1
    local archivo_html=$2
    local dni=$3
    
    echo "Enviando email a: $destinatario (DNI: $dni)"
    
    # Aquí iría el comando real de envío
    # Ejemplo con sendmail, mailx, o herramienta SMTP
    # mail -s "Actualización de Documentos - Sistema MPD" -a "Content-Type: text/html" "$destinatario" < "$archivo_html"
    
    echo "  ✅ Email enviado (simulado)"
}

# Leer CSV y enviar emails
while IFS=',' read -r dni email username estado accion; do
    if [ -n "$email" ] && [ "$email" != "NULL" ]; then
        archivo_email="email_${dni}_${username}.html"
        if [ -f "$archivo_email" ]; then
            enviar_email "$email" "$archivo_email" "$dni"
            sleep 1  # Pausa entre envíos
        fi
    fi
done < ../USUARIOS_PARA_NOTIFICAR.csv

echo
echo "=== ENVÍO COMPLETADO ==="
EOF

chmod +x "$EMAILS_DIR/SCRIPT_ENVIO_MASIVO.sh"

echo
echo "📄 ARCHIVOS ADICIONALES GENERADOS:"
echo "• Script de envío: $EMAILS_DIR/SCRIPT_ENVIO_MASIVO.sh"

echo
echo "=== GENERACIÓN COMPLETADA ==="