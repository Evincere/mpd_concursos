# Docker Compose V2 - Sintaxis Actualizada

## ⚠️ IMPORTANTE: 
Este servidor usa Docker Compose V2, que utiliza el comando SIN GUIÓN:

### ✅ CORRECTO (V2):
```bash
docker compose up -d
docker compose down
docker compose ps
docker compose logs service_name
```

### ❌ INCORRECTO (V1 obsoleto):
```bash
docker-compose up -d    # NO funciona
docker-compose down     # NO funciona  
```

## 🔄 Para uso futuro en reactivación:
```bash
# Reactivar backend usando docker compose
docker compose -f docker-compose.prod.yml up -d backend

# O usando docker directamente (más simple):
docker start mpd-concursos-backend
```
