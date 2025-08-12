# 🔒 Guía de Seguridad - MPD Concursos

## ⚠️ ARCHIVOS SENSIBLES

Los siguientes archivos/directorios contienen información sensible y **NUNCA** deben ser incluidos en el repositorio Git:

### 🚨 Archivos de Configuración Críticos
- `.env.production` - Variables de entorno de producción
- `.env.ssl` - Configuración SSL/TLS
- `docker-compose.ssl.yml` - Configuración Docker con credenciales
- Cualquier archivo `.env.*` excepto `.env.production.example`

### 🗃️ Backups y Recuperación
- `backups/` - Carpetas de backup de base de datos
- `backup_*/` - Directorios de backup con timestamp
- `RECOVERY_PLAN_DEFINITIVO/` - Planes de recuperación con datos sensibles
- `*.backup`, `*.bak`, `*.old`, `*.orig` - Archivos de backup individuales
- `*.sql` - Dumps de base de datos

### 🔐 Certificados y Claves
- `ssl-setup/` - Configuración SSL con certificados
- `*.pem`, `*.key`, `*.crt` - Certificados y claves privadas
- `certificates/`, `certs/` - Directorios de certificados
- `private_key.json` - Claves privadas de Let's Encrypt

### 📁 Directorios de Desarrollo
- `temp/`, `tmp/`, `temporary/` - Archivos temporales
- `logs/` - Archivos de log del sistema
- `*_backup/`, `*_recovery/` - Directorios de backup y recuperación

## ✅ Configuración Correcta

### 1. Variables de Entorno
```bash
# ❌ INCORRECTO - Nunca hacer esto
echo "JWT_SECRET=mi_clave_secreta_123" >> .env.production

# ✅ CORRECTO - Usar archivos de ejemplo
cp .env.production.example .env.production
# Editar .env.production con valores reales (local únicamente)
```

### 2. Docker Compose
```bash
# ✅ CORRECTO
cp docker-compose.ssl.example.yml docker-compose.ssl.yml
# Editar docker-compose.ssl.yml con configuraciones reales
```

### 3. SSL/Certificados
```bash
# ✅ CORRECTO - Certificados fuera del repositorio
sudo certbot --nginx -d tu-dominio.com
# Los certificados se almacenan automáticamente en /etc/letsencrypt/
```

## 🛡️ Buenas Prácticas

### Git Pre-commit Hooks
```bash
# Instalar hook para prevenir commits de archivos sensibles
cat > .git/hooks/pre-commit << 'EOL'
#!/bin/bash
if git diff --cached --name-only | grep -E "\.(env|key|pem|crt)$|backup|ssl-setup"; then
    echo "🚨 ERROR: Intentando commitear archivos sensibles!"
    echo "Archivos detectados:"
    git diff --cached --name-only | grep -E "\.(env|key|pem|crt)$|backup|ssl-setup"
    exit 1
fi
EOL
chmod +x .git/hooks/pre-commit
```

### Verificación de Seguridad
```bash
# Verificar que no hay archivos sensibles en el repositorio
git ls-files | grep -E "\.(env|key|pem|crt)$|backup|ssl-setup"
# No debería devolver ningún resultado
```

## 🚨 Si Accidentalmente Commiteaste Información Sensible

### 1. Eliminación Inmediata
```bash
# Remover del índice de Git (pero mantener localmente)
git rm --cached archivo_sensible.env

# Commitear la eliminación
git commit -m "🔒 SECURITY: Remove sensitive file"

# Push inmediato
git push origin main
```

### 2. Limpieza del Historial (Si es necesario)
```bash
# CUIDADO: Esto reescribe el historial
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch archivo_sensible.env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinado con el equipo)
git push origin --force --all
```

### 3. Rotación de Credenciales
- Cambiar inmediatamente todas las claves/passwords expuestos
- Regenerar tokens JWT
- Renovar certificados SSL si fueron expuestos
- Notificar al equipo de seguridad

## 📋 Checklist de Seguridad

- [ ] `.gitignore` actualizado con reglas de seguridad
- [ ] Archivos de ejemplo creados sin información sensible
- [ ] Variables de entorno configuradas localmente
- [ ] Certificados SSL configurados fuera del repositorio
- [ ] Pre-commit hooks instalados
- [ ] Backups almacenados de forma segura fuera del repo
- [ ] Credenciales rotadas si hubo exposición accidental

## 🆘 Contacto de Emergencia

Si detectas información sensible en el repositorio:
1. **NO HAGAS PULL** - Evita descargar información comprometida
2. Reporta inmediatamente al administrador del sistema
3. Documenta qué información fue expuesta
4. Sigue el protocolo de respuesta a incidentes

---

**Recuerda**: La seguridad es responsabilidad de todos. Siempre verifica antes de hacer commit.
