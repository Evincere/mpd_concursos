package ar.gov.mpd.concursobackend.shared.domain.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "distributed_lock")
@Getter
@Setter
public class DistributedLock {

    @Id
    private String lockKey;

    private String owner;

    private Instant lockedAt;

    @Version
    private Long version;

    public DistributedLock() {
    }

    public DistributedLock(String lockKey, String owner) {
        this.lockKey = lockKey;
        this.owner = owner;
        this.lockedAt = Instant.now();
    }
}
