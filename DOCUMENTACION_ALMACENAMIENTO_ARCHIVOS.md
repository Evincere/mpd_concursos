# Documentación del Sistema de Almacenamiento de Archivos - MPD Concursos

**Fecha:** 8 de agosto de 2025  
**Análisis realizado durante:** Investigación del caso María Pecorari (DNI: 39380028)  
**Estado del sistema:** ✅ FUNCIONAL

## 🏗️ Arquitectura del Sistema de Storage

### 📁 Ubicación Principal del Storage
```
Contenedor Docker: mpd-concursos-backend
Ruta interna: /app/storage/
```

### 🗂️ Estructura de Directorios Identificada

```
/app/storage/
├── contest-bases/
├── cv-documents/               # 64 subdirectorios activos
├── documents/                  # 224 subdirectorios activos ⭐ PRINCIPAL
├── profile-images/             # 64 subdirectorios activos  
├── recovered_cv_documents/     # 5 subdirectorios (recuperados)
├── recovered_documents/        # 28 subdirectorios (recuperados)
├── recovered_profile_images/   # 14 subdirectorios (recuperados)
├── storage/                    # 7 subdirectorios
├── temp/
└── test-write.txt
```

## 📄 Directorio Principal: `/app/storage/documents/`

### 🎯 Función
Almacena **todos los documentos de inscripción** subidos por los usuarios durante el proceso de concursos.

### 📊 Estadísticas Actuales
- **Total de subdirectorios:** 224
- **Organización:** Por DNI de usuario
- **Última actividad:** 8 de agosto de 2025, 19:23

### 🏷️ Convención de Nomenclatura de Archivos

**Patrón identificado:**
```
{UUID}_{NOMBRE_DOCUMENTO_SANITIZADO}_{TIMESTAMP}.{EXTENSION}
```

**Ejemplos reales:**
```
0a5b85be-2233-4fa5-9cce-22ce9882faf8_Certificado_de_Antecedentes_Penales_1754679079370.pdf
1484c54f-411c-48fd-bb89-4a1153800ece_Constancia_de_CUIL_1754577478812.pdf
1e1af5f4-e6a9-49bb-87b5-f514cdc4b1ca_T_tulo_Universitario_y_Certificado_Anal_tico_1754397100015.pdf
```

### 📂 Estructura de Rutas en Base de Datos

**Patrón almacenado:**
```
documents/{DNI}/{UUID}_{NOMBRE_SANITIZADO}_{TIMESTAMP}.{EXTENSION}
```

**Ejemplos:**
```
documents/26598410/1e1af5f4-e6a9-49bb-87b5-f514cdc4b1ca_T_tulo_Universitario_y_Certificado_Anal_tico_1754397100015.pdf
documents/39380028/0a5b85be-2233-4fa5-9cce-22ce9882faf8_Certificado_de_Antecedentes_Penales_1754679079370.pdf
```

## 👤 Casos de Usuario Analizados

### ✅ Usuario Funcional: Sergio Mauricio Pereyra (DNI: 26598410)
- **Directorio:** `/app/storage/documents/26598410/`
- **Archivos:** 11 documentos
- **Estado:** ✅ Todos los archivos correctamente almacenados
- **Registro desde:** 3 de agosto de 2025
- **Permisos archivos:** `-rwxr-xr-x` (ejecutables)

### ✅ Usuario Verificado: María de los Milagros Pecorari Sosa (DNI: 39380028)
- **Directorio:** `/app/storage/documents/39380028/`
- **Archivos:** 19 documentos
- **Estado:** ✅ Todos los archivos correctamente almacenados
- **Registro desde:** 6 de agosto de 2025
- **Permisos archivos:** `-rw-r--r--` (lectura/escritura)
- **Actividad reciente:** Última subida 8 de agosto 18:58

## 🗃️ Otros Directorios de Storage

### 📷 Profile Images (`/app/storage/profile-images/`)
- **Función:** Almacena fotos de perfil de usuarios
- **Subdirectorios activos:** 64
- **Organización:** Por DNI de usuario (presumiblemente)

