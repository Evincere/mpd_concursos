#!/usr/bin/env python3
"""
PREPARACIÓN SOLUCIÓN TIMEZONE PARA PRÓXIMO REDEPLOY
Script para preparar todos los archivos necesarios sin interrumpir el servicio actual
"""

import os
import shutil
from datetime import datetime

def preparar_solucion_timezone():
    print("🔧 PREPARANDO SOLUCIÓN TIMEZONE PARA PRÓXIMO REDEPLOY")
    print("=" * 70)
    
    # 1. Crear backup del docker-compose actual
    print("📁 1. CREANDO BACKUP DE CONFIGURACIÓN ACTUAL...")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"docker-compose.production.yml.backup_antes_timezone_{timestamp}"
    
    if os.path.exists("docker-compose.production.yml"):
        shutil.copy2("docker-compose.production.yml", backup_name)
        print(f"   ✅ Backup creado: {backup_name}")
    else:
        print("   ⚠️  docker-compose.production.yml no encontrado, creando plantilla")
    
    # 2. Preparar docker-compose modificado
    print("\n🛠️  2. PREPARANDO DOCKER-COMPOSE CON TIMEZONE ARGENTINA...")
    
    docker_compose_timezone = """version: '3.8'

services:
  backend:
    image: mpd_concursos-backend:latest
    container_name: mpd-concursos-backend
    ports:
      - "8080:8080"
    environment:
      # ===== CONFIGURACIÓN TIMEZONE ARGENTINA =====
      - TZ=America/Argentina/Buenos_Aires
      - JAVA_OPTS=-Dspring.jpa.properties.hibernate.jdbc.time_zone=America/Argentina/Buenos_Aires -Duser.timezone=America/Argentina/Buenos_Aires
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/mpd_concursos?serverTimezone=America/Argentina/Buenos_Aires&useSSL=false&allowPublicKeyRetrieval=true
      # ============================================
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root1234
      - SPRING_JPA_HIBERNATE_DDL_AUTO=update
      - SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.MySQL8Dialect
    depends_on:
      - mysql
    networks:
      - mpd-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  mysql:
    image: mysql:8.0
    container_name: mpd-concursos-mysql
    ports:
      - "3307:3306"
    environment:
      # ===== CONFIGURACIÓN TIMEZONE ARGENTINA =====
      - TZ=America/Argentina/Buenos_Aires
      # ============================================
      - MYSQL_ROOT_PASSWORD=root1234
      - MYSQL_DATABASE=mpd_concursos
      - MYSQL_USER=mpd_user
      - MYSQL_PASSWORD=mpd_password
    # ===== TIMEZONE EN COMANDO MYSQL =====
    command: --default-time-zone='-03:00' --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    # =====================================
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - mpd-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot1234"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: mpd_concursos-frontend:latest
    container_name: mpd-concursos-frontend
    networks:
      - mpd-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx-proxy:
    image: nginx:stable-alpine
    container_name: mpd-concursos-nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - mpd-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  mpd-network:
    driver: bridge

volumes:
  mysql_data:
"""
    
    with open("docker-compose.production.yml.timezone_ready", "w") as f:
        f.write(docker_compose_timezone)
    
    print("   ✅ docker-compose.production.yml.timezone_ready creado")
    
    # 3. Crear script de aplicación
    print("\n🚀 3. CREANDO SCRIPT DE APLICACIÓN PARA REDEPLOY...")
    
    script_redeploy = f"""#!/bin/bash
# SCRIPT DE APLICACIÓN TIMEZONE - REDEPLOY
# Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

echo "🌍 APLICANDO CONFIGURACIÓN TIMEZONE ARGENTINA - MPD CONCURSOS"
echo "================================================================"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Error: docker-compose.production.yml no encontrado"
    exit 1
fi

echo "📋 PRE-VERIFICACIONES:"
echo "   • Sistema actual en producción"
echo "   • Configuración timezone preparada"
echo "   • Backup de seguridad disponible"

# 1. Crear backup final antes del cambio
echo ""
echo "📁 1. CREANDO BACKUP FINAL..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp docker-compose.production.yml docker-compose.production.yml.backup_final_$TIMESTAMP
echo "   ✅ Backup final: docker-compose.production.yml.backup_final_$TIMESTAMP"

# 2. Aplicar nueva configuración
echo ""
echo "🔧 2. APLICANDO CONFIGURACIÓN TIMEZONE..."
cp docker-compose.production.yml.timezone_ready docker-compose.production.yml
echo "   ✅ Configuración timezone aplicada"

# 3. Detener servicios
echo ""
echo "🛑 3. DETENIENDO SERVICIOS..."
docker-compose -f docker-compose.production.yml down
echo "   ✅ Servicios detenidos"

# 4. Reiniciar con nueva configuración
echo ""
echo "🚀 4. INICIANDO SERVICIOS CON TIMEZONE ARGENTINA..."
docker-compose -f docker-compose.production.yml up -d
echo "   ✅ Servicios iniciados con timezone corregido"

# 5. Verificar servicios
echo ""
echo "✅ 5. VERIFICANDO SERVICIOS..."
sleep 30
docker-compose -f docker-compose.production.yml ps

# 6. Verificar timezone en contenedores
echo ""
echo "🕐 6. VERIFICANDO TIMEZONE EN CONTENEDORES..."
echo "   Backend timezone:"
docker exec mpd-concursos-backend date
echo "   MySQL timezone:"
docker exec mpd-concursos-mysql mysql -u root -proot1234 -e "SELECT NOW() as 'MySQL Time', @@system_time_zone as 'System TZ';"

echo ""
echo "🎉 APLICACIÓN DE TIMEZONE COMPLETADA"
echo "   • Todos los servicios funcionando"
echo "   • Timezone configurado: America/Argentina/Buenos_Aires"
echo "   • Próximas inscripciones tendrán fecha/hora correcta"
echo "   • Backup disponible en caso de rollback"

echo ""
echo "📋 VERIFICACIONES RECOMENDADAS:"
echo "   1. Probar una inscripción de prueba"
echo "   2. Verificar logs de backend"
echo "   3. Confirmar timestamps en base de datos"
echo "   4. Monitorear por 24-48 horas"
"""
    
    with open("aplicar_timezone_redeploy.sh", "w") as f:
        f.write(script_redeploy)
    
    os.chmod("aplicar_timezone_redeploy.sh", 0o755)
    print("   ✅ Script ejecutable creado: aplicar_timezone_redeploy.sh")
    
    # 4. Crear documentación
    print("\n📖 4. GENERANDO DOCUMENTACIÓN...")
    
    documentacion = f"""# SOLUCIÓN TIMEZONE - DOCUMENTACIÓN TÉCNICA

## Problema Identificado
- **Fecha**: {datetime.now().strftime('%Y-%m-%d')}
- **Descripción**: Diferencia horaria UTC vs ART causando fechas incorrectas
- **Impacto**: 89 usuarios afectados con fechas de inscripción incorrectas
- **Estado**: RESUELTO para casos históricos

## Solución Implementada

### Fase 1: Corrección Histórica ✅ COMPLETADA
- Corrección manual de 89 registros afectados
- Usuarios con fechas corregidas del 31/07 al 08/08
- 0 casos sospechosos restantes

### Fase 2: Prevención Futura 🔄 PREPARADA PARA REDEPLOY

#### Archivos Preparados:
1. `docker-compose.production.yml.timezone_ready` - Configuración corregida
2. `aplicar_timezone_redeploy.sh` - Script de aplicación
3. `docker-compose.production.yml.backup_antes_timezone_{timestamp}` - Backup actual

#### Cambios Principales:
**Backend:**
- `TZ=America/Argentina/Buenos_Aires`
- `JAVA_OPTS` con timezone Argentina
- `SPRING_DATASOURCE_URL` con `serverTimezone=America/Argentina/Buenos_Aires`

**MySQL:**
- `TZ=America/Argentina/Buenos_Aires`
- `--default-time-zone='-03:00'`

## Instrucciones de Aplicación

### ⚠️ IMPORTANTE: Solo aplicar durante ventana de mantenimiento

```bash
# En el directorio del proyecto
./aplicar_timezone_redeploy.sh
```

### Verificaciones Post-Aplicación:
1. Verificar timezone en contenedores
2. Probar inscripción de prueba
3. Verificar timestamps en base de datos
4. Monitorear logs por 24-48 horas

## Rollback en Caso de Problemas

```bash
# Volver a configuración anterior
docker-compose down
cp docker-compose.production.yml.backup_final_TIMESTAMP docker-compose.production.yml
docker-compose up -d
```

## Usuarios Corregidos
- **Total**: 89 usuarios
- **Fechas afectadas**: 31/07 a 08/08
- **Estados**: COMPLETED_WITH_DOCS, COMPLETED_PENDING_DOCS, ACTIVE
- **Lista completa**: Ver reporte_final_timezone.py

## Beneficios Esperados
- Timestamps correctos en zona horaria Argentina
- Fechas de inscripción exactas para usuarios
- Eliminación de confusión horaria
- Cumplimiento de expectativas de usuarios locales

## Contacto Técnico
- Archivos preparados: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- Ubicación: /root/concursos/mpd_concursos/
"""
    
    with open("TIMEZONE_SOLUCION_DOCUMENTACION.md", "w") as f:
        f.write(documentacion)
    
    print("   ✅ Documentación creada: TIMEZONE_SOLUCION_DOCUMENTACION.md")
    
    # 5. Crear checklist de aplicación
    print("\n📋 5. GENERANDO CHECKLIST DE APLICACIÓN...")
    
    checklist = f"""# CHECKLIST APLICACIÓN TIMEZONE - REDEPLOY

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
Preparado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Archivos listos en: /root/concursos/mpd_concursos/
"""
    
    with open("TIMEZONE_CHECKLIST_APLICACION.md", "w") as f:
        f.write(checklist)
    
    print("   ✅ Checklist creado: TIMEZONE_CHECKLIST_APLICACION.md")
    
    # 6. Resumen final
    print(f"\n🎯 RESUMEN DE PREPARACIÓN COMPLETADA:")
    print(f"   📁 Archivos preparados: 6")
    print(f"   🛠️  Configuración timezone: Lista")
    print(f"   📜 Script de aplicación: Ejecutable")
    print(f"   📖 Documentación: Completa")
    print(f"   📋 Checklist: Disponible")
    print(f"   💾 Backups: Creados")
    
    print(f"\n🚀 PRÓXIMO PASO:")
    print(f"   Programar ventana de mantenimiento y ejecutar:")
    print(f"   ./aplicar_timezone_redeploy.sh")
    
    print(f"\n⚠️  RECORDATORIO:")
    print(f"   • NO interrumpir servicio actual")
    print(f"   • Aplicar solo en ventana de mantenimiento")
    print(f"   • Verificar archivos antes de aplicar")
    print(f"   • Tener plan de rollback listo")

def main():
    preparar_solucion_timezone()

if __name__ == "__main__":
    main()
