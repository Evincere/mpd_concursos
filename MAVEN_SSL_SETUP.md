# Configuración de Certificados SSL para Maven

## Problema Identificado

**Error**: `PKIX path building failed: unable to find valid certification path to requested target`

Este error impide que Maven descargue dependencias y plugins desde el repositorio central de Maven.

## Solución: Configurar Certificado SSL

### Método 1: Obtener Certificado desde Navegador (Recomendado)

1. **Abrir navegador** y navegar a: `https://repo.maven.apache.org`

2. **Exportar certificado**:
   - **Chrome**: Clic en el candado → "Conexión es segura" → "El certificado es válido" → "Detalles" → "Exportar"
   - **Firefox**: Clic en el candado → "Conexión segura" → "Más información" → "Ver certificado" → "Descargar"
   - **Edge**: Clic en el candado → "Conexión es segura" → "Certificado" → "Detalles" → "Copiar a archivo"

3. **Guardar como**: `repo.maven.apache.org.crt` (formato Base64 X.509)

### Método 2: Usar OpenSSL (Si está disponible)

```bash
# En Git Bash o WSL
openssl s_client -showcerts -connect repo.maven.apache.org:443 -servername repo.maven.apache.org < /dev/null 2>/dev/null | openssl x509 -outform PEM > repo.maven.apache.org.crt
```

### Método 3: Usar PowerShell con User-Agent

```powershell
# Script alternativo con User-Agent
$url = "https://repo.maven.apache.org"
$request = [System.Net.WebRequest]::Create($url)
$request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
$request.Method = "HEAD"

try {
    $response = $request.GetResponse()
    $cert = $request.ServicePoint.Certificate
    # ... resto del código
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
```

## Instalación del Certificado

### Paso 1: Localizar Java Home

```powershell
# Verificar JAVA_HOME
echo $env:JAVA_HOME

# Si no está definido, encontrar Java
Get-Command java | Select-Object Source
```

**Java Home detectado**: `C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot`

### Paso 2: Instalar Certificado en Keystore

```powershell
# Comando para instalar el certificado
keytool -import -alias maven-central -file repo.maven.apache.org.crt -keystore "C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot\lib\security\cacerts" -storepass changeit -noprompt

# Verificar instalación
keytool -list -alias maven-central -keystore "C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot\lib\security\cacerts" -storepass changeit
```

### Paso 3: Verificar Funcionamiento

```powershell
# Probar Maven con el certificado instalado
cd concurso-backend
mvn versions:display-dependency-updates
```

## Soluciones Alternativas

### Opción 1: Configurar Maven Settings

Crear/editar `~/.m2/settings.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 
          http://maven.apache.org/xsd/settings-1.0.0.xsd">
  
  <!-- Configurar proxy si es necesario -->
  <proxies>
    <!-- Descomentar si hay proxy corporativo -->
    <!--
    <proxy>
      <id>corporate-proxy</id>
      <active>true</active>
      <protocol>http</protocol>
      <host>proxy.company.com</host>
      <port>8080</port>
    </proxy>
    -->
  </proxies>
  
  <!-- Configurar repositorio alternativo si es necesario -->
  <mirrors>
    <!-- Descomentar si hay repositorio interno -->
    <!--
    <mirror>
      <id>internal-repo</id>
      <name>Internal Repository</name>
      <url>http://internal-maven-repo/</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
    -->
  </mirrors>
</settings>
```

### Opción 2: Variables de Entorno Java

```powershell
# Configurar variables de entorno para SSL
$env:MAVEN_OPTS = "-Djavax.net.ssl.trustStore=`"C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot\lib\security\cacerts`" -Djavax.net.ssl.trustStorePassword=changeit"

# Hacer permanente (opcional)
[System.Environment]::SetEnvironmentVariable("MAVEN_OPTS", "-Djavax.net.ssl.trustStore=`"C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot\lib\security\cacerts`" -Djavax.net.ssl.trustStorePassword=changeit", "User")
```

### Opción 3: Deshabilitar SSL (NO RECOMENDADO para producción)

```powershell
# Solo para desarrollo local temporal
$env:MAVEN_OPTS = "-Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true"
```

## Verificación Post-Instalación

### Script de Verificación

```powershell
# Verificar certificado instalado
Write-Host "Verificando certificado en keystore..."
keytool -list -alias maven-central -keystore "C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot\lib\security\cacerts" -storepass changeit

# Probar conectividad Maven
Write-Host "Probando conectividad Maven..."
cd concurso-backend
mvn help:effective-settings

# Probar plugin versions
Write-Host "Probando plugin versions..."
mvn versions:display-dependency-updates
```

## Troubleshooting

### Error: "keytool: command not found"

```powershell
# Agregar Java bin al PATH
$env:PATH += ";C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot\bin"
```

### Error: "Access Denied" al modificar cacerts

```powershell
# Ejecutar PowerShell como Administrador
# O copiar cacerts a ubicación temporal, modificar, y copiar de vuelta
```

### Error: "Certificate already exists"

```powershell
# Eliminar certificado existente primero
keytool -delete -alias maven-central -keystore "C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot\lib\security\cacerts" -storepass changeit
```

## Contacto

Para problemas adicionales:
- Documentación: Este archivo (MAVEN_SSL_SETUP.md)
- Equipo de Desarrollo MPD
- IT/Infraestructura (para certificados corporativos)
