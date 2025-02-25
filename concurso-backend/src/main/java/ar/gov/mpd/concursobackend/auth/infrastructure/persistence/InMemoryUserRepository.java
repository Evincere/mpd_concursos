package ar.gov.mpd.concursobackend.auth.infrastructure.persistence;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserDni;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserEmail;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IUserSpringRepository;
import ar.gov.mpd.concursobackend.auth.infrastructure.mapper.UserMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class InMemoryUserRepository implements IUserRepository {

    @Autowired
    private IUserSpringRepository userSpringRepository;
    @Autowired
    private UserMapper userMapper;

    @Override
    public User create(User user) {
        return userMapper.toDomain(userSpringRepository.save(userMapper.toEntity(user)));
    }

    @Override
    public Optional<User> getByUsername(UserUsername username) {
        return userSpringRepository.findByUsername(username.value())
                .map(userMapper::toDomain);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return userSpringRepository.findById(id)
                .map(userMapper::toDomain);
    }

    @Override
    public boolean existsByUsername(UserUsername userName) {
        return userSpringRepository.existsByUsername(userName.value());
    }

    @Override
    public boolean existsByEmail(UserEmail email) {
        return userSpringRepository.existsByEmail(email.value());
    }

    @Override
    public boolean existsByDni(UserDni dni) {
        return userSpringRepository.existsByDni(dni.value());
    }

    @Override
    public List<User> findAll() {
        return userSpringRepository.findAll().stream()
                .map(userMapper::toDomain)
                .collect(Collectors.toList());
    }
}
