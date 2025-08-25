# 📋 METODOLOGÍA DE INVESTIGACIÓN - CASOS EDGE DE DOCUMENTACIÓN

## 🎯 **OBJETIVO**
Establecer un protocolo estándar para investigar inconsistencias, documentos faltantes, archivos corruptos y otros problemas reportados por la administración en el sistema de documentación del MPD Concursos.

---

## 🔧 **HERRAMIENTAS DISPONIBLES**

### **1. Acceso a Base de Datos**
- **Usuario:** `root`
- **Password:** `root1234`
- **Base de Datos:** `mpd_concursos`
- **Comando:** `docker exec mpd-concursos-mysql mysql -u root -proot1234 -D mpd_concursos`

### **2. Token JWT Admin**
- **Usuario:** `admin`
- **Password:** `admin123`
- **Token:** Almacenado en `/tmp/jwt_token_admin.txt`

### **3. Rutas de Almacenamiento**
- **Documentos Principales:** `/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents/`
- **Documentos Recuperados:** `/var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/recovered_documents/`
- **Backups:** `/var/lib/docker/volumes/mpd_concursos_backup_data_prod/_data/`

### **4. Scripts Automatizados**
- **Investigación:** `CASOS_EDGE/scripts/investigar_usuario.sh [DNI]`

---

## 🔍 **PROTOCOLO DE INVESTIGACIÓN**

### **FASE 1: RECOLECCIÓN DE INFORMACIÓN**
1. **Obtener datos del usuario:**
   - DNI, nombre completo, email
   - Estado de inscripción
   - Fecha de registro

2. **Identificar problema específico:**
   - Documentos faltantes
   - Archivos corruptos
   - Errores de visualización
   - Inconsistencias de datos

### **FASE 2: VERIFICACIÓN EN BASE DE DATOS**
1. **Consultar tabla `user_entity`:**
   ```sql
   SELECT * FROM user_entity WHERE dni = '[DNI]';
   ```

2. **Verificar inscripciones:**
   ```sql
   SELECT * FROM inscriptions WHERE user_id = UNHEX('[USER_ID]');
   ```

3. **Analizar documentos:**
   ```sql
   SELECT d.*, dt.name as document_type 
   FROM documents d 
   LEFT JOIN document_types dt ON d.document_type_id = dt.id 
   WHERE d.user_id = UNHEX('[USER_ID]');
   ```

4. **Revisar auditoría:**
   ```sql
   SELECT * FROM document_audit WHERE user_id = UNHEX('[USER_ID]');
   ```

### **FASE 3: VERIFICACIÓN FÍSICA DE ARCHIVOS**
1. **Verificar directorio principal:**
   ```bash
   ls -la /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents/[DNI]/
   ```

2. **Verificar integridad de archivos:**
   ```bash
   find /path/to/user/dir -type f -exec md5sum {} \;
   ```

3. **Buscar archivos archivados:**
   ```bash
   find /path/to/user/dir -name "ARCHIVED_*"
   ```

### **FASE 4: BÚSQUEDA EN SISTEMAS DE BACKUP**
1. **Consultar tablas de backup:**
   ```sql
   SELECT * FROM documents_backup_* WHERE [CONDITIONS];
   ```

2. **Verificar directorios de recovery:**
   ```bash
   ls -la /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/recovered_documents/[DNI]/
   ```

3. **Buscar en backups SQL:**
   ```bash
   grep -r "[DNI]" ./backups/*.sql
   ```

### **FASE 5: ANÁLISIS Y DIAGNÓSTICO**
1. **Comparar datos BD vs archivos físicos**
2. **Identificar inconsistencias**
3. **Determinar causa raíz**
4. **Evaluar opciones de recuperación**

### **FASE 6: RECUPERACIÓN (SI ES POSIBLE)**
1. **Restaurar desde backups**
2. **Corregir referencias en BD**
3. **Verificar integridad post-recuperación**
4. **Documentar acciones tomadas**

---

## 📊 **TIPOS DE CASOS COMUNES**

### **1. Documento Faltante**
- **Síntomas:** Registro en BD pero archivo físico ausente
- **Investigación:** Verificar backups, directorios de recovery
- **Recuperación:** Restaurar desde backup más reciente

### **2. Archivo Corrupto**
- **Síntomas:** Archivo presente pero no se puede abrir
- **Investigación:** Verificar checksums, buscar versiones anteriores
- **Recuperación:** Reemplazar con versión de backup

### **3. Inconsistencia BD-Archivo**
- **Síntomas:** Datos en BD no coinciden con archivos físicos
- **Investigación:** Comparar timestamps, verificar auditoría
- **Recuperación:** Sincronizar BD con estado real de archivos

### **4. Usuario Sin Directorio**
- **Síntomas:** Usuario registrado pero sin directorio de documentos
- **Investigación:** Verificar proceso de inscripción, buscar en recovery
- **Recuperación:** Crear estructura o restaurar desde backup

---

## 🏆 **CRITERIOS DE ÉXITO**
- **Resuelto:** Problema completamente solucionado
- **Parcialmente Resuelto:** Algunos documentos recuperados
- **No Resuelto:** No se pudo recuperar información

---

## 📝 **DOCUMENTACIÓN REQUERIDA**
Para cada caso investigado, crear informe usando plantilla:
- `CASOS_EDGE/PLANTILLA_INVESTIGACION.md`
- Guardar en `CASOS_EDGE/investigaciones/[DNI]_[FECHA].md`
- Adjuntar evidencias en `CASOS_EDGE/evidencias/[DNI]/`

---

**Última actualización:** 2025-08-19  
**Versión:** 1.0
