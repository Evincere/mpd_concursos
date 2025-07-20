# GEMINI - Directivas y Análisis de Problemas

## 🎯 DIRECTIVAS GENERALES DE DESARROLLO

### Actitud y Comunicación
* **TU ACTITUD SIEMPRE SERA CRITICA Y NO COMPLACIENTE**, LA ACTITUD CRITICA DEBE SER OPORTUNA Y RELEVANTE, SIEMPRE PARA LLEVAR EL CODIGO A UN MAYOR NIVEL DE CALIDAD EN EL DESARROLLO.
* Responde siempre en español, pero utiliza el idioma inglés en el código.
* Mantén actualizado el archivo README.md, CHANGELOG.md y TASKS.md

### Herramientas y Comandos
* Al utilizar la línea de comandos debes emplear sintaxis de PowerShell, por ejemplo para concatenar comandos debes utilizar el símbolo `;`
* Usa siempre `pnpm install` en lugar de `npm install` para este proyecto
* Si necesitas agregar dependencias, usa `pnpm add <package-name>`
* Si necesitas eliminar dependencias, usa `pnpm remove <package-name>`

### Validación de Código
Para validar modificaciones de código:
* ✅ Compilar solamente: `mvn clean compile -q`
* ✅ Leer resultados: Los errores/éxitos de compilación SÍ los puedo detectar perfectamente
* ✅ Validar sintaxis: Si compila = código correcto
* ✅ Detectar errores: Si falla = mostrar errores específicos

### Arquitectura y Patrones
* Siempre antes de crear un nuevo archivo, te asegurarás que en el proyecto no exista otro con funcionalidades similares
* Eres un experto en implementación de patrones de diseño y tomas tu fuente de conocimiento en ellos desde https://refactoring.guru/es/design-patterns/catalog
* Siempre respetas los principios SOLID y clean code
* En el backend de todo proyecto siempre implementarás una **arquitectura hexagonal**
* En el frontend de todo proyecto siempre implementarás una **arquitectura modularizada de componentes y features**

### Buenas Prácticas de Código
* Siempre definir el constructor al principio de la clase
* Usar una sintaxis explícita para definir los efectos, con un return claro
* Asegurarse de que todas las propiedades inyectadas se inicialicen correctamente antes de ser utilizadas
* Crear archivos más pequeños: Limitar el tamaño de cada archivo que creamos
* Dividir la implementación en partes: Implementar una funcionalidad a la vez

### Optimización de Herramientas
* Reducir el tamaño de las entradas en las llamadas a herramientas: Especialmente en str-replace-editor
* Usar rangos específicos al ver archivos: Usar view_range para ver solo las partes relevantes
* Implementar funcionalidades incrementalmente: Agregar funcionalidades básicas primero y luego mejorarlas
* Para evitar el error "I'm sorry. I tried to call a tool, but provided too large of an input", implementa los cambios en porciones más pequeñas y manejables

### Prevención de Problemas Técnicos

#### Spring Boot - Dependencias Circulares
* **Convenciones de nombres**: Evita el sufijo "Impl" para clases que implementan interfaces de dominio pero dependen de interfaces de Spring Data JPA con nombres similares.

```java
// EVITAR
public class JpaUserRepositoryImpl implements UserRepository {
    private final JpaUserRepository jpaRepository;
}

// PREFERIR
public class CustomUserRepository implements UserRepository {
    private final JpaUserRepository jpaRepository;
}
```

#### Angular - Servicios de Diálogo
* **Inyección de dependencias**: Usa siempre UnifiedDialogService + UnifiedDialogRef + DIALOG_DATA desde el mismo archivo unified-dialog.service.ts para evitar incompatibilidades de inyección.

