# Script para probar la corrección del Punto 12 - Validación de Período de Inscripción
# Fecha: 2025-07-15

Write-Host "=== PRUEBA DE SEGURIDAD - PUNTO 12 ===" -ForegroundColor Green
Write-Host "Validación de Período de Inscripción" -ForegroundColor Green
Write-Host ""

# Configuración
$baseUrl = "http://localhost:8080"
$apiUrl = "$baseUrl/api"

Write-Host "🔍 Verificando que el backend esté ejecutándose..." -ForegroundColor Yellow

# Verificar que el backend esté corriendo
try {
    $healthCheck = Invoke-RestMethod -Uri "$baseUrl/actuator/health" -Method GET -TimeoutSec 5
    if ($healthCheck.status -eq "UP") {
        Write-Host "✅ Backend está ejecutándose correctamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend no está disponible" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ No se puede conectar al backend. Asegúrate de que esté ejecutándose en $baseUrl" -ForegroundColor Red
    Write-Host "   Ejecuta: mvn spring-boot:run" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Obteniendo lista de concursos..." -ForegroundColor Yellow

# Obtener lista de concursos
try {
    $contests = Invoke-RestMethod -Uri "$apiUrl/contests" -Method GET
    Write-Host "✅ Se encontraron $($contests.Count) concursos" -ForegroundColor Green
    
    # Buscar el concurso de prueba (período cerrado)
    $testContest = $contests | Where-Object { $_.title -like "*PERÍODO CERRADO*" }
    
    if ($testContest) {
        Write-Host "🧪 Concurso de prueba encontrado:" -ForegroundColor Cyan
        Write-Host "   ID: $($testContest.id)" -ForegroundColor White
        Write-Host "   Título: $($testContest.title)" -ForegroundColor White
        Write-Host "   Estado: $($testContest.status)" -ForegroundColor White
        Write-Host ""
        
        # Intentar inscripción (debe fallar)
        Write-Host "🚨 Intentando inscripción en concurso con período cerrado..." -ForegroundColor Yellow
        Write-Host "   (Esto DEBE fallar con error 403 Forbidden)" -ForegroundColor Yellow
        
        # Datos de inscripción de prueba
        $inscriptionData = @{
            contestId = $testContest.id
            userId = "123e4567-e89b-12d3-a456-426614174000"  # UUID de prueba
        } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/inscriptions" -Method POST -Body $inscriptionData -ContentType "application/json"
            Write-Host "❌ ERROR: La inscripción NO fue rechazada. Vulnerabilidad presente!" -ForegroundColor Red
            Write-Host "   Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Red
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            if ($statusCode -eq 403) {
                Write-Host "✅ ÉXITO: Inscripción rechazada correctamente (403 Forbidden)" -ForegroundColor Green
                Write-Host "   La validación de período de inscripción está funcionando" -ForegroundColor Green
            } elseif ($statusCode -eq 401) {
                Write-Host "⚠️  ADVERTENCIA: Error 401 (No autorizado)" -ForegroundColor Yellow
                Write-Host "   Esto puede ser normal si se requiere autenticación" -ForegroundColor Yellow
                Write-Host "   Para una prueba completa, usa un token de autenticación válido" -ForegroundColor Yellow
            } else {
                Write-Host "⚠️  ADVERTENCIA: Error $statusCode (no esperado)" -ForegroundColor Yellow
                Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        
    } else {
        Write-Host "⚠️  No se encontró el concurso de prueba con período cerrado" -ForegroundColor Yellow
        Write-Host "   Asegúrate de que el servicio de inicialización haya creado los datos de prueba" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error al obtener concursos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Resumen de la prueba:" -ForegroundColor Cyan
Write-Host "   - Si ves '✅ ÉXITO: Inscripción rechazada correctamente (403 Forbidden)'" -ForegroundColor White
Write-Host "     entonces la corrección del Punto 12 está funcionando correctamente" -ForegroundColor White
Write-Host "   - Si ves '❌ ERROR: La inscripción NO fue rechazada'" -ForegroundColor White
Write-Host "     entonces hay un problema con la validación de seguridad" -ForegroundColor White
Write-Host ""
Write-Host "=== PRUEBA COMPLETADA ===" -ForegroundColor Green
