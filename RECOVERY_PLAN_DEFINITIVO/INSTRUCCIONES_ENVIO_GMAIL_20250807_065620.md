# 📧 INSTRUCCIONES PARA ENVÍO MASIVO CON GMAIL

## 📊 Archivos Generados
- **CSV para Gmail**: `GMAIL_ENVIO_MASIVO_20250807_065620.csv` (54 destinatarios)
- **Template HTML**: `TEMPLATE_GMAIL_20250807_065620.html`
- **Instrucciones**: Este archivo

## 🚀 Método 1: Gmail + Google Sheets (RECOMENDADO)

### Paso 1: Preparar Google Sheets
1. Abrir Google Sheets
2. Importar el archivo `GMAIL_ENVIO_MASIVO_20250807_065620.csv`
3. Verificar que las columnas sean: Email, Nombre, DNI, CantidadDocumentos, Username

### Paso 2: Instalar Add-on de Mail Merge
1. En Google Sheets: Extensions → Add-ons → Get add-ons
2. Buscar "Mail Merge" (recomendado: "Mail Merge with Attachments")
3. Instalar y autorizar

### Paso 3: Configurar Mail Merge
1. Extensions → Mail Merge → Start Mail Merge
2. **From Email**: Tu cuenta Gmail institucional
3. **Subject**: "Actualización de Documentos - Sistema de Concursos MPD"
4. **Email Template**: Copiar contenido de `TEMPLATE_GMAIL_20250807_065620.html`
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
3. **Para**: Agregar emails desde `EMAILS_PARA_NOTIFICAR.txt`
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
```
Actualización de Documentos - Sistema de Concursos MPD
```

### Remitente Recomendado:
```
Sistema de Concursos MPD <tu-email@gmail.com>
```

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
**Generado**: Thu Aug  7 06:56:20 AM -03 2025
**Total Destinatarios**: 54 usuarios
**Estado**: ✅ Listo para envío
