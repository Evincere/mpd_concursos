# PLAN DEFINITIVO DE RECUPERACIÓN - MPD CONCURSOS
# ==================================================

## 🎯 OBJETIVO
Recuperar documentos perdidos del período 4-6 agosto 2025 mediante exploración exhaustiva de backups del proveedor DonWeb, con enfoque pragmático y sin asumir ubicaciones.

## 📊 SITUACIÓN ACTUAL CONFIRMADA
- **Documentos físicos actuales**: 590 archivos (546 PDFs + ~44 imágenes)
- **Registros en BD sin archivo físico**: ~316 documentos
- **Usuarios totales en sistema**: 231 usuarios
- **Sistema actual**: ✅ ESTABLE Y FUNCIONANDO

## 🚀 ESTRATEGIA: EXPLORACIÓN SIN SUPOSICIONES

### Principios Fundamentales
1. **EXPLORAR, NO ASUMIR**: Cada backup puede tener estructura diferente
2. **DESCARGAR TODO**: Sin discriminar inicialmente
3. **ANÁLISIS OFFLINE**: En máquina externa para minimizar downtime
4. **PRESERVAR ESTADO ACTUAL**: Backup completo antes de cualquier cambio
5. **DOCUMENTAR TODO**: Cada paso y hallazgo

---

## 📋 FASES DEL PLAN

### FASE 0: PREPARACIÓN Y BACKUP ACTUAL (2 horas)
**Objetivo**: Crear backup maestro del estado actual
**Ubicación**: Servidor actual
**Scripts**: `01_backup_estado_actual.sh`

### FASE 1: EXPLORACIÓN BACKUP 3 AGOSTO (3 horas)
**Objetivo**: Descubrir estructura y contenido del backup del 3/8
**Ubicación**: Servidor (post-restauración) + Máquina externa
**Scripts**: `02_explorar_backup.sh`, `03_descargar_hallazgos.sh`

### FASE 2: EXPLORACIÓN BACKUP 4 AGOSTO (3 horas)
**Objetivo**: Descubrir estructura y contenido del backup del 4/8
**Ubicación**: Servidor (post-restauración) + Máquina externa
**Scripts**: `02_explorar_backup.sh`, `03_descargar_hallazgos.sh`

### FASE 3: EXPLORACIÓN BACKUP 5 AGOSTO (3 horas)
**Objetivo**: Descubrir estructura y contenido del backup del 5/8
**Ubicación**: Servidor (post-restauración) + Máquina externa
**Scripts**: `02_explorar_backup.sh`, `03_descargar_hallazgos.sh`

### FASE 4: ANÁLISIS Y CONSOLIDACIÓN (4 horas)
**Objetivo**: Analizar hallazgos y crear paquete de recuperación
**Ubicación**: Máquina externa
**Scripts**: `04_analizar_hallazgos.sh`, `05_consolidar_archivos.sh`

### FASE 5: INTEGRACIÓN FINAL (2 horas)
**Objetivo**: Restaurar al 6/8 e integrar archivos recuperados
**Ubicación**: Servidor
**Scripts**: `06_integrar_recuperacion.sh`

---

## 🛠️ RECURSOS NECESARIOS

### Servidor
- **Espacio libre**: >10GB para exploraciones temporales
- **Tiempo total downtime**: ~12-15 horas
- **Acceso**: SSH root, panel DonWeb disponible

### Máquina Externa
- **Espacio libre**: >150GB (seguridad para múltiples backups)
- **Conexión**: SSH/SCP estable al servidor
- **Sistema**: Linux/Unix con bash

### Herramientas
- Docker funcionando
- Git disponible
- Comandos: tar, gzip, find, scp, rsync

---

## ⚠️ PUNTOS CRÍTICOS IDENTIFICADOS

### 1. Cambios de Configuración Durante el Período
- **Nombres de volúmenes**: Pueden haber cambiado
- **Rutas de storage**: Pueden ser diferentes
- **Contenedores**: Nombres y configuraciones variables

### 2. Múltiples Ubicaciones Posibles
- `/var/lib/docker/volumes/mpd_concursos_*`
- `/var/lib/docker/volumes/*_storage_*`
- Dentro de contenedores: `/app/storage/`
- Rutas absolutas en filesystem
- Directorios temporales de migración

### 3. Tipos de Archivos a Recuperar
- **PDFs de inscripción**: `*.pdf` en carpetas de usuarios
- **PDFs de CV**: `*.pdf` en carpetas cv-documents
- **Imágenes de perfil**: `*.jpg`, `*.jpeg`, `*.png`
- **Bases de concursos**: Archivos PDF grandes
- **Archivos temporales**: Uploads en proceso

---

## 📊 RESULTADOS ESPERADOS

### Escenario Conservador (90% recuperación)
- **Archivos actuales preservados**: 590 archivos
- **Archivos recuperados**: +300-400 archivos
- **Total final**: ~900-1000 archivos
- **Usuarios beneficiados**: +50-80 usuarios

### Escenario Optimista (95% recuperación)
- **Archivos actuales preservados**: 590 archivos
- **Archivos recuperados**: +400-600 archivos
- **Total final**: ~1000-1200 archivos
- **Usuarios beneficiados**: +80-120 usuarios

---

## 🚨 MEDIDAS DE SEGURIDAD

### Backup Múltiple
- Backup completo en servidor
- Descarga completa a máquina externa
- Backup de configuraciones y scripts
- Backup de estado de base de datos

### Puntos de No Retorno
- Solo proceder si backup actual está seguro
- Solo proceder si máquina externa tiene capacidad
- Solo proceder si se documenta cada hallazgo

### Plan de Rollback
- Restaurar a backup del 6 agosto
- Restaurar configuración desde Git
- Verificar funcionalidad completa

---

## 📅 CRONOGRAMA ESTIMADO

```
DÍA 1 (12-15 horas):
00:00 - 02:00  | FASE 0: Backup actual
02:00 - 05:00  | FASE 1: Exploración 3/8
05:00 - 08:00  | FASE 2: Exploración 4/8  
08:00 - 11:00  | FASE 3: Exploración 5/8
11:00 - 15:00  | FASE 4: Análisis offline
15:00 - 17:00  | FASE 5: Integración final
```

---

## 📞 CONTACTOS DE EMERGENCIA
- **Proveedor**: DonWeb/DattaWeb - Panel de control
- **Repositorio**: GitHub Evincere/mpd_concursos
- **Commit de referencia**: fa63bd9a

---

**🎯 Este plan está diseñado para maximizar la recuperación mediante exploración exhaustiva sin asumir ubicaciones o estructuras.**
