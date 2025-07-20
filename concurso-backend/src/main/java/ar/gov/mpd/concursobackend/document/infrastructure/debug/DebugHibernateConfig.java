package ar.gov.mpd.concursobackend.document.infrastructure.debug;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Configuración para activar el interceptor de debugging
 * SOLO ACTIVO EN PERFIL 'debug'
 */
@Component
@Profile("debug") // Solo activo cuando se ejecuta con -Dspring.profiles.active=debug
public class DebugHibernateConfig implements HibernatePropertiesCustomizer {

    @Autowired
    private DocumentVersionDebugInterceptor debugInterceptor;

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put("hibernate.session_factory.interceptor", debugInterceptor);
        
        // Activar logging SQL detallado
        hibernateProperties.put("hibernate.show_sql", true);
        hibernateProperties.put("hibernate.format_sql", true);
        hibernateProperties.put("hibernate.use_sql_comments", true);
        
        System.out.println("🔍 [DEBUG] Interceptor de versioning activado!");
    }
}
