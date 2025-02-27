package ar.gov.mpd.concursobackend.examination.domain.model;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder(toBuilder = true)
public class Option {
    UUID id;
    String text;
    Integer order;
} 