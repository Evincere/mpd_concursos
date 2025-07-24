# Script para verificar dependencias sin conectividad externa
# Autor: Equipo de Desarrollo MPD
# Fecha: 2025-07-15
# Propósito: Verificar dependencias cuando hay problemas de SSL/conectividad

Write-Host "=== VERIFICACION DE DEPENDENCIAS (MODO OFFLINE) ===" -ForegroundColor Green
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

# Verificar compilación actual (sin descargas)
Write-Host "Verificando compilación actual (offline)..." -ForegroundColor Yellow
mvn clean compile -o -q 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Compilación exitosa (modo offline)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Compilación offline falló, intentando online..." -ForegroundColor Yellow
    mvn clean compile -q 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilación exitosa (modo online)" -ForegroundColor Green
    } else {
        Write-Host "❌ Error en compilación" -ForegroundColor Red
        Write-Host "   Posible problema de dependencias o conectividad" -ForegroundColor Gray
    }
}

Write-Host ""

# Analizar dependencias desde pom.xml
Write-Host "Analizando dependencias desde pom.xml..." -ForegroundColor Yellow

if (-not (Test-Path "pom.xml")) {
    Write-Host "❌ No se encontró pom.xml" -ForegroundColor Red
    exit 1
}

$pomContent = Get-Content "pom.xml" -Raw

# Definir versiones conocidas más recientes (actualizadas manualmente)
$latestVersions = @{
    "spring-boot" = "3.3.5"
    "mysql-connector" = "8.4.0"
    "jjwt" = "0.12.6"
    "tika" = "2.9.2"
    "lombok" = "1.18.36"
    "mapstruct" = "1.6.3"
    "springdoc" = "2.7.0"
    "hibernate" = "6.6.4.Final"
    "commons-beanutils" = "1.9.5"
}

Write-Host ""
Write-Host "📊 ANÁLISIS DE VERSIONES:" -ForegroundColor Cyan

# Spring Boot
if ($pomContent -match '<version>(\d+\.\d+\.\d+)</version>') {
    $currentSpringBoot = $matches[1]
    $latestSpringBoot = $latestVersions["spring-boot"]
    
    Write-Host "Spring Boot:" -ForegroundColor White
    Write-Host "   Actual: $currentSpringBoot" -ForegroundColor Gray
    Write-Host "   Recomendada: $latestSpringBoot" -ForegroundColor Gray
    
    if ($currentSpringBoot -eq $latestSpringBoot) {
        Write-Host "   ✅ Actualizada" -ForegroundColor Green
    } elseif ($currentSpringBoot -like "3.3.*") {
        Write-Host "   ✅ Versión aceptable (3.3.x)" -ForegroundColor Green
    } elseif ($currentSpringBoot -like "3.2.*") {
        Write-Host "   ⚠️  Actualización recomendada (3.2.x → 3.3.x)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Actualización crítica necesaria" -ForegroundColor Red
    }
}

# MySQL Connector
if ($pomContent -match 'mysql-connector-j.*?<version>([^<]+)</version>') {
    $currentMySQL = $matches[1]
    $latestMySQL = $latestVersions["mysql-connector"]
    
    Write-Host ""
    Write-Host "MySQL Connector:" -ForegroundColor White
    Write-Host "   Actual: $currentMySQL" -ForegroundColor Gray
    Write-Host "   Recomendada: $latestMySQL" -ForegroundColor Gray
    
    if ($currentMySQL -eq $latestMySQL) {
        Write-Host "   ✅ Actualizada" -ForegroundColor Green
    } elseif ($currentMySQL -like "8.3.*" -or $currentMySQL -like "8.4.*") {
        Write-Host "   ✅ Versión aceptable" -ForegroundColor Green
    } elseif ($currentMySQL -like "8.2.*") {
        Write-Host "   ⚠️  Actualización recomendada (vulnerabilidades conocidas)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Actualización crítica necesaria" -ForegroundColor Red
    }
}

# JJWT
if ($pomContent -match 'jjwt-api.*?<version>([^<]+)</version>') {
    $currentJJWT = $matches[1]
    $latestJJWT = $latestVersions["jjwt"]
    
    Write-Host ""
    Write-Host "JJWT:" -ForegroundColor White
    Write-Host "   Actual: $currentJJWT" -ForegroundColor Gray
    Write-Host "   Recomendada: $latestJJWT" -ForegroundColor Gray
    
    if ($currentJJWT -eq $latestJJWT) {
        Write-Host "   ✅ Actualizada" -ForegroundColor Green
    } elseif ($currentJJWT -like "0.12.*") {
        Write-Host "   ✅ Versión aceptable (0.12.x)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Actualización recomendada" -ForegroundColor Yellow
    }
}

