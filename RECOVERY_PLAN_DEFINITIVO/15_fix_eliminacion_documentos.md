# 🔧 FIX: Problema de Eliminación de Documentos

## 🎯 **PROBLEMA IDENTIFICADO:**

El método de eliminación de documentos no puede encontrar el archivo físico debido a una inconsistencia en las rutas:

- **Al crear**: `filePath = "26598410/archivo.pdf"` (sin prefijo "documents/")
- **Al eliminar**: Busca `"documents/26598410/archivo.pdf"` (con prefijo "documents/")

## 📊 **ANÁLISIS DEL CÓDIGO:**

### ❌ **Código Actual (Problemático):**
```java
// En DocumentServiceImpl.renameFileForArchiving()
Path originalPath = Paths.get(documentStorageService.getStorageLocation()).resolve(originalFilePath);
```

**Donde:**
- `documentStorageService.getStorageLocation()` = `/app/storage`
- `originalFilePath` = `"26598410/archivo.pdf"` (desde document.getFilePath())
- **Resultado**: `/app/storage/26598410/archivo.pdf` ❌ (INCORRECTO)
- **Debería ser**: `/app/storage/documents/26598410/archivo.pdf` ✅

## 🔧 **SOLUCIÓN PROPUESTA:**

### **Opción 1: Modificar el método renameFileForArchiving()**
```java
private String renameFileForArchiving(String originalFilePath, String archivedFileName) {
    try {
        // FIX: Construir la ruta completa correctamente
        Path documentsPath = storageConfig.getDocumentsPath(); // /app/storage/documents
        Path originalPath = documentsPath.resolve(originalFilePath); // /app/storage/documents/26598410/archivo.pdf
        Path archivedPath = originalPath.getParent().resolve(archivedFileName);

        // Verificar que el archivo original existe
        if (!Files.exists(originalPath)) {
            log.warn("⚠️ [DocumentService] Archivo original no encontrado: {}", originalPath);
            return originalFilePath; // Mantener path original si no existe el archivo
        }

        // Renombrar archivo
        Files.move(originalPath, archivedPath, StandardCopyOption.REPLACE_EXISTING);

        // Retornar el nuevo path relativo
        return storageConfig.getDocumentsPath().relativize(archivedPath).toString();

    } catch (IOException e) {
        log.error("❌ [DocumentService] Error renombrando archivo: {} -> {}", originalFilePath, archivedFileName, e);
        throw new DocumentException("Error al renombrar archivo para archivado: " + e.getMessage());
    }
}
```

### **Opción 2: Modificar el storeFile() para incluir "documents/" en el path**
```java
// En FileSystemDocumentStorageService.storeFile()
String relativePath = String.format("documents/%s/%s", userDir, newFileName);
return relativePath; // Retorna "documents/26598410/archivo.pdf"
```

## 🎯 **RECOMENDACIÓN:**

**Usar Opción 1** porque:
- ✅ No rompe compatibilidad con datos existentes
- ✅ Usa directamente `storageConfig.getDocumentsPath()`
- ✅ Es más consistente con la arquitectura actual
- ✅ Mantiene la separación de responsabilidades

## 📝 **ARCHIVO A MODIFICAR:**

`concurso-backend/src/main/java/ar/gov/mpd/concursobackend/document/application/service/DocumentServiceImpl.java`

**Líneas a cambiar:** 661-662

## 🧪 **PRUEBA DEL FIX:**

1. Aplicar el cambio
2. Recompilar y reiniciar el backend
3. Probar eliminación con Sergio Pereyra
4. Verificar que el archivo se renombra correctamente a `ARCHIVED_*`

## ⚠️ **CONSIDERACIONES:**

- El fix es **backward compatible**
- No afecta la creación de nuevos documentos
- Solo corrige el proceso de eliminación/archivado
- Mantiene la estructura de directorios existente