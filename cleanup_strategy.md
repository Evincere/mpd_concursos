# Estrategia de Limpieza del Proyecto MPD Concursos

## Archivos/Carpetas ESENCIALES (mantener):
- `concurso-backend/` - Código fuente del backend
- `mpd-concursos-app-frontend/` - Código fuente del frontend  
- `ssl-setup/` - Configuración SSL para producción
- `mysql-init/` - Scripts de inicialización de BD
- `logs/` - Logs del sistema (mantener estructura)
- `.env*` - Variables de entorno
- `docker-compose.ssl.yml` - Configuración actual de producción
- `.gitignore`
- `README.md`
- `DEPLOYMENT.md` - Documentación de deployment

## Archivos/Carpetas a ELIMINAR:
### Backups y archivos temporales:
- `backups/`
- `storage_backup_*.tar.gz`
- `backup_*.sql`
- Todos los archivos `.backup*`

### Configuraciones obsoletas:
- `docker-compose.yml` (obsoleto)
- `docker-compose.prod.yml*`
- `docker-compose.production.yml*`
- `docker-compose.fix.yml`
- `docker-compose.ssl-proxy.yml`

### Scripts de investigación/recuperación:
- `recovery_scripts_external/`
- `recovery_toolkit_portable/`
- `RECOVERY_PLAN_DEFINITIVO/`
- Todos los archivos `investigacion_*.py/md`
- Todos los archivos `recovery_*.sh`
- Todos los archivos `fix_*.py/sh`

### Informes y documentación temporal:
- `informes/`
- `estado_referencia_20250806_0915/`
- Todos los archivos `INFORME_*.md`
- Todos los archivos `informe_*.py/md/txt`
- Todos los archivos `INVESTIGACION_*.md`

### Archivos de desarrollo/debug:
- `.cursor*`
- `.qodo/`
- `.run/`
- `.vscode/`
- `qodana.yaml`

### Scripts obsoletos:
- Todos los archivos `.py` de análisis/investigación
- Todos los archivos `.sh` de recuperación
- Archivos `*.bat` y `*.ps1`

### Datos temporales:
- `data/`
- `storage/` (si está vacío o es temporal)
- `src/` (parece duplicado)
- Archivos `.csv`, `.json`, `.txt` de reportes