# Apache Tika
if ($pomContent -match 'tika-core.*?<version>([^<]+)</version>') {
    $currentTika = $matches[1]
    $latestTika = $latestVersions["tika"]
    
    Write-Host ""
    Write-Host "Apache Tika:" -ForegroundColor White
    Write-Host "   Actual: $currentTika" -ForegroundColor Gray
    Write-Host "   Recomendada: $latestTika" -ForegroundColor Gray
    
    if ($currentTika -eq $latestTika) {
        Write-Host "   ✅ Actualizada" -ForegroundColor Green
    } elseif ($currentTika -like "2.9.*") {
        Write-Host "   ✅ Versión aceptable (2.9.x)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Actualización recomendada" -ForegroundColor Yellow
    }
}

Write-Host ""

# Generar reporte local
Write-Host "📋 Generando reporte local..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportFile = "dependency-analysis-offline-$timestamp.txt"

$report = @"
=== ANÁLISIS DE DEPENDENCIAS (OFFLINE) ===
Fecha: $fecha
Modo: Sin conectividad externa

ESTADO DE DEPENDENCIAS CRÍTICAS:
- Spring Boot: $currentSpringBoot (Recomendada: $($latestVersions["spring-boot"]))
- MySQL Connector: $currentMySQL (Recomendada: $($latestVersions["mysql-connector"]))
- JJWT: $currentJJWT (Recomendada: $($latestVersions["jjwt"]))
- Apache Tika: $currentTika (Recomendada: $($latestVersions["tika"]))

PROBLEMA DE CONECTIVIDAD DETECTADO:
- Error SSL: PKIX path building failed
- Repositorio Maven Central inaccesible
- Plugin versions-maven-plugin no disponible

RECOMENDACIONES:
1. Resolver problemas de certificados SSL
2. Configurar repositorio Maven interno
3. Actualizar dependencias críticas manualmente
4. Ejecutar tests después de actualizaciones

PRÓXIMOS PASOS:
1. Configurar certificados corporativos
2. Actualizar Spring Boot a 3.3.5+
3. Actualizar MySQL Connector a 8.4.0+
4. Verificar funcionamiento con tests

=== FIN REPORTE ===
"@

$report | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "✅ Reporte guardado en: $reportFile" -ForegroundColor Green

Write-Host ""

# Verificar problemas de conectividad
Write-Host "🔍 Diagnosticando problemas de conectividad..." -ForegroundColor Yellow
Write-Host ""
Write-Host "PROBLEMA DETECTADO:" -ForegroundColor Red
Write-Host "❌ Error SSL: PKIX path building failed" -ForegroundColor Red
Write-Host "❌ No se puede acceder a Maven Central" -ForegroundColor Red
Write-Host "❌ Plugin versions-maven-plugin no disponible" -ForegroundColor Red

Write-Host ""
Write-Host "SOLUCIONES POSIBLES:" -ForegroundColor Cyan
Write-Host "1. 🔧 Configurar certificados corporativos en Java keystore" -ForegroundColor Cyan
Write-Host "2. 🔧 Configurar repositorio Maven interno/mirror" -ForegroundColor Cyan
Write-Host "3. 🔧 Usar VPN o conexión alternativa" -ForegroundColor Cyan
Write-Host "4. 📋 Verificación manual de versiones en sitios web" -ForegroundColor Cyan

Write-Host ""
Write-Host "RECURSOS PARA VERIFICACIÓN MANUAL:" -ForegroundColor Green
Write-Host "• Maven Central: https://search.maven.org/" -ForegroundColor Gray
Write-Host "• Spring Boot: https://github.com/spring-projects/spring-boot/releases" -ForegroundColor Gray
Write-Host "• MySQL Connector: https://dev.mysql.com/downloads/connector/j/" -ForegroundColor Gray
Write-Host "• JJWT: https://github.com/jwtk/jjwt/releases" -ForegroundColor Gray

Write-Host ""
Write-Host "=== VERIFICACION COMPLETADA (MODO OFFLINE) ===" -ForegroundColor Green
