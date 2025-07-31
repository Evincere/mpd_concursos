#!/bin/bash

# Instalador de Scripts de Monitoreo - MPD Concursos
# Ubicación: /root/concursos/mpd_concursos/scripts/monitor

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           INSTALADOR DE MONITOREO - MPD CONCURSOS            ║${NC}"
echo -e "${BLUE}║                    Servidor vps-4778464-x                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que estamos ejecutando como root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Este script debe ejecutarse como root${NC}"
   echo -e "${YELLOW}💡 Ejecuta: sudo su -${NC}"
   exit 1
fi

# Verificar ubicación actual
CURRENT_DIR=$(pwd)
EXPECTED_DIR="/root/concursos/mpd_concursos/scripts/monitor"

echo -e "${CYAN}📍 Ubicación actual: ${GREEN}$CURRENT_DIR${NC}"

if [ "$CURRENT_DIR" != "$EXPECTED_DIR" ]; then
    echo -e "${YELLOW}⚠️ Se esperaba estar en: $EXPECTED_DIR${NC}"
    echo -e "${BLUE}¿Deseas continuar desde la ubicación actual? (y/N)${NC}"
    read -p "Respuesta: " continue_anyway
    
    if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}💡 Para cambiar al directorio correcto ejecuta:${NC}"
        echo -e "${GREEN}cd $EXPECTED_DIR${NC}"
        exit 1
    fi
fi

# Configuración del proyecto
PROJECT_DIR="/root/concursos/mpd_concursos"
MONITOR_DIR="/opt/mpd-monitor"

# Verificar que Docker está instalado y ejecutándose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker no está ejecutándose o no tienes permisos${NC}"
    exit 1
fi

# Verificar que los contenedores existen
echo -e "${BLUE}🔍 Verificando contenedores MPD Concursos...${NC}"
containers_found=0

if docker ps | grep -q "mpd-concursos-mysql-prod"; then
    echo -e "${GREEN}  ✅ MySQL (mpd-concursos-mysql-prod)${NC}"
    ((containers_found++))
else
    echo -e "${RED}  ❌ MySQL no encontrado${NC}"
fi

if docker ps | grep -q "mpd-concursos-backend-prod"; then
    echo -e "${GREEN}  ✅ Backend (mpd-concursos-backend-prod)${NC}"
    ((containers_found++))
else
    echo -e "${RED}  ❌ Backend no encontrado${NC}"
fi

if docker ps | grep -q "mpd-concursos-frontend-prod"; then
    echo -e "${GREEN}  ✅ Frontend (mpd-concursos-frontend-prod)${NC}"
    ((containers_found++))
else
    echo -e "${RED}  ❌ Frontend no encontrado${NC}"
fi

if [ $containers_found -eq 0 ]; then
    echo -e "${RED}❌ No se encontraron contenedores MPD Concursos${NC}"
    echo -e "${YELLOW}💡 Asegúrate de que los servicios estén ejecutándose${NC}"
    exit 1
