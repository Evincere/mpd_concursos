# GUÍA COMPLETA DE RECUPERACIÓN - MPD CONCURSOS

## 🎯 Objetivo
Recuperar documentos perdidos del período 4-5 agosto 2025 mediante exploración de 3 fechas de respaldo del proveedor, maximizando la recuperación sin perder datos actuales.

## 📊 Estado Actual del Sistema
- ✅ **Documentos actuales preservados**: 348 PDFs + 11 CV + 21 fotos
- ✅ **Sistema funcionando**: Problema de visualización resuelto
- ✅ **Código fuente respaldado**: Commit fa63bd9a en repositorio
- ⏳ **Pendiente**: Recuperación de ~350 documentos de 28 usuarios críticos

## 🎯 Estrategia: Recuperación con 3 Fechas de Respaldo

### Fechas a Explorar
1. **3 de agosto**: Documentos históricos pre-incidente (~400-500 archivos)
2. **4 de agosto**: Documentos del período crítico temprano (~150-200 archivos)
3. **5 de agosto**: Documentos del período crítico tardío (~100-150 archivos)

### Resultado Esperado
- **Tasa de recuperación**: 95-98%
- **Documentos finales**: ~1000-1200 archivos
- **Usuarios beneficiados**: ~150-180 usuarios

---

## ⚠️ REQUISITOS PREVIOS

### ✅ Verificaciones Obligatorias
```bash
# Ejecutar verificación del sistema
./recovery_scripts_external/00_verify_system_state.sh
```

### 📋 Recursos Necesarios
- **Tiempo**: 10-12 horas
- **Espacio servidor**: >5GB libre
- **Espacio máquina externa**: >15GB libre
- **Conexión**: SSH/SCP estable
- **Acceso**: Panel del proveedor disponible

---

## 🚀 PROCESO DE RECUPERACIÓN

### FASE 1: Backup del Estado Actual (1 hora)

#### En el servidor:
```bash
cd /root/concursos/mpd_concursos
./recovery_scripts_external/01_backup_current_state.sh
```

#### Desde máquina externa:
```bash
mkdir -p ~/mpd_recovery_backup
scp -r root@SERVER_IP:/root/external_recovery ~/mpd_recovery_backup/
```

**✅ Checkpoint**: Backup descargado y verificado

---

### FASE 2: Extracción del Respaldo 3/8 (2 horas)

#### En panel del proveedor:
1. Ir a "Copias de seguridad"
2. Seleccionar **3 de agosto 2025**
3. Confirmar restauración
4. Esperar completar (15-30 min)

#### En el servidor:
```bash
# Verificar contenedores funcionando
docker ps | grep mpd-concursos

# Ejecutar extracción
./recovery_scripts_external/02_extract_from_backup_enhanced.sh 03_agosto
```

#### Desde máquina externa:
```bash
scp -r root@SERVER_IP:/root/external_recovery/extractions/03_agosto ~/mpd_recovery_backup/extractions/
```

**✅ Checkpoint**: Extracción 3/8 completada

---

### FASE 3: Extracción del Respaldo 4/8 (2 horas)

#### En panel del proveedor:
1. Seleccionar **4 de agosto 2025**
2. Confirmar restauración
3. Esperar completar

#### En el servidor:
```bash
./recovery_scripts_external/02_extract_from_backup_enhanced.sh 04_agosto
```

#### Desde máquina externa:
```bash
scp -r root@SERVER_IP:/root/external_recovery/extractions/04_agosto ~/mpd_recovery_backup/extractions/
```

**✅ Checkpoint**: Extracción 4/8 completada

---

### FASE 4: Extracción del Respaldo 5/8 (2 horas)

#### En panel del proveedor:
1. Seleccionar **5 de agosto 2025**
2. Confirmar restauración
3. Esperar completar

#### En el servidor:
```bash
./recovery_scripts_external/02_extract_from_backup_enhanced.sh 05_agosto
```

#### Desde máquina externa:
```bash
scp -r root@SERVER_IP:/root/external_recovery/extractions/05_agosto ~/mpd_recovery_backup/extractions/
```

**✅ Checkpoint**: Todas las extracciones completadas

---

### FASE 5: Consolidación Externa (2 horas)

#### En máquina externa:
```bash
cd ~/mpd_recovery_backup
./03_consolidate_external_enhanced.sh

# Subir paquete consolidado
scp consolidated_recovery_*.tar.gz root@SERVER_IP:/root/external_recovery/
```

**✅ Checkpoint**: Consolidación completada

---

### FASE 6: Integración Final (3 horas)

#### En panel del proveedor:
1. Seleccionar **6 de agosto 2025** (más reciente)
2. Confirmar restauración
3. Esperar completar

#### En el servidor:
```bash
cd /root/concursos/mpd_concursos
./recovery_scripts_external/04_final_integration_enhanced.sh /root/external_recovery/consolidated_recovery_*.tar.gz
```

**✅ Checkpoint**: Integración completada

---

## 🔍 VERIFICACIÓN FINAL

### Verificar Sistema
```bash
# Estado contenedores
docker ps | grep mpd-concursos

# Contar documentos
docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" | wc -l

# Probar API
curl -s http://localhost:8080/actuator/health
```

### Verificar Funcionalidad
1. Acceder a aplicación web
2. Probar login de usuario
3. Verificar visualización de documentos
4. Probar descarga de archivos

---

## 🆘 PLAN DE CONTINGENCIA

### Si algo sale mal:
1. **DETENER** proceso inmediatamente
2. **Restaurar** al respaldo 6/8 más reciente
3. **Restaurar código fuente**:
   ```bash
   cd /root/concursos/mpd_concursos
   git fetch origin
   git reset --hard origin/main
   ```
4. **Contactar** para análisis

### Backups disponibles:
- Código fuente: Git commit fa63bd9a
- Estado actual: Múltiples backups automáticos
- Cada extracción: Respaldada independientemente

---

## 📊 RESULTADOS ESPERADOS

### Documentos Finales
- **Preservados**: 348 PDFs + 11 CV + 21 fotos
- **Recuperados del 3/8**: +400-500 archivos
- **Recuperados del 4/8**: +150-200 archivos
- **Recuperados del 5/8**: +100-150 archivos
- **Total estimado**: ~1000-1200 documentos

### Usuarios Beneficiados
- **Actuales preservados**: 103 usuarios
- **Históricos recuperados**: +50-60 usuarios
- **Críticos recuperados**: +28 usuarios
- **Total estimado**: ~150-180 usuarios

---

## 📋 CHECKLIST DE EJECUCIÓN

### Pre-ejecución
- [ ] Sistema verificado con script de verificación
- [ ] Máquina externa preparada (>15GB)
- [ ] Conexión SSH/SCP probada
- [ ] Acceso al panel del proveedor confirmado
- [ ] Ventana de mantenimiento programada

### Durante ejecución
- [ ] Fase 1: Backup estado actual
- [ ] Fase 2: Extracción 3/8
- [ ] Fase 3: Extracción 4/8
- [ ] Fase 4: Extracción 5/8
- [ ] Fase 5: Consolidación externa
- [ ] Fase 6: Integración final

### Post-ejecución
- [ ] Contenedores funcionando
- [ ] Documentos contados y verificados
- [ ] Acceso de usuarios probado
- [ ] Funcionalidad completa verificada
- [ ] Resultados documentados

---

**🎯 Esta guía garantiza la máxima recuperación posible manteniendo la seguridad de los datos actuales.**