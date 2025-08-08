#!/bin/bash

# ============================================================================
# SCRIPT: Preparar Envío Masivo Gmail
# PROPÓSITO: Crear archivos optimizados para envío masivo desde Gmail
# FECHA: 2025-08-07
# ============================================================================

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CSV_GMAIL="GMAIL_ENVIO_MASIVO_${TIMESTAMP}.csv"
INSTRUCCIONES="INSTRUCCIONES_ENVIO_GMAIL_${TIMESTAMP}.md"

echo "=== PREPARANDO ENVÍO MASIVO PARA GMAIL ==="
echo "Timestamp: $TIMESTAMP"
echo

# ============================================================================
# 1. CREAR CSV OPTIMIZADO PARA GMAIL
# ============================================================================
echo "📧 Creando CSV optimizado para Gmail..."

# Crear encabezados para Gmail (formato estándar para mail merge)
echo "Email,Nombre,DNI,CantidadDocumentos,Username" > "$CSV_GMAIL"

# Procesar datos existentes
if [ -f "USUARIOS_PARA_NOTIFICAR.csv" ]; then
    tail -n +2 USUARIOS_PARA_NOTIFICAR.csv | while IFS=',' read -r dni email username estado accion; do
        # Extraer cantidad de documentos
        cantidad=$(echo "$accion" | sed 's/RECARGAR_//')
        
        # Limpiar nombre de usuario para usar como nombre
        nombre_limpio=$(echo "$username" | sed 's/[^a-zA-Z0-9]/ /g' | sed 's/  */ /g')
        
        # Agregar al CSV de Gmail
        echo "$email,$nombre_limpio,$dni,$cantidad,$username" >> "$CSV_GMAIL"
    done
    
    total_emails=$(tail -n +2 "$CSV_GMAIL" | wc -l)
    echo "✅ CSV creado con $total_emails destinatarios"
else
    echo "❌ Error: Archivo USUARIOS_PARA_NOTIFICAR.csv no encontrado"
    exit 1
fi

# ============================================================================
# 2. CREAR TEMPLATE SIMPLIFICADO PARA GMAIL
# ============================================================================
echo "📝 Creando template simplificado para Gmail..."

TEMPLATE_GMAIL="TEMPLATE_GMAIL_${TIMESTAMP}.html"

