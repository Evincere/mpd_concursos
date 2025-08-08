# 📥 GUÍA DE DESCARGA RÁPIDA

## 🎯 **ARCHIVOS QUE DEBES DESCARGAR**

### **OPCIÓN 1: Archivo Comprimido (RECOMENDADO)**
```
📦 GMAIL_ENVIO_MASIVO_COMPLETO.tar.gz
```
**Contiene todo lo necesario en un solo archivo**

### **OPCIÓN 2: Archivos Individuales**
```
📄 GMAIL_ENVIO_MASIVO_20250807_065620.csv
📧 TEMPLATE_GMAIL_20250807_065620.html  
📋 INSTRUCCIONES_ENVIO_GMAIL_20250807_065620.md
```

## 🚀 **PASOS DESPUÉS DE DESCARGAR**

### **1. Extraer archivos (si descargaste el .tar.gz)**
- Windows: Usar 7-Zip o WinRAR
- Mac/Linux: `tar -xzf GMAIL_ENVIO_MASIVO_COMPLETO.tar.gz`

### **2. Abrir Google Sheets**
- Ir a: https://sheets.google.com
- Crear nueva hoja de cálculo
- Archivo → Importar → Subir → Seleccionar el archivo CSV

### **3. Instalar Mail Merge**
- En Google Sheets: Extensiones → Complementos → Obtener complementos
- Buscar: "Mail Merge with Attachments"
- Instalar y autorizar

### **4. Configurar Mail Merge**
- Extensiones → Mail Merge → Start Mail Merge
- **From Email**: Tu cuenta Gmail
- **Subject**: `Actualización de Documentos - Sistema de Concursos MPD`
- **Email Template**: Copiar contenido del archivo HTML
- **Merge Fields**: 
  - {{Email}} → Columna Email
  - {{Nombre}} → Columna Nombre
  - {{DNI}} → Columna DNI
  - {{CantidadDocumentos}} → Columna CantidadDocumentos

### **5. Enviar**
- **Prueba**: 2-3 emails primero
- **Masivo**: Todos los 54 destinatarios

## 📊 **DATOS IMPORTANTES**

| Información | Valor |
|-------------|-------|
| **Total destinatarios** | 54 usuarios |
| **Asunto recomendado** | Actualización de Documentos - Sistema de Concursos MPD |
| **Límite Gmail gratuito** | 100 emails/día |
| **Variables en template** | {{Nombre}}, {{DNI}}, {{CantidadDocumentos}} |

## ⚠️ **IMPORTANTE**

- ✅ Usar cuenta Gmail institucional
- ✅ Enviar emails de prueba primero
- ✅ Verificar que las variables se reemplacen correctamente
- ✅ Monitorear bounces y respuestas

## 🎯 **RESULTADO ESPERADO**

Después del envío:
- 54 usuarios recibirán email personalizado
- Cada uno sabrá exactamente cuántos documentos recargar
- Instrucciones claras sobre verificación
- Plazo: "a la mayor brevedad posible"

---

**¿Listo para descargar y enviar?** 🚀