elif [ $containers_found -lt 3 ]; then
    echo -e "${YELLOW}⚠️ Solo se encontraron $containers_found de 3 contenedores${NC}"
    echo -e "${BLUE}¿Deseas continuar con la instalación? (y/N)${NC}"
    read -p "Respuesta: " continue_partial
    
    if [[ ! "$continue_partial" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Verificaciones iniciales completadas${NC}"
echo ""

# Verificar que los archivos de script existen
required_files=("db-monitor.sh" "log-monitor.sh")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo -e "${RED}❌ Archivos faltantes: ${missing_files[*]}${NC}"
    echo -e "${YELLOW}💡 Asegúrate de que todos los archivos estén en el directorio actual${NC}"
    exit 1
fi

# Crear directorio para scripts de monitoreo
echo -e "${BLUE}📁 Creando directorio de monitoreo: $MONITOR_DIR${NC}"
mkdir -p $MONITOR_DIR

# Copiar los scripts principales
echo -e "${BLUE}📋 Copiando scripts de monitoreo...${NC}"
cp db-monitor.sh $MONITOR_DIR/
cp log-monitor.sh $MONITOR_DIR/
chmod +x $MONITOR_DIR/db-monitor.sh
chmod +x $MONITOR_DIR/log-monitor.sh

# Crear enlaces simbólicos para acceso global
echo -e "${BLUE}🔗 Creando enlaces simbólicos...${NC}"
ln -sf $MONITOR_DIR/db-monitor.sh /usr/local/bin/db-monitor
ln -sf $MONITOR_DIR/log-monitor.sh /usr/local/bin/log-monitor

# Crear script de backup automático
echo -e "${BLUE}💾 Creando script de backup...${NC}"
cat > $MONITOR_DIR/backup-db.sh << 'EOF'
#!/bin/bash

# Script de Backup Automático - MPD Concursos
BACKUP_DIR="/opt/mpd-monitor/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="mpd-concursos-mysql-prod"
DB_NAME="mpd_concursos"
DB_USER="root"
DB_PASS="root1234"

mkdir -p $BACKUP_DIR

echo "🔄 Iniciando backup de base de datos..."
docker exec $DB_CONTAINER mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_${DATE}.sql

if [ $? -eq 0 ]; then
    echo "✅ Backup completado: backup_${DATE}.sql"
    # Mantener solo los últimos 7 backups
    cd $BACKUP_DIR && ls -t backup_*.sql | tail -n +8 | xargs -r rm
    echo "🧹 Limpieza de backups antiguos completada"
else
    echo "❌ Error en el backup"
    exit 1
fi
EOF

chmod +x $MONITOR_DIR/backup-db.sh
ln -sf $MONITOR_DIR/backup-db.sh /usr/local/bin/backup-db

# Crear script de limpieza de Docker
echo -e "${BLUE}🧹 Creando script de limpieza...${NC}"
cat > $MONITOR_DIR/cleanup-docker.sh << 'EOF'
#!/bin/bash

# Script de Limpieza de Docker - MPD Concursos
echo "🧹 Iniciando limpieza de Docker..."

echo "📦 Eliminando imágenes sin etiqueta..."
docker image prune -f

echo "📁 Eliminando volúmenes no utilizados..."
docker volume prune -f

echo "🌐 Eliminando redes no utilizadas..."
docker network prune -f

echo "🗑️ Limpieza general del sistema..."
docker system prune -f

echo "✅ Limpieza completada"
EOF

chmod +x $MONITOR_DIR/cleanup-docker.sh
ln -sf $MONITOR_DIR/cleanup-docker.sh /usr/local/bin/cleanup-docker

# Crear cron job para backup diario
echo -e "${BLUE}⏰ Configurando backup automático diario...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-db >> /var/log/mpd-backup.log 2>&1") | crontab -

# Crear archivo de configuración
echo -e "${BLUE}⚙️ Creando archivo de configuración...${NC}"
cat > $MONITOR_DIR/config.conf << EOF
# Configuración MPD Monitor Tools
PROJECT_DIR=$PROJECT_DIR
DB_CONTAINER=mpd-concursos-mysql-prod
DB_NAME=mpd_concursos
DB_USER=root
DB_PASS=root1234
BACKEND_CONTAINER=mpd-concursos-backend-prod
FRONTEND_CONTAINER=mpd-concursos-frontend-prod
BACKUP_RETENTION_DAYS=7
LOG_LEVEL=INFO
EOF

# Crear directorio de logs
mkdir -p /var/log/mpd-monitor
touch /var/log/mpd-backup.log
chmod 644 /var/log/mpd-backup.log

# Crear script de actualización
echo -e "${BLUE}🔄 Creando script de actualización...${NC}"
cat > $MONITOR_DIR/update-monitor.sh << EOF
#!/bin/bash

# Script de Actualización de Herramientas de Monitoreo MPD
echo "🔄 Actualizando herramientas de monitoreo..."

MONITOR_SOURCE="$PROJECT_DIR/scripts/monitor"

if [ -f "\$MONITOR_SOURCE/db-monitor.sh" ]; then
    cp \$MONITOR_SOURCE/db-monitor.sh $MONITOR_DIR/
    chmod +x $MONITOR_DIR/db-monitor.sh
    echo "✅ db-monitor actualizado"
fi

if [ -f "\$MONITOR_SOURCE/log-monitor.sh" ]; then
    cp \$MONITOR_SOURCE/log-monitor.sh $MONITOR_DIR/
    chmod +x $MONITOR_DIR/log-monitor.sh
    echo "✅ log-monitor actualizado"
fi

echo "🎉 Actualización completada"
EOF

chmod +x $MONITOR_DIR/update-monitor.sh
ln -sf $MONITOR_DIR/update-monitor.sh /usr/local/bin/update-monitor

echo ""
echo -e "${GREEN}🎉 INSTALACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 COMANDOS DISPONIBLES:${NC}"
echo -e "${GREEN}  db-monitor${NC}      - Monitor interactivo de base de datos"
echo -e "${GREEN}  log-monitor${NC}     - Monitor de logs en tiempo real"
echo -e "${GREEN}  backup-db${NC}       - Backup manual de base de datos"
echo -e "${GREEN}  cleanup-docker${NC}  - Limpieza de recursos Docker"
echo -e "${GREEN}  update-monitor${NC}  - Actualizar herramientas de monitoreo"
echo ""
echo -e "${YELLOW}📁 UBICACIONES:${NC}"
echo -e "${GREEN}  Proyecto:${NC} $PROJECT_DIR"
echo -e "${GREEN}  Scripts:${NC}  $MONITOR_DIR"
echo -e "${GREEN}  Backups:${NC}  $MONITOR_DIR/backups"
echo -e "${GREEN}  Logs:${NC}     /var/log/mpd-monitor"
echo ""
echo -e "${YELLOW}⏰ TAREAS AUTOMÁTICAS:${NC}"
echo -e "${GREEN}  Backup diario:${NC} 02:00 AM (configurado en crontab)"
echo ""
echo -e "${BLUE}💡 Para comenzar, ejecuta cualquiera de estos comandos:${NC}"
echo -e "${CYAN}  db-monitor      ${NC}# Para consultas de base de datos"
echo -e "${CYAN}  log-monitor     ${NC}# Para monitoreo de logs"
echo ""
echo -e "${YELLOW}🔧 Tu script de deploy existente no se ve afectado:${NC}"
echo -e "${GREEN}  deploy-production.sh${NC} sigue funcionando normalmente"
echo ""
