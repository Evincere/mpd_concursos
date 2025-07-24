# Script para verificar el estado de las dependencias
# Autor: Equipo de Desarrollo MPD
# Fecha: 2025-07-15

Write-Host "=== VERIFICACIÓN DE DEPENDENCIAS ===" -ForegroundColor Green
Write-Host "Fecha: $((Get-Date).ToString())" -ForegroundColor Gray
Write-Host ""

# Verificar que Maven está disponible
try {
    $mavenVersion = mvn --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Maven disponible" -ForegroundColor Green
        Write-Host "   $($mavenVersion[0])" -ForegroundColor Gray
    } else {
        Write-Host "❌ Maven no disponible" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error verificando Maven: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar compilación actual
Write-Host "🔍 Verificando compilación actual..." -ForegroundColor Yellow
try {
    $compileResult = mvn clean compile -q 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilación exitosa con dependencias actuales" -ForegroundColor Green
    } else {
        Write-Host "❌ Error en compilación actual:" -ForegroundColor Red
        Write-Host $compileResult -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error ejecutando compilación: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar dependencias desactualizadas
Write-Host "🔍 Verificando dependencias desactualizadas..." -ForegroundColor Yellow
try {
    Write-Host "   Ejecutando: mvn versions:display-dependency-updates" -ForegroundColor Gray
    $dependencyUpdates = mvn versions:display-dependency-updates 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Verificación de dependencias completada" -ForegroundColor Green
        
        # Buscar dependencias desactualizadas en la salida
        $outdatedFound = $false
        foreach ($line in $dependencyUpdates) {
            if ($line -match "->") {
                if (-not $outdatedFound) {
                    Write-Host ""
                    Write-Host "⚠️  Dependencias desactualizadas encontradas:" -ForegroundColor Yellow
                    $outdatedFound = $true
                }
                Write-Host "   $line" -ForegroundColor Yellow
            }
        }
        
        if (-not $outdatedFound) {
            Write-Host "✅ Todas las dependencias están actualizadas" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  No se pudo verificar actualizaciones (posible problema de conectividad)" -ForegroundColor Yellow
        Write-Host "   Esto es normal si no hay conexión a internet" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Error verificando actualizaciones: $_" -ForegroundColor Yellow
    Write-Host "   Continuando con verificaciones locales..." -ForegroundColor Gray
}

Write-Host ""

# Verificar versiones específicas críticas
Write-Host "🔍 Verificando versiones críticas..." -ForegroundColor Yellow

# Leer pom.xml y extraer versiones
$pomContent = Get-Content "pom.xml" -Raw

# Spring Boot
if ($pomContent -match '<version>(\d+\.\d+\.\d+)</version>') {
    $springBootVersion = $matches[1]
    Write-Host "   Spring Boot: $springBootVersion" -ForegroundColor Gray
    
    # Verificar si es una versión conocida como desactualizada
    $majorMinor = $springBootVersion.Substring(0, $springBootVersion.LastIndexOf('.'))
    if ($majorMinor -eq "3.2") {
        Write-Host "   ⚠️  Spring Boot 3.2.x - Considerar actualizar a 3.3.x" -ForegroundColor Yellow
    } elseif ($majorMinor -eq "3.3") {
        Write-Host "   ✅ Spring Boot 3.3.x - Versión recomendada" -ForegroundColor Green
    }
}

# MySQL Connector
if ($pomContent -match 'mysql-connector-j.*?<version>([^<]+)</version>') {
    $mysqlVersion = $matches[1]
    Write-Host "   MySQL Connector: $mysqlVersion" -ForegroundColor Gray
    
    if ($mysqlVersion -lt "8.3.0") {
        Write-Host "   ⚠️  MySQL Connector < 8.3.0 - Considerar actualizar" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ MySQL Connector actualizado" -ForegroundColor Green
    }
}

# JJWT
if ($pomContent -match 'jjwt-api.*?<version>([^<]+)</version>') {
    $jjwtVersion = $matches[1]
    Write-Host "   JJWT: $jjwtVersion" -ForegroundColor Gray
    
    if ($jjwtVersion -lt "0.12.6") {
        Write-Host "   ⚠️  JJWT < 0.12.6 - Considerar actualizar para parches de seguridad" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ JJWT actualizado" -ForegroundColor Green
    }
}

Write-Host ""

# Generar reporte de dependencias
Write-Host "📊 Generando reporte de dependencias..." -ForegroundColor Yellow
try {
    $treeOutput = mvn dependency:tree -q 2>&1
    if ($LASTEXITCODE -eq 0) {
        $reportFile = "dependency-report-$((Get-Date).ToString('yyyyMMdd-HHmmss')).txt"
        $treeOutput | Out-File -FilePath $reportFile -Encoding UTF8
        Write-Host "✅ Reporte guardado en: $reportFile" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No se pudo generar reporte de dependencias" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Error generando reporte: $_" -ForegroundColor Yellow
}

Write-Host ""

# Verificar vulnerabilidades conocidas (si OWASP Dependency Check está disponible)
Write-Host "🔒 Verificando vulnerabilidades conocidas..." -ForegroundColor Yellow
Write-Host "ℹ️  OWASP Dependency Check no configurado (opcional)" -ForegroundColor Cyan
Write-Host "   Para habilitar, agregar plugin al pom.xml" -ForegroundColor Gray
}

Write-Host ""

# Resumen y recomendaciones
Write-Host "📋 RESUMEN Y RECOMENDACIONES:" -ForegroundColor Green
Write-Host ""
Write-Host "1. 📖 Revisar DEPENDENCY_UPDATES.md para plan detallado" -ForegroundColor Cyan
Write-Host "2. 🔄 Ejecutar este script mensualmente" -ForegroundColor Cyan
Write-Host "3. 🚀 Actualizar dependencias críticas según prioridad" -ForegroundColor Cyan
Write-Host "4. 🧪 Probar exhaustivamente después de actualizaciones" -ForegroundColor Cyan
Write-Host "5. 📊 Monitorear alertas de seguridad" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== VERIFICACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host "Fecha: $((Get-Date).ToString())" -ForegroundColor Gray
