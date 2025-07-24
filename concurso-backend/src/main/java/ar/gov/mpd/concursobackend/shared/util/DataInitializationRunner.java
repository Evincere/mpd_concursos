package ar.gov.mpd.concursobackend.shared.util;

import ar.gov.mpd.concursobackend.shared.application.service.DataInitializationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class DataInitializationRunner implements CommandLineRunner {

    @Autowired
    private DataInitializationService dataInitializationService;

    @Override
    public void run(String... args) throws Exception {
        dataInitializationService.initializeData();
    }
}
