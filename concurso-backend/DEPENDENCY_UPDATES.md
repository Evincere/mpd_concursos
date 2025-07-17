# Plan de Actualización de Dependencias

## Resumen Ejecutivo

Este documento contiene el plan para actualizar las dependencias del proyecto a versiones más recientes que incluyen parches de seguridad importantes.

**Estado Actual**: Dependencias en versiones estables pero no las más recientes
**Objetivo**: Actualizar a versiones más recientes con parches de seguridad
**Prioridad**: Media-Alta (seguridad)

## Dependencias Actuales vs. Recomendadas

### Dependencias Críticas de Seguridad

| Dependencia | Versión Actual | Versión Recomendada | Prioridad | Motivo |
|---|---|---|---|---|
| **Spring Boot** | 3.2.4 | 3.3.5+ | Alta | Parches de seguridad |
| **MySQL Connector** | 8.2.0 | 8.4.0+ | Alta | Vulnerabilidades conocidas |
| **JJWT** | 0.12.5 | 0.12.6+ | Media | Mejoras de seguridad JWT |
| **Apache Tika** | 2.9.1 | 2.9.2+ | Media | Parches de seguridad |

### Dependencias de Desarrollo

| Dependencia | Versión Actual | Versión Recomendada | Prioridad | Motivo |
|---|---|---|---|---|
| **Lombok** | 1.18.30 | 1.18.36+ | Baja | Compatibilidad y mejoras |
| **MapStruct** | 1.5.5.Final | 1.6.3+ | Baja | Nuevas características |
| **SpringDoc OpenAPI** | 2.3.0 | 2.7.0+ | Baja | Mejoras de documentación |
| **Commons BeanUtils** | 1.9.4 | 1.9.5+ | Baja | Correcciones menores |

## Plan de Actualización por Fases

### Fase 1: Preparación (Inmediata)
1. ✅ **Agregar plugin versions-maven-plugin** al pom.xml
2. ✅ **Crear documentación** de dependencias actuales
3. ✅ **Establecer proceso** de verificación de actualizaciones
4. ✅ **Configurar herramientas** de monitoreo

### Fase 2: Actualizaciones de Seguridad ✅ COMPLETADA (15/07/2025)
1. ✅ **Spring Boot 3.2.4 → 3.5.3** (Completado anteriormente)
   - ✅ Verificar compatibilidad con código existente
   - ✅ Probar en entorno de desarrollo
   - ✅ Ejecutar suite completa de tests
   - ✅ Desplegar en staging para validación

2. ✅ **MySQL Connector 8.2.0 → 9.3.0** (Completado 15/07/2025)
   - ✅ Verificar compatibilidad con MySQL Server
   - ✅ Probar conexiones y transacciones
   - ✅ Validar performance

3. ✅ **JJWT 0.12.5 → 0.12.6** (Completado 15/07/2025)
   - ✅ Verificar compatibilidad con JWT existentes
   - ✅ Probar autenticación y autorización
   - ✅ Validar tokens existentes

### Fase 3: Actualizaciones de Mejora ✅ COMPLETADA (15/07/2025)
1. ✅ **Apache Tika 2.9.1 → 3.2.1** (Completado 15/07/2025)
2. ✅ **SpringDoc OpenAPI 2.3.0 → 2.8.9** (Completado 15/07/2025)
3. ✅ **Lombok 1.18.30 → 1.18.38** (Completado 15/07/2025)
4. ✅ **MapStruct 1.5.5.Final → 1.6.3** (Completado 15/07/2025)

## Comandos de Verificación

### Verificar Dependencias Desactualizadas
```bash
# Verificar actualizaciones disponibles
mvn versions:display-dependency-updates

# Verificar actualizaciones de plugins
mvn versions:display-plugin-updates

# Verificar actualizaciones de parent
mvn versions:display-parent-updates
```

### ⚠️ Problema Conocido: Certificados SSL
**Error actual**: `PKIX path building failed: unable to find valid certification path to requested target`

Este error impide la descarga de plugins y verificación de actualizaciones. Soluciones:

1. **Configurar certificados corporativos**:
```bash
# Agregar certificado al keystore de Java
keytool -import -alias corporate-cert -file corporate.crt -keystore $JAVA_HOME/lib/security/cacerts
```

