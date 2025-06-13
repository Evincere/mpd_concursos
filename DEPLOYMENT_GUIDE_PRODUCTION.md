# 🚀 GUÍA DE DEPLOYMENT A PRODUCCIÓN - SISTEMA MPD CONCURSOS

## 📋 **ESTADO ACTUAL DEL SISTEMA**

### ✅ **AUDITORÍA JPA-DATABASE COMPLETADA**
- **17 entidades JPA** auditadas y corregidas al 100%
- **Schema.sql** completamente alineado con entidades JPA
- **Data.sql** corregido y funcional
- **Convención snake_case** aplicada sistemáticamente
- **Backend compila y funciona** sin errores

### 🎯 **CORRECCIONES APLICADAS**
- **76+ campos** corregidos de camelCase a snake_case
- **14 entidades** completamente refactorizadas
- **Eliminación total** de errores "Unknown column"
- **Sistema 100% consistente** JPA-Database

---

## 🔧 **PASOS PARA DEPLOYMENT EN PRODUCCIÓN**

### **PASO 1: PREPARACIÓN DEL SERVIDOR**

#### 1.1 Backup de la base de datos actual
```bash
# Conectar al servidor de producción
ssh usuario@servidor-produccion

# Crear backup de la base de datos
mysqldump -u root -p mpd_concursos > backup_pre_deployment_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2 Detener servicios actuales
```bash
# Detener contenedores Docker
cd /path/to/mpd-concursos
docker-compose down

# Verificar que no hay procesos ejecutándose
docker ps -a
```

### **PASO 2: ACTUALIZACIÓN DEL CÓDIGO**

#### 2.1 Actualizar repositorio
```bash
# Actualizar código desde repositorio
git pull origin main

# Verificar que estamos en el commit correcto
git log --oneline -5
```

#### 2.2 Verificar archivos críticos
```bash
# Verificar schema.sql actualizado
head -20 concurso-backend/src/main/resources/schema.sql

# Verificar data.sql corregido
grep -n "is_active\|parent_id" concurso-backend/src/main/resources/data.sql
```

### **PASO 3: RECREACIÓN DE LA BASE DE DATOS**

#### 3.1 Eliminar base de datos existente
```bash
# Conectar a MySQL
mysql -u root -p

# Eliminar y recrear base de datos
DROP DATABASE IF EXISTS mpd_concursos;
CREATE DATABASE mpd_concursos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

#### 3.2 Verificar configuración de Docker
```bash
# Verificar docker-compose.yml
cat docker-compose.yml | grep -A 10 -B 5 "DB_HOST\|MYSQL"

# Asegurar que las variables de entorno están correctas
grep -E "DB_HOST|MYSQL" .env
```

### **PASO 4: DEPLOYMENT CON DOCKER**

#### 4.1 Reconstruir imágenes desde cero
```bash
# Limpiar imágenes y contenedores anteriores
docker system prune -a -f

# Reconstruir todo desde cero
docker-compose build --no-cache

# Verificar imágenes creadas
docker images | grep mpd
```

#### 4.2 Iniciar servicios
```bash
# Iniciar servicios en orden
docker-compose up -d mysql

# Esperar que MySQL esté listo (30-60 segundos)
sleep 60

# Verificar que MySQL está funcionando
docker-compose logs mysql | tail -20

# Iniciar backend
docker-compose up -d backend

# Verificar logs del backend
docker-compose logs backend | tail -30
```

### **PASO 5: VERIFICACIÓN POST-DEPLOYMENT**

#### 5.1 Verificar estado de contenedores
```bash
# Verificar que todos los contenedores están ejecutándose
docker-compose ps

# Verificar logs de todos los servicios
docker-compose logs --tail=50
```

#### 5.2 Verificar base de datos
```bash
# Conectar a la base de datos
mysql -u root -p mpd_concursos

# Verificar que las tablas se crearon correctamente
SHOW TABLES;

# Verificar estructura de tablas críticas
DESCRIBE user_entity;
DESCRIBE contests;
DESCRIBE document_types;

# Verificar datos de prueba
SELECT COUNT(*) FROM contests;
SELECT COUNT(*) FROM document_types;
SELECT COUNT(*) FROM roles;

exit
```

#### 5.3 Verificar API del backend
```bash
# Verificar que el backend responde
curl -s -w "HTTP_CODE:%{http_code}" http://localhost:8080/api/health

# Verificar endpoint de concursos públicos
curl -s http://localhost:8080/api/contests/public | head -10

# Verificar que no hay errores en logs
docker-compose logs backend | grep -i error | tail -10
```

### **PASO 6: INICIAR FRONTEND**

#### 6.1 Iniciar frontend
```bash
# Iniciar frontend
docker-compose up -d frontend

# Verificar logs del frontend
docker-compose logs frontend | tail -20
```

#### 6.2 Verificar acceso completo
```bash
# Verificar que el frontend está accesible
curl -s -w "HTTP_CODE:%{http_code}" http://localhost:8000

# Verificar proxy nginx
docker-compose logs nginx | tail -10
```

---

## 🔍 **VERIFICACIÓN EN PRODUCCIÓN**

### **Checklist de Verificación**

#### ✅ **Base de Datos**
- [ ] MySQL iniciado correctamente
- [ ] Todas las tablas creadas con snake_case
- [ ] Datos de prueba insertados sin errores
- [ ] Foreign keys funcionando correctamente

#### ✅ **Backend**
- [ ] Backend iniciado sin errores SQL
- [ ] Endpoints API respondiendo
- [ ] Logs sin errores "Unknown column"
- [ ] Autenticación funcionando

#### ✅ **Frontend**
- [ ] Frontend accesible en puerto 8000
- [ ] Proxy nginx funcionando
- [ ] Comunicación frontend-backend exitosa

#### ✅ **Funcionalidad**
- [ ] Login de usuarios funcionando
- [ ] Listado de concursos visible
- [ ] Registro de usuarios operativo
- [ ] Carga de documentos funcional

---

## 🚨 **PLAN DE ROLLBACK**

### **En caso de problemas:**

#### 1. Restaurar base de datos
```bash
# Detener servicios
docker-compose down

# Restaurar backup
mysql -u root -p mpd_concursos < backup_pre_deployment_YYYYMMDD_HHMMSS.sql
```

#### 2. Revertir código
```bash
# Volver al commit anterior
git log --oneline -10
git checkout <commit-anterior>
```

#### 3. Reconstruir con versión anterior
```bash
# Reconstruir con código anterior
docker-compose build --no-cache
docker-compose up -d
```

---

## 📞 **CONTACTO Y SOPORTE**

- **Desarrollador**: Sistema MPD Concursos
- **Fecha de deployment**: $(date)
- **Versión**: Post-auditoría JPA-Database completa
- **Commit**: d609e2c - Sistema JPA-Database 100% funcional

---

## 📝 **NOTAS IMPORTANTES**

1. **Tiempo estimado**: 15-30 minutos para deployment completo
2. **Downtime**: Aproximadamente 5-10 minutos
3. **Backup obligatorio**: Siempre hacer backup antes del deployment
4. **Verificación exhaustiva**: Probar todas las funcionalidades críticas
5. **Monitoreo**: Supervisar logs durante las primeras horas post-deployment
