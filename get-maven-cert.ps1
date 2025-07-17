# Script para obtener el certificado de Maven Central
# Autor: Equipo de Desarrollo MPD

Write-Host "Obteniendo certificado de repo.maven.apache.org..." -ForegroundColor Yellow

try {
    # Ignorar errores de certificado temporalmente
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    
    # Crear la petición
    $request = [System.Net.WebRequest]::Create("https://repo.maven.apache.org")
    
    # Obtener la respuesta
    $response = $request.GetResponse()
    
    # Obtener el certificado
    $cert = $request.ServicePoint.Certificate
    $cert2 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($cert)
    
    # Convertir a formato PEM
    $pemHeader = "-----BEGIN CERTIFICATE-----"
    $pemFooter = "-----END CERTIFICATE-----"
    $base64Cert = [System.Convert]::ToBase64String($cert2.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
    
    $pemCert = $pemHeader + [System.Environment]::NewLine + $base64Cert + [System.Environment]::NewLine + $pemFooter
    
    # Guardar el certificado
    $pemCert | Out-File -FilePath "repo.maven.apache.org.crt" -Encoding ASCII
    
    Write-Host "✅ Certificado guardado exitosamente en repo.maven.apache.org.crt" -ForegroundColor Green
    
    # Mostrar información del certificado
    Write-Host ""
    Write-Host "Información del certificado:" -ForegroundColor Cyan
    Write-Host "  Sujeto: $($cert2.Subject)" -ForegroundColor Gray
    Write-Host "  Emisor: $($cert2.Issuer)" -ForegroundColor Gray
    Write-Host "  Válido desde: $($cert2.NotBefore)" -ForegroundColor Gray
    Write-Host "  Válido hasta: $($cert2.NotAfter)" -ForegroundColor Gray
    Write-Host "  Huella digital: $($cert2.Thumbprint)" -ForegroundColor Gray
    
    $response.Close()
    
} catch {
    Write-Host "❌ Error obteniendo certificado: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Próximo paso: Instalar el certificado en el keystore de Java" -ForegroundColor Yellow
Write-Host "Comando: keytool -import -alias maven-central -file repo.maven.apache.org.crt -keystore `$JAVA_HOME/lib/security/cacerts -storepass changeit" -ForegroundColor Gray
