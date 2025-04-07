package ar.gov.mpd.concursobackend.document.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTypeDto {
    private String id;
    private String code;
    private String nombre;
    private String descripcion;
    private boolean requerido;
    private Integer orden;
    private String parentId;
    private boolean activo;
}