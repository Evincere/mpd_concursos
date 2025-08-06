# PLAN DE RECUPERACIÓN HÍBRIDA - RESPALDOS DEL PROVEEDOR

## 🎯 Objetivo
Recuperar documentos del período crítico (4-5 agosto) usando respaldos del dashboard del proveedor sin perder datos actuales.

## 📊 Situación Actual
- **Documentos actuales**: 348 PDFs + 11 CV + 21 fotos
- **Usuarios críticos faltantes**: 28 usuarios
- **Documentos a recuperar**: ~350 archivos

## 🔄 Estrategia de Recuperación

### FASE 1: PREPARACIÓN (ANTES DE RESTAURAR)
1. **Crear backup completo del estado actual**
   ```bash
   # Backup de volúmenes Docker actuales
   docker run --rm -v mpd_concursos_storage_data_prod:/data -v /root/backups:/backup alpine tar czf /backup/current_state_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
   
   # Backup de base de datos actual
   docker exec mpd-concursos-mysql-prod mysqldump -u root -proot1234 mpd_concursos > /root/backups/current_db_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Descargar archivos críticos a máquina local**
   - Usar SCP/RSYNC para descargar estado actual
   - Crear copia de seguridad externa

### FASE 2: RESTAURACIÓN TEMPORAL (4 AGOSTO)
1. **En el dashboard del proveedor**:
   - Seleccionar "04/08/2025 - Ubuntu 22.04"
   - Confirmar restauración
   - **ESPERAR** a que complete (15-30 min)

2. **Inmediatamente después de la restauración**:
   ```bash
   # Extraer documentos del período crítico
   mkdir -p /tmp/recovery_4agosto
   cp -r /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents /tmp/recovery_4agosto/
   
   # Crear archivo comprimido
   tar -czf /root/recovery_4agosto_$(date +%Y%m%d_%H%M%S).tar.gz -C /tmp/recovery_4agosto .
   ```

### FASE 3: RESTAURACIÓN TEMPORAL (5 AGOSTO)
1. **En el dashboard del proveedor**:
   - Seleccionar "05/08/2025 - Ubuntu 22.04"
   - Confirmar restauración

2. **Extraer documentos adicionales**:
   ```bash
   # Extraer documentos del 5 agosto
   mkdir -p /tmp/recovery_5agosto
   cp -r /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data/documents /tmp/recovery_5agosto/
   
   # Crear archivo comprimido
   tar -czf /root/recovery_5agosto_$(date +%Y%m%d_%H%M%S).tar.gz -C /tmp/recovery_5agosto .
   ```

### FASE 4: RESTAURACIÓN AL ESTADO ACTUAL
1. **En el dashboard del proveedor**:
   - Seleccionar "06/08/2025 - Ubuntu 22.04" (ÚLTIMO)
   - Confirmar restauración

2. **Restaurar estado actual desde backup**:
   ```bash
   # Restaurar volúmenes Docker
   docker run --rm -v mpd_concursos_storage_data_prod:/data -v /root/backups:/backup alpine tar xzf /backup/current_state_[TIMESTAMP].tar.gz -C /data
   
   # Restaurar base de datos
   docker exec -i mpd-concursos-mysql-prod mysql -u root -proot1234 mpd_concursos < /root/backups/current_db_[TIMESTAMP].sql
   ```

### FASE 5: INTEGRACIÓN DE DOCUMENTOS RECUPERADOS
1. **Extraer archivos recuperados**:
   ```bash
   # Extraer respaldos del 4 y 5 agosto
   mkdir -p /tmp/final_recovery
   tar -xzf /root/recovery_4agosto_*.tar.gz -C /tmp/final_recovery/
   tar -xzf /root/recovery_5agosto_*.tar.gz -C /tmp/final_recovery/
   ```

2. **Integrar documentos usando script inteligente**:
   ```bash
   # Usar el script de integración ya probado
   docker cp /tmp/final_recovery mpd-concursos-backend-prod:/app/final_recovery
   docker exec mpd-concursos-backend-prod bash /app/integration_script.sh
   ```

## ⚠️ RIESGOS Y PRECAUCIONES

### Riesgos Identificados
1. **Pérdida de datos actuales** durante restauraciones
2. **Tiempo de inactividad** del sistema (2-3 horas)
3. **Posible corrupción** si se interrumpe el proceso

### Medidas de Seguridad
1. **Backups múltiples** antes de cada paso
2. **Descarga local** de archivos críticos
3. **Validación** después de cada restauración
4. **Plan de rollback** preparado

## 📋 CHECKLIST DE EJECUCIÓN

### Pre-requisitos
- [ ] Acceso al dashboard del proveedor
- [ ] Espacio suficiente en disco (>5GB)
- [ ] Herramientas de transferencia (SCP/RSYNC)
- [ ] Ventana de mantenimiento programada

### Ejecución
- [ ] Backup completo del estado actual
- [ ] Descarga de archivos críticos
- [ ] Restauración al 4 agosto
- [ ] Extracción de documentos del 4 agosto
- [ ] Restauración al 5 agosto
- [ ] Extracción de documentos del 5 agosto
- [ ] Restauración al estado actual (6 agosto)
- [ ] Restauración de datos actuales
- [ ] Integración de documentos recuperados
- [ ] Validación final del sistema

### Post-ejecución
- [ ] Verificar integridad de documentos
- [ ] Probar acceso de usuarios
- [ ] Validar funcionalidad completa
- [ ] Documentar resultados

## 🎯 RESULTADO ESPERADO
- **Recuperación total**: ~90% de documentos
- **Usuarios beneficiados**: 54 usuarios
- **Documentos finales**: ~700 archivos
- **Tiempo estimado**: 3-4 horas
