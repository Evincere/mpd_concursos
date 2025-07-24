## [Unreleased]
### Added
- Endpoint `POST /api/documentos/{documentId}/replace` para reemplazo robusto de documentos, con validación y advertencia de impacto en concursos.
- DTOs `DocumentReplaceRequest` y `DocumentReplaceResponse` para el nuevo flujo de reemplazo. 
- La respuesta de `DocumentReplaceResponse` ahora incluye un campo `impactedEntities` con el detalle de inscripciones/concursos afectados por el reemplazo. 