cat > "$TEMPLATE_GMAIL" << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actualización de Documentos - Sistema MPD</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; border: 1px solid #ddd; }
        .alert { background-color: #e74c3c; color: white; padding: 15px; border-radius: 5px; text-align: center; font-weight: bold; margin: 15px 0; }
        .highlight { background-color: #f39c12; color: white; padding: 15px; border-radius: 5px; text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
        .instructions { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .btn { display: inline-block; background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0; }
        .important { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f39c12; }
        .footer { background-color: #34495e; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🏛️ Ministerio Público de la Defensa</h2>
        <p>Sistema de Concursos - Actualización de Documentos</p>
    </div>
    
    <div class="content">
        <p>Estimado/a <strong>{{Nombre}}</strong> (DNI: <strong>{{DNI}}</strong>),</p>
        
        <div class="alert">
            ⚠️ ACCIÓN REQUERIDA: Necesita volver a cargar algunos documentos
        </div>
        
        <p>Durante una actualización de nuestro sistema, algunos de sus documentos requieren ser cargados nuevamente para garantizar su correcta visualización.</p>
        
        <div class="highlight">
            📄 Necesita recargar <strong>{{CantidadDocumentos}}</strong> documento(s)
        </div>
        
        <div class="instructions">
            <h3>📋 Instrucciones:</h3>
            <ol>
                <li><strong>Ingrese al sistema</strong> con sus credenciales habituales</li>
                <li><strong>Vaya a su perfil</strong> → sección "Mis Documentos"</li>
                <li><strong>Identifique los documentos faltantes</strong> (aparecerán marcados)</li>
                <li><strong>Vuelva a cargar</strong> los documentos desde su computadora</li>
                <li><strong>Verifique que se visualicen</strong> - si puede verlos, la actualización fue exitosa</li>
            </ol>
        </div>
        
        <div style="text-align: center;">
            <a href="http://149.50.132.23:8000" class="btn">🔗 Acceder al Sistema</a>
        </div>
        
        <div class="important">
            <h4>📌 Importante:</h4>
            <ul>
                <li><strong>Sus datos están seguros</strong> - No se afecta su información personal</li>
                <li><strong>Concursos activos</strong> - Su participación no se ve afectada</li>
                <li><strong>Plazo</strong> - Complete esta actualización <strong>a la mayor brevedad posible</strong></li>
                <li><strong>Verificación</strong> - Si puede visualizar los documentos en su perfil, todo está correcto</li>
            </ul>
        </div>
        
        <p>Gracias por su colaboración.</p>
        
        <p><strong>Equipo Técnico del Sistema de Concursos</strong><br>
        Ministerio Público de la Defensa</p>
    </div>
    
    <div class="footer">
        <p><strong>Ministerio Público de la Defensa - Sistema de Concursos</strong></p>
        <p>Mensaje automático - No responder a este email</p>
    </div>
</body>
</html>
EOF

echo "✅ Template para Gmail creado: $TEMPLATE_GMAIL"

# ============================================================================
# 3. CREAR INSTRUCCIONES DETALLADAS
# ============================================================================
echo "📋 Creando instrucciones de envío..."

cat > "$INSTRUCCIONES" << EOF
# 📧 INSTRUCCIONES PARA ENVÍO MASIVO CON GMAIL

## 📊 Archivos Generados
- **CSV para Gmail**: \`$CSV_GMAIL\` (54 destinatarios)
- **Template HTML**: \`$TEMPLATE_GMAIL\`
- **Instrucciones**: Este archivo

## 🚀 Método 1: Gmail + Google Sheets (RECOMENDADO)

### Paso 1: Preparar Google Sheets
1. Abrir Google Sheets
2. Importar el archivo \`$CSV_GMAIL\`
3. Verificar que las columnas sean: Email, Nombre, DNI, CantidadDocumentos, Username

### Paso 2: Instalar Add-on de Mail Merge
1. En Google Sheets: Extensions → Add-ons → Get add-ons
2. Buscar "Mail Merge" (recomendado: "Mail Merge with Attachments")
3. Instalar y autorizar

### Paso 3: Configurar Mail Merge
1. Extensions → Mail Merge → Start Mail Merge
2. **From Email**: Tu cuenta Gmail institucional
3. **Subject**: "Actualización de Documentos - Sistema de Concursos MPD"
4. **Email Template**: Copiar contenido de \`$TEMPLATE_GMAIL\`
5. **Merge Fields**: 
   - {{Email}} → Columna Email
   - {{Nombre}} → Columna Nombre  
   - {{DNI}} → Columna DNI
   - {{CantidadDocumentos}} → Columna CantidadDocumentos

### Paso 4: Enviar
1. **Test**: Enviar 1-2 emails de prueba primero
2. **Send**: Enviar a todos (Gmail permite ~100 emails/día con cuenta gratuita)

## 🚀 Método 2: Gmail Manual (Para pocos emails)

### Para envíos pequeños:
1. Abrir Gmail
2. Redactar nuevo email
3. **Para**: Agregar emails desde \`EMAILS_PARA_NOTIFICAR.txt\`
4. **Asunto**: "Actualización de Documentos - Sistema de Concursos MPD"
5. **Cuerpo**: Usar template HTML personalizado
6. Enviar

## ⚠️ Consideraciones Importantes

### Límites de Gmail:
- **Cuenta gratuita**: ~100 emails/día
- **G Suite/Workspace**: ~2000 emails/día
- **Recomendación**: Dividir en lotes si es necesario

### Mejores Prácticas:
- ✅ Usar cuenta institucional oficial
- ✅ Personalizar remitente como "Sistema MPD" 
- ✅ Enviar emails de prueba primero
- ✅ Monitorear bounces y respuestas
- ✅ Mantener registro de envíos

### Asunto Recomendado:
\`\`\`
Actualización de Documentos - Sistema de Concursos MPD
\`\`\`

### Remitente Recomendado:
\`\`\`
Sistema de Concursos MPD <tu-email@gmail.com>
\`\`\`

## 📈 Seguimiento

### Después del Envío:
1. **Monitorear respuestas** de usuarios
2. **Registrar bounces** (emails no entregados)
3. **Ejecutar auditoría** en 7-10 días para ver progreso
4. **Enviar recordatorios** si es necesario

### Métricas a Seguir:
- Emails entregados exitosamente
- Usuarios que recargan documentos
- Reducción en documentos faltantes
- Consultas de soporte técnico

## 🎯 Resultado Esperado

Después del envío masivo:
- **54 usuarios notificados**
- **Reducción significativa** en documentos faltantes
- **Sistema más estable** y confiable
- **Usuarios informados** y colaborando

---
**Generado**: $(date)
**Total Destinatarios**: 54 usuarios
**Estado**: ✅ Listo para envío
EOF

echo "✅ Instrucciones creadas: $INSTRUCCIONES"

# ============================================================================
# 4. CREAR LISTA SIMPLE DE EMAILS
# ============================================================================
echo "📝 Creando lista simple de emails..."

EMAILS_SIMPLE="EMAILS_SIMPLE_${TIMESTAMP}.txt"
tail -n +2 "$CSV_GMAIL" | cut -d',' -f1 > "$EMAILS_SIMPLE"

echo "✅ Lista simple creada: $EMAILS_SIMPLE"

# ============================================================================
# 5. RESUMEN FINAL
# ============================================================================
echo
echo "📊 RESUMEN DE ARCHIVOS GENERADOS:"
echo "================================="
echo "• CSV para Gmail: $CSV_GMAIL"
echo "• Template HTML: $TEMPLATE_GMAIL" 
echo "• Instrucciones: $INSTRUCCIONES"
echo "• Lista emails: $EMAILS_SIMPLE"
echo
echo "📈 ESTADÍSTICAS:"
echo "• Total destinatarios: $total_emails"
echo "• Método recomendado: Gmail + Google Sheets"
echo "• Límite Gmail gratuito: ~100 emails/día"
echo
echo "🎯 PRÓXIMO PASO:"
echo "1. Revisar archivo: $INSTRUCCIONES"
echo "2. Seguir método recomendado"
echo "3. Enviar emails de prueba primero"
echo
echo "=== PREPARACIÓN COMPLETADA ==="