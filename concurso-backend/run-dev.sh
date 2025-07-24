#!/bin/bash
# Script para ejecutar la aplicación en modo desarrollo con variables de entorno
# Fecha: 2025-07-15

echo "=== INICIANDO APLICACIÓN EN MODO DESARROLLO ==="
echo ""

# Configurar variables de entorno para la sesión actual
echo "🔧 Configurando variables de entorno..."

# Variables de base de datos
export DB_USERNAME="root"
export DB_PASSWORD="root1234"
export DB_HOST="localhost"
export DB_PORT="3306"
export DB_NAME="mpd_concursos"

# Variables de Spring
export SPRING_PROFILES_ACTIVE="dev,debug"

# Variables de JWT (generar una clave temporal para desarrollo)
export JWT_SECRET="desarrollo_jwt_secret_muy_largo_y_seguro_para_testing_local_solamente_no_usar_en_produccion_256_bits_minimo"
export JWT_EXPIRATION="86400000"

# Variables de almacenamiento
export DOCUMENT_STORAGE_LOCATION="./document-storage"
export MAX_FILE_SIZE="10485760"

# Variables de CORS
export CORS_ALLOWED_ORIGINS="http://localhost:4200,http://localhost:8000"

# Variables de diagnóstico
export SECURITY_DIAGNOSTIC_ENABLED="true"

# Variables de logging
export LOG_LEVEL="DEBUG"
export LOG_DIR="./logs"

# Variables de debugging JPA/Hibernate
export HIBERNATE_SHOW_SQL="true"
export HIBERNATE_FORMAT_SQL="true"
export HIBERNATE_SQL_COMMENTS="true"

echo "✅ Variables de entorno configuradas:"
echo "   DB_USERNAME: $DB_USERNAME"
echo "   DB_HOST: $DB_HOST"
echo "   SPRING_PROFILES_ACTIVE: $SPRING_PROFILES_ACTIVE"
echo ""

echo "🚀 Iniciando aplicación Spring Boot..."
echo "   Perfil activo: $SPRING_PROFILES_ACTIVE"
echo "   Puerto: 8080"
echo ""
echo "📝 Para detener la aplicación, presiona Ctrl+C"
echo ""

# Ejecutar la aplicación (usar mvn si mvnw no está disponible)
if [ -f "./mvnw" ]; then
    ./mvnw spring-boot:run
elif [ -f "./mvnw.cmd" ]; then
    cmd //c "mvnw.cmd spring-boot:run"
else
    mvn spring-boot:run
fi

echo ""
echo "=== APLICACIÓN DETENIDA ==="