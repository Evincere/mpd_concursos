# 🔒 Guía de Configuración SSL para MPD Concursos

Esta guía te ayudará a configurar certificados SSL gratuitos de Let's Encrypt para tu aplicación MPD Concursos.

## 📋 Prerrequisitos

1. **Dominio configurado**: Tu dominio debe apuntar a la IP del servidor (149.50.132.23)
2. **Puertos abiertos**: Los puertos 80 y 443 deben estar abiertos en el firewall
3. **Acceso root**: Necesitas permisos de administrador en el servidor

## 🚀 Configuración Rápida

### 1. Preparar el dominio
Asegúrate de que tu dominio apunte a la IP del servidor:
```bash
# Verificar DNS
nslookup tu-dominio.com
# Debe devolver: 149.50.132.23
```

### 2. Ejecutar configuración automática
```bash
# Hacer ejecutable el script
chmod +x ssl-setup/setup-ssl.sh

# Ejecutar configuración (reemplaza con tus datos)
sudo ./ssl-setup/setup-ssl.sh tu-dominio.com tu-email@ejemplo.com
```

### 3. Verificar funcionamiento
```bash
# Verificar que todos los servicios están ejecutándose
docker-compose -f docker-compose.ssl.yml ps

# Probar HTTPS
curl -I https://tu-dominio.com/health
```

## 🔧 Configuración Manual (Paso a Paso)

### Paso 1: Configurar variables de entorno
```bash
# Copiar archivo de configuración
cp .env.ssl .env

# Editar con tus datos
nano .env
```

Configurar:
```env
DOMAIN=tu-dominio.com
SSL_EMAIL=tu-email@ejemplo.com
MYSQL_ROOT_PASSWORD=tu-password-seguro
```

### Paso 2: Actualizar configuración de Nginx
```bash
# Reemplazar placeholder con tu dominio
sed -i 's/DOMAIN_PLACEHOLDER/tu-dominio.com/g' ssl-setup/nginx.conf
```

### Paso 3: Detener servicios actuales
```bash
docker-compose -f docker-compose.prod.yml down
```

### Paso 4: Obtener certificado SSL
```bash
# Iniciar nginx temporal
docker-compose -f docker-compose.ssl.yml up -d nginx-proxy

# Obtener certificado
docker-compose -f docker-compose.ssl.yml run --rm certbot

# Iniciar todos los servicios con SSL
docker-compose -f docker-compose.ssl.yml down
docker-compose -f docker-compose.ssl.yml up -d
```

## 🔄 Renovación Automática

### Configurar cron para renovación automática
```bash
# Hacer ejecutable el script de renovación
chmod +x ssl-setup/renew-ssl.sh

# Agregar a crontab (se ejecuta diariamente a las 12:00)
echo "0 12 * * * root cd $(pwd) && ./ssl-setup/renew-ssl.sh" | sudo tee /etc/cron.d/certbot-renew
```

### Renovación manual
```bash
# Ejecutar renovación manualmente
./ssl-setup/renew-ssl.sh
```

## 📊 Monitoreo y Mantenimiento

### Verificar estado de certificados
```bash
# Ver información del certificado
docker-compose -f docker-compose.ssl.yml run --rm certbot certificates

# Verificar expiración
openssl x509 -in ssl-setup/certbot/conf/live/tu-dominio.com/cert.pem -text -noout | grep "Not After"
```

### Ver logs
```bash
# Logs de todos los servicios
docker-compose -f docker-compose.ssl.yml logs -f

# Logs específicos
docker-compose -f docker-compose.ssl.yml logs nginx-proxy
docker-compose -f docker-compose.ssl.yml logs certbot
```

### Comandos útiles
```bash
# Reiniciar servicios
docker-compose -f docker-compose.ssl.yml restart

# Verificar configuración de nginx
docker-compose -f docker-compose.ssl.yml exec nginx-proxy nginx -t

# Recargar nginx sin reiniciar
docker-compose -f docker-compose.ssl.yml exec nginx-proxy nginx -s reload
```

## 🛡️ Características de Seguridad

### Configuración SSL implementada:
- ✅ **TLS 1.2 y 1.3** únicamente
- ✅ **HSTS** (HTTP Strict Transport Security)
- ✅ **Rate limiting** para API y login
- ✅ **Cabeceras de seguridad** modernas
- ✅ **Redirección automática** HTTP → HTTPS
- ✅ **Renovación automática** de certificados

### Cabeceras de seguridad:
- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection`
- `Referrer-Policy`

## 🚨 Solución de Problemas

### Error: "No se pudo obtener el certificado"
1. Verificar que el dominio apunte al servidor
2. Verificar que el puerto 80 esté libre
3. Verificar logs: `docker-compose -f docker-compose.ssl.yml logs certbot`

### Error: "HTTPS no funciona"
1. Verificar que el certificado existe: `ls ssl-setup/certbot/conf/live/`
2. Verificar configuración nginx: `docker-compose -f docker-compose.ssl.yml exec nginx-proxy nginx -t`
3. Reiniciar nginx: `docker-compose -f docker-compose.ssl.yml restart nginx-proxy`

### Error: "Puerto 80 en uso"
```bash
# Detener servicios que usen puerto 80
sudo systemctl stop nginx apache2
sudo fuser -k 80/tcp
```

## 📞 Soporte

Si encuentras problemas:
1. Verificar logs detallados
2. Comprobar configuración DNS
3. Verificar firewall y puertos
4. Consultar documentación de Let's Encrypt

---

**¡Tu aplicación MPD Concursos ahora tendrá SSL/HTTPS seguro y automático!** 🔒✨
