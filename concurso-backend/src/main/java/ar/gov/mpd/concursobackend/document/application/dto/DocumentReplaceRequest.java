package ar.gov.mpd.concursobackend.document.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentReplaceRequest {
    private String fileName;
    private String contentType;
    private String comments;
    private boolean forceReplace; // Si el usuario acepta el impacto en concursos
} 