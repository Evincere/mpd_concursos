package ar.gov.mpd.concursobackend.inscription.application.port.in;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.UUID;

public interface FindInscriptionsUseCase {
    PageResponse<InscriptionDetailResponse> findAll(
            ar.gov.mpd.concursobackend.shared.domain.model.PageRequest pageRequest, UUID userId);

    InscriptionDetailResponse findById(UUID id);

    Boolean findInscriptionStatus(Long contestId, String userId);

    Page<InscriptionResponse> findAllPaged(PageRequest pageRequest, UUID userId);
}