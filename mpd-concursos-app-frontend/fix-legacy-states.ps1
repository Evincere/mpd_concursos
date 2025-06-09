# Script para corregir referencias a estados legacy en el frontend
# REFACTORING PHASE 3: Eliminar estados legacy completamente

Write-Host "🔧 Iniciando corrección de estados legacy..." -ForegroundColor Yellow

# Función para reemplazar texto en archivos
function Replace-InFile {
    param(
        [string]$FilePath,
        [string]$OldText,
        [string]$NewText
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match [regex]::Escape($OldText)) {
            $content = $content -replace [regex]::Escape($OldText), $NewText
            Set-Content $FilePath $content -NoNewline
            Write-Host "✅ Corregido: $FilePath" -ForegroundColor Green
        }
    }
}

# Correcciones en DashboardService
Replace-InFile "src/app/core/services/dashboard/dashboard.service.ts" `
    "InscripcionState.IN_PROCESS.toUpperCase()" `
    "InscripcionState.ACTIVE.toUpperCase()"

# Correcciones en ConcursoInscripcionesComponent
Replace-InFile "src/app/features/admin/components/concursos/components/concurso-inscripciones/concurso-inscripciones.component.html" `
    "InscripcionState.PENDIENTE" `
    "InscripcionState.PENDING"

Replace-InFile "src/app/features/admin/components/concursos/components/concurso-inscripciones/concurso-inscripciones.component.html" `
    "InscripcionState.INSCRIPTO" `
    "InscripcionState.APPROVED"

Replace-InFile "src/app/features/admin/components/concursos/components/concurso-inscripciones/concurso-inscripciones.component.ts" `
    "{ value: InscripcionState.NO_INSCRIPTO, label: 'No inscripto' }," `
    ""

Replace-InFile "src/app/features/admin/components/concursos/components/concurso-inscripciones/concurso-inscripciones.component.ts" `
    "{ value: InscripcionState.IN_PROCESS, label: 'En proceso' }," `
    "{ value: InscripcionState.ACTIVE, label: 'Activa' },"

Replace-InFile "src/app/features/admin/components/concursos/components/concurso-inscripciones/concurso-inscripciones.component.ts" `
    "{ value: InscripcionState.PENDIENTE, label: 'Pendiente' }," `
    "{ value: InscripcionState.PENDING, label: 'Pendiente' },"

Replace-InFile "src/app/features/admin/components/concursos/components/concurso-inscripciones/concurso-inscripciones.component.ts" `
    "{ value: InscripcionState.INSCRIPTO, label: 'Inscripto' }," `
    "{ value: InscripcionState.APPROVED, label: 'Aprobada' },"

Replace-InFile "src/app/features/admin/components/concursos/components/concurso-inscripciones/concurso-inscripciones.component.ts" `
    "case 'INSCRIPTO': return 'state-approved';" `
    "case 'APPROVED': return 'state-approved';"

Replace-InFile "src/app/features/admin/components/concursos/components/concurso-inscripciones/concurso-inscripciones.component.ts" `
    "case 'PENDIENTE': return 'state-pending';" `
    "case 'PENDING': return 'state-pending';"

Replace-InFile "src/app/features/admin/components/concursos/components/concurso-inscripciones/concurso-inscripciones.component.ts" `
    "case 'IN_PROCESS': return 'state-in-process';" `
    "case 'ACTIVE': return 'state-in-process';"

# Correcciones en ConcursoDetalleComponent
Replace-InFile "src/app/features/concursos/components/concurso-detalle/concurso-detalle.component.html" `
    "InscripcionState.CONFIRMADA" `
    "InscripcionState.PENDING"

Replace-InFile "src/app/features/concursos/components/concurso-detalle/concurso-detalle.component.ts" `
    "InscripcionState.NO_INSCRIPTO" `
    "InscripcionState.ACTIVE"

# Correcciones en ConcursoCardComponent
Replace-InFile "src/app/features/concursos/components/concurso-card/concurso-card.component.ts" `
    "InscripcionState.NO_INSCRIPTO" `
    "InscripcionState.ACTIVE"

Write-Host "🎉 Corrección de estados legacy completada!" -ForegroundColor Green
