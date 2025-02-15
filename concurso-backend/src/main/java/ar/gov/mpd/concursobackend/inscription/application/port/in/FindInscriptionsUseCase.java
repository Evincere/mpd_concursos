package ar.gov.mpd.concursobackend.inscription.application.port.in;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import org.springframework.data.domain.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import java.util.UUID;

import org.springframework.data.domain.Page;

public interface FindInscriptionsUseCase {
    PageResponse<InscriptionDetailResponse> findAll(
            ar.gov.mpd.concursobackend.shared.domain.model.PageRequest pageRequest, UUID userId);

    InscriptionDetailResponse findById(UUID id);

    Boolean findInscriptionStatus(Long contestId, String userId);

    Page<InscriptionResponse> findAllPaged(PageRequest pageRequest, UUID userId);
}