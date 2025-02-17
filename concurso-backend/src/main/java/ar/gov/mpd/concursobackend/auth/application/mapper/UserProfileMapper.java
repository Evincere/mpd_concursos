package ar.gov.mpd.concursobackend.auth.application.mapper;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.application.dto.ExperienciaDto;
import ar.gov.mpd.concursobackend.auth.application.dto.EducacionDto;
import ar.gov.mpd.concursobackend.auth.application.dto.HabilidadDto;
import ar.gov.mpd.concursobackend.auth.domain.model.Experiencia;
import ar.gov.mpd.concursobackend.auth.domain.model.Educacion;
import ar.gov.mpd.concursobackend.auth.domain.model.Habilidad;

@Component
public class UserProfileMapper {
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_DATE;

    public List<ExperienciaDto> toExperienciaDtoList(List<Experiencia> experiencias) {
        return experiencias.stream()
                .map(this::toExperienciaDto)
                .collect(Collectors.toList());
    }

    public List<Experiencia> toExperienciaList(List<ExperienciaDto> dtos) {
        return dtos.stream()
                .map(this::toExperiencia)
                .collect(Collectors.toList());
    }

    public List<EducacionDto> toEducacionDtoList(List<Educacion> educaciones) {
        return educaciones.stream()
                .map(this::toEducacionDto)
                .collect(Collectors.toList());
    }

    public List<Educacion> toEducacionList(List<EducacionDto> dtos) {
        return dtos.stream()
                .map(this::toEducacion)
                .collect(Collectors.toList());
    }

    public List<HabilidadDto> toHabilidadDtoList(List<Habilidad> habilidades) {
        return habilidades.stream()
                .map(this::toHabilidadDto)
                .collect(Collectors.toList());
    }

    public List<Habilidad> toHabilidadList(List<HabilidadDto> dtos) {
        return dtos.stream()
                .map(this::toHabilidad)
                .collect(Collectors.toList());
    }

    private ExperienciaDto toExperienciaDto(Experiencia experiencia) {
        return ExperienciaDto.builder()
                .empresa(experiencia.getEmpresa())
                .cargo(experiencia.getCargo())
                .fechaInicio(experiencia.getFechaInicio().format(DATE_FORMATTER))
                .fechaFin(experiencia.getFechaFin() != null ? experiencia.getFechaFin().format(DATE_FORMATTER) : null)
                .descripcion(experiencia.getDescripcion())
                .build();
    }

    private Experiencia toExperiencia(ExperienciaDto dto) {
        Experiencia experiencia = new Experiencia();
        experiencia.setEmpresa(dto.getEmpresa());
        experiencia.setCargo(dto.getCargo());
        experiencia.setFechaInicio(LocalDate.parse(dto.getFechaInicio(), DATE_FORMATTER));
        experiencia.setFechaFin(dto.getFechaFin() != null ? LocalDate.parse(dto.getFechaFin(), DATE_FORMATTER) : null);
        experiencia.setDescripcion(dto.getDescripcion());
        return experiencia;
    }

    private EducacionDto toEducacionDto(Educacion educacion) {
        return EducacionDto.builder()
                .institucion(educacion.getInstitucion())
                .titulo(educacion.getTitulo())
                .descripcion(educacion.getDescripcion())
                .fechaInicio(educacion.getFechaInicio().format(DATE_FORMATTER))
                .fechaFin(educacion.getFechaFin() != null ? educacion.getFechaFin().format(DATE_FORMATTER) : null)
                .build();
    }

    private Educacion toEducacion(EducacionDto dto) {
        Educacion educacion = new Educacion();
        educacion.setInstitucion(dto.getInstitucion());
        educacion.setTitulo(dto.getTitulo());
        educacion.setDescripcion(dto.getDescripcion());
        educacion.setFechaInicio(LocalDate.parse(dto.getFechaInicio(), DATE_FORMATTER));
        educacion.setFechaFin(dto.getFechaFin() != null ? LocalDate.parse(dto.getFechaFin(), DATE_FORMATTER) : null);
        return educacion;
    }

    private HabilidadDto toHabilidadDto(Habilidad habilidad) {
        return HabilidadDto.builder()
                .nombre(habilidad.getNombre())
                .nivel(habilidad.getNivel())
                .build();
    }

    private Habilidad toHabilidad(HabilidadDto dto) {
        Habilidad habilidad = new Habilidad();
        habilidad.setNombre(dto.getNombre());
        habilidad.setNivel(dto.getNivel());
        return habilidad;
    }
}