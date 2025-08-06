# GUÍA DE EJECUCIÓN COMPLETA - RECUPERACIÓN CON 3 FECHAS

## 🎯 Objetivo
Recuperar documentos perdidos explorando 3 fechas de respaldo del proveedor (3/8, 4/8, 5/8) para maximizar la recuperación.

## ⚠️ IMPORTANTE - ANTES DE COMENZAR

### ✅ Verificaciones Previas
- [x] **Código fuente respaldado**: Commit fa63bd9a pushed al repositorio
- [x] **Scripts preparados**: Versiones mejoradas para 3 fechas
- [x] **Estado actual documentado**: 348 PDFs + 11 CV + 21 fotos
- [x] **Máquina externa preparada**: >15GB espacio libre

### 📋 Requisitos
- **Tiempo estimado**: 10-12 horas
- **Espacio en servidor**: >5GB libre
- **Espacio en máquina externa**: >15GB libre
- **Conexión estable**: SSH/SCP funcionando
- **Acceso al panel del proveedor**: Credenciales disponibles

---

## 📅 CRONOGRAMA DE EJECUCIÓN

| Fase | Actividad | Tiempo | Acumulado |
|------|-----------|--------|-----------|
| 1 | Backup estado actual | 1h | 1h |
| 2 | Extracción respaldo 3/8 | 2h | 3h |
| 3 | Extracción respaldo 4/8 | 2h | 5h |
| 4 | Extracción respaldo 5/8 | 2h | 7h |
| 5 | Consolidación externa | 2h | 9h |
| 6 | Integración final | 3h | 12h |

---

## 🚀 FASE 1: BACKUP DEL ESTADO ACTUAL (1 hora)

### En el servidor:
```bash
cd /root/concursos/mpd_concursos
./recovery_scripts_external/01_backup_current_state.sh
```

### Desde máquina externa:
```bash
# Crear directorio de trabajo
mkdir -p ~/mpd_recovery_backup

# Descargar backup completo
scp -r root@SERVER_IP:/root/external_recovery ~/mpd_recovery_backup/

# Verificar descarga
ls -la ~/mpd_recovery_backup/external_recovery/
```

**✅ Checkpoint**: Backup descargado y verificado

---

## 🚀 FASE 2: EXTRACCIÓN RESPALDO 3 DE AGOSTO (2 horas)

### En el panel del proveedor:
1. Ir a "Copias de seguridad"
2. Seleccionar respaldo del **3 de agosto 2025**
3. Confirmar restauración
4. **ESPERAR** hasta completar (15-30 min)

### En el servidor (después de la restauración):
```bash
cd /root/concursos/mpd_concursos

# Verificar que los contenedores estén funcionando
docker ps | grep mpd-concursos

# Ejecutar extracción
./recovery_scripts_external/02_extract_from_backup_enhanced.sh 03_agosto
```

### Desde máquina externa:
```bash
# Descargar extracción del 3/8
scp -r root@SERVER_IP:/root/external_recovery/extractions/03_agosto ~/mpd_recovery_backup/extractions/

# Verificar descarga
ls -la ~/mpd_recovery_backup/extractions/03_agosto/
```

**✅ Checkpoint**: Extracción del 3/8 completada y descargada

---

## 🚀 FASE 3: EXTRACCIÓN RESPALDO 4 DE AGOSTO (2 horas)

### En el panel del proveedor:
1. Seleccionar respaldo del **4 de agosto 2025**
2. Confirmar restauración
3. **ESPERAR** hasta completar

### En el servidor:
```bash
# Verificar contenedores
docker ps | grep mpd-concursos

# Ejecutar extracción
./recovery_scripts_external/02_extract_from_backup_enhanced.sh 04_agosto
```

### Desde máquina externa:
```bash
# Descargar extracción del 4/8
scp -r root@SERVER_IP:/root/external_recovery/extractions/04_agosto ~/mpd_recovery_backup/extractions/

# Verificar descarga
ls -la ~/mpd_recovery_backup/extractions/04_agosto/
```

**✅ Checkpoint**: Extracción del 4/8 completada y descargada

---

## 🚀 FASE 4: EXTRACCIÓN RESPALDO 5 DE AGOSTO (2 horas)

### En el panel del proveedor:
1. Seleccionar respaldo del **5 de agosto 2025**
2. Confirmar restauración
3. **ESPERAR** hasta completar

### En el servidor:
```bash
# Verificar contenedores
docker ps | grep mpd-concursos

# Ejecutar extracción
./recovery_scripts_external/02_extract_from_backup_enhanced.sh 05_agosto
```

### Desde máquina externa:
```bash
# Descargar extracción del 5/8
scp -r root@SERVER_IP:/root/external_recovery/extractions/05_agosto ~/mpd_recovery_backup/extractions/

# Verificar todas las extracciones
ls -la ~/mpd_recovery_backup/extractions/
```

