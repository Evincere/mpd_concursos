package ar.gov.mpd.concursobackend.notification.infrastructure.persistence;

import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.domain.port.NotificationRepository;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class NotificationPersistenceAdapter implements NotificationRepository {

    private final NotificationJpaRepository jpaRepository;
    private final NotificationPersistenceMapper mapper;

    @Override
    public Notification save(Notification notification) {
        NotificationJpaEntity entity = mapper.toJpaEntity(notification);
        NotificationJpaEntity savedEntity = jpaRepository.save(entity);
        return mapper.toDomainEntity(savedEntity);
    }

    @Override
    public Optional<Notification> findById(NotificationId id) {
        return jpaRepository.findById(id.getValue())
            .map(mapper::toDomainEntity);
    }

    @Override
    public List<Notification> findByRecipientId(UUID recipientId) {
        return jpaRepository.findByRecipientId(recipientId)
            .stream()
            .map(mapper::toDomainEntity)
            .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findPendingNotifications() {
        return jpaRepository.findByStatus(ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus.PENDING)
            .stream()
            .map(mapper::toDomainEntity)
            .collect(Collectors.toList());
    }
}
