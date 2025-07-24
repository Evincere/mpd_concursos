# Script simplificado para verificar dependencias
# Autor: Equipo de Desarrollo MPD
# Fecha: 2025-07-15

Write-Host "=== VERIFICACION DE DEPENDENCIAS ===" -ForegroundColor Green
$fecha = Get-Date
Write-Host "Fecha: $fecha" -ForegroundColor Gray
Write-Host ""

# Verificar que Maven está disponible
Write-Host "Verificando Maven..." -ForegroundColor Yellow
$mavenCheck = mvn --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Maven disponible" -ForegroundColor Green
} else {
    Write-Host "❌ Maven no disponible" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar compilación actual
Write-Host "Verificando compilación actual..." -ForegroundColor Yellow
mvn clean compile -q
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Compilación exitosa" -ForegroundColor Green
} else {
    Write-Host "❌ Error en compilación" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar dependencias desactualizadas
Write-Host "Verificando dependencias desactualizadas..." -ForegroundColor Yellow
mvn versions:display-dependency-updates -q
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Verificación completada" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se pudo verificar actualizaciones" -ForegroundColor Yellow
}

Write-Host ""

# Leer versiones del pom.xml
Write-Host "Verificando versiones críticas..." -ForegroundColor Yellow
$pomContent = Get-Content "pom.xml" -Raw

# Spring Boot
if ($pomContent -match '<version>(\d+\.\d+\.\d+)</version>') {
    $springBootVersion = $matches[1]
    Write-Host "   Spring Boot: $springBootVersion" -ForegroundColor Gray
    
    if ($springBootVersion -like "3.2.*") {
        Write-Host "   ⚠️  Considerar actualizar a 3.3.x" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Versión aceptable" -ForegroundColor Green
    }
}

# MySQL Connector
if ($pomContent -match 'mysql-connector-j.*?<version>([^<]+)</version>') {
    $mysqlVersion = $matches[1]
    Write-Host "   MySQL Connector: $mysqlVersion" -ForegroundColor Gray
    
    if ($mysqlVersion -like "8.2.*") {
        Write-Host "   ⚠️  Considerar actualizar a 8.4.x" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Versión aceptable" -ForegroundColor Green
    }
}

Write-Host ""

# Generar reporte
Write-Host "Generando reporte..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportFile = "dependency-report-$timestamp.txt"
mvn dependency:tree -q > $reportFile 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Reporte guardado en: $reportFile" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se pudo generar reporte" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "RECOMENDACIONES:" -ForegroundColor Green
Write-Host "1. Revisar DEPENDENCY_UPDATES.md" -ForegroundColor Cyan
Write-Host "2. Ejecutar este script mensualmente" -ForegroundColor Cyan
Write-Host "3. Actualizar dependencias críticas" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== VERIFICACION COMPLETADA ===" -ForegroundColor Green
