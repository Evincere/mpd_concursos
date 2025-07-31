# MPD Concursos - Monitor Remoto PowerShell
# Ejecutar con: powershell -ExecutionPolicy Bypass -File "MPD-Monitor-PowerShell.ps1"

param(
    [string]$ServerIP = "149.50.132.23",
    [string]$ServerUser = "root",
    [string]$SSHKey = "$env:USERPROFILE\.ssh\id_rsa"
)

# Configuración de colores
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "Green"
Clear-Host

# Función para mostrar header
function Show-Header {
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                    MPD CONCURSOS - MONITOR REMOTO            ║" -ForegroundColor Cyan
    Write-Host "║                      PowerShell Edition                      ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Servidor: $ServerIP" -ForegroundColor Yellow
    Write-Host "👤 Usuario:  $ServerUser" -ForegroundColor Yellow
    Write-Host ""
}

# Función para ejecutar comandos SSH
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description = "Ejecutando comando remoto"
    )
    
    Write-Host "🔄 $Description..." -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Blue
    Write-Host ""
    
    try {
        if (Test-Path $SSHKey) {
            $sshArgs = @("-i", $SSHKey, "-o", "ConnectTimeout=10", "$ServerUser@$ServerIP", $Command)
        } else {
            $sshArgs = @("-o", "ConnectTimeout=10", "$ServerUser@$ServerIP", $Command)
        }
        
        & ssh $sshArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Comando ejecutado exitosamente" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Error al ejecutar el comando" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error de conexión: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Función para probar conexión
function Test-SSHConnection {
    Write-Host "🔍 Probando conexión SSH..." -ForegroundColor Yellow
    
    try {
        if (Test-Path $SSHKey) {
            $testResult = & ssh -i $SSHKey -o ConnectTimeout=5 -o BatchMode=yes "$ServerUser@$ServerIP" "echo 'OK'" 2>$null
        } else {
            $testResult = & ssh -o ConnectTimeout=5 -o BatchMode=yes "$ServerUser@$ServerIP" "echo 'OK'" 2>$null
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Conexión SSH exitosa" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Error de conexión SSH" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error de conexión: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función para mostrar menú
function Show-Menu {
    Clear-Host
    Show-Header
    
    Write-Host "┌─ OPCIONES DISPONIBLES ─────────────────────────────────────┐" -ForegroundColor Cyan
    Write-Host "│  1. 🔍 Monitor de Base de Datos                            │" -ForegroundColor White
    Write-Host "│  2. 📋 Monitor de Logs                                     │" -ForegroundColor White
    Write-Host "│  3. 💾 Backup Manual                                       │" -ForegroundColor White
    Write-Host "│  4. 🧹 Limpieza Docker                                     │" -ForegroundColor White
    Write-Host "│  5. 📊 Estado de Contenedores                              │" -ForegroundColor White
    Write-Host "│  6. 📈 Estadísticas de Recursos                            │" -ForegroundColor White
    Write-Host "│  7. 🔧 Consola SSH Interactiva                             │" -ForegroundColor White
    Write-Host "│  8. 🔍 Buscar Usuario por DNI                              │" -ForegroundColor White
    Write-Host "│  9. 📄 Ver Logs de Backup                                  │" -ForegroundColor White
    Write-Host "│ 10. ⚙️  Configurar Conexión                                │" -ForegroundColor White
    Write-Host "│  0. ❌ Salir                                               │" -ForegroundColor White
    Write-Host "└────────────────────────────────────────────────────────────┘" -ForegroundColor Cyan
    Write-Host ""
}

# Función principal
function Main {
    # Verificar si SSH está disponible
    try {
        $null = Get-Command ssh -ErrorAction Stop
    }
    catch {
        Write-Host "❌ SSH no está disponible en el sistema" -ForegroundColor Red
        Write-Host "💡 Instala OpenSSH o Git Bash" -ForegroundColor Yellow
        Read-Host "Presiona Enter para salir"
        exit 1
    }
    
    # Probar conexión inicial
    if (-not (Test-SSHConnection)) {
        Write-Host ""
        Write-Host "💡 Posibles soluciones:" -ForegroundColor Yellow
        Write-Host "  1. Verifica que la IP sea correcta: $ServerIP" -ForegroundColor Gray
        Write-Host "  2. Asegúrate de que el usuario sea correcto: $ServerUser" -ForegroundColor Gray
        Write-Host "  3. Configura autenticación por clave SSH" -ForegroundColor Gray
        Write-Host "  4. Verifica que el puerto 22 esté abierto" -ForegroundColor Gray
        Write-Host ""
        Write-Host "¿Deseas continuar de todos modos? (s/N): " -ForegroundColor Yellow -NoNewline
        $continue = Read-Host
        if ($continue -ne "s" -and $continue -ne "S") {
            exit 1
        }
    }
    
    # Bucle principal del menú
    do {
        Show-Menu
        $choice = Read-Host "Seleccione una opción"
        
        switch ($choice) {
            "1" { 
                Clear-Host
                Invoke-SSHCommand "db-monitor" "Conectando al Monitor de Base de Datos"
            }
            "2" { 
                Clear-Host
                Invoke-SSHCommand "log-monitor" "Conectando al Monitor de Logs"
            }
            "3" { 
                Clear-Host
                Invoke-SSHCommand "backup-db" "Ejecutando Backup Manual"
            }
            "4" { 
                Clear-Host
                Invoke-SSHCommand "cleanup-docker" "Ejecutando Limpieza Docker"
            }
            "5" { 
                Clear-Host
                Invoke-SSHCommand "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep mpd-concursos" "Verificando Estado de Contenedores"
            }
            "6" { 
                Clear-Host
                Invoke-SSHCommand "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}' | grep mpd-concursos" "Obteniendo Estadísticas de Recursos"
            }
            "7" { 
                Clear-Host
                Write-Host "🔧 Abriendo Consola SSH Interactiva..." -ForegroundColor Yellow
                Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
                Write-Host "💡 Para salir de la consola SSH, escribe: exit" -ForegroundColor Gray
                Write-Host ""
                
                if (Test-Path $SSHKey) {
                    & ssh -i $SSHKey "$ServerUser@$ServerIP"
                } else {
                    & ssh "$ServerUser@$ServerIP"
                }
            }
            "8" {
                Clear-Host
                Write-Host "🔍 Búsqueda de Usuario por DNI" -ForegroundColor Yellow
                Write-Host "═══════════════════════════════════" -ForegroundColor Blue
                $dni = Read-Host "Ingrese el DNI a buscar"
                if ($dni) {
                    $searchCommand = "docker exec mpd-concursos-mysql-prod mysql -uroot -proot1234 mpd_concursos -e `"SELECT CONCAT(first_name, ' ', last_name) as 'Nombre', dni as 'DNI', telefono as 'Teléfono', email as 'Email', status as 'Estado' FROM user_entity WHERE dni = '$dni';`""
                    Invoke-SSHCommand $searchCommand "Buscando usuario con DNI: $dni"
                }
            }
            "9" {
                Clear-Host
                Invoke-SSHCommand "tail -20 /var/log/mpd-backup.log" "Mostrando últimos logs de backup"
            }
            "10" {
                Clear-Host
                Write-Host "⚙️ CONFIGURACIÓN DE CONEXIÓN" -ForegroundColor Yellow
                Write-Host "═══════════════════════════════" -ForegroundColor Blue
                Write-Host ""
                Write-Host "Configuración actual:" -ForegroundColor White
                Write-Host "  Servidor: $ServerIP" -ForegroundColor Gray
                Write-Host "  Usuario:  $ServerUser" -ForegroundColor Gray
                Write-Host "  Clave SSH: $SSHKey" -ForegroundColor Gray
                Write-Host ""
                
                $change = Read-Host "¿Deseas cambiar la configuración? (s/N)"
                if ($change -eq "s" -or $change -eq "S") {
                    $newIP = Read-Host "Nueva IP del servidor [$ServerIP]"
                    if ($newIP) { $ServerIP = $newIP }
                    
                    $newUser = Read-Host "Nuevo usuario [$ServerUser]"
                    if ($newUser) { $ServerUser = $newUser }
                    
                    Write-Host ""
                    Write-Host "✅ Configuración actualizada:" -ForegroundColor Green
                    Write-Host "  Servidor: $ServerIP" -ForegroundColor Gray
                    Write-Host "  Usuario:  $ServerUser" -ForegroundColor Gray
                }
                
                Write-Host ""
                Test-SSHConnection
                Write-Host ""
                Read-Host "Presiona Enter para continuar"
            }
            "0" { 
                Clear-Host
                Write-Host "👋 ¡Hasta luego!" -ForegroundColor Green
                Start-Sleep -Seconds 1
                exit 0
            }
            default {
                Write-Host "❌ Opción inválida" -ForegroundColor Red
                Start-Sleep -Seconds 1
            }
        }
    } while ($true)
}

# Ejecutar función principal
Main
