package ar.gov.mpd.concursobackend.auth.domain.jwt;

import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.springframework.security.core.userdetails.UserDetails;

import ar.gov.mpd.concursobackend.auth.application.service.UserDetailsServiceImpl;

import org.springframework.security.core.userdetails.User;
import java.util.ArrayList;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public class JwtTokenFilterTest {

    private JwtTokenFilter jwtTokenFilter;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    @BeforeEach
    public void setup(){
        MockitoAnnotations.openMocks(this);
        jwtTokenFilter = new JwtTokenFilter();
        jwtTokenFilter.jwtProvider = jwtProvider;
        jwtTokenFilter.userDetailsService = userDetailsService;
    }
        
    @Test
    public void testValidToken() throws ServletException, IOException {
        // Simula un token JWT válido
        String validToken = "valid.jwt.token";
        when(jwtProvider.validateToken(validToken)).thenReturn(true);
        when(jwtProvider.getUsernameFromToken(validToken)).thenReturn("user");
        UserDetails userDetails = new User("user", "", new ArrayList<>());
        when(userDetailsService.loadUserByUsername("user")).thenReturn(userDetails);

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);

        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);

        jwtTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    public void testInvalidToken() throws ServletException, IOException {
        // Simula un token JWT inválido
        String invalidToken = "invalid.jwt.token";
        when(jwtProvider.validateToken(invalidToken)).thenReturn(false);

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);

        when(request.getHeader("Authorization")).thenReturn("Bearer " + invalidToken);

        jwtTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    public void testExpiredToken() throws ServletException, IOException {
        // Simula un token JWT expirado
        String expiredToken = "expired.jwt.token";
        when(jwtProvider.validateToken(expiredToken)).thenReturn(false);

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);

        when(request.getHeader("Authorization")).thenReturn("Bearer " + expiredToken);

        jwtTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    public void testNullToken() {
        // Prueba con un token nulo
        String nullToken = null;
        // Lógica para probar el filtro con un token nulo
        assertFalse(jwtTokenFilter.filter(nullToken));
    }

    @Test
    public void testEmptyToken() {
        // Prueba con un token vacío
        String emptyToken = "";
        // Lógica para probar el filtro con un token vacío
        assertFalse(jwtTokenFilter.filter(emptyToken));
    }
}
    