package ar.gov.mpd.concursobackend.notification.infrastructure.persistence;

import ar.gov.mpd.concursobackend.notification.application.port.out.INotificationRepository;
import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.infrastructure.persistence.entity.NotificationJpaEntity;
import ar.gov.mpd.concursobackend.notification.infrastructure.persistence.mapper.NotificationPersistenceMapper;
import ar.gov.mpd.concursobackend.notification.infrastructure.persistence.repository.JpaNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class NotificationPersistenceAdapter implements INotificationRepository {

    private final JpaNotificationRepository jpaRepository;
    private final NotificationPersistenceMapper mapper;

    @Override
    public List<Notification> findByRecipientId(UUID recipientId) {
        List<NotificationJpaEntity> notifications = jpaRepository.findByRecipientIdOrderBySentAtDesc(recipientId);
        return notifications.stream()
                .map(mapper::toDomainEntity)
                .collect(Collectors.toList());
    }

    @Override
    public Notification save(Notification notification) {
        var entity = mapper.toJpaEntity(notification);
        var savedEntity = jpaRepository.save(entity);
        return mapper.toDomainEntity(savedEntity);
    }

    @Override
    public Notification findById(UUID id) {
        return jpaRepository.findById(id)
                .map(mapper::toDomainEntity)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public Notification update(Notification notification) {
        if (!jpaRepository.existsById(notification.getId())) {
            throw new IllegalArgumentException("Notification not found");
        }
        return save(notification);
    }
}
