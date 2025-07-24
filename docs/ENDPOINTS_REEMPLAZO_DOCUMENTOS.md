# Especificación de Endpoints REST: Reemplazo de Documentos

## 1. Endpoint Principal

### POST `/api/documentos/{documentId}/replace`

#### **Descripción**
Permite al usuario reemplazar un documento ya cargado. El flujo varía según el estado de validación y relación con concursos del documento original.

---

### **Request**
- **Path Param:**
  - `documentId` (UUID): ID del documento a reemplazar
- **Body (multipart/form-data):**
  - `file`: Archivo a subir (obligatorio)
  - `comentarios`: String (opcional)
  - `confirmar`: Boolean (opcional, solo para segunda llamada si el documento está validado y el usuario ya fue advertido)

---

### **Response**
- **Si el documento NO está validado:**
  - `status`: "OK"
  - `mensaje`: "Documento reemplazado exitosamente."
  - `documentoNuevo`: DocumentDto

- **Si el documento está validado:**
  - `status`: "NEEDS_CONFIRMATION"
  - `mensaje`: "El documento está validado y relacionado a concursos. Se requiere confirmación."
  - `documentoActual`: DocumentDto
  - `concursosRelacionados`: List<ConcursoDto>
  - `advertencias`: List<String>
  - La respuesta del endpoint incluye el campo `impactedEntities` con el detalle de inscripciones/concursos afectados por el reemplazo.

- **Si el usuario confirma (segunda llamada con `