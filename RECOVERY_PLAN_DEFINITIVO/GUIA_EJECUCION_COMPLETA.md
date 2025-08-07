# GUÍA DE EJECUCIÓN PASO A PASO - PLAN DEFINITIVO
# ===============================================

## 🎯 RESUMEN EJECUTIVO
Esta guía proporciona instrucciones detalladas para ejecutar el plan de recuperación híbrida de documentación del sistema MPD Concursos, basado en exploración exhaustiva de backups del proveedor.

---

## 📋 PREPARACIÓN INICIAL

### ✅ REQUISITOS VERIFICADOS
- [  ] Acceso SSH al servidor
- [  ] Acceso al panel DonWeb/DattaWeb
- [  ] Máquina externa con >150GB espacio libre
- [  ] Conexión estable entre servidor y máquina externa
- [  ] Ventana de mantenimiento de 15-20 horas programada

### 📁 DESCARGA DEL PLAN
```bash
# En el servidor
cd /root
scp -r /root/RECOVERY_PLAN_DEFINITIVO user@external_machine:~/
```

---

## 🚀 EJECUCIÓN FASE POR FASE

### FASE 0: BACKUP DEL ESTADO ACTUAL (2 horas)
**📍 Ubicación: SERVIDOR**

```bash
# 1. Ir al directorio del plan
cd /root/RECOVERY_PLAN_DEFINITIVO

# 2. Ejecutar backup del estado actual
./01_backup_estado_actual.sh
```

**✅ VERIFICAR:**
- Script completó sin errores críticos
- Se creó directorio /root/BACKUP_ESTADO_ACTUAL
- Archivos .tar.gz fueron generados

```bash
# 3. En MÁQUINA EXTERNA, descargar backup
mkdir -p ~/mpd_recovery_master
scp -r root@SERVER_IP:/root/BACKUP_ESTADO_ACTUAL ~/mpd_recovery_master/
```

**⚠️ NO CONTINUAR hasta confirmar que backup está descargado**

---

### FASE 1: EXPLORACIÓN BACKUP 3 AGOSTO (3 horas)
**📍 Ubicación: SERVIDOR + MÁQUINA EXTERNA**

```bash
# 1. En PANEL DONWEB:
#    - Ir a "Copias de seguridad"
#    - Seleccionar "3 de agosto 2025"
#    - Confirmar restauración
#    - ESPERAR 15-30 minutos hasta completar

# 2. En SERVIDOR, verificar que restauración completó:
ssh root@SERVER_IP
cd /root/RECOVERY_PLAN_DEFINITIVO

# 3. Ejecutar exploración
./02_explorar_backup.sh 03_agosto
```

**✅ VERIFICAR:**
- Se creó /root/EXPLORACION_03_AGOSTO
- Archivos de análisis generados
- No errores críticos en logs

```bash
# 4. Descargar hallazgos
./03_descargar_hallazgos.sh 03_agosto
```

**✅ VERIFICAR:**
- Se creó /root/DESCARGA_03_AGOSTO
- Archivos .tar.gz generados

```bash
# 5. En MÁQUINA EXTERNA, descargar hallazgos
mkdir -p ~/mpd_recovery_backups/03_agosto
scp -r root@SERVER_IP:/root/DESCARGA_03_AGOSTO ~/mpd_recovery_backups/
```

---

### FASE 2: EXPLORACIÓN BACKUP 4 AGOSTO (3 horas)
**📍 Ubicación: SERVIDOR + MÁQUINA EXTERNA**

```bash
# 1. En PANEL DONWEB:
#    - Seleccionar "4 de agosto 2025"  
#    - Confirmar restauración
#    - ESPERAR completar

# 2. En SERVIDOR:
./02_explorar_backup.sh 04_agosto
./03_descargar_hallazgos.sh 04_agosto

# 3. En MÁQUINA EXTERNA:
mkdir -p ~/mpd_recovery_backups/04_agosto
scp -r root@SERVER_IP:/root/DESCARGA_04_AGOSTO ~/mpd_recovery_backups/
```

---

### FASE 3: EXPLORACIÓN BACKUP 5 AGOSTO (3 horas)
**📍 Ubicación: SERVIDOR + MÁQUINA EXTERNA**

```bash
# 1. En PANEL DONWEB:
#    - Seleccionar "5 de agosto 2025"
#    - Confirmar restauración
#    - ESPERAR completar

# 2. En SERVIDOR:
./02_explorar_backup.sh 05_agosto
./03_descargar_hallazgos.sh 05_agosto

# 3. En MÁQUINA EXTERNA:
mkdir -p ~/mpd_recovery_backups/05_agosto
scp -r root@SERVER_IP:/root/DESCARGA_05_AGOSTO ~/mpd_recovery_backups/
```

---

### FASE 4: ANÁLISIS Y CONSOLIDACIÓN (4 horas)
**📍 Ubicación: MÁQUINA EXTERNA**

```bash
# 1. En MÁQUINA EXTERNA, ir al directorio de recovery
cd ~/
ls -la  # Verificar estructura:
        # - mpd_recovery_master/ (backup actual)
        # - mpd_recovery_backups/03_agosto/
        # - mpd_recovery_backups/04_agosto/
        # - mpd_recovery_backups/05_agosto/

# 2. Copiar scripts de análisis
cp RECOVERY_PLAN_DEFINITIVO/04_analizar_hallazgos.sh .
cp RECOVERY_PLAN_DEFINITIVO/05_consolidar_archivos.sh .

# 3. Ejecutar análisis
./04_analizar_hallazgos.sh
```

