# REPORTE DE INCIDENTE - PÉRDIDA DE DOCUMENTACIÓN DE USUARIOS

## 📅 Información del Incidente
- **Fecha de detección**: 4 agosto 2025
- **Fecha de análisis**: 6 agosto 2025
- **Severidad**: CRÍTICA
- **Estado**: EN RECUPERACIÓN

## 🚨 Descripción del Problema
Pérdida de documentación de usuarios debido a configuración incorrecta de volúmenes Docker durante cambio de deployment (contenedores sin "prod" → con "prod").

### Síntomas Identificados
- Usuarios reportan documentos no visibles
- Error "El recurso solicitado no existe"
- Pérdida del certificado SSL (advertencia de seguridad)
- Inconsistencia entre registros de BD y archivos físicos

### Causa Raíz
- Desconfiguración del mapeo de volúmenes Docker
- Cambio de nombres de contenedores sin actualizar configuración
- Los respaldos del proveedor se realizan en madrugada (no incluyen trabajo del día)

## 📊 Impacto Cuantificado

### Usuarios Afectados
**Total**: 29 usuarios únicos sin documentos físicos
**Período crítico**: 4-5 agosto 2025 (406 documentos subidos)

### Documentos Perdidos por Categoría
- **Documentos de inscripción**: ~350 PDFs
- **Documentos CV**: ~100 PDFs (experiencia/educación)
- **Fotos de perfil**: ~9 imágenes

### Lista de Usuarios Críticos
23520516, 24467884, 26569905, 27544194, 27651864, 27931606, 28226117, 28511308, 29267571, 29277615, 30108615, 30724462, 30984162, 31432016, 31737951, 31821855, 31854739, 32161223, 33579011, 33583216, 36746208, 36859594, 37002217, 37513884, 38207799, 39238641, 40787955, 41991997

## ✅ Acciones de Recuperación Ejecutadas

### Recuperación Parcial (6 agosto)
- **Fuente**: Backups locales del 3 agosto y pre-consolidation
- **Documentos recuperados**: 180+ archivos
- **Usuarios beneficiados**: 26 usuarios
- **Tasa de recuperación**: ~45%

### Estado Actual del Sistema
- **Documentos de inscripción**: 349 PDFs
- **Documentos CV**: 11 PDFs
- **Fotos de perfil**: 21 imágenes
- **Usuarios con documentos**: 103 directorios

## 🎯 Plan de Recuperación Completa

### Estrategia: Recuperación Híbrida Externa
Desarrollada para alcanzar ~90% de recuperación usando máquina externa con acceso root.

### Scripts de Recuperación Incluidos
- `recovery_scripts_external/01_backup_current_state.sh`
- `recovery_scripts_external/02_extract_from_backup.sh`
- `recovery_scripts_external/03_consolidate_external.sh`
- `recovery_scripts_external/04_final_integration.sh`
- `recovery_scripts_external/GUIA_EJECUCION_COMPLETA.md`

### Proceso Planificado
1. Backup completo del estado actual a máquina externa
2. Restauración temporal a respaldos del 4 y 5 agosto
3. Extracción de documentos históricos
4. Consolidación en máquina externa
5. Restauración al estado actual
6. Integración de todos los documentos recuperados

## 🔧 Configuración del Sistema Identificada

### Estructura de Storage (Código Fuente)
```properties
app.storage.base-dir=./storage
app.storage.documents-dir=documents
app.storage.cv-documents-dir=cv-documents
app.storage.profile-images-dir=profile-images
```

### Volúmenes Docker
- `mpd_concursos_storage_data_prod`: Storage principal
- `mpd_concursos_mysql_data_prod`: Base de datos
- `mpd_concursos_backup_data_prod`: Backups (vacío)

### Contenedores Actuales
- `mpd-concursos-frontend-prod`: Puerto 8000
- `mpd-concursos-backend-prod`: Puerto 8080
- `mpd-concursos-mysql-prod`: Puerto 3307

## 📋 Lecciones Aprendidas

### Problemas Identificados
1. **Falta de backups automáticos** de volúmenes Docker
2. **Configuración inconsistente** entre desarrollo y producción
3. **Monitoreo insuficiente** de integridad de archivos
4. **Dependencia crítica** de respaldos del proveedor

### Mejoras Recomendadas
1. **Implementar backups automáticos** diarios de volúmenes
2. **Crear sistema de monitoreo** de integridad de archivos
3. **Documentar procedimientos** de deployment
4. **Establecer ambiente de staging** para pruebas
5. **Implementar alertas** de inconsistencias BD↔Storage

## 📊 Métricas de Recuperación

### Estado Antes del Incidente (Estimado)
- Documentos totales: ~800 archivos
- Usuarios con documentos: ~130

### Estado Después de Recuperación Parcial
- Documentos recuperados: 349 PDFs + 11 CV + 21 fotos
- Tasa de recuperación: ~45%

### Proyección con Recuperación Completa
- Documentos esperados: ~700 archivos
- Tasa de recuperación proyectada: ~90%

## 🎯 Estado Actual
- **Recuperación parcial**: ✅ COMPLETADA
- **Scripts de recuperación**: ✅ PREPARADOS
- **Documentación**: ✅ COMPLETA
- **Recuperación completa**: ⏳ PENDIENTE DE EJECUCIÓN

---

**Responsable**: Equipo Técnico MPD Concursos  
**Última actualización**: 6 agosto 2025 - 19:20 hrs  
**Próxima acción**: Ejecutar recuperación híbrida externa
