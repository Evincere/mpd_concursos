package ar.gov.mpd.concursobackend.inscription.application.port.in.command;

import lombok.Builder;
import lombok.Value;
import java.util.UUID;

@Value
@Builder
public class CreateInscriptionCommand {
    UUID userId;
    Long contestId;
} 