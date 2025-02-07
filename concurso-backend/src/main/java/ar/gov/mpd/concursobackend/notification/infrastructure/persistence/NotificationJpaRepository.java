package ar.gov.mpd.concursobackend.notification.infrastructure.persistence;

import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationJpaRepository extends JpaRepository<NotificationJpaEntity, UUID> {
    List<NotificationJpaEntity> findByRecipientId(UUID recipientId);
    List<NotificationJpaEntity> findByStatus(NotificationStatus status);
}
