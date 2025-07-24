package ar.gov.mpd.concursobackend.shared.application.service;

import ar.gov.mpd.concursobackend.shared.domain.entities.DistributedLock;
import ar.gov.mpd.concursobackend.shared.infrastructure.database.repository.DistributedLockRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;
import java.util.function.Supplier;

@Service
public class DataInitializationLockService {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializationLockService.class);
    private static final String LOCK_KEY = "data-initialization";

    @Autowired
    private DistributedLockRepository lockRepository;

    private final String ownerId = UUID.randomUUID().toString();

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public <T> T executeWithLock(Supplier<T> task) {
        if (acquireLock()) {
            try {
                return task.get();
            } finally {
                releaseLock();
            }
        }
        logger.info("Data initialization is already running by another instance.");
        return null;
    }

    private boolean acquireLock() {
        try {
            DistributedLock lock = lockRepository.findById(LOCK_KEY).orElse(null);
            if (lock == null) {
                lockRepository.save(new DistributedLock(LOCK_KEY, ownerId));
                logger.info("Lock acquired by owner {}", ownerId);
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error acquiring lock", e);
            return false;
        }
    }

    private void releaseLock() {
        try {
            DistributedLock lock = lockRepository.findById(LOCK_KEY).orElse(null);
            if (lock != null && ownerId.equals(lock.getOwner())) {
                lockRepository.delete(lock);
                logger.info("Lock released by owner {}", ownerId);
            }
        } catch (Exception e) {
            logger.error("Error releasing lock", e);
        }
    }
}
