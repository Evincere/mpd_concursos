package ar.gov.mpd.concursobackend.contest.infrastructure.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

/**
 * Controlador para manejar documentos de concursos
 */
@RestController
@RequestMapping("/api/contest-documents")
public class ContestDocumentController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Endpoint para inicializar los datos de documentos de concursos
     * Solo para uso administrativo durante el setup inicial
     */
    @PostMapping("/initialize")
    public ResponseEntity<String> initializeContestDocuments() {
        try {
            // Verificar si ya existen datos
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM contest_documents", 
                Integer.class
            );
            
            if (count != null && count > 0) {
                return ResponseEntity.ok("Los documentos de concursos ya están inicializados. Total: " + count);
            }

            // Insertar datos de documentos de concursos
            String sql = """
                INSERT INTO contest_documents (id, contest_id, name, description, file_url, file_name, file_type, file_size, required, public, uploaded_by, uploaded_at)
                VALUES
                (UNHEX(REPLACE(UUID(), '-', '')), 1, 'Bases del Concurso', 'Bases oficiales del concurso para Defensor/a Penal', '/api/files/contest-bases/contest_1_bases.pdf', 'contest_1_bases.pdf', 'application/pdf', 1024000, TRUE, TRUE, UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440000', '-', '')), NOW()),
                (UNHEX(REPLACE(UUID(), '-', '')), 1, 'Descripción del Cargo', 'Descripción detallada del cargo y funciones', '/api/files/contest-bases/contest_1_description.pdf', 'contest_1_description.pdf', 'application/pdf', 512000, TRUE, TRUE, UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440000', '-', '')), NOW()),
                (UNHEX(REPLACE(UUID(), '-', '')), 2, 'Bases del Concurso', 'Bases oficiales del concurso para Defensor/a Civil', '/api/files/contest-bases/contest_2_bases.pdf', 'contest_2_bases.pdf', 'application/pdf', 1024000, TRUE, TRUE, UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440000', '-', '')), NOW()),
                (UNHEX(REPLACE(UUID(), '-', '')), 2, 'Descripción del Cargo', 'Descripción detallada del cargo y funciones', '/api/files/contest-bases/contest_2_description.pdf', 'contest_2_description.pdf', 'application/pdf', 512000, TRUE, TRUE, UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440000', '-', '')), NOW()),
                (UNHEX(REPLACE(UUID(), '-', '')), 3, 'Bases del Concurso', 'Bases oficiales del concurso para Asesor/a Legal', '/api/files/contest-bases/contest_3_bases.pdf', 'contest_3_bases.pdf', 'application/pdf', 1024000, TRUE, TRUE, UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440000', '-', '')), NOW()),
                (UNHEX(REPLACE(UUID(), '-', '')), 3, 'Descripción del Cargo', 'Descripción detallada del cargo y funciones', '/api/files/contest-bases/contest_3_description.pdf', 'contest_3_description.pdf', 'application/pdf', 512000, TRUE, TRUE, UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440000', '-', '')), NOW()),
                (UNHEX(REPLACE(UUID(), '-', '')), 4, 'Bases del Concurso', 'Bases oficiales del concurso para Analista Programador/a', '/api/files/contest-bases/contest_4_bases.pdf', 'contest_4_bases.pdf', 'application/pdf', 1024000, TRUE, TRUE, UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440000', '-', '')), NOW()),
                (UNHEX(REPLACE(UUID(), '-', '')), 4, 'Descripción del Cargo', 'Descripción detallada del cargo y funciones', '/api/files/contest-bases/contest_4_description.pdf', 'contest_4_description.pdf', 'application/pdf', 512000, TRUE, TRUE, UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440000', '-', '')), NOW()),
                (UNHEX(REPLACE(UUID(), '-', '')), 5, 'Bases del Concurso', 'Bases oficiales del concurso para Defensor/a de Familia', '/api/files/contest-bases/contest_5_bases.pdf', 'contest_5_bases.pdf', 'application/pdf', 1024000, TRUE, TRUE, UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440000', '-', '')), NOW()),
                (UNHEX(REPLACE(UUID(), '-', '')), 5, 'Descripción del Cargo', 'Descripción detallada del cargo y funciones', '/api/files/contest-bases/contest_5_description.pdf', 'contest_5_description.pdf', 'application/pdf', 512000, TRUE, TRUE, UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440000', '-', '')), NOW())
                """;

            int rowsAffected = jdbcTemplate.update(sql);
            
            return ResponseEntity.ok("Documentos de concursos inicializados correctamente. Filas insertadas: " + rowsAffected);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error al inicializar documentos de concursos: " + e.getMessage());
        }
    }

    /**
     * Endpoint para obtener el estado de los documentos de concursos
     */
    @GetMapping("/status")
    public ResponseEntity<String> getStatus() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM contest_documents", 
                Integer.class
            );
            
            return ResponseEntity.ok("Total de documentos de concursos: " + (count != null ? count : 0));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error al obtener estado: " + e.getMessage());
        }
    }
}
