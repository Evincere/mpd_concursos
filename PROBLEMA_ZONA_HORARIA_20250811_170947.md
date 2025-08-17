# 🕒 PROBLEMA CRÍTICO: Zona Horaria Incorrecta en Contenedores

**Fecha de detección:** $(date '+%Y-%m-%d %H:%M:%S %Z')
**Prioridad:** ALTA - Afecta integridad de timestamps
**Estado:** IDENTIFICADO - PENDIENTE DE CORRECCIÓN

---

## 📋 DESCRIPCIÓN DEL PROBLEMA

Los contenedores Docker están ejecutándose con **zona horaria UTC** mientras que el sistema debería usar **America/Argentina/Mendoza (UTC-3)**.

### Síntomas Observados:
- **Hora real en Mendoza:** 17:08 (Argentina/Buenos_Aires UTC-3)
- **Hora en contenedores:** 20:08 (UTC)
- **Diferencia:** +3 horas (contenedores adelantados)

---

## 🔍 DIAGNÓSTICO DETALLADO

### Estado Actual de Zonas Horarias:

**Sistema Host:**
- ✅ **Hora:** 17:08 -03 (CORRECTO)
- ✅ **Zona:** America/Argentina/Buenos_Aires (CORRECTO)

**Contenedor MySQL:**
- ❌ **Hora:** 20:08 UTC (INCORRECTO - 3h adelantado)
- ⚠️ **system_time_zone:** UTC 
- ⚠️ **session time_zone:** -03:00 (configurado pero no efectivo)

**Contenedor Backend:**
- ❌ **Hora:** 20:08 UTC (INCORRECTO - 3h adelantado)
- ❌ **ServerTimezone:** UTC (en SPRING_DATASOURCE_URL)

**Contenedor Frontend:**
- ❌ **Hora:** 20:08 UTC (INCORRECTO - 3h adelantado)

---

## 📂 ANÁLISIS DE CONFIGURACIÓN

### Archivos Docker Compose:

**🔴 ARCHIVO ACTUAL (docker-compose.ssl.yml):**
```yaml
SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/${MYSQL_DATABASE}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
```

**✅ ARCHIVO CORREGIDO (docker-compose-timezone-fixed.yml):**
```yaml
# MySQL
TZ: America/Argentina/Mendoza
command: --default-time-zone='-03:00'
volumes:
  - /etc/timezone:/etc/timezone:ro
  - /etc/localtime:/etc/localtime:ro

# Backend  
TZ: America/Argentina/Mendoza
JAVA_OPTS: "-Xmx1g -Xms512m -Duser.timezone=America/Argentina/Mendoza"
SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/mpd_concursos?useSSL=false&serverTimezone=America/Argentina/Mendoza&allowPublicKeyRetrieval=true

# Frontend
TZ: America/Argentina/Mendoza
volumes:
  - /etc/timezone:/etc/timezone:ro
  - /etc/localtime:/etc/localtime:ro
```

---

## 🚨 IMPACTO DEL PROBLEMA

### Afectaciones Actuales:

1. **📊 Timestamps en Base de Datos:**
   - Todos los registros tienen +3 horas
   - `upload_date`, `inscription_date`, `updated_at` incorrectos

2. **📈 Reportes y Análisis:**
   - Métricas de actividad distorsionadas
   - Seguimiento temporal inexacto

3. **👥 Experiencia de Usuario:**
   - Usuarios ven horarios incorrectos
   - Fechas límite confusas

4. **🔍 Auditoría y Logs:**
   - Trazabilidad temporal incorrecta
   - Logs con timestamps UTC vs local

---

## 🔧 SOLUCIÓN IDENTIFICADA

### Opción 1: Usar Docker Compose Corregido (RECOMENDADO)
```bash
# Detener servicios actuales
docker-compose -f docker-compose.ssl.yml down

# Iniciar con configuración corregida
docker-compose -f docker-compose-timezone-fixed.yml up -d
```

### Opción 2: Corregir Archivo Actual
Modificar `docker-compose.ssl.yml` para incluir:
- Variables `TZ: America/Argentina/Mendoza`
- `serverTimezone=America/Argentina/Mendoza`
- Volúmenes de timezone
- Comandos de timezone para MySQL

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### Antes de Aplicar la Corrección:

