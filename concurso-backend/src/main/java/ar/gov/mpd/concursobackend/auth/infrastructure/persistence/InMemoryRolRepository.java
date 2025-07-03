package ar.gov.mpd.concursobackend.auth.infrastructure.persistence;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.Rol;
import ar.gov.mpd.concursobackend.auth.domain.port.IRoleRepository;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.RoleEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IRoleSpringRepository;
import ar.gov.mpd.concursobackend.auth.infrastructure.mapper.RolMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class InMemoryRolRepository implements IRoleRepository{

    @Autowired
    private IRoleSpringRepository roleSpringRepository;
    @Autowired
    private RolMapper rolMapper;

    @Override
    public Optional<Rol> findByRole(RoleEnum name) {
        return roleSpringRepository.findByName(name)
            .map(rolMapper::toDomain);
    }

    @Override
    public void create(Rol rol) {
        RoleEntity entity = rolMapper.toEntity(rol);
        roleSpringRepository.save(entity);
    }

    @Override
    public boolean existsByRole(RoleEnum role) {
        return roleSpringRepository.existsByName(role);
    }

}
