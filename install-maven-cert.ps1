# Script para instalar certificado SSL de Maven Central
# Autor: Equipo de Desarrollo MPD
# Fecha: 2025-07-15
# Requisitos: Ejecutar como Administrador

param(
    [string]$CertFile = "repo.maven.apache.org.crt",
    [string]$Alias = "maven-central"
)

Write-Host "=== INSTALACIÓN DE CERTIFICADO SSL PARA MAVEN ===" -ForegroundColor Green
Write-Host "Fecha: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "⚠️  ADVERTENCIA: No se está ejecutando como Administrador" -ForegroundColor Yellow
    Write-Host "   Puede ser necesario para modificar el keystore de Java" -ForegroundColor Gray
    Write-Host ""
}

# Verificar que existe el archivo de certificado
if (-not (Test-Path $CertFile)) {
    Write-Host "❌ No se encontró el archivo de certificado: $CertFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "PASOS PARA OBTENER EL CERTIFICADO:" -ForegroundColor Yellow
    Write-Host "1. Abrir navegador y navegar a: https://repo.maven.apache.org" -ForegroundColor Gray
    Write-Host "2. Clic en el candado de seguridad" -ForegroundColor Gray
    Write-Host "3. Exportar certificado como Base64 X.509" -ForegroundColor Gray
    Write-Host "4. Guardar como: $CertFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "O ejecutar: powershell -File get-maven-cert.ps1" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Archivo de certificado encontrado: $CertFile" -ForegroundColor Green

# Detectar JAVA_HOME
$javaHome = $env:JAVA_HOME
if (-not $javaHome) {
    Write-Host "⚠️  JAVA_HOME no está definido, intentando detectar..." -ForegroundColor Yellow
    
    # Intentar encontrar Java
    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if ($javaCmd) {
        $javaPath = $javaCmd.Source
        $javaHome = Split-Path (Split-Path $javaPath -Parent) -Parent
        Write-Host "   Java detectado en: $javaHome" -ForegroundColor Gray
    } else {
        Write-Host "❌ No se pudo detectar Java. Instalar Java y configurar JAVA_HOME" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Java Home: $javaHome" -ForegroundColor Green

# Construir ruta al keystore
$keystorePath = Join-Path $javaHome "lib\security\cacerts"
if (-not (Test-Path $keystorePath)) {
    Write-Host "❌ No se encontró el keystore en: $keystorePath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Keystore encontrado: $keystorePath" -ForegroundColor Green

# Verificar que keytool está disponible
$keytoolPath = Join-Path $javaHome "bin\keytool.exe"
if (-not (Test-Path $keytoolPath)) {
    Write-Host "❌ No se encontró keytool en: $keytoolPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Keytool encontrado: $keytoolPath" -ForegroundColor Green
Write-Host ""

# Verificar si el certificado ya existe
Write-Host "🔍 Verificando si el certificado ya existe..." -ForegroundColor Yellow
$checkResult = & $keytoolPath -list -alias $Alias -keystore $keystorePath -storepass changeit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  El certificado '$Alias' ya existe en el keystore" -ForegroundColor Yellow
    $response = Read-Host "¿Desea reemplazarlo? (s/N)"
    if ($response -eq 's' -or $response -eq 'S') {
        Write-Host "🗑️  Eliminando certificado existente..." -ForegroundColor Yellow
        & $keytoolPath -delete -alias $Alias -keystore $keystorePath -storepass changeit
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error eliminando certificado existente" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Certificado existente eliminado" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Operación cancelada por el usuario" -ForegroundColor Cyan
        exit 0
    }
}

# Instalar el certificado
Write-Host "📥 Instalando certificado en el keystore..." -ForegroundColor Yellow
$installResult = & $keytoolPath -import -alias $Alias -file $CertFile -keystore $keystorePath -storepass changeit -noprompt 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Certificado instalado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error instalando certificado:" -ForegroundColor Red
    Write-Host $installResult -ForegroundColor Red
    exit 1
}

# Verificar la instalación
Write-Host ""
Write-Host "🔍 Verificando instalación..." -ForegroundColor Yellow
$verifyResult = & $keytoolPath -list -alias $Alias -keystore $keystorePath -storepass changeit 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Certificado verificado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "INFORMACIÓN DEL CERTIFICADO:" -ForegroundColor Cyan
    Write-Host $verifyResult -ForegroundColor Gray
} else {
    Write-Host "❌ Error verificando certificado" -ForegroundColor Red
    Write-Host $verifyResult -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧪 Probando conectividad Maven..." -ForegroundColor Yellow

# Cambiar al directorio del backend
$backendPath = "concurso-backend"
if (Test-Path $backendPath) {
    Push-Location $backendPath
    
    # Probar Maven
    Write-Host "   Ejecutando: mvn help:effective-settings" -ForegroundColor Gray
    $mavenTest = mvn help:effective-settings -q 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Maven funciona correctamente" -ForegroundColor Green
        
        # Probar plugin versions
        Write-Host "   Probando plugin versions..." -ForegroundColor Gray
        $versionsTest = mvn versions:display-dependency-updates -q 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Plugin versions funciona correctamente" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Plugin versions aún tiene problemas" -ForegroundColor Yellow
            Write-Host "   Puede necesitar tiempo para que los cambios surtan efecto" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  Maven aún tiene problemas de conectividad" -ForegroundColor Yellow
        Write-Host "   Puede necesitar reiniciar la terminal o IDE" -ForegroundColor Gray
    }
    
    Pop-Location
} else {
    Write-Host "⚠️  No se encontró directorio concurso-backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Green
Write-Host "1. 🔄 Reiniciar IntelliJ IDEA o IDE" -ForegroundColor Cyan
Write-Host "2. 🔄 Reiniciar terminal/PowerShell" -ForegroundColor Cyan
Write-Host "3. 🧪 Probar: mvn versions:display-dependency-updates" -ForegroundColor Cyan
Write-Host "4. 📊 Ejecutar script de verificación de dependencias" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== INSTALACIÓN COMPLETADA ===" -ForegroundColor Green
