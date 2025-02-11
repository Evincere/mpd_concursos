package ar.gov.mpd.concursobackend.notification.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.notification.infrastructure.persistence.entity.NotificationJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JpaNotificationRepository extends JpaRepository<NotificationJpaEntity, UUID> {
    List<NotificationJpaEntity> findByRecipientIdOrderBySentAtDesc(UUID recipientId);
}
