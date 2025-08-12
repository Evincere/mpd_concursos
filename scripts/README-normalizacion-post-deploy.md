# Normalización post-deploy (ventana de mantenimiento)

Este instructivo explica cómo volver al flujo estándar usando el script `scripts/deploy-production.sh` durante una ventana de baja actividad, utilizando la plantilla basada en imágenes.

## Pasos rápidos

1) Ajustar tags en la plantilla
- Editar `docker-compose.ssl.image-template.yml` y fijar los tags en `image:` que correspondan al release (idealmente el mismo tag que el de Git, p.ej. `deploy-YYYY-MM-DD-ssl`).

2) Elegir una de estas opciones de normalización
- Opción A (recomendada): Portar los cambios (image: y sin build) a `docker-compose.ssl.yml`.
- Opción B: Modificar temporalmente `scripts/deploy-production.sh` para apuntar a `docker-compose.ssl.image-template.yml`.

3) Ejecutar durante la ventana
```
./scripts/deploy-production.sh
```
El script detiene servicios (sin borrar volúmenes), limpia recursos no usados y levanta con `up -d --build`.

4) Post-ventana
- Dejar de usar `docker-compose.ssl.override.yml` en la operación diaria.
- Conservarlo para futuras publicaciones sin downtime o eliminarlo según criterio del equipo.

Notas
- Los volúmenes `mpd_concursos_mysql_data_prod` y `mpd_concursos_storage_data_prod` preservan datos.
- Para cero-downtime en futuras publicaciones, preferir el flujo con override y reemplazo servicio por servicio.
