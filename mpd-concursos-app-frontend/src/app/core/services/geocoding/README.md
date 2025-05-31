# Servicio de Geocodificación con OpenStreetMap/Nominatim

Este servicio proporciona funcionalidad de geocodificación utilizando la API gratuita de OpenStreetMap (Nominatim) a través de un proxy CORS.

## Características

- Búsqueda de direcciones basada en OpenStreetMap
- Obtención de coordenadas geográficas
- Componentes de dirección desglosados (calle, número, localidad, etc.)
- Caché de resultados para mejorar el rendimiento
- Cumple con la política de uso justo de Nominatim (máximo 1 solicitud por segundo)
- Solución al problema de CORS mediante un proxy

## Solución al problema de CORS

La API de Nominatim no permite solicitudes CORS directas desde aplicaciones frontend, lo que resulta en errores como:

```
Refused to connect to 'https://nominatim.openstreetmap.org/search' because it violates the following Content Security Policy directive: "connect-src 'self' http://localhost:8080 ws://localhost:8080".
```

Para solucionar este problema, hemos implementado las siguientes soluciones:

### 1. Proxy CORS

Utilizamos un proxy CORS público (`https://corsproxy.io/`) para redirigir las solicitudes a la API de Nominatim. Esto permite que las solicitudes se realicen desde el frontend sin violar la política de seguridad de contenido.

```typescript
private readonly PROXY_URL = 'https://corsproxy.io/?';
private readonly API_URL = 'https://nominatim.openstreetmap.org';

// Ejemplo de uso
const encodedUrl = encodeURIComponent(`${this.API_URL}/search`);
const proxyUrl = `${this.PROXY_URL}${encodedUrl}`;
```

### 2. Caché de resultados

Para reducir el número de solicitudes a la API y mejorar el rendimiento, implementamos un sistema de caché que almacena los resultados de búsquedas previas.

```typescript
// Caché para almacenar resultados de búsquedas previas
private searchCache: { [key: string]: NominatimResult[] } = {};
private detailsCache: { [key: string]: NominatimResult } = {};
```

### 3. Manejo de errores

Implementamos un manejo de errores robusto que devuelve resultados vacíos en lugar de lanzar errores, lo que evita que la interfaz de usuario se rompa en caso de problemas con la API.

```typescript
catchError(error => {
  console.error('Error al buscar direcciones con Nominatim:', error);
  
  // Si hay un error, devolver un array vacío en lugar de lanzar un error
  return of([]);
})
```

## Alternativas consideradas

### 1. Proxy en el backend

Una solución más robusta sería implementar un endpoint en el backend que actúe como proxy para las solicitudes a Nominatim. Esto proporcionaría mayor seguridad y control, pero requeriría acceso al backend.

```typescript
// Ejemplo de cómo sería con un proxy en el backend
private readonly API_URL = '/api/geocoding/search';
```

### 2. Base de datos local para Argentina

Otra alternativa sería utilizar una base de datos local con direcciones de Argentina, lo que eliminaría la necesidad de hacer solicitudes a una API externa. Esto proporcionaría mayor velocidad y disponibilidad, pero requeriría mantener la base de datos actualizada.

## Política de uso justo de Nominatim

La API de Nominatim tiene una política de uso justo que limita las solicitudes a un máximo de 1 por segundo. El servicio implementa esta política automáticamente, agregando retrasos entre solicitudes si es necesario.

```typescript
// Aplicar política de uso justo (1 solicitud por segundo)
const now = Date.now();
const timeSinceLastRequest = now - this.lastRequestTime;
const delayTime = timeSinceLastRequest < this.MIN_REQUEST_INTERVAL 
  ? this.MIN_REQUEST_INTERVAL - timeSinceLastRequest 
  : 0;

this.lastRequestTime = now + delayTime;
```

## Próximos pasos

1. **Implementar un proxy en el backend**: Para una solución más robusta y segura, se recomienda implementar un endpoint en el backend que actúe como proxy para las solicitudes a Nominatim.

2. **Mejorar el sistema de caché**: Implementar un sistema de caché más avanzado que tenga en cuenta la expiración de los datos y la limpieza de la caché para evitar el consumo excesivo de memoria.

3. **Implementar validación adicional**: Agregar validación adicional para asegurarse de que las direcciones seleccionadas sean válidas y estén dentro de Argentina.

4. **Considerar alternativas locales**: Evaluar la posibilidad de utilizar una base de datos local con direcciones de Argentina para eliminar la dependencia de una API externa.
