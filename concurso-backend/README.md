 
## Endpoints relevantes

- `POST /api/documentos/{documentId}/replace`: Permite reemplazar un documento existente, mostrando advertencias si el documento está validado y puede impactar concursos relacionados. La respuesta incluye el detalle de inscripciones/concursos afectados en el campo `impactedEntities`. Utiliza los DTOs `DocumentReplaceRequest` y `DocumentReplaceResponse`. 