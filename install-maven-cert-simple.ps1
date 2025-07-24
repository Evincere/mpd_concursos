# Script simplificado para instalar certificado SSL de Maven Central
# Autor: Equipo de Desarrollo MPD
# Fecha: 2025-07-15

param(
    [string]$CertFile = "repo.maven.apache.org.crt",
    [string]$Alias = "maven-central"
)

Write-Host "=== INSTALACION DE CERTIFICADO SSL PARA MAVEN ===" -ForegroundColor Green
Write-Host "Fecha: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ADVERTENCIA: No se esta ejecutando como Administrador" -ForegroundColor Yellow
    Write-Host "Puede ser necesario para modificar el keystore de Java" -ForegroundColor Gray
    Write-Host ""
}

# Verificar que existe el archivo de certificado
if (-not (Test-Path $CertFile)) {
    Write-Host "ERROR: No se encontro el archivo de certificado: $CertFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "PASOS PARA OBTENER EL CERTIFICADO:" -ForegroundColor Yellow
    Write-Host "1. Abrir navegador y navegar a: https://repo.maven.apache.org" -ForegroundColor Gray
    Write-Host "2. Clic en el candado de seguridad" -ForegroundColor Gray
    Write-Host "3. Exportar certificado como Base64 X.509" -ForegroundColor Gray
    Write-Host "4. Guardar como: $CertFile" -ForegroundColor Gray
    exit 1
}

Write-Host "OK: Archivo de certificado encontrado: $CertFile" -ForegroundColor Green

# Detectar JAVA_HOME
$javaHome = $env:JAVA_HOME
if (-not $javaHome) {
    Write-Host "JAVA_HOME no esta definido, intentando detectar..." -ForegroundColor Yellow
    
    # Intentar encontrar Java
    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if ($javaCmd) {
        $javaPath = $javaCmd.Source
        $javaHome = Split-Path (Split-Path $javaPath -Parent) -Parent
        Write-Host "Java detectado en: $javaHome" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: No se pudo detectar Java. Instalar Java y configurar JAVA_HOME" -ForegroundColor Red
        exit 1
    }
}

Write-Host "OK: Java Home: $javaHome" -ForegroundColor Green

# Construir ruta al keystore
$keystorePath = Join-Path $javaHome "lib\security\cacerts"
if (-not (Test-Path $keystorePath)) {
    Write-Host "ERROR: No se encontro el keystore en: $keystorePath" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Keystore encontrado: $keystorePath" -ForegroundColor Green

# Verificar que keytool esta disponible
$keytoolPath = Join-Path $javaHome "bin\keytool.exe"
if (-not (Test-Path $keytoolPath)) {
    Write-Host "ERROR: No se encontro keytool en: $keytoolPath" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Keytool encontrado: $keytoolPath" -ForegroundColor Green
Write-Host ""

# Verificar si el certificado ya existe
Write-Host "Verificando si el certificado ya existe..." -ForegroundColor Yellow
$checkResult = & $keytoolPath -list -alias $Alias -keystore $keystorePath -storepass changeit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "ADVERTENCIA: El certificado '$Alias' ya existe en el keystore" -ForegroundColor Yellow
    $response = Read-Host "Desea reemplazarlo? (s/N)"
    if ($response -eq 's' -or $response -eq 'S') {
        Write-Host "Eliminando certificado existente..." -ForegroundColor Yellow
        & $keytoolPath -delete -alias $Alias -keystore $keystorePath -storepass changeit
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Error eliminando certificado existente" -ForegroundColor Red
            exit 1
        }
        Write-Host "OK: Certificado existente eliminado" -ForegroundColor Green
    } else {
        Write-Host "INFO: Operacion cancelada por el usuario" -ForegroundColor Cyan
        exit 0
    }
}

# Instalar el certificado
Write-Host "Instalando certificado en el keystore..." -ForegroundColor Yellow
$installResult = & $keytoolPath -import -alias $Alias -file $CertFile -keystore $keystorePath -storepass changeit -noprompt 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Certificado instalado exitosamente" -ForegroundColor Green
} else {
    Write-Host "ERROR: Error instalando certificado:" -ForegroundColor Red
    Write-Host $installResult -ForegroundColor Red
    exit 1
}

# Verificar la instalacion
Write-Host ""
Write-Host "Verificando instalacion..." -ForegroundColor Yellow
$verifyResult = & $keytoolPath -list -alias $Alias -keystore $keystorePath -storepass changeit 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Certificado verificado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "INFORMACION DEL CERTIFICADO:" -ForegroundColor Cyan
    Write-Host $verifyResult -ForegroundColor Gray
} else {
    Write-Host "ERROR: Error verificando certificado" -ForegroundColor Red
    Write-Host $verifyResult -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Probando conectividad Maven..." -ForegroundColor Yellow

# Cambiar al directorio del backend
$backendPath = "concurso-backend"
if (Test-Path $backendPath) {
    Push-Location $backendPath
    
    # Probar Maven
    Write-Host "Ejecutando: mvn help:effective-settings" -ForegroundColor Gray
    $mavenTest = mvn help:effective-settings -q 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Maven funciona correctamente" -ForegroundColor Green
        
        # Probar plugin versions
        Write-Host "Probando plugin versions..." -ForegroundColor Gray
        $versionsTest = mvn versions:display-dependency-updates -q 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: Plugin versions funciona correctamente" -ForegroundColor Green
        } else {
            Write-Host "ADVERTENCIA: Plugin versions aun tiene problemas" -ForegroundColor Yellow
            Write-Host "Puede necesitar tiempo para que los cambios surtan efecto" -ForegroundColor Gray
        }
    } else {
        Write-Host "ADVERTENCIA: Maven aun tiene problemas de conectividad" -ForegroundColor Yellow
        Write-Host "Puede necesitar reiniciar la terminal o IDE" -ForegroundColor Gray
    }
    
    Pop-Location
} else {
    Write-Host "ADVERTENCIA: No se encontro directorio concurso-backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Green
Write-Host "1. Reiniciar IntelliJ IDEA o IDE" -ForegroundColor Cyan
Write-Host "2. Reiniciar terminal/PowerShell" -ForegroundColor Cyan
Write-Host "3. Probar: mvn versions:display-dependency-updates" -ForegroundColor Cyan
Write-Host "4. Ejecutar script de verificacion de dependencias" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== INSTALACION COMPLETADA ===" -ForegroundColor Green
