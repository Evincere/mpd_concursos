# 🚨 PROCESO HÍBRIDO DE RECUPERACIÓN - INSTRUCCIONES DETALLADAS

## 📋 REQUISITOS PREVIOS:
- Tener este toolkit descargado en tu máquina local
- Acceso SSH al servidor
- Acceso al panel de backups de DonWeb

---

## 🔄 FASE 1: PREPARACIÓN (EN EL SERVIDOR ACTUAL - 5/8)

### 1.1 Subir este toolkit al servidor:
```bash
scp -r recovery_toolkit_portable/ root@[IP_SERVIDOR]:/root/
```

### 1.2 En el servidor, ejecutar preparación:
```bash
cd /root/recovery_toolkit_portable
chmod +x *.sh
./01_preparar_recuperacion.sh
```

### 1.3 Descargar el directorio de trabajo generado:
```bash
# En tu máquina local:
scp -r root@[IP_SERVIDOR]:/root/recovery_temp_* ./recovery_backup_local/
```

---

## 🔄 FASE 2: EXTRACCIÓN (BACKUP DEL 3/8)

### 2.1 Restaurar backup del 3/8 desde panel DonWeb

### 2.2 Subir toolkit nuevamente (se perdió en la restauración):
```bash
scp -r recovery_toolkit_portable/ root@[IP_SERVIDOR]:/root/
```

### 2.3 En el servidor, ejecutar extracción:
```bash
cd /root/recovery_toolkit_portable
./02_extraer_documentos.sh
```

### 2.4 Descargar archivos recuperados:
```bash
# En tu máquina local:
scp -r root@[IP_SERVIDOR]:/root/recovery_toolkit_portable/recovered_files/ ./documentos_recuperados/
```

---

## 🔄 FASE 3: RESTAURACIÓN FINAL (BACKUP DEL 5/8)

### 3.1 Restaurar backup del 5/8 desde panel DonWeb

### 3.2 Subir archivos recuperados al servidor:
```bash
scp -r ./documentos_recuperados/ root@[IP_SERVIDOR]:/root/recovery_toolkit_portable/
```

### 3.3 Subir toolkit nuevamente:
```bash
scp -r recovery_toolkit_portable/ root@[IP_SERVIDOR]:/root/
```

### 3.4 En el servidor, ejecutar restauración final:
```bash
cd /root/recovery_toolkit_portable
./03_restaurar_archivos.sh ./documentos_recuperados/
```

---

## ✅ VERIFICACIÓN FINAL:

### Verificar archivos en storage:
```bash
find /var/lib/docker/volumes/mpd_concursos_storage_data_prod/_data -name "*.pdf" | wc -l
```

### Probar descarga desde la aplicación web

### Generar reporte final de usuarios afectados

