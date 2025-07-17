# Script simple para verificar dependencias
# Fecha: 2025-07-15

Write-Host "=== VERIFICACION DE DEPENDENCIAS ===" -ForegroundColor Green
Write-Host ""

# Verificar Maven
Write-Host "Verificando Maven..." -ForegroundColor Yellow
mvn --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "Maven OK" -ForegroundColor Green
} else {
    Write-Host "Maven ERROR" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar compilacion
Write-Host "Verificando compilacion..." -ForegroundColor Yellow
mvn clean compile -q
if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilacion OK" -ForegroundColor Green
} else {
    Write-Host "Compilacion ERROR" -ForegroundColor Red
}

Write-Host ""

# Verificar actualizaciones disponibles
Write-Host "Verificando actualizaciones disponibles..." -ForegroundColor Yellow
mvn versions:display-dependency-updates -q

Write-Host ""
Write-Host "=== VERIFICACION COMPLETADA ===" -ForegroundColor Green
