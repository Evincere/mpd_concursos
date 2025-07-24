package ar.gov.mpd.concursobackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableRetry
public class ConcursoBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ConcursoBackendApplication.class, args);
	}

}
