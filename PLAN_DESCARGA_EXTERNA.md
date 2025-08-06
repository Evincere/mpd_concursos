# PLAN DE DESCARGA EXTERNA - ÚNICA SOLUCIÓN VIABLE

## 🚨 Problema Confirmado
Los backups en el servidor se perderán al restaurar a fechas anteriores.
La ÚNICA solución es descargar todo a una máquina externa.

## 📋 Requisitos Absolutos
- **Máquina externa** con >5GB espacio libre
- **Conexión SSH/SCP** estable desde el servidor
- **Acceso permanente** durante 6-8 horas
- **Supervisión continua** del proceso

## 🔄 Proceso de Descarga Externa

### PASO 1: Preparar Máquina Externa
```bash
# En la máquina externa
mkdir -p ~/mpd_recovery_backup
cd ~/mpd_recovery_backup
```

### PASO 2: Crear y Descargar Backup Actual
```bash
# En el servidor
./create_external_backup.sh

# Descargar a máquina externa
scp -r /root/recovery_external/ usuario@maquina-externa:~/mpd_recovery_backup/
```

### PASO 3: Restaurar y Extraer (4 agosto)
```bash
# Dashboard: Restaurar al 4 agosto
# En el servidor después de restauración:
./extract_to_external.sh 4agosto usuario@maquina-externa:~/mpd_recovery_backup/
```

### PASO 4: Restaurar y Extraer (5 agosto)
```bash
# Dashboard: Restaurar al 5 agosto
# En el servidor:
./extract_to_external.sh 5agosto usuario@maquina-externa:~/mpd_recovery_backup/
```

### PASO 5: Restaurar al 6 agosto y Subir Todo
```bash
# Dashboard: Restaurar al 6 agosto
# Subir desde máquina externa:
scp -r ~/mpd_recovery_backup/ usuario@servidor:/tmp/final_recovery/
# En el servidor:
./integrate_from_external.sh
```

## ⚠️ ALTERNATIVAS SI NO HAY MÁQUINA EXTERNA

### OPCIÓN A: Esperar hasta mañana
- Esperar al respaldo de mañana (7 agosto)
- El respaldo incluirá nuestro trabajo de hoy
- Ejecutar recuperación híbrida con seguridad total

### OPCIÓN B: Recuperación manual con usuarios
- Contactar a los 28 usuarios críticos
- Solicitar re-subida de documentos
- Implementar sistema de notificación
- Proceso más lento pero sin riesgo técnico

### OPCIÓN C: Mantener estado actual
- Conservar los 180+ documentos ya recuperados
- Documentar usuarios afectados para contacto futuro
- Implementar mejoras preventivas
- Aceptar recuperación parcial del 45%
