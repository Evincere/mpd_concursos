package ar.gov.mpd.concursobackend.auth.infrastructure.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import ar.gov.mpd.concursobackend.auth.application.dto.UserProfileResponse;
import ar.gov.mpd.concursobackend.auth.application.dto.UserProfileUpdateRequest;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserDni;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserCuit;
import ar.gov.mpd.concursobackend.shared.security.IAuthenticationFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
@Slf4j
public class UserController {

    private final UserService userService;
    private final IAuthenticationFacade authenticationFacade;

    @GetMapping("/me")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<UserProfileResponse> getCurrentUserProfile() {
        String username = authenticationFacade.getAuthentication().getName();
        log.debug("Obteniendo perfil para usuario: {}", username);

        return userService.getByUsername(new UserUsername(username))
                .map(this::mapToProfileResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<UserProfileResponse> updateCurrentUserProfile(
            @RequestBody UserProfileUpdateRequest updateRequest) {
        String username = authenticationFacade.getAuthentication().getName();
        log.debug("Actualizando perfil para usuario: {}", username);

        return userService.getByUsername(new UserUsername(username))
                .map(user -> updateUserFromRequest(user, updateRequest))
                .map(userService::updateUser)
                .map(this::mapToProfileResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId().value().toString())
                .username(user.getUsername().value())
                .email(user.getEmail().value())
                .dni(user.getDni().value())
                .cuit(user.getCuit().value())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build();
    }

    private User updateUserFromRequest(User user, UserProfileUpdateRequest request) {
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setDni(new UserDni(request.getDni()));
        user.setCuit(new UserCuit(request.getCuit()));
        return user;
    }
}