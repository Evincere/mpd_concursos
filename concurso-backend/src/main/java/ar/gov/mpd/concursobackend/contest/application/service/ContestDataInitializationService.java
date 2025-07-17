package ar.gov.mpd.concursobackend.contest.application.service;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestDateEntity;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.repository.ContestJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio para inicialización automática de concursos de prueba
 * Se ejecuta al inicio de la aplicación para garantizar que existan concursos de prueba
 * para que los usuarios puedan interactuar con la plataforma
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Order(300) // Se ejecuta después de otros CommandLineRunner básicos
public class ContestDataInitializationService implements CommandLineRunner {

    private final ContestJpaRepository contestRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("🚀 [ContestDataInitialization] Iniciando verificación de concursos de prueba");

        try {
            initializeTestContests();
            log.info("✅ [ContestDataInitialization] Inicialización de concursos completada exitosamente");
        } catch (Exception e) {
            log.error("❌ [ContestDataInitialization] Error durante la inicialización de concursos", e);
            // No lanzamos la excepción para no impedir el inicio de la aplicación
        }
    }

    /**
     * Inicializa concursos de prueba si no existen
     */
    private void initializeTestContests() {
        List<ContestEntity> existingContests = contestRepository.findAll();
        
        if (existingContests.isEmpty()) {
            log.warn("⚠️ [ContestDataInitialization] No se encontraron concursos existentes. Creando concursos de prueba...");
            createTestContests();
        } else {
            log.info("📋 [ContestDataInitialization] Se encontraron {} concursos existentes", existingContests.size());
        }
    }

    /**
     * Crea concursos de prueba basados en el documento "CONCURSO CLASE 3 MULTIFUERO"
     * Para 1ra, 2da, 3ra y 4ta Circunscripciones Judiciales de Mendoza
     */
    private void createTestContests() {
        log.info("📝 [ContestDataInitialization] Creando concursos de prueba...");

        // Fechas base para los concursos
        LocalDate today = LocalDate.now();
        LocalDate contestEndDate = today.plusDays(60);

        // Concurso 1: Co-Defensor Penal y Penal Juvenil - Clase 3 Multifuero
        ContestEntity contest1 = createTestContest(
            "Co-Defensor Penal y Penal Juvenil - Clase 03 Multifuero",
            "FUNCIONARIOS Y PERSONAL JERARQUICO",
            "03",
            "Defensa legal en causas penales y penales juveniles. Garantizar derechos fundamentales y debido proceso.",
            "DEFENSORIAS PENALES",
            "Co-Defensor/a Penal y Penal Juvenil - Clase 03",
            today,
            contestEndDate,
            "/api/files/contest-bases/concurso_codefensor_penal_clase03.pdf",
            "/api/files/contest-descriptions/codefensor_penal_clase03_descripcion.pdf"
        );

        // Concurso 2: Co-Defensor Civil - Clase 3 Multifuero
        ContestEntity contest2 = createTestContest(
            "Co-Defensor Civil - Clase 03 Multifuero",
            "FUNCIONARIOS Y PERSONAL JERARQUICO",
            "03",
            "Asesoramiento y representación legal en materias Civil, Comercial, Paz, Familia, Consumidor, Tributario y Concursal.",
            "DEFENSORIAS CIVILES",
            "Co-Defensor/a Civil - Clase 03",
            today,
            contestEndDate,
            "/api/files/contest-bases/concurso_codefensor_civil_clase03.pdf",
            "/api/files/contest-descriptions/codefensor_civil_clase03_descripcion.pdf"
        );

        // Concurso 3: Co-Asesor de NNAyPCR - Clase 3 Multifuero
        ContestEntity contest3 = createTestContest(
            "Co-Asesor/a de NNAyPCR - Clase 03 Multifuero",
            "FUNCIONARIOS Y PERSONAL JERARQUICO",
            "03",
            "Defensa y protección de derechos de niños, niñas, adolescentes y personas con capacidad restringida.",
            "ASESORIAS DE NIÑOS, NIÑAS, ADOLESCENTES Y PERSONAS CON CAPACIDAD RESTRINGIDA",
            "Co-Asesor/a de NNAyPCR - Clase 03",
            today,
            contestEndDate,
            "/api/files/contest-bases/concurso_coasesor_nnapcr_clase03.pdf",
            "/api/files/contest-descriptions/coasesor_nnapcr_clase03_descripcion.pdf"
        );

        // Concurso 4: CONCURSO DE PRUEBA - Período de Inscripción Cerrado (Para testing de seguridad)
        ContestEntity contest4 = createTestContestWithClosedInscription(
            "CONCURSO DE PRUEBA - Secretario/a Judicial Clase 02 (PERÍODO CERRADO)",
            "FUNCIONARIOS Y PERSONAL JERARQUICO",
            "02",
            "CONCURSO DE PRUEBA para validar restricciones de período de inscripción. Las inscripciones están CERRADAS para probar la corrección de seguridad del punto 12.",
            "SECRETARIAS JUDICIALES",
            "Secretario/a Judicial - Clase 02",
            today.minusDays(60), // Concurso que comenzó hace 60 días
            today.minusDays(10), // Y terminó hace 10 días
            "/api/files/contest-bases/concurso_secretario_clase02_prueba.pdf",
            "/api/files/contest-descriptions/secretario_clase02_prueba_descripcion.pdf"
        );

        // Guardar concursos
        try {
            ContestEntity savedContest1 = contestRepository.save(contest1);
            log.info("✅ [ContestDataInitialization] Concurso creado: {} (ID: {})", 
                savedContest1.getTitle(), savedContest1.getId());

            ContestEntity savedContest2 = contestRepository.save(contest2);
            log.info("✅ [ContestDataInitialization] Concurso creado: {} (ID: {})", 
                savedContest2.getTitle(), savedContest2.getId());

            ContestEntity savedContest3 = contestRepository.save(contest3);
            log.info("✅ [ContestDataInitialization] Concurso creado: {} (ID: {})",
                savedContest3.getTitle(), savedContest3.getId());

            ContestEntity savedContest4 = contestRepository.save(contest4);
            log.info("✅ [ContestDataInitialization] Concurso de prueba creado: {} (ID: {})",
                savedContest4.getTitle(), savedContest4.getId());

            // Crear fechas importantes para cada concurso
            createContestDates(savedContest1);
            createContestDates(savedContest2);
            createContestDates(savedContest3);
            createClosedInscriptionDates(savedContest4); // Fechas especiales para el concurso de prueba

        } catch (Exception e) {
            log.error("❌ [ContestDataInitialization] Error creando concursos de prueba", e);
        }

        log.info("📊 [ContestDataInitialization] Creación de concursos de prueba completada");
    }

    /**
     * Crea un concurso de prueba con los datos especificados
     */
    private ContestEntity createTestContest(String title, String category, String class_,
                                          String functions, String department, String position,
                                          LocalDate startDate, LocalDate endDate,
                                          String basesUrl, String descriptionUrl) {
        return ContestEntity.builder()
            .title(title)
            .category(category)
            .class_(class_)
            .functions(functions)
            .status(ContestStatus.PUBLISHED) // Estado que permite inscripciones
            .department(department)
            .position(position)
            .startDate(startDate)
            .endDate(endDate)
            .basesUrl(basesUrl)
            .descriptionUrl(descriptionUrl)
            .dates(new ArrayList<>()) // Se inicializa vacía, se llenan después
            .build();
    }

    /**
     * Crea un concurso de prueba con período de inscripción cerrado
     * SECURITY TEST: Para validar la corrección del punto 12 de la auditoría
     */
    private ContestEntity createTestContestWithClosedInscription(String title, String category, String class_,
                                                               String functions, String department, String position,
                                                               LocalDate startDate, LocalDate endDate,
                                                               String basesUrl, String descriptionUrl) {
        return ContestEntity.builder()
            .title(title)
            .category(category)
            .class_(class_)
            .functions(functions)
            .status(ContestStatus.INSCRIPTION_CLOSED) // Estado que NO permite inscripciones
            .department(department)
            .position(position)
            .startDate(startDate)
            .endDate(endDate)
            .basesUrl(basesUrl)
            .descriptionUrl(descriptionUrl)
            .dates(new ArrayList<>()) // Se inicializa vacía, se llenan después
            .build();
    }

    /**
     * Crea fechas importantes para un concurso
     */
    private void createContestDates(ContestEntity contest) {
        LocalDate today = LocalDate.now();

        List<ContestDateEntity> dates = new ArrayList<>();

        // Fecha de inscripción (30 días desde hoy)
        ContestDateEntity inscriptionDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Período de Inscripción")
            .type("inscription")
            .startDate(today)
            .endDate(today.plusDays(30))
            .build();
        dates.add(inscriptionDate);

        // Fecha de evaluación de antecedentes (35-40 días desde hoy)
        ContestDateEntity evaluationDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Evaluación de Antecedentes")
            .type("evaluation")
            .startDate(today.plusDays(35))
            .endDate(today.plusDays(40))
            .build();
        dates.add(evaluationDate);

        // Fecha de examen escrito (45 días desde hoy)
        ContestDateEntity examDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Examen Escrito")
            .type("written_exam")
            .startDate(today.plusDays(45))
            .endDate(today.plusDays(45))
            .build();
        dates.add(examDate);

        // Fecha de entrevista personal (50 días desde hoy)
        ContestDateEntity interviewDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Entrevista Personal")
            .type("interview")
            .startDate(today.plusDays(50))
            .endDate(today.plusDays(50))
            .build();
        dates.add(interviewDate);

        // Fecha de publicación de resultados (55 días desde hoy)
        ContestDateEntity resultsDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Publicación de Resultados")
            .type("results")
            .startDate(today.plusDays(55))
            .endDate(today.plusDays(55))
            .build();
        dates.add(resultsDate);

        // Asignar las fechas al concurso
        contest.setDates(dates);

        log.info("📅 [ContestDataInitialization] Fechas creadas para concurso: {}", contest.getTitle());
    }

    /**
     * Crea fechas para un concurso con período de inscripción cerrado
     * SECURITY TEST: Para validar la corrección del punto 12 de la auditoría
     */
    private void createClosedInscriptionDates(ContestEntity contest) {
        LocalDate today = LocalDate.now();

        List<ContestDateEntity> dates = new ArrayList<>();

        // Fecha de inscripción CERRADA (período pasado)
        ContestDateEntity inscriptionDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Período de Inscripción (CERRADO)")
            .type("inscription")
            .startDate(today.minusDays(45)) // Comenzó hace 45 días
            .endDate(today.minusDays(15))   // Terminó hace 15 días
            .build();
        dates.add(inscriptionDate);

        // Fecha de evaluación de antecedentes (ya pasó)
        ContestDateEntity evaluationDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Evaluación de Antecedentes (FINALIZADA)")
            .type("evaluation")
            .startDate(today.minusDays(10))
            .endDate(today.minusDays(5))
            .build();
        dates.add(evaluationDate);

        // Fecha de examen escrito (ya pasó)
        ContestDateEntity examDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Examen Escrito (FINALIZADO)")
            .type("written_exam")
            .startDate(today.minusDays(3))
            .endDate(today.minusDays(3))
            .build();
        dates.add(examDate);

        // Fecha de entrevista personal (próximamente)
        ContestDateEntity interviewDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Entrevista Personal (PRÓXIMAMENTE)")
            .type("interview")
            .startDate(today.plusDays(5))
            .endDate(today.plusDays(5))
            .build();
        dates.add(interviewDate);

        // Fecha de publicación de resultados (futuro)
        ContestDateEntity resultsDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Publicación de Resultados (PENDIENTE)")
            .type("results")
            .startDate(today.plusDays(10))
            .endDate(today.plusDays(10))
            .build();
        dates.add(resultsDate);

        // Asignar las fechas al concurso
        contest.setDates(dates);

        log.info("🧪 [ContestDataInitialization] Fechas de prueba (período cerrado) creadas para concurso: {}", contest.getTitle());
    }
}