#### JPA/Hibernate - Versioning Consistente
* **Flujo de guardado estandarizado**: Asegúrate de que todos los documentos (originales y reemplazos) sigan el mismo flujo de persistencia para mantener consistencia en el campo `@Version`.
* **Evitar doble save**: No guardes entidades primero sin datos completos y luego las actualices asincrónicamente, ya que esto causa inconsistencias en el versioning.
* **Usar campos semánticamente correctos**: Para determinar el orden cronológico usa `uploadDate` o `createdAt`, no el campo `@Version` que está diseñado para optimistic locking.

### Principios de Migración
* Migración gradual por fases es más segura y controlable
* Eliminación sistemática de legacy es más efectiva que coexistencia
* Estados específicos mejoran significativamente claridad y mantenibilidad
* Verificación continua detecta problemas temprano

---

## 🚨 PROBLEMA RESUELTO: Inconsistencia en Versioning de Documentos

### **ESTADO: ✅ COMPLETAMENTE RESUELTO**

**Fecha de resolución**: 2025-07-19

### 🔍 DESCRIPCIÓN DEL PROBLEMA

**Síntoma**: Los documentos de reemplazo se creaban con `version=0` mientras que el documento original tenía `version=1`, causando que el sistema identificara incorrectamente cuál era el documento más reciente.

**Impacto**: El sistema mostraba documentos obsoletos como "más recientes" al usar `ORDER BY version DESC` en las consultas.

### 🎯 CAUSA RAÍZ IDENTIFICADA

**Inconsistencia en el flujo de guardado**:

1. **Documento original**: Se guardaba **dos veces**
   - Primer save: Sin `filePath` → `version=0`
   - Segundo save (asíncrono): Con `filePath` → `version=1`

2. **Documentos de reemplazo**: Se guardaban **una sola vez**
   - Un solo save: Con `filePath` desde el inicio → `version=0`

**Código problemático**:
```java
// En uploadDocumentWithDuplicateCheck()
Document savedDocument = documentRepository.save(newDocument); // Primer save sin filePath
storeFileAsync(fileContent, ...); // Segundo save asíncrono con filePath
```

### 💡 SOLUCIÓN IMPLEMENTADA

**Estandarización del flujo de guardado**:

```java
// ANTES (Problemático)
Document newDocument = Document.create(...);
Document savedDocument = documentRepository.save(newDocument); // Sin filePath
storeFileAsync(fileContent, ...); // Actualización asíncrona

// DESPUÉS (Correcto)
Document newDocument = Document.create(...);
String filePath = documentStorageService.storeFile(...); // Guardar archivo primero
newDocument.setFilePath(filePath); // Asignar filePath antes del save
newDocument.setStatus(DocumentStatus.PENDING);
Document savedDocument = documentRepository.save(newDocument); // Un solo save completo
```

### ✅ RESULTADO

**Comportamiento consistente**:
- **Documento original**: `version=0` (un solo save)
- **Documentos de reemplazo**: `version=0` (un solo save)
- **Orden correcto**: Sistema usa `uploadDate` para determinar el documento más reciente

### 📋 ARCHIVOS MODIFICADOS

```
concurso-backend/src/main/java/ar/gov/mpd/concursobackend/document/application/service/
└── DocumentServiceImpl.java - Método uploadDocumentWithDuplicateCheck() estandarizado
```

### 🎯 DIRECTIVA PREVENTIVA

**Para evitar problemas similares en el futuro**:

1. **Nunca guardes entidades incompletas**: Siempre asigna todos los campos necesarios antes del primer save
2. **Evita actualizaciones asíncronas innecesarias**: Si puedes completar la entidad antes del save, hazlo
3. **Mantén consistencia en flujos similares**: Documentos originales y reemplazos deben seguir el mismo patrón
4. **Usa campos semánticamente correctos**: `@Version` es para optimistic locking, no para orden cronológico
5. **Valida comportamiento con logging**: Implementa logging detallado para detectar inconsistencias temprano

**El campo `@Version` debe usarse exclusivamente para optimistic locking. Para determinar orden cronológico, usa siempre campos como `uploadDate`, `createdAt` o `lastModified`.**