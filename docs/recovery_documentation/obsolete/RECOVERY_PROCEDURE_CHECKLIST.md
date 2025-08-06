# 🚨 PROCEDIMIENTO DE RECUPERACIÓN HÍBRIDA - CHECKLIST

## ⏰ CRONOGRAMA
- **Inicio:** Después de medianoche del 6/8/2025
- **Duración estimada:** 2-3 horas
- **Ventana de mantenimiento:** Recomendada

---

## 📋 FASE 1: PREPARACIÓN (ANTES DE LA RESTAURACIÓN)

### ✅ Pre-requisitos cumplidos:
- [x] Script de extracción creado (`scripts/recovery_extraction_plan.sh`)
- [x] Script de restauración creado (`scripts/restore_recovered_files.sh`)
- [x] Lista de documentos afectados identificada
- [x] Ruta de almacenamiento Docker confirmada

### 🔧 Acciones preparatorias:
1. **Ejecutar script de preparación:**
   ```bash
   ./scripts/recovery_extraction_plan.sh
   ```

2. **Anotar información crítica actual:**
   - Total documentos actuales: `docker exec mpd-concursos-mysql mysql -u root -p[PASSWORD] mpd_concursos -e "SELECT COUNT(*) FROM documents;"`
   - Total usuarios actuales: `docker exec mpd-concursos-mysql mysql -u root -p[PASSWORD] mpd_concursos -e "SELECT COUNT(*) FROM user_entity;"`

---

## 📋 FASE 2: RESTAURACIÓN TEMPORAL (3/8 BACKUP)

### 🔄 En el panel de DonWeb:
1. Ir a "Copias de seguridad"
2. Seleccionar backup del **3 de agosto 2025** (8:00 AM aprox)
3. Confirmar restauración
4. **ESPERAR** a que complete (puede tomar 15-30 min)

### ✅ Verificación post-restauración:
1. Verificar que los contenedores estén ejecutándose:
   ```bash
   docker ps
   ```
2. Verificar acceso a la aplicación
3. **INMEDIATAMENTE** ir a la carpeta de recuperación creada

---

## 📋 FASE 3: EXTRACCIÓN DE DOCUMENTOS

### 📁 Ir al directorio de recuperación:
```bash
cd /root/concursos/mpd_concursos/recovery_temp_[TIMESTAMP]
```

### 🔄 Ejecutar extracción:
```bash
./copy_files.sh
```

### ✅ Verificar extracción:
```bash
ls -la recovered_files/
find recovered_files/ -name "*.pdf" | wc -l
```

### 💾 Crear paquete de archivos recuperados:
```bash
tar -czf recovered_documents_$(date +%Y%m%d_%H%M%S).tar.gz recovered_files/
```

---

## 📋 FASE 4: RESTAURACIÓN FINAL (5/8 BACKUP)

### 🔄 En el panel de DonWeb:
1. Ir a "Copias de seguridad"
2. Seleccionar backup del **5 de agosto 2025** (o el más reciente disponible)
3. Confirmar restauración
4. **ESPERAR** a que complete

### ✅ Verificación del estado actual:
1. Verificar contenedores: `docker ps`
2. Verificar aplicación funcional
3. Verificar datos actualizados en BD

---

## 📋 FASE 5: RESTAURACIÓN DE ARCHIVOS RECUPERADOS

### 🔄 Ejecutar restauración:
```bash
cd /root/concursos/mpd_concursos
./scripts/restore_recovered_files.sh /ruta/completa/al/recovered_files/
```

### ✅ Verificación final:
1. Verificar archivos en storage:
   ```bash
   find /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data -name "*.pdf" | wc -l
   ```
2. Probar descarga de documentos desde la aplicación
3. Verificar logs de aplicación
4. Ejecutar reporte de usuarios afectados para confirmar recuperación

---

## 🆘 PLAN DE CONTINGENCIA

### Si algo sale mal:
1. **DETENER** inmediatamente el proceso
2. Restaurar al backup más reciente (5/8)
3. Documentar el problema específico
4. Contactar soporte técnico con detalles

### Backups de emergencia:
- Los archivos recuperados estarán empaquetados en `.tar.gz`
- Se crean backups automáticos antes de cada restauración
- Mantener logs detallados de cada paso

---

## 📊 MÉTRICAS DE ÉXITO

### Al finalizar, debemos tener:
- ✅ **182 documentos** perdidos recuperados
- ✅ **Todos los datos actuales** preservados (documentos + usuarios post 3/8)
- ✅ **Sistema funcionando** normalmente
- ✅ **Cero pérdida** de información reciente

