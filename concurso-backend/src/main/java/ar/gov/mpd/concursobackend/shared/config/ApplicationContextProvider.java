package ar.gov.mpd.concursobackend.shared.config;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

/**
 * Proveedor de contexto de Spring para acceder a beans desde entidades JPA
 * TEMPORAL - Solo para debugging
 */
@Component
public class ApplicationContextProvider implements ApplicationContextAware {

    private static ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        context = applicationContext;
    }

    public static <T> T getBean(Class<T> beanClass) {
        if (context == null) {
            // Fallback silencioso si el contexto no está disponible
            return null;
        }
        try {
            return context.getBean(beanClass);
        } catch (Exception e) {
            // Fallback silencioso en caso de error
            return null;
        }
    }
}
