package ar.gov.mpd.concursobackend.document.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentReplaceResponse {
    private DocumentDto newDocument;
    private DocumentDto previousDocument;
    private String warning;
    private String message;
    private List<String> impactedEntities; // Detalle de inscripciones/concursos afectados
} 