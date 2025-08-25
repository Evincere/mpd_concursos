# 🔧 MODO MANTENIMIENTO - CONCURSOS MPD

## ✅ ESTADO ACTUAL: MODO MANTENIMIENTO ACTIVADO

**Fecha de activación:** 14 de Agosto de 2025 - 03:20 UTC
**Motivo:** Finalización del período de 3 días hábiles para regularización de documentación

### 📄 Mensaje mostrado a usuarios:
- ✅ Proceso de tres días hábiles finalizado
- ✅ Instrucción de mantenerse atentos al correo registrado
- ✅ Contacto de mesa de ayuda: concursos_mdp_rrhh@jus.mendoza.gov.ar

---

## 📊 CONFIGURACIÓN ACTUAL

### **Servicios Activos:**
- ✅ **Frontend**: Puerto 80 expuesto directamente
- ✅ **Backend**: Disponible para API administrativa
- ✅ **MySQL**: Operativo para consultas administrativas

### **Servicios Deshabilitados:**
- ❌ **Nginx-proxy**: Detenido temporalmente

### **Acceso Restringido:**
- 👥 **Usuarios públicos**: Ven página de mantenimiento
- 👨‍💼 **Administradores**: Acceso a API desde IPs permitidas (127.0.0.1, 172.20.0.0/16, 149.50.132.23)

---

## 🔄 PARA DESACTIVAR EL MODO MANTENIMIENTO

### **Opción 1: Restaurar configuración completa**
```bash
# 1. Detener el frontend de mantenimiento
docker stop mpd-concursos-frontend
docker rm mpd-concursos-frontend

# 2. Restaurar configuración original del nginx-proxy
docker cp /tmp/default.conf.backup mpd-concursos-nginx-proxy:/etc/nginx/conf.d/default.conf

# 3. Reiniciar servicios con docker-compose original
docker compose up -d

# 4. Verificar que todo funcione
curl -s http://localhost | head -10
```

### **Opción 2: Restaurar solo frontend**
```bash
# 1. Restaurar configuración original del frontend
docker cp mpd-concursos-app-frontend/nginx.conf mpd-concursos-frontend:/etc/nginx/conf.d/default.conf
docker exec mpd-concursos-frontend nginx -s reload

# 2. Verificar funcionamiento
curl -s http://localhost | head -10
```

---

## 📋 ARCHIVOS DE BACKUP CREADOS

### **Configuraciones respaldadas:**
1. `docker-compose.yml.backup` - Docker-compose original
2. `nginx.conf.backup.original` - Configuración nginx original (en contenedor)

### **Configuraciones de mantenimiento:**
1. `maintenance/maintenance.html` - Página de mantenimiento
2. `nginx-maintenance-simple.conf` - Configuración nginx de mantenimiento
3. `docker-compose-maintenance.yml` - Docker-compose de mantenimiento

---

## 🚨 CASOS DE EMERGENCIA

### **Si necesita acceso inmediato:**
```bash
# Detener modo mantenimiento inmediatamente
docker exec mpd-concursos-frontend cp /etc/nginx/conf.d/default.conf /tmp/maintenance.backup
docker cp mpd-concursos-app-frontend/nginx.conf mpd-concursos-frontend:/etc/nginx/conf.d/default.conf
docker exec mpd-concursos-frontend nginx -s reload
```

### **Si hay problemas con contenedores:**
```bash
# Verificar logs
docker logs mpd-concursos-frontend --tail=20
docker logs mpd-concursos-backend --tail=20

# Reiniciar servicios problemáticos
docker restart mpd-concursos-frontend
docker restart mpd-concursos-backend
```

---

## 📈 MONITOREO Y VERIFICACIÓN

### **Verificar estado actual:**
```bash
# Ver página de mantenimiento
curl -s http://localhost | grep "Proceso Finalizado"

# Estado de contenedores
docker ps --format "table {{.Names}}\t{{.Status}}"

# Health checks
curl http://localhost/health
```

### **Verificar logs de acceso:**
```bash
# Logs del frontend (usuarios intentando acceder)
docker logs mpd-concursos-frontend --tail=50

# Logs del backend (actividad administrativa)
docker logs mpd-concursos-backend --tail=50
```

---

## 📞 CONTACTOS Y SOPORTE

- **Mesa de Ayuda**: concursos_mdp_rrhh@jus.mendoza.gov.ar
- **Documentación técnica**: Este archivo
- **Logs**: `/var/log/` en contenedores correspondientes

---

## ⚠️ NOTAS IMPORTANTES

1. **API Administrativa**: Sigue funcionando desde IPs permitidas
2. **Base de Datos**: Completamente operativa para consultas
3. **Certificados SSL**: Mantenidos (nginx-proxy detenido temporalmente)
4. **Backups**: Todos los cambios están respaldados
5. **Reversibilidad**: Proceso completamente reversible

---

**Estado:** ✅ **MODO MANTENIMIENTO ACTIVO**
**Próxima acción:** Esperar instrucciones para restaurar acceso normal