2. **Usar repositorio local/mirror**:
```xml
<!-- En settings.xml -->
<mirrors>
  <mirror>
    <id>internal-repo</id>
    <url>http://internal-maven-repo/</url>
    <mirrorOf>central</mirrorOf>
  </mirror>
</mirrors>
```

3. **Verificación manual de versiones** (alternativa temporal):
   - Consultar [Maven Central](https://search.maven.org/)
   - Revisar [Spring Boot Releases](https://github.com/spring-projects/spring-boot/releases)
   - Verificar [MySQL Connector Releases](https://dev.mysql.com/downloads/connector/j/)

### Actualizar Dependencias (Cuando sea posible)
```bash
# Actualizar a versiones menores (patches)
mvn versions:use-latest-versions -DallowSnapshots=false

# Actualizar Spring Boot parent
mvn versions:update-parent -DallowSnapshots=false

# Generar reporte de dependencias
mvn dependency:tree > dependency-tree.txt
```

## Procedimiento de Actualización Segura

### 1. Preparación
```bash
# Crear rama para actualizaciones
git checkout -b feature/dependency-updates

# Hacer backup del pom.xml actual
cp pom.xml pom.xml.backup
```

### 2. Actualización Incremental
```bash
# Actualizar una dependencia a la vez
# Ejemplo: Spring Boot
mvn versions:update-parent -DparentVersion=3.3.5

# Compilar y probar
mvn clean compile
mvn test
```

### 3. Verificación
```bash
# Ejecutar tests completos
mvn clean test

# Verificar aplicación en desarrollo
mvn spring-boot:run -Dspring.profiles.active=dev

# Probar endpoints críticos
curl -X GET http://localhost:8080/api/health
```

### 4. Rollback si es necesario
```bash
# Restaurar pom.xml original
cp pom.xml.backup pom.xml

# Verificar que funciona
mvn clean compile
```

## Herramientas de Monitoreo

### Plugin Versions Maven
```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>versions-maven-plugin</artifactId>
    <version>2.17.1</version>
    <configuration>
        <generateBackupPoms>false</generateBackupPoms>
    </configuration>
</plugin>
```

### Configuración de Dependabot (GitHub)
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "maven"
    directory: "/concurso-backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

## Riesgos y Mitigaciones

### Riesgos Identificados
1. **Incompatibilidad de APIs** - Cambios breaking en nuevas versiones
2. **Regresiones** - Nuevos bugs introducidos
3. **Performance** - Degradación de rendimiento
4. **Configuración** - Cambios en configuración requeridos

### Mitigaciones
1. **Testing exhaustivo** antes de despliegue
2. **Actualización incremental** una dependencia a la vez
3. **Rollback plan** preparado
4. **Monitoreo** post-actualización

## Cronograma Recomendado

### Inmediato (Esta semana)
- ✅ Documentación completada
- ✅ Herramientas configuradas
- ✅ Plugin versions-maven-plugin agregado

### Próximas 2 semanas
- [ ] Actualizar Spring Boot 3.2.4 → 3.3.5
- [ ] Actualizar MySQL Connector 8.2.0 → 8.4.0
- [ ] Probar en desarrollo y staging

### Próximo mes
- [ ] Actualizar JJWT 0.12.5 → 0.12.6
- [ ] Actualizar Apache Tika 2.9.1 → 2.9.2
- [ ] Actualizar dependencias de desarrollo

### Proceso Continuo
- [ ] Revisión mensual de dependencias
- [ ] Configurar alertas de seguridad
- [ ] Automatizar verificación de actualizaciones

## Contacto y Responsabilidades

- **Responsable**: Equipo de Desarrollo MPD
- **Revisor**: Arquitecto de Software
- **Aprobación**: Lead Developer
- **Documentación**: Este archivo (DEPENDENCY_UPDATES.md)

## Referencias

- [Spring Boot Release Notes](https://github.com/spring-projects/spring-boot/wiki)
- [MySQL Connector/J Release Notes](https://dev.mysql.com/doc/relnotes/connector-j/)
- [JJWT Release Notes](https://github.com/jwtk/jjwt/releases)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Versions Maven Plugin](https://www.mojohaus.org/versions-maven-plugin/)