1. **📅 Backup de Base de Datos:**
   ```bash
   docker exec mpd-concursos-mysql mysqldump -uroot -proot1234 mpd_concursos > backup_pre_timezone_fix.sql
   ```

2. **🕒 Corrección de Timestamps Existentes:**
   - Los registros actuales tienen +3 horas
   - Evaluar si es necesario corregir datos históricos
   - Considerar mantener UTC internamente y convertir en presentación

3. **🔄 Tiempo de Inactividad:**
   - La corrección requiere reinicio de contenedores
   - Planificar ventana de mantenimiento

---

## 📋 EJEMPLOS DE REGISTROS AFECTADOS

### Actividad Reciente Detectada:
- **Agostina Mondello:** documentos "subidos" a 20:01-20:02
- **Carmen Mariela López:** documentos "subidos" a 19:06-19:11
- **Hora real aproximada:** 17:01-17:02 y 16:06-16:11

### Diferencia Sistemática:
- **Todos los timestamps:** +3 horas vs hora real
- **Afecta:** upload_date, inscription_date, updated_at, created_at

---

## 🎯 PLAN DE CORRECCIÓN RECOMENDADO

### Paso 1: Preparación
1. Crear backup completo de la base de datos
2. Documentar estado actual de timestamps críticos
3. Notificar a usuarios sobre mantenimiento programado

### Paso 2: Implementación
1. Detener contenedores actuales
2. Aplicar configuración con timezone correcto
3. Reiniciar servicios con nueva configuración

### Paso 3: Verificación
1. Confirmar que contenedores usan timezone correcto
2. Verificar que nuevos registros tienen timestamps correctos
3. Monitorear funcionamiento general

### Paso 4: Corrección de Datos (Opcional)
1. Evaluar necesidad de corregir datos históricos
2. Si es necesario, ejecutar UPDATE masivo con -3 horas
3. Verificar integridad post-corrección

---

## 📊 COMANDOS DE VERIFICACIÓN POST-CORRECCIÓN

```bash
# Verificar timezone en contenedores
docker exec mpd-concursos-mysql date
docker exec mpd-concursos-backend date

# Verificar timezone en MySQL
docker exec mpd-concursos-mysql mysql -uroot -proot1234 -e "SELECT NOW(), @@system_time_zone, @@time_zone;"

# Verificar nuevos registros
docker exec mpd-concursos-mysql mysql -uroot -proot1234 -D mpd_concursos -e "SELECT NOW() as current_time, MAX(upload_date) as latest_upload FROM documents;"
```

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### Esta Sesión:
1. **Crear backup** de base de datos actual
2. **Documentar timestamps** críticos para comparación
3. **Planificar momento** de aplicación de corrección

### Próxima Sesión:
1. **Aplicar corrección** de timezone
2. **Verificar funcionamiento** post-corrección
3. **Monitorear nuevos registros** con timestamps correctos

---

## 📞 COMUNICACIÓN REQUERIDA

### Usuarios a Notificar:
- Administradores del sistema
- Usuarios activos recientes (por posible breve interrupción)

### Mensaje Sugerido:
*"Se detectó un problema de zona horaria en el sistema que será corregido en breve. Los horarios mostrados pueden tener una diferencia de 3 horas hasta la corrección. Sus datos están seguros y la funcionalidad no se ve afectada."*

---

## ✅ CONCLUSIÓN

**Problema:** Zona horaria UTC en lugar de America/Argentina/Mendoza
**Impacto:** Timestamps +3 horas vs hora real
**Solución:** Disponible en `docker-compose-timezone-fixed.yml`
**Urgencia:** ALTA - Afecta integridad temporal del sistema

**La corrección es técnicamente sencilla pero requiere planificación para minimizar impacto en usuarios.**

---

*Reporte de problema creado - Sistema MPD Concursos*
*Estado: PROBLEMA IDENTIFICADO Y DOCUMENTADO*
*Prioridad: CORRECCIÓN INMEDIATA REQUERIDA*
