# Script para ejecutar backend Spring Boot con configuración local de documentos
# Mantiene configuración de producción intacta pero permite desarrollo local

Write-Host "========================================" -ForegroundColor Green
Write-Host "   INICIANDO BACKEND MPD - DESARROLLO" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Configurar variables de entorno para desarrollo local
$env:DOCUMENTS_BASE_PATH = "B:/concursos_situacion_post_gracia/descarga_administracion_20250814_191745"
$env:SPRING_PROFILES_ACTIVE = "local"

Write-Host "Variables configuradas:" -ForegroundColor Yellow
Write-Host "- DOCUMENTS_BASE_PATH: $env:DOCUMENTS_BASE_PATH" -ForegroundColor Cyan
Write-Host "- SPRING_PROFILES_ACTIVE: $env:SPRING_PROFILES_ACTIVE" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verificando path de documentos..." -ForegroundColor Yellow
$documentsPath = "$env:DOCUMENTS_BASE_PATH/documentos"
if (Test-Path $documentsPath) {
    Write-Host "✅ Path de documentos encontrado: $documentsPath" -ForegroundColor Green
    $fileCount = (Get-ChildItem -Path $documentsPath -Directory).Count
    Write-Host "✅ Directorios de usuarios encontrados: $fileCount" -ForegroundColor Green
} else {
    Write-Host "❌ Path de documentos NO encontrado: $documentsPath" -ForegroundColor Red
    Write-Host "   Por favor verifica que la carpeta existe" -ForegroundColor Red
}
Write-Host ""

Write-Host "Arrancando backend Spring Boot..." -ForegroundColor Yellow
Write-Host "Puerto: 8080" -ForegroundColor Cyan
Write-Host "Perfil: local" -ForegroundColor Cyan
Write-Host "Documentos: $documentsPath" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del backend y ejecutar
Set-Location -Path "concurso-backend"

try {
    # Ejecutar Maven Spring Boot
    mvn spring-boot:run
} catch {
    Write-Host "❌ Error al ejecutar el backend: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Volver al directorio original
    Set-Location -Path ".."
    Write-Host ""
    Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
