package ar.gov.mpd.concursobackend.auth.domain.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserPassword;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;

public class UserAuthorityTest {

    private UserAuthority userAuthority;
    private UserUsername mockUsername;
    private UserPassword mockPassword;
    private Collection<? extends GrantedAuthority> mockAuthorities;

    @BeforeEach
    public void setUp() {
        mockUsername = mock(UserUsername.class);
        mockPassword = mock(UserPassword.class);
        mockAuthorities = Arrays.asList(new SimpleGrantedAuthority("ROLE_USER"));

        userAuthority = new UserAuthority(mockUsername, mockPassword, mockAuthorities);
    }

    @Test
    public void testGetAuthorities() {
        assertEquals(mockAuthorities, userAuthority.getAuthorities());
    }

    @Test
    public void testGetPassword() {
        when(mockPassword.toString()).thenReturn("password");
        assertEquals("password", userAuthority.getPassword());
    }

    @Test
    public void testGetUsername() {
        when(mockUsername.toString()).thenReturn("username");
        assertEquals("username", userAuthority.getUsername());
    }

    @Test
    public void testIsAccountNonExpired() {
        assertTrue(userAuthority.isAccountNonExpired());
    }

    @Test
    public void testIsAccountNonLocked() {
        assertTrue(userAuthority.isAccountNonLocked());
    }

    @Test
    public void testIsCredentialsNonExpired() {
        assertTrue(userAuthority.isCredentialsNonExpired());
    }

    @Test
    public void testIsEnabled() {
        assertTrue(userAuthority.isEnabled());
    }

    @Test
    public void testEqualsAndHashCode() {
        UserAuthority anotherUserAuthority = new UserAuthority(mockUsername, mockPassword, mockAuthorities);
        assertEquals(userAuthority, anotherUserAuthority);
        assertEquals(userAuthority.hashCode(), anotherUserAuthority.hashCode());
    }

    @Test
    public void testDifferentRoles() {
        Collection<? extends GrantedAuthority> adminAuthorities = Arrays.asList(new SimpleGrantedAuthority("ROLE_ADMIN"));
        UserAuthority adminUserAuthority = new UserAuthority(mockUsername, mockPassword, adminAuthorities);
        assertNotEquals(userAuthority.getAuthorities(), adminUserAuthority.getAuthorities());
    }

    @Test
    public void testNullValues() {
        UserAuthority nullUserAuthority = new UserAuthority(null, null, Collections.emptyList());
        assertNull(nullUserAuthority.getUsername());
        assertNull(nullUserAuthority.getPassword());
        assertTrue(nullUserAuthority.getAuthorities().isEmpty());
    }
}    