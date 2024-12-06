package ar.gov.mpd.concursobackend.inscription.application.port.in;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.shared.domain.model.PageRequest;
import ar.gov.mpd.concursobackend.shared.domain.model.PageResponse;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;

public interface FindInscriptionsUseCase {
    PageResponse<InscriptionDetailResponse> findAll(PageRequest pageRequest);
    InscriptionDetailResponse findById(Long id);
    InscriptionStatus findInscriptionStatus(Long contestId, String userId);
}