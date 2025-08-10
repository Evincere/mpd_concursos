# CHECKLIST APLICACIÓN TIMEZONE - REDEPLOY

## PRE-APLICACIÓN ✅
- [ ] Notificar a usuarios del mantenimiento programado
- [ ] Confirmar horario de baja demanda (ej: madrugada)
- [ ] Verificar que todos los archivos están preparados
- [ ] Confirmar acceso a servidor de producción
- [ ] Tener contacto de emergencia disponible

## DURANTE LA APLICACIÓN 🔄
- [ ] Ejecutar `./aplicar_timezone_redeploy.sh`
- [ ] Verificar que servicios se detienen correctamente
- [ ] Confirmar que servicios reinician sin errores
- [ ] Verificar timezone en contenedores backend y MySQL
- [ ] Probar acceso web básico

## POST-APLICACIÓN ✅
- [ ] Realizar inscripción de prueba y verificar timestamp
- [ ] Verificar logs de backend por errores
- [ ] Monitorear base de datos por timestamps correctos
- [ ] Confirmar que aplicación responde normalmente
- [ ] Notificar usuarios que mantenimiento terminó

## VERIFICACIONES 24-48 HORAS ⏰
- [ ] Monitorear nuevas inscripciones
- [ ] Verificar que no hay reclamos por fechas
- [ ] Revisar logs por errores relacionados a timezone
- [ ] Confirmar rendimiento normal del sistema

## EN CASO DE PROBLEMAS 🚨
- [ ] Ejecutar rollback inmediatamente
- [ ] Notificar a usuarios del problema
- [ ] Investigar causa del fallo
- [ ] Reprogramar aplicación con correcciones

---
Preparado: 2025-08-08 22:23:38
Archivos listos en: /root/concursos/mpd_concursos/
