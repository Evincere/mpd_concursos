# PLAN DE CONTINGENCIA - RECUPERACIÓN MPD CONCURSOS

## 🚨 Propósito
Este documento define las acciones a tomar si algo sale mal durante el proceso de recuperación híbrida.

---

## 🛡️ Principios de Seguridad

### Regla de Oro
**NUNCA continuar si hay dudas o errores no resueltos**

### Prioridades
1. **Preservar datos actuales** (380 archivos ya recuperados)
2. **Mantener sistema operativo** para usuarios
3. **Documentar cualquier problema** para análisis posterior
4. **Restaurar al estado conocido** si es necesario

---

## 🚨 Escenarios de Contingencia

## Escenario 1: Error Durante Backup Inicial

### Síntomas
- Script `01_backup_current_state.sh` falla
- Error al crear backup de volúmenes Docker
- Error al acceder a la base de datos

### Acciones Inmediatas
```bash
# 1. DETENER el proceso inmediatamente
# 2. Verificar estado del sistema
docker ps | grep mpd-concursos
curl -s http://localhost:8080/actuator/health

# 3. Verificar espacio en disco
df -h

# 4. Verificar permisos
ls -la /root/external_recovery/
```

### Soluciones Comunes
```bash
# Si falta espacio en disco
docker system prune -f
rm -rf /tmp/* 2>/dev/null

# Si hay problemas de permisos
mkdir -p /root/external_recovery
chmod 755 /root/external_recovery

# Si la BD no responde
docker compose -f docker-compose.prod.yml restart mysql
sleep 30
```

### Criterio de Continuación
- ✅ Todos los contenedores UP
- ✅ Backend respondiendo
- ✅ >5GB espacio libre
- ✅ Backup creado exitosamente

---

## Escenario 2: Error Durante Restauración del Proveedor

### Síntomas
- Restauración del proveedor no completa
- Contenedores no inician después de restauración
- Sistema no responde después de restauración

### Acciones Inmediatas
```bash
# 1. ESPERAR 10 minutos adicionales
# La restauración puede tomar más tiempo del esperado

# 2. Verificar en el panel del proveedor
# - Estado de la restauración
# - Logs de errores si están disponibles

# 3. Intentar acceso SSH
ssh root@SERVER_IP

# 4. Si hay acceso, verificar contenedores
docker ps -a
```

### Soluciones de Recuperación
```bash
# Si los contenedores no están ejecutándose
cd /root/concursos/mpd_concursos
docker compose -f docker-compose.prod.yml up -d

# Si hay problemas de configuración
git fetch origin
git reset --hard origin/main
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Si persisten los problemas
# Restaurar al respaldo más reciente (6 agosto)
```

### Criterio de Continuación
- ✅ SSH accesible
- ✅ Contenedores iniciando correctamente
- ✅ Sistema respondiendo

---

## Escenario 3: Error Durante Extracción

### Síntomas
- Script `02_extract_from_backup_enhanced.sh` falla
- No se encuentran archivos esperados
- Error al copiar archivos desde contenedores

### Acciones Inmediatas
```bash
# 1. Verificar que estamos en el respaldo correcto
docker exec mpd-concursos-mysql-prod mysql -u root -proot1234 mpd_concursos -e "SELECT COUNT(*) FROM documents;"

# 2. Verificar estructura de storage
docker exec mpd-concursos-backend-prod ls -la /app/storage/

# 3. Verificar espacio disponible
df -h
```

### Soluciones Comunes
```bash
# Si no se encuentran archivos
# Verificar que la restauración fue al respaldo correcto
# Puede que el respaldo no tenga documentos de esa fecha

# Si hay errores de copia
# Verificar permisos y espacio
mkdir -p /root/external_recovery/extractions/FECHA
chmod -R 755 /root/external_recovery/

# Si el contenedor no responde
docker compose -f docker-compose.prod.yml restart backend
sleep 30
```

### Criterio de Continuación
- ✅ Al menos algunos archivos extraídos
- ✅ Metadatos generados correctamente
- ✅ Logs sin errores críticos

---

## Escenario 4: Error Durante Consolidación Externa

### Síntomas
- Script `03_consolidate_external_enhanced.sh` falla en máquina externa
- Archivos corruptos durante transferencia
- Espacio insuficiente en máquina externa

### Acciones Inmediatas
```bash
# En máquina externa
# 1. Verificar espacio disponible
df -h

# 2. Verificar integridad de archivos descargados
find ~/mpd_recovery_backup -name "*.tar.gz" -exec tar -tzf {} \; > /dev/null

# 3. Verificar checksums si están disponibles
cd ~/mpd_recovery_backup/extractions/
find . -name "checksums_*.md5" -exec md5sum -c {} \;
```

### Soluciones de Recuperación
```bash
# Si falta espacio
# Limpiar archivos temporales o usar disco adicional
rm -rf ~/mpd_recovery_backup/temp/* 2>/dev/null

# Si hay archivos corruptos
# Re-descargar desde el servidor
scp -r root@SERVER_IP:/root/external_recovery/extractions/FECHA ~/mpd_recovery_backup/extractions/

# Si la consolidación falla parcialmente
# Continuar con los archivos disponibles
# El script está diseñado para manejar extracciones parciales
```

