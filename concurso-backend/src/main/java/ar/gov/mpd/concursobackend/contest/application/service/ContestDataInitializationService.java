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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio para inicialización automática del concurso oficial de producción
 * Se ejecuta al inicio de la aplicación para crear el concurso oficial según las bases
 * del documento "CONCURSO DE ANTECEDENTES Y OPOSICIÓN PARA CUBRIR CARGOS DE MULTIFUERO"
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
        log.info("🚀 [ContestDataInitialization] Iniciando verificación del concurso oficial");

        try {
            initializeOfficialContest();
            log.info("✅ [ContestDataInitialization] Inicialización del concurso oficial completada exitosamente");
        } catch (Exception e) {
            log.error("❌ [ContestDataInitialization] Error durante la inicialización del concurso oficial", e);
            // No lanzamos la excepción para no impedir el inicio de la aplicación
        }
    }

    /**
     * Inicializa el concurso oficial, recreándolo siempre para asegurar datos actualizados
     */
    private void initializeOfficialContest() {
        List<ContestEntity> existingContests = contestRepository.findAll();

        if (!existingContests.isEmpty()) {
            log.warn("⚠️ [ContestDataInitialization] Eliminando {} concursos existentes para recrear con datos actualizados...", existingContests.size());
            contestRepository.deleteAll();
        }

        log.info("📝 [ContestDataInitialization] Creando concurso oficial con datos actualizados...");
        createOfficialContest();
    }

    /**
     * Crea el concurso oficial basado en las bases del documento oficial
     * "CONCURSO DE ANTECEDENTES Y OPOSICIÓN PARA CUBRIR CARGOS DE MULTIFUERO"
     */
    private void createOfficialContest() {
        log.info("📝 [ContestDataInitialization] Creando concurso oficial...");

        // Fechas específicas del concurso oficial
        LocalDate inscriptionStartDate = LocalDate.of(2025, 7, 30); // 30/07/2025
        LocalDate inscriptionEndDate = LocalDate.of(2025, 8, 8);    // 8/8/2025

        // Crear el concurso oficial
        ContestEntity officialContest = createOfficialContestEntity(
            "MULTIFUERO",
            "FUNCIONARIOS Y PERSONAL JERÁRQUICO",
            "03",
            "Co-Defensor en lo Penal, Penal Juvenil y en lo Civil y Co-Asesor de Niños, Niñas, Adolescentes y Personas con Capacidad Restringida a desempeñarse en la 1ra o 2da, o 3ra o 4ta Circunscripcion Judicial",
            "MULTIFUERO",
            "Co-Defensor/Co-Asesor Multifuero - Clase 03",
            inscriptionStartDate,
            inscriptionEndDate,
            "/api/files/contest-bases/bases_concurso_1.pdf",
            "/api/files/contest-descriptions/descripcion_concurso_1.pdf"
        );

        // Guardar concurso oficial
        try {
            ContestEntity savedContest = contestRepository.save(officialContest);
            log.info("✅ [ContestDataInitialization] Concurso oficial creado: {} (ID: {})",
                savedContest.getTitle(), savedContest.getId());

            // Crear fechas importantes para el concurso oficial
            createOfficialContestDates(savedContest);

        } catch (Exception e) {
            log.error("❌ [ContestDataInitialization] Error creando concurso oficial", e);
        }

        log.info("📊 [ContestDataInitialization] Creación del concurso oficial completada");
    }

    /**
     * Crea el concurso oficial con los datos especificados
     */
    private ContestEntity createOfficialContestEntity(String title, String category, String class_,
                                                     String functions, String department, String position,
                                                     LocalDate startDate, LocalDate endDate,
                                                     String basesUrl, String descriptionUrl) {
        // Configurar fechas de inscripción: desde las 00:00 del día de inicio hasta las 23:59 del día final
        LocalDateTime inscriptionStart = startDate.atStartOfDay(); // 00:00:00 del día de inicio
        LocalDateTime inscriptionEnd = endDate.atTime(23, 59, 59); // 23:59:59 del día final

        return ContestEntity.builder()
            .title(title)
            .category(category)
            .class_(class_)
            .functions(functions)
            .status(ContestStatus.ACTIVE) // Estado ACTIVO para permitir inscripciones
            .department(department)
            .position(position)
            .startDate(startDate)
            .endDate(endDate)
            .inscriptionStartDate(inscriptionStart) // Fecha específica de inicio de inscripciones
            .inscriptionEndDate(inscriptionEnd)     // Fecha específica de fin de inscripciones
            .basesUrl(basesUrl)
            .descriptionUrl(descriptionUrl)
            .dates(new ArrayList<>()) // Se inicializa vacía, se llenan después
            .build();
    }

    /**
     * Crea fechas importantes para el concurso oficial
     */
    private void createOfficialContestDates(ContestEntity contest) {
        List<ContestDateEntity> dates = new ArrayList<>();

        // Fechas específicas del concurso oficial
        LocalDate inscriptionStart = LocalDate.of(2025, 7, 30); // 30/07/2025
        LocalDate inscriptionEnd = LocalDate.of(2025, 8, 8);    // 8/8/2025

        // Fecha de inscripción (30/07/2025 - 8/8/2025)
        ContestDateEntity inscriptionDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Período de Inscripción")
            .type("inscription")
            .startDate(inscriptionStart)
            .endDate(inscriptionEnd)
            .build();
        dates.add(inscriptionDate);

        // Fecha de evaluación de antecedentes (A definir)
        ContestDateEntity evaluationDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Evaluación de Antecedentes - A definir")
            .type("evaluation")
            .startDate(inscriptionEnd.plusDays(1))  // Fecha temporal
            .endDate(inscriptionEnd.plusDays(1))    // Fecha temporal
            .build();
        dates.add(evaluationDate);

        // Fecha de examen escrito (A definir)
        ContestDateEntity examDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Examen Escrito - A definir")
            .type("written_exam")
            .startDate(inscriptionEnd.plusDays(1)) // Fecha temporal
            .endDate(inscriptionEnd.plusDays(1))   // Fecha temporal
            .build();
        dates.add(examDate);

        // Fecha de entrevista personal (A definir)
        ContestDateEntity interviewDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Entrevista Personal - A definir")
            .type("interview")
            .startDate(inscriptionEnd.plusDays(1)) // Fecha temporal
            .endDate(inscriptionEnd.plusDays(1))   // Fecha temporal
            .build();
        dates.add(interviewDate);

        // Fecha de publicación de resultados (A definir)
        ContestDateEntity resultsDate = ContestDateEntity.builder()
            .contest(contest)
            .label("Publicación de Resultados - A definir")
            .type("results")
            .startDate(inscriptionEnd.plusDays(1)) // Fecha temporal
            .endDate(inscriptionEnd.plusDays(1))   // Fecha temporal
            .build();
        dates.add(resultsDate);

        // Asignar las fechas al concurso
        contest.setDates(dates);

        log.info("📅 [ContestDataInitialization] Fechas oficiales creadas para concurso: {}", contest.getTitle());
    }

}
