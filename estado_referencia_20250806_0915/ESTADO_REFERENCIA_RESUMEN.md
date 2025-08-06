# ESTADO DE REFERENCIA DEL SISTEMA MPD CONCURSOS
## Fecha: Wed Aug  6 09:16:48 AM -03 2025
## Propósito: Análisis diferencial para recuperación híbrida

---

## 📊 MÉTRICAS PRINCIPALES

### 👥 USUARIOS:
- **Total usuarios:** 196
- **Usuarios registrados hoy (6 Ago):** 4
- **Primer usuario:** 2025-07-30 11:11:10
- **Último usuario:** 2025-08-06 03:03:53

### 📄 DOCUMENTOS:  
- **Total documentos:** 855
- **Documentos subidos hoy (6 Ago):** 27
- **Documentos con archivo:** 855
- **Documentos pendientes:** 855 (100%)
- **Primer documento:** 2025-07-30 13:24:21
- **Último documento:** 2025-08-06 03:48:38

### 📁 STORAGE FÍSICO:
- **Archivos PDF:** 242
- **Tamaño total:** 142M
- **Inconsistencia BD vs Storage:** 855 docs en BD vs 242 archivos físicos

---

## 🎯 PROPÓSITO DEL ESTADO DE REFERENCIA

Este snapshot permite:

1. **Análisis diferencial:** Comparar estado antes vs después de actividad diaria
2. **Preservación de datos nuevos:** Identificar usuarios y documentos agregados durante el día  
3. **Recuperación inteligente:** No perder datos generados entre referencia y proceso de recuperación
4. **Auditoría completa:** Tener registro exacto de cambios del sistema

---

## 📋 ARCHIVOS GENERADOS

### 📊 Estadísticas:
- `usuarios_referencia.txt` - Resumen estadístico usuarios
- `documentos_referencia.txt` - Resumen estadístico documentos  
- `documentos_por_estado_referencia.txt` - Documentos por estado
- `archivos_pdf_referencia.txt` - Cantidad archivos PDF
- `storage_size_referencia.txt` - Tamaño storage

### 📋 Inventarios completos:
- `lista_usuarios_completa_referencia.csv` - 196 usuarios completos
- `lista_documentos_completa_referencia.csv` - 855 documentos completos  
- `inventario_archivos_completo_referencia.txt` - 242 archivos físicos

### 🔧 Estructura de BD:
- `estructura_user_entity.txt` - Esquema tabla usuarios
- `estructura_documents.txt` - Esquema tabla documentos

---

## 🚀 PRÓXIMOS PASOS

1. **Permitir actividad normal** del sistema durante el día
2. **En la tarde:** Ejecutar proceso de recuperación híbrida  
3. **Antes de restaurar:** Crear nuevo snapshot para comparación
4. **Después de recuperar:** Aplicar diferencias para preservar datos nuevos

---

## ⚠️ PROBLEMA IDENTIFICADO

**Inconsistencia crítica detectada:**
- Base de datos: 855 documentos
- Storage físico: 242 archivos PDF  
- **613 documentos sin archivo físico** (problema original a resolver)

**Estado:** Listo para proceso de recuperación híbrida
**Responsable:** Sistema automatizado con supervisión humana
