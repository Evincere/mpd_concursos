#!/usr/bin/env python3
import re

# Leer el archivo original
with open('./concurso-backend/src/main/java/ar/gov/mpd/concursobackend/contest/domain/model/Contest.java', 'r') as f:
    content = f.read()

# Nueva implementación del método getCurrentStatus()
new_method = '''    /**
     * Calcula el estado actual del concurso basado en fechas
     * REFACTORING: Estados claros sin ambigüedad - CORREGIDO PARA ACTIVE->CLOSED
     *
     * @return Estado actual del concurso
     */
    public ContestStatus getCurrentStatus() {
        LocalDateTime now = LocalDateTime.now();

        // Estados administrativos fijos (no cambian automáticamente)
        if (status == ContestStatus.DRAFT) return ContestStatus.DRAFT;
        if (status == ContestStatus.CANCELLED) return ContestStatus.CANCELLED;
        if (status == ContestStatus.PAUSED) return ContestStatus.PAUSED;
        if (status == ContestStatus.FINISHED) return ContestStatus.FINISHED;
        if (status == ContestStatus.ARCHIVED) return ContestStatus.ARCHIVED;
        if (status == ContestStatus.IN_EVALUATION) return ContestStatus.IN_EVALUATION;
        if (status == ContestStatus.RESULTS_PUBLISHED) return ContestStatus.RESULTS_PUBLISHED;

        // Estados dinámicos (para SCHEDULED y ACTIVE)
        if (status == ContestStatus.SCHEDULED || status == ContestStatus.ACTIVE) {
            // Si hay fechas específicas de inscripción, usarlas PRIORITARIAMENTE
            if (inscriptionStartDate != null && inscriptionEndDate != null) {
                if (now.isBefore(inscriptionStartDate)) {
                    return ContestStatus.SCHEDULED;  // Aún programado
                }
                if (now.isBefore(inscriptionEndDate) || now.isEqual(inscriptionEndDate)) {
                    return ContestStatus.ACTIVE;     // Activo para inscripciones
                }
                // CORRECCIÓN CRÍTICA: Después de fecha límite de inscripción -> CLOSED
                return ContestStatus.CLOSED;
            }

            // Fallback: usar fechas generales del concurso
            if (startDate != null && endDate != null) {
                if (now.isBefore(startDate)) {
                    return ContestStatus.SCHEDULED;
                }
                if (now.isBefore(endDate) || now.isEqual(endDate)) {
                    return ContestStatus.ACTIVE;
                }
                return ContestStatus.CLOSED;
            }
        }

        // Estados legacy - devolver tal como están
        return status;
    }'''

# Buscar el método getCurrentStatus actual y reemplazarlo
pattern = r'(\s*)\/\*\*[\s\S]*?\*\/\s*public ContestStatus getCurrentStatus\(\)[\s\S]*?return status;\s*}'

replacement = new_method

# Reemplazar el método
new_content = re.sub(pattern, replacement, content)

# Verificar que se hizo el reemplazo
if new_content != content:
    # Escribir el archivo modificado
    with open('./concurso-backend/src/main/java/ar/gov/mpd/concursobackend/contest/domain/model/Contest.java', 'w') as f:
        f.write(new_content)
    print("✅ Método getCurrentStatus() corregido exitosamente")
    print("🔧 Cambios aplicados:")
    print("   - Los estados ACTIVE también verifican fecha límite de inscripción")
    print("   - Después de inscription_end_date -> estado automático CLOSED")
else:
    print("❌ No se pudo aplicar el reemplazo - verificar patrón")