### 💼 CV Documents (`/app/storage/cv-documents/`)
- **Función:** Almacena documentos de CV/currículum
- **Subdirectorios activos:** 64
- **Relación:** Posiblemente vinculado a experiencia laboral/educación

### 📋 Contest Bases (`/app/storage/contest-bases/`)
- **Función:** Almacena bases y documentación de concursos
- **Estado:** Activo con archivos

### 🔄 Directorios de Recuperación
- **`recovered_documents/`:** 28 subdirectorios recuperados
- **`recovered_cv_documents/`:** 5 subdirectorios recuperados  
- **`recovered_profile_images/`:** 14 subdirectorios recuperados
- **Propósito:** Archivos restaurados de backups previos

## 🔧 Configuración Técnica

### 🐳 Configuración Docker
- **Contenedor:** `mpd-concursos-backend`
- **Usuario interno:** `root` (UID: 0, GID: 0)
- **Permisos base:** `drwxr-xr-x` para directorios
- **Acceso:** Interno al contenedor únicamente

### 📝 Patrón de Verificación de Archivos

**Para verificar archivos desde el host:**
```bash
# Listado de directorio usuario
docker exec mpd-concursos-backend ls -la /app/storage/documents/{DNI}/

# Conteo de archivos
docker exec mpd-concursos-backend ls /app/storage/documents/{DNI}/ | wc -l

# Búsqueda específica
docker exec mpd-concursos-backend find /app/storage/documents -name "*{DNI}*"
```

## 🚨 Lecciones Aprendidas del Análisis

### ❌ Error Común de Verificación
**Problema detectado:** Scripts de verificación buscaban archivos en rutas del host:
- `/root/concursos/mpd_concursos/storage/`
- `/var/lib/docker/volumes/mpd_concursos_storage/_data`

**Solución:** Los archivos están dentro del contenedor Docker en `/app/storage/`

### ✅ Corrección de Diagnóstico
- **Estado inicial (erróneo):** "Archivos faltantes - 0/19 encontrados"
- **Estado real (correcto):** "Archivos presentes - 19/19 almacenados correctamente"

### 🎯 Importancia de la Arquitectura Containerizada
El sistema utiliza **almacenamiento interno del contenedor**, no volúmenes externos mapeados directamente al host.

## 📊 Métricas del Sistema (8 de agosto 2025)

- **Total usuarios con documentos:** 224+
- **Sistema de storage:** ✅ OPERATIVO
- **Integridad de archivos:** ✅ VERIFICADA
- **Último backup:** 6 de agosto 2025 (111MB)
- **Capacidad utilizada:** Múltiples GB en documentos activos

## 🔍 Recomendaciones para Verificación Futura

1. **Siempre verificar dentro del contenedor Docker**
2. **Usar comandos docker exec para inspección**
3. **Considerar la nomenclatura UUID para identificación única**
4. **Monitorear crecimiento de subdirectorios**
5. **Verificar permisos de archivos recientes vs antiguos**

## 🛠️ Comandos Útiles para Administración

```bash
# Estadísticas generales
docker exec mpd-concursos-backend find /app/storage -type f | wc -l

# Usuarios con más documentos
docker exec mpd-concursos-backend find /app/storage/documents -mindepth 1 -maxdepth 1 -type d -exec bash -c 'echo "$(ls "{}" | wc -l) $(basename "{}")"' \; | sort -nr | head -10

# Verificar usuario específico
docker exec mpd-concursos-backend ls -la /app/storage/documents/{DNI}/

# Espacio utilizado por tipo
docker exec mpd-concursos-backend du -sh /app/storage/*/
```

---

**Nota:** Esta documentación fue generada durante el análisis del caso de María Pecorari, donde inicialmente se pensó que había un problema de almacenamiento. El análisis reveló que el sistema funciona correctamente y los archivos se almacenan según diseño en la arquitectura containerizada.
