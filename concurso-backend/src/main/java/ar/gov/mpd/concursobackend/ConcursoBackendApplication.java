package ar.gov.mpd.concursobackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class ConcursoBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ConcursoBackendApplication.class, args);
	}

}