**✅ VERIFICAR:**
- Se creó directorio ANALISIS_HALLAZGOS_*
- Archivos organizados por fecha
- Estadísticas generadas

```bash
# 4. Ejecutar consolidación
./05_consolidar_archivos.sh
```

**✅ VERIFICAR:**
- Se creó archivo RECOVERY_PACKAGE_*.tar.gz
- Manifiesto final generado
- Script SUBIR_PAQUETE.sh creado

---

### FASE 5: INTEGRACIÓN FINAL (2 horas)
**📍 Ubicación: SERVIDOR**

```bash
# 1. En PANEL DONWEB:
#    - Seleccionar "6 de agosto 2025" (HOY - más reciente)
#    - Confirmar restauración
#    - ESPERAR completar

# 2. En MÁQUINA EXTERNA, subir paquete:
./SUBIR_PAQUETE.sh
# O manualmente:
scp RECOVERY_PACKAGE_*.tar.gz root@SERVER_IP:/root/

# 3. En SERVIDOR, ejecutar integración:
cd /root/RECOVERY_PLAN_DEFINITIVO
./06_integrar_recuperacion.sh /root/RECOVERY_PACKAGE_*.tar.gz
```

**✅ VERIFICAR:**
- Integración completó sin errores críticos
- Servicios Docker funcionando
- Ganancia neta de archivos > 0

---

## 🔍 VERIFICACIÓN FINAL

### Tests de Funcionalidad
```bash
# 1. Verificar contenedores
docker ps | grep mpd-concursos

# 2. Verificar backend
curl -s http://localhost:8080/actuator/health

# 3. Contar archivos finales
docker exec mpd-concursos-backend-prod find /app/storage -type f | wc -l

# 4. Verificar base de datos
docker exec mpd-concursos-mysql-prod mysql -u root -proot1234 mpd_concursos -e "SELECT COUNT(*) FROM documents;"
```

### Tests de Usuario
- [ ] Acceso a aplicación web
- [ ] Login de usuario funcionando
- [ ] Visualización de documentos
- [ ] Descarga de archivos PDF
- [ ] Carga de nuevos documentos (si aplica)

---

## 🚨 PLAN DE CONTINGENCIA

### Si Algo Sale Mal Durante Exploración:
```bash
# 1. En PANEL DONWEB: Restaurar al 6 agosto (actual)
# 2. Esperar restauración completa
# 3. En servidor, verificar servicios:
docker ps
curl -s http://localhost:8080/actuator/health
```

### Si Algo Sale Mal Durante Integración:
```bash
# 1. DETENER integración inmediatamente
# 2. Restaurar desde backup de seguridad:
cd /root/SAFETY_BACKUP_PRE_INTEGRATION_*
# Seguir instrucciones en REPORTE_FINAL_*.txt

# 3. Reiniciar servicios:
cd /root/concursos/mpd_concursos
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

### Si Sistema Queda Inaccesible:
```bash
# 1. En PANEL DONWEB: Restaurar al backup del 6 agosto
# 2. Esperar restauración completa (puede tomar 30-60 min)
# 3. Contactar soporte del proveedor si persiste
```

---

## 📊 MÉTRICAS DE ÉXITO

### Escenario Exitoso
- ✅ +200-500 archivos recuperados
- ✅ Sistema funcionando normalmente
- ✅ Usuarios pueden acceder a documentos
- ✅ Sin errores críticos en logs

### Escenario Parcialmente Exitoso  
- ✅ +50-200 archivos recuperados
- ✅ Sistema funcionando
- ⚠️ Algunos archivos duplicados o renombrados

### Escenario de Rollback Necesario
- ❌ Sistema inestable después de integración
- ❌ Pérdida de archivos actuales
- ❌ Errores críticos no resueltos

---

## 📞 CONTACTOS DE EMERGENCIA

### Información del Sistema
- **Servidor**: vps-4778464-x.dattaweb.com
- **Proveedor**: DonWeb/DattaWeb
- **Panel**: [URL del panel de control]
- **Repositorio**: GitHub Evincere/mpd_concursos
- **Commit de referencia**: fa63bd9a

### En Caso de Emergencia
1. **Documentar el problema** específico
2. **No hacer cambios adicionales** sin análisis
3. **Preservar logs** de error
4. **Contactar soporte técnico** del proveedor si es necesario

---

## 📋 CHECKLIST FINAL

### Pre-ejecución
- [ ] Backup del estado actual descargado
- [ ] Máquina externa preparada (>150GB)
- [ ] Acceso al panel DonWeb confirmado
- [ ] Ventana de mantenimiento programada
- [ ] Scripts descargados y permisos verificados

### Durante Ejecución
- [ ] Cada fase completada sin errores críticos
- [ ] Backups descargados antes de continuar
- [ ] Análisis revisados manualmente
- [ ] Consolidación verificada

### Post-ejecución
- [ ] Sistema funcionando correctamente
- [ ] Archivos recuperados confirmados
- [ ] Funcionalidad de usuario verificada
- [ ] Backups de seguridad conservados
- [ ] Documentación de resultados completada

---

**🎯 Esta guía garantiza una ejecución segura y sistemática del plan de recuperación.**
