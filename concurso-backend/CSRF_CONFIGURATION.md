# Configuración CSRF - Documentación Técnica

## Resumen Ejecutivo

La protección CSRF está **DESHABILITADA DE FORMA SEGURA** en esta aplicación porque:

1. ✅ **Arquitectura 100% Stateless** - Sin sesiones HTTP
2. ✅ **Autenticación únicamente via JWT en headers** - Sin cookies
3. ✅ **Sin estado en el servidor** - Cada request es independiente
4. ✅ **Práctica recomendada** para APIs REST con JWT

## ¿Qué es CSRF?

Cross-Site Request Forgery (CSRF) es un ataque donde un sitio malicioso engaña al navegador del usuario para que realice peticiones no autorizadas a otro sitio donde el usuario está autenticado.

### Condiciones para vulnerabilidad CSRF:

1. **Autenticación basada en cookies** - El navegador envía cookies automáticamente
2. **Estado de sesión** - El servidor mantiene sesiones de usuario
3. **Peticiones automáticas** - El navegador incluye credenciales sin intervención del usuario

## ¿Por qué CSRF está deshabilitado de forma segura?

### 1. Arquitectura Stateless

```java
.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
```

- **Sin sesiones HTTP**: No hay `HttpSession` en el servidor
- **Sin estado**: Cada petición es independiente
- **Sin cookies de sesión**: No hay `JSESSIONID` ni cookies similares

### 2. Autenticación JWT únicamente en Headers

```java
// JwtTokenFilter.java
private String getToken(HttpServletRequest request) {
    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ")) {
        return null;
    }
    return header.substring(7);
}
```

- **Solo headers**: Token JWT se transmite únicamente via `Authorization: Bearer`
- **Sin cookies**: No hay cookies de autenticación
- **Control explícito**: El frontend debe incluir el token manualmente

### 3. Frontend sin Cookies de Autenticación

```typescript
// Frontend - token.service.ts
window.localStorage.setItem(this.tokenKey, jwtDto.token);
```

- **localStorage**: Tokens almacenados en localStorage (no cookies)
- **Headers manuales**: Cada petición incluye el header Authorization explícitamente
- **Sin envío automático**: El navegador NO envía tokens automáticamente

## Validación Automática

### SecurityValidationService

El sistema incluye validación automática que verifica:

```java
@PostConstruct
public void validateSecurityConfiguration() {
    validateStatelessConfiguration();
    validateJwtOnlyAuthentication();
    validateCsrfDisabled();
}
```

### Diagnóstico en Desarrollo

Endpoints disponibles solo en desarrollo (`app.security.diagnostic.enabled=true`):

- `GET /api/security/diagnostic/report` - Reporte completo
- `GET /api/security/diagnostic/csrf-status` - Estado CSRF
- `POST /api/security/diagnostic/diagnose-request` - Diagnóstico de petición
- `GET /api/security/diagnostic/health` - Salud de configuración

## Cuándo REHABILITAR CSRF

⚠️ **IMPORTANTE**: CSRF debe ser rehabilitado si se introduce:

1. **Cookies de autenticación**
2. **Sesiones HTTP**
3. **Autenticación automática del navegador**

### Ejemplo de rehabilitación:

```java
.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    .ignoringRequestMatchers("/api/auth/login", "/api/auth/register")
)
```

## Configuración por Entorno

### Desarrollo
```properties
# application-dev.properties
app.security.diagnostic.enabled=true
```

### Producción
```properties
# application-prod.properties
app.security.diagnostic.enabled=false
```

## Monitoreo y Alertas

### Logs de Seguridad

El sistema registra automáticamente:

```java
logger.warn("⚠️  ADVERTENCIA: Cookie de autenticación detectada: {}", cookieName);
logger.warn("⚠️  Esto podría indicar un problema de configuración de seguridad");
```

### Validaciones en Runtime

```java
public boolean validateRequestSecurity(HttpServletRequest request) {
    // Detecta cookies de autenticación no deseadas
    // Valida que JWT viene del header Authorization
    // Registra anomalías de seguridad
}
```

## Mejores Prácticas

### ✅ Hacer

1. **Mantener** arquitectura stateless
2. **Usar** JWT únicamente en headers
3. **Evitar** cookies de autenticación
4. **Monitorear** configuración con herramientas de diagnóstico
5. **Documentar** cambios de arquitectura

### ❌ No Hacer

1. **No introducir** cookies de sesión sin rehabilitar CSRF
2. **No cambiar** a autenticación basada en cookies sin análisis
3. **No deshabilitar** validaciones de seguridad
4. **No ignorar** advertencias del sistema

## Referencias

- [OWASP CSRF Prevention](https://owasp.org/www-community/attacks/csrf)
- [Spring Security CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Contacto

Para preguntas sobre esta configuración:
- Equipo de Desarrollo MPD
- Auditoría de Seguridad: `AUDITORIA_SEGURIDAD.md`
- Logs del sistema: `SecurityValidationService`
