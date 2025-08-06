# 🚨 TOOLKIT DE RECUPERACIÓN HÍBRIDA - DOCUMENTOS PERDIDOS

## 📊 RESUMEN DEL PROBLEMA:
- **Usuarios afectados:** 36 usuarios
- **Documentos perdidos:** 182 documentos PDF
- **Período afectado:** 1-3 Agosto 2025
- **Causa:** Actualización problemática el 31/07/2025

## 🎯 OBJETIVO:
Recuperar documentos perdidos usando backups de DonWeb sin perder datos actuales

---

## 📋 PROCESO COMPLETO - GUÍA PASO A PASO

### ⏰ CRONOGRAMA RECOMENDADO:
- **Inicio:** Después de medianoche (ventana de mantenimiento)
- **Duración:** 2-3 horas aproximadamente
- **Fases:** 3 fases principales + verificación

---

## 🔄 FASE 1: PREPARACIÓN (SERVIDOR ACTUAL - 5/8)

### 1.1 Preparar el entorno:
```bash
cd /root/concursos/mpd_concursos/recovery_toolkit_portable
chmod +x *.sh
```

### 1.2 Ejecutar preparación:
```bash
./01_preparar_recuperacion.sh
```
**Resultado:** Genera directorio `recovery_temp_XXXXXXX` con lista de archivos a recuperar

### 1.3 Descargar toolkit + datos a máquina local:
```bash
# En tu máquina local:
scp -r root@[IP_SERVIDOR]:/root/concursos/mpd_concursos/recovery_toolkit_portable ./
scp -r root@[IP_SERVIDOR]:/root/recovery_temp_* ./recovery_backup_local/
```

---

## 🔄 FASE 2: EXTRACCIÓN (BACKUP DEL 3/8)

### 2.1 Restaurar backup del 3/8:
- Panel DonWeb → Copias de seguridad → Seleccionar 3 Agosto 2025
- **ESPERAR** a que complete (15-30 minutos)

### 2.2 Subir toolkit al servidor restaurado:
```bash
# Desde tu máquina local:
scp -r recovery_toolkit_portable/ root@[IP_SERVIDOR]:/root/
scp -r recovery_backup_local/recovery_temp_* root@[IP_SERVIDOR]:/root/recovery_toolkit_portable/
```

### 2.3 Ejecutar extracción:
```bash
# En el servidor:
cd /root/recovery_toolkit_portable
./02_extraer_documentos.sh
```
**Resultado:** Archivos recuperados en `recovered_files/`

### 2.4 Descargar archivos recuperados:
```bash
# En tu máquina local:
scp -r root@[IP_SERVIDOR]:/root/recovery_toolkit_portable/recovered_files/ ./documentos_recuperados/
```

---

## 🔄 FASE 3: RESTAURACIÓN FINAL (BACKUP DEL 5/8 O MÁS RECIENTE)

### 3.1 Restaurar backup actual:
- Panel DonWeb → Copias de seguridad → Seleccionar 5 Agosto 2025 (o más reciente)
- **ESPERAR** a que complete

### 3.2 Subir archivos y toolkit:
```bash
# Desde tu máquina local:
scp -r recovery_toolkit_portable/ root@[IP_SERVIDOR]:/root/
scp -r documentos_recuperados/ root@[IP_SERVIDOR]:/root/recovery_toolkit_portable/
```

### 3.3 Ejecutar restauración final:
```bash
# En el servidor:
cd /root/recovery_toolkit_portable
./03_restaurar_archivos.sh ./documentos_recuperados/
```

### 3.4 Verificar proceso:
```bash
./04_verificar_recuperacion.sh
```

---

## ✅ CRITERIOS DE ÉXITO:

1. **Archivos físicos restaurados:** ~182 archivos PDF en storage
2. **Sistema funcionando:** Todos los contenedores Docker ejecutándose
3. **Base de datos consistente:** Sin errores de acceso
4. **Usuarios sin documentos pendientes:** 0 usuarios afectados
5. **Aplicación web funcional:** Descarga de documentos operativa

---

## 🆘 PLAN DE CONTINGENCIA:

### Si algo sale mal en cualquier fase:
1. **DETENER** inmediatamente el proceso
2. **Restaurar** al backup más reciente disponible
3. **Documentar** el error específico
4. **Contactar** soporte técnico con logs detallados

### Backups de seguridad automáticos:
- Cada script crea backups antes de modificar archivos
- Los archivos recuperados se mantienen en `.tar.gz`
- Logs detallados de cada operación

---

## 📞 CONTACTOS DE EMERGENCIA:
- **Soporte DonWeb:** [Información del ticket de soporte]
- **Logs del proceso:** Cada script genera logs detallados
- **Rollback:** Restaurar backup más reciente desde panel DonWeb

---

## 📊 MÉTRICAS POST-RECUPERACIÓN:
- Total de archivos en storage antes: `find /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data -name "*.pdf" | wc -l`
- Total de documentos en BD: `SELECT COUNT(*) FROM documents;`
- Usuarios con docs pendientes: `SELECT COUNT(DISTINCT user_id) FROM documents WHERE status='PENDING';`

**🎯 OBJETIVO:** 182 documentos recuperados + 0 pérdida de datos actuales = ÉXITO TOTAL**
