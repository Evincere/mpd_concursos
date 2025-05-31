package ar.gov.mpd.concursobackend.shared.infrastructure.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response paginado genérico")
public class PageResponse<T> {

    @Schema(description = "Contenido de la página")
    private List<T> content;

    @Schema(description = "Número total de elementos", example = "150")
    private Long totalElements;

    @Schema(description = "Número total de páginas", example = "15")
    private Integer totalPages;

    @Schema(description = "Tamaño de la página", example = "10")
    private Integer size;

    @Schema(description = "Número de página actual", example = "0")
    private Integer number;

    @Schema(description = "Indica si es la primera página")
    private Boolean first;

    @Schema(description = "Indica si es la última página")
    private Boolean last;

    @Schema(description = "Indica si la página está vacía")
    private Boolean empty;

    @Schema(description = "Número de elementos en la página actual", example = "10")
    private Integer numberOfElements;
}
