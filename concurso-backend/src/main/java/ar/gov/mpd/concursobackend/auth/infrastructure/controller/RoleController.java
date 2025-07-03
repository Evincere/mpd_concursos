package ar.gov.mpd.concursobackend.auth.infrastructure.controller;

import ar.gov.mpd.concursobackend.auth.application.dto.UserRoleUpdateRequest;
import ar.gov.mpd.concursobackend.auth.application.service.RolService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RolService rolService;

    @PostMapping("/assign")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> assignRole(@Valid @RequestBody UserRoleUpdateRequest request) {
        rolService.assignRoleToUser(request.getUsername(), request.getRole());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/remove")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> removeRole(@Valid @RequestBody UserRoleUpdateRequest request) {
        rolService.removeRoleFromUser(request.getUsername(), request.getRole());
        return ResponseEntity.ok().build();
    }
}