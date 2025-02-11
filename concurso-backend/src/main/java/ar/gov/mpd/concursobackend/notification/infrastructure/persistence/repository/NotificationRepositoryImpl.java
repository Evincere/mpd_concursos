package ar.gov.mpd.concursobackend.notification.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.notification.application.port.out.INotificationRepository;
import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.infrastructure.persistence.mapper.NotificationPersistenceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
@Primary
@RequiredArgsConstructor
public class NotificationRepositoryImpl implements INotificationRepository {

    private final JpaNotificationRepository jpaRepository;
    private final NotificationPersistenceMapper mapper;

    @Override
    public Notification save(Notification notification) {
        var entity = mapper.toJpaEntity(notification);
        return mapper.toDomainEntity(jpaRepository.save(entity));
    }

    @Override
    public List<Notification> findByRecipientId(UUID recipientId) {
        return jpaRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId)
                .stream()
                .map(mapper::toDomainEntity)
                .toList();
    }

    @Override
    public Notification findById(UUID id) {
        return jpaRepository.findById(id)
                .map(mapper::toDomainEntity)
                .orElse(null);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public Notification update(Notification notification) {
        var entity = mapper.toJpaEntity(notification);
        return mapper.toDomainEntity(jpaRepository.save(entity));
    }
}
