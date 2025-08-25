#!/bin/bash
echo "=== VERIFICACIÓN POST-DEPLOY ==="
echo "1. Verificando contenedores..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "2. Verificando volúmenes..."
docker volume ls | grep mpd_concursos

echo "3. Verificando datos críticos..."
docker exec mpd-concursos-mysql mysql -uroot -proot1234 -D mpd_concursos -e "SELECT COUNT(*) as 'Total Usuarios' FROM user_entity; SELECT COUNT(*) as 'Total Inscripciones' FROM inscriptions;"

echo "4. Test de conectividad..."
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost/
curl -s -o /dev/null -w "Backend API: %{http_code}\n" http://localhost/api/health