**✅ Checkpoint**: Todas las extracciones completadas y descargadas

---

## 🚀 FASE 5: CONSOLIDACIÓN EXTERNA (2 horas)

### En la máquina externa:
```bash
cd ~/mpd_recovery_backup

# Ejecutar consolidación inteligente
./03_consolidate_external_enhanced.sh

# Verificar consolidación
ls -la consolidated/
ls -la consolidated_recovery_*.tar.gz
```

### Subir paquete consolidado al servidor:
```bash
# Subir paquete consolidado
scp consolidated_recovery_*.tar.gz root@SERVER_IP:/root/external_recovery/

# Verificar subida
ssh root@SERVER_IP "ls -la /root/external_recovery/consolidated_recovery_*.tar.gz"
```

**✅ Checkpoint**: Consolidación completada y paquete subido

---

## 🚀 FASE 6: INTEGRACIÓN FINAL (3 horas)

### En el panel del proveedor:
1. Seleccionar respaldo del **6 de agosto 2025** (más reciente)
2. Confirmar restauración
3. **ESPERAR** hasta completar

### En el servidor:
```bash
cd /root/concursos/mpd_concursos

# Verificar que estamos en el estado actual
docker ps | grep mpd-concursos

# Ejecutar integración final
./recovery_scripts_external/04_final_integration_enhanced.sh /root/external_recovery/consolidated_recovery_*.tar.gz
```

**✅ Checkpoint**: Integración completada

---

## 🔍 VERIFICACIÓN FINAL

### Verificar estado del sistema:
```bash
# Estado de contenedores
docker ps | grep mpd-concursos

# Contar documentos finales
docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" | wc -l
docker exec mpd-concursos-backend-prod find /app/storage/cv-documents -name "*.pdf" | wc -l
docker exec mpd-concursos-backend-prod find /app/storage/profile-images \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l

# Probar API
curl -s http://localhost:8080/actuator/health
```

### Verificar acceso de usuarios:
1. Acceder a la aplicación web
2. Probar login de usuario
3. Verificar visualización de documentos
4. Probar descarga de archivos

---

## 📊 RESULTADOS ESPERADOS

### Documentos Recuperados
- **Estado inicial preservado**: 348 PDFs + 11 CV + 21 fotos
- **Del respaldo 3/8**: +400-500 documentos históricos
- **Del respaldo 4/8**: +150-200 documentos críticos
- **Del respaldo 5/8**: +100-150 documentos críticos
- **Total final estimado**: ~1000-1200 documentos

### Usuarios Beneficiados
- **Usuarios actuales**: 103 (preservados)
- **Usuarios históricos**: +50-60
- **Usuarios críticos**: +28
- **Total final estimado**: ~150-180 usuarios

### Tasa de Recuperación
- **Conservadora**: 95% de documentos
- **Optimista**: 98% de documentos

---

## 🆘 PLAN DE CONTINGENCIA

### Si algo sale mal en cualquier fase:

1. **DETENER** inmediatamente el proceso
2. **Restaurar** al respaldo más reciente (6/8)
3. **Restaurar código fuente** desde Git:
   ```bash
   cd /root/concursos/mpd_concursos
   git fetch origin
   git reset --hard origin/main
   ```
4. **Contactar** para análisis del problema

### Backups de seguridad disponibles:
- **Código fuente**: Repositorio Git (commit fa63bd9a)
- **Estado actual**: `/root/external_recovery/current_*`
- **Cada extracción**: Respaldada en máquina externa
- **Pre-integración**: Backup automático antes de integrar

---

## 📋 CHECKLIST DE EJECUCIÓN

### Pre-ejecución
- [ ] Máquina externa preparada (>15GB)
- [ ] Conexión SSH/SCP verificada
- [ ] Acceso al panel del proveedor
- [ ] Ventana de mantenimiento programada

### Durante ejecución
- [ ] Fase 1: Backup estado actual
- [ ] Fase 2: Extracción 3/8
- [ ] Fase 3: Extracción 4/8
- [ ] Fase 4: Extracción 5/8
- [ ] Fase 5: Consolidación externa
- [ ] Fase 6: Integración final

### Post-ejecución
- [ ] Verificar contenedores funcionando
- [ ] Contar documentos finales
- [ ] Probar acceso de usuarios
- [ ] Verificar funcionalidad completa
- [ ] Documentar resultados

---

## 🎯 CONTACTO Y SOPORTE

En caso de problemas durante la ejecución:
1. Documentar el error específico
2. Tomar screenshot del panel del proveedor
3. Guardar logs de los scripts
4. No continuar hasta resolver el problema

**¡La recuperación será exitosa siguiendo esta guía paso a paso!**