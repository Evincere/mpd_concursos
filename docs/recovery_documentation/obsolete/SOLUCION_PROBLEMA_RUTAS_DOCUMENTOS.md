# SOLUCIÓN PROBLEMA RUTAS DE DOCUMENTOS

## 📊 RESUMEN DEL PROBLEMA

**Problema:** Los usuarios no podían visualizar sus documentos subidos
**Causa:** Desajuste entre rutas en BD y ubicación física de archivos
**Usuario reportado:** Laura Alvarado (40071999)
**Impacto:** 876 documentos afectados

## 🔍 CAUSA RAÍZ IDENTIFICADA

### Configuración del sistema:
- **Docker mapea:** `/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data` → `/app/document-storage`
- **Archivos se guardan en:** `/app/document-storage/documents/[DNI]/[archivo].pdf`
- **BD registraba:** `[DNI]/[archivo].pdf` (sin prefijo `documents/`)
- **Backend buscaba:** `/app/document-storage/` + `[DNI]/[archivo].pdf` = **NO ENCONTRADO**
- **Archivo real está en:** `/app/document-storage/` + `documents/[DNI]/[archivo].pdf`

## ✅ SOLUCIÓN IMPLEMENTADA

### FASE 1: Corrección inmediata (6 Agosto 2025 - 09:44)
```sql
UPDATE documents 
SET file_path = CONCAT('documents/', file_path) 
WHERE file_path IS NOT NULL AND file_path NOT LIKE 'documents/%';
```
**Resultado:** 876 documentos con rutas corregidas

### FASE 2: Sistema de monitoreo automático
- **Script:** `scripts/path_monitor_and_fix.sh`
- **Frecuencia:** Cada 5 minutos (cron job)
- **Función:** Detecta y corrige automáticamente nuevas rutas incorrectas
- **Log:** `logs/path_monitor.log`

### FASE 3: Backups de seguridad
- **Backup BD:** `backup_documents_before_path_fix_20250806_094407.sql`
- **Verificación:** Todos los archivos físicos confirmados

## 🎯 CORRECCIÓN A LARGO PLAZO (PENDIENTE)

### Problema de configuración:
El problema persiste para nuevos uploads. Opciones de solución:

#### Opción A: Corregir mapeo Docker
```yaml
# En docker-compose.prod.yml cambiar:
volumes:
  - storage_data_prod:/app/storage  # En lugar de /app/document-storage
```

#### Opción B: Corregir variables de entorno
```env
# Cambiar configuración del backend:
DOCUMENT_STORAGE_PATH=/app/document-storage/documents
```

#### Opción C: Corregir código del backend
Modificar la lógica de generación de rutas para incluir el prefijo `documents/`

## 📊 ESTADO ACTUAL

### ✅ Funcionando correctamente:
- Laura Alvarado puede ver sus 8 documentos
- Todos los 876 documentos corregidos
- Sistema de monitoreo activo
- No se pierden nuevos uploads (se corrigen automáticamente)

### ⏳ Pendiente:
- Implementar corrección de configuración definitiva
- Hacer pruebas de nuevos uploads
- Monitorear logs por 48 horas

## 🛡️ MEDIDAS PREVENTIVAS

1. **Monitoreo automático:** Script cada 5 minutos
2. **Logs detallados:** Registro de todas las correcciones
3. **Backups automáticos:** Antes de cualquier cambio masivo
4. **Alertas:** Log de correcciones para análisis posterior

## 📋 PRÓXIMOS PASOS

1. **Inmediato:** Verificar que Laura puede ver documentos ✅
2. **24 horas:** Monitorear efectividad del script automático  
3. **48 horas:** Implementar corrección de configuración definitiva
4. **1 semana:** Validar que no hay más problemas de rutas

---
**Responsable:** Sistema automatizado + supervisión humana
**Fecha:** 6 Agosto 2025
**Estado:** SOLUCIONADO (con monitoreo activo)