### Criterio de Continuación
- ✅ Al menos 2 de 3 extracciones disponibles
- ✅ Archivos principales consolidados
- ✅ Paquete final creado exitosamente

---

## Escenario 5: Error Durante Integración Final

### Síntomas
- Script `04_final_integration_enhanced.sh` falla
- Error al restaurar código fuente
- Error al integrar archivos al storage

### Acciones Inmediatas
```bash
# 1. DETENER inmediatamente
# 2. Verificar que tenemos backup de seguridad
ls -la /root/safety_backup_*/

# 3. Verificar estado del repositorio Git
cd /root/concursos/mpd_concursos
git status
```

### Soluciones de Recuperación
```bash
# Si hay problemas con Git
cd /root/concursos/mpd_concursos
git stash  # Guardar cambios si los hay
git fetch origin
git reset --hard origin/main

# Si hay problemas con la integración
# Restaurar desde backup de seguridad
SAFETY_BACKUP=$(ls -t /root/safety_backup_* | head -1)
docker run --rm -v mpd_concursos_storage_data_prod:/data -v "$SAFETY_BACKUP":/backup alpine tar xzf /backup/storage_pre_integration_*.tar.gz -C /data

# Restaurar BD si es necesario
docker exec -i mpd-concursos-mysql-prod mysql -u root -proot1234 mpd_concursos < "$SAFETY_BACKUP/db_pre_integration_*.sql"
```

### Criterio de Continuación
- ✅ Sistema restaurado al estado pre-integración
- ✅ Todos los servicios funcionando
- ✅ Datos actuales preservados

---

## 🔄 Procedimiento de Rollback Completo

### Cuándo Usar
- Errores críticos irrecuperables
- Corrupción de datos detectada
- Sistema inestable después de cambios

### Pasos de Rollback
```bash
# 1. Ir al directorio del proyecto
cd /root/concursos/mpd_concursos

# 2. Restaurar código fuente
git fetch origin
git reset --hard origin/main
git clean -fd

# 3. Restaurar al respaldo más reciente del proveedor
# En panel del proveedor: Seleccionar 6 agosto 2025

# 4. Esperar a que complete la restauración

# 5. Verificar que el sistema funciona
docker ps | grep mpd-concursos
curl -s http://localhost:8080/actuator/health

# 6. Si es necesario, reiniciar servicios
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

### Verificación Post-Rollback
```bash
# Verificar documentos actuales
docker exec mpd-concursos-backend-prod find /app/storage/documents -name "*.pdf" | wc -l
# Debe mostrar ~348 documentos

# Verificar usuarios
docker exec mpd-concursos-backend-prod ls /app/storage/documents | wc -l
# Debe mostrar ~103 directorios

# Verificar funcionalidad
curl -s http://localhost:8080/actuator/health | grep '"status":"UP"'
```

---

## 📞 Escalación y Contacto

### Niveles de Escalación

#### Nivel 1: Problemas Menores
- Errores de scripts que se pueden resolver
- Problemas de espacio o permisos
- Fallos temporales de conectividad

**Acción**: Seguir procedimientos de este documento

#### Nivel 2: Problemas Moderados
- Fallos de restauración del proveedor
- Corrupción parcial de datos
- Errores de integración complejos

**Acción**: Ejecutar rollback y documentar problema

#### Nivel 3: Problemas Críticos
- Sistema completamente inaccesible
- Pérdida de datos actuales
- Corrupción completa del sistema

**Acción**: Contacto inmediato con soporte del proveedor

### Información para Soporte
```
INFORMACIÓN DEL SISTEMA:
- Servidor: vps-4778464-x.dattaweb.com
- Proveedor: DonWeb/DattaWeb
- Aplicación: MPD Concursos
- Repositorio: GitHub - Evincere/mpd_concursos
- Commit de referencia: fa63bd9a
- Fecha del incidente: [FECHA Y HORA]
- Descripción del problema: [DESCRIPCIÓN DETALLADA]
- Pasos realizados: [LISTA DE ACCIONES]
- Estado actual: [ESTADO DEL SISTEMA]
```

---

## 📋 Checklist de Contingencia

### Antes de Iniciar Recuperación
- [ ] Backup completo del estado actual creado
- [ ] Código fuente respaldado en Git
- [ ] Plan de contingencia revisado
- [ ] Contactos de soporte disponibles
- [ ] Ventana de tiempo suficiente

### Durante la Recuperación
- [ ] Monitorear cada paso cuidadosamente
- [ ] Documentar cualquier error o advertencia
- [ ] No continuar si hay dudas
- [ ] Mantener comunicación con el equipo

### Después de Cualquier Error
- [ ] Sistema restaurado a estado conocido
- [ ] Funcionalidad básica verificada
- [ ] Problema documentado completamente
- [ ] Plan de acción definido para siguiente intento

---

## 🎯 Filosofía de Contingencia

### Principio Fundamental
**"Es mejor mantener el sistema actual funcionando que arriesgar todo por una recuperación completa"**

### Recordatorios Importantes
1. **Los 380 archivos actuales son valiosos** - No los perdamos
2. **El sistema funciona correctamente** - Mantengámoslo así
3. **La recuperación es deseable, no crítica** - Podemos intentar después
4. **Siempre hay una segunda oportunidad** - Con mejor preparación

---

**🛡️ Este plan de contingencia garantiza que siempre podamos volver a un estado seguro y conocido.**