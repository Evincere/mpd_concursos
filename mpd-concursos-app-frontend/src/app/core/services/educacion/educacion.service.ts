import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject, EMPTY } from 'rxjs';
import { catchError, map, finalize, switchMap, tap } from 'rxjs/operators';
import { Educacion } from '../../../core/models/educacion.model';
import { environment } from '@env/environment';

// Interfaz para las respuestas de operaciones
export interface OperacionResponse<T> {
    exito: boolean;
    data?: T;
    error?: string;
    mensaje?: string;
    detalles?: string[];
}

// Enum para códigos de error
export enum ErrorCodigo {
    ERROR_RED = 'ERROR_RED',
    ERROR_SERVIDOR = 'ERROR_SERVIDOR',
    ERROR_VALIDACION = 'ERROR_VALIDACION',
    ERROR_DESCONOCIDO = 'ERROR_DESCONOCIDO'
}

@Injectable({
    providedIn: 'root'
})
export class EducacionService {
    // ✅ CORRECCIÓN CRÍTICA: Inyección real de HttpClient
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/educacion`;

    // Subject para mantener el estado actual de la educación
    private educacionSubject = new BehaviorSubject<Educacion[]>([]);
    public educacion$ = this.educacionSubject.asObservable();

    // Indicador de carga
    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    // Últimos mensajes de operación
    private mensajeSubject = new BehaviorSubject<string | null>(null);
    public mensaje$ = this.mensajeSubject.asObservable();

    // Últimos errores
    private errorSubject = new BehaviorSubject<string | null>(null);
    public error$ = this.errorSubject.asObservable();

    // Cache para evitar peticiones innecesarias
    private educacionCargada = false;

    constructor() {
        console.log('[EducacionService] ✅ SERVICIO REAL INICIALIZADO');
        console.log('[EducacionService] API URL:', this.apiUrl);
        console.log('[EducacionService] HttpClient inyectado correctamente');
    }

    // Cargar educación del usuario
    cargarEducacion(usuarioId: string): Observable<OperacionResponse<Educacion[]>> {
        console.log('[EducacionService] ✅ Cargando educación del usuario del backend real:', usuarioId);

        if (this.educacionCargada && this.educacionSubject.value.length > 0) {
            console.log('[EducacionService] Usando datos en caché');
            return of({
                exito: true,
                data: this.educacionSubject.value,
                mensaje: 'Datos cargados desde caché'
            });
        }

        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        return this.http.get<Educacion[]>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
            map((educacionData: Educacion[]) => {
                console.log('[EducacionService] ✅ Educación obtenida del backend:', educacionData);

                // Procesar los datos recibidos para asegurar que las propiedades específicas
                // sean accesibles directamente
                const educacionNormalizada = this.normalizarDatosEducacion(educacionData);
                console.log('[EducacionService] Educación normalizada:', educacionNormalizada);

                this.educacionSubject.next(educacionNormalizada);
                this.educacionCargada = true;

                return {
                    exito: true,
                    data: educacionNormalizada,
                    mensaje: 'Registros de educación cargados correctamente'
                } as OperacionResponse<Educacion[]>;
            }),
            catchError(error => {
                console.error('[EducacionService] ❌ Error al cargar educación:', error);
                const errorResponse = this.manejarError(error, 'Error al cargar educación');
                return errorResponse as unknown as Observable<OperacionResponse<Educacion[]>>;
            }),
            finalize(() => this.loadingSubject.next(false))
        );
    }

    // Guardar nuevo registro de educación
    guardarEducacion(educacion: unknown, usuarioId: string): Observable<OperacionResponse<Educacion>> {
        console.log('[EducacionService] ✅ Guardando educación en backend real para usuario:', usuarioId);

        this.loadingSubject.next(true);
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);

        console.log('[EducacionService] Enviando petición POST a:', `${this.apiUrl}/usuario/${usuarioId}`);
        console.log('[EducacionService] Datos enviados:', JSON.stringify(educacion));

        return this.http.post<Educacion>(`${this.apiUrl}/usuario/${usuarioId}`, educacion)
            .pipe(
                tap(nuevaEducacion => {
                    console.log('[EducacionService] ✅ Educación guardada correctamente en backend:', nuevaEducacion);
                }),
                map((nuevaEducacion: Educacion) => {
                    const educacionActual = this.educacionSubject.value;
                    this.educacionSubject.next([...educacionActual, nuevaEducacion]);
                    this.mensajeSubject.next('Educación guardada correctamente');
                    return {
                        exito: true,
                        data: nuevaEducacion,
                        mensaje: 'Educación guardada correctamente'
                    } as OperacionResponse<Educacion>;
                }),
                catchError(error => {
                    console.error('Error detallado al guardar educación:', error);

                    // Inspeccionar el cuerpo de la respuesta para obtener detalles del error
                    let mensajeDetallado = 'Error al guardar educación';

                    if (error instanceof HttpErrorResponse) {
                        if (error.status === 400) {
                            console.log('Respuesta de error 400:', error.error);

                            // Extraer mensaje de error específico del backend si está disponible
                            if (error.error && typeof error.error === 'object') {
                                if (error.error.message) {
                                    mensajeDetallado = `Error de validación: ${error.error.message}`;

                                    // Imprimir detalles adicionales del error para depuración
                                    if (error.error.errors && Array.isArray(error.error.errors)) {
                                        console.log('Errores detallados de validación:');
                                        error.error.errors.forEach((err: unknown, index: number) => {
                                            console.log(`Error ${index + 1}:`, err);
                                        });
                                    }

                                } else if (error.error.error) {
                                    mensajeDetallado = `Error de validación: ${error.error.error}`;
                                } else {
                                    // Intentar obtener el primer campo con error
                                    const camposError = Object.keys(error.error).filter(k =>
                                        error.error[k] && typeof error.error[k] === 'string');

                                    if (camposError.length > 0) {
                                        mensajeDetallado = `Error en ${camposError[0]}: ${error.error[camposError[0]]}`;
                                    }
                                }
                            }
                        }
                    }

                    return this.manejarError(error, mensajeDetallado) as Observable<OperacionResponse<Educacion>>;
                }),
                finalize(() => this.loadingSubject.next(false))
            );
    }

    // Actualizar un registro existente
    actualizarEducacion(educacion: Educacion): Observable<OperacionResponse<Educacion>> {
        console.log('[EducacionService] ✅ Actualizando educación en backend real:', educacion.id);

        this.loadingSubject.next(true);
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);

        return this.http.put<Educacion>(`${this.apiUrl}/${educacion.id}`, educacion).pipe(
            tap(educacionActualizada => {
                console.log('[EducacionService] ✅ Educación actualizada correctamente en backend:', educacionActualizada);
            }),
            map((educacionActualizada: Educacion) => {
                const educacionActual = this.educacionSubject.value;
                const index = educacionActual.findIndex(e => e.id === educacion.id);

                if (index !== -1) {
                    educacionActual[index] = educacionActualizada;
                    this.educacionSubject.next([...educacionActual]);
                }

                this.mensajeSubject.next('Educación actualizada correctamente');

                const successResponse: OperacionResponse<Educacion> = {
                    exito: true,
                    data: educacionActualizada,
                    mensaje: 'Educación actualizada correctamente'
                };
                return successResponse;
            }),
            catchError((error: unknown) => {
              // Convertir el error a un objeto de respuesta de operación con tipo Educacion
              const errorResponse: OperacionResponse<Educacion> = {
                exito: false,
                mensaje: 'Error al actualizar educación',
                error: error instanceof Error ? error.message : 'Error desconocido'
              };
              return of(errorResponse);
            }),
            finalize(() => this.loadingSubject.next(false))
        );
    }

    // Eliminar un registro
    eliminarEducacion(educacionId: string): Observable<OperacionResponse<void>> {
        console.log('[EducacionService] ✅ Eliminando educación del backend real:', educacionId);

        this.loadingSubject.next(true);
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);

        return this.http.delete<void>(`${this.apiUrl}/${educacionId}`).pipe(
            tap(() => {
                console.log('[EducacionService] ✅ Educación eliminada correctamente del backend:', educacionId);
            }),
            map(() => {
                // Eliminar del subject solo si existe en la lista
                const educacionActual = this.educacionSubject.value;
                const educacionFiltrada = educacionActual.filter(e => e.id !== educacionId);

                this.educacionSubject.next(educacionFiltrada);
                this.mensajeSubject.next('Educación eliminada correctamente');

                return {
                    exito: true,
                    mensaje: 'Educación eliminada correctamente'
                } as OperacionResponse<void>;
            }),
            catchError(error => {
                // Manejar el caso específico de 404 Not Found
                if (error.status === 404) {
                    console.log(`Educación con ID ${educacionId} no encontrada en el servidor, pero eliminándola de la lista local`);

                    // Si no está en el servidor, igual la eliminamos de la lista local
                    const educacionActual = this.educacionSubject.value;
                    const educacionFiltrada = educacionActual.filter(e => e.id !== educacionId);

                    this.educacionSubject.next(educacionFiltrada);
                    this.mensajeSubject.next('Educación eliminada correctamente');

                    return of({
                        exito: true,
                        mensaje: 'Educación eliminada correctamente'
                    } as OperacionResponse<void>);
                }

                return this.manejarError(error, 'Error al eliminar educación') as Observable<OperacionResponse<void>>;
            }),
            finalize(() => this.loadingSubject.next(false))
        );
    }

    // Subir documento PDF
    subirDocumento(archivo: File, educacionId: string): Observable<OperacionResponse<Record<string, unknown>>> {
        if (!archivo) {
            return of({
                exito: false,
                error: 'No se ha seleccionado ningún archivo',
                mensaje: 'No se ha seleccionado ningún archivo'
            });
        }

        // Validar tamaño máximo (5MB)
        const tamanoMaximo = 5 * 1024 * 1024; // 5MB en bytes
        if (archivo.size > tamanoMaximo) {
            return of({
                exito: false,
                error: 'El archivo excede el tamaño máximo permitido (5MB)',
                mensaje: 'El archivo excede el tamaño máximo permitido (5MB)'
            });
        }

        // Validar tipo de archivo (PDF)
        if (archivo.type !== 'application/pdf') {
            return of({
                exito: false,
                error: 'El archivo debe ser un PDF',
                mensaje: 'El archivo debe ser un PDF'
            });
        }

        this.loadingSubject.next(true);
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);

        const formData = new FormData();
        formData.append('file', archivo);

        // Asegurarse de que el ID se utiliza como está, sin intentar convertirlo
        console.log(`Subiendo documento para educación ID: ${educacionId} de tipo ${typeof educacionId}`);

        // ✅ CORRECCIÓN CRÍTICA: Usar endpoint real del backend
        const uploadUrl = `${this.apiUrl}/${educacionId}/document`;
        console.log('[EducacionService] ✅ Subiendo documento al backend real:', uploadUrl);

        return this.http.post<Record<string, unknown>>(uploadUrl, formData).pipe(
            tap(respuesta => {
                console.log('[EducacionService] ✅ Documento subido correctamente al backend:', respuesta);
                this.mensajeSubject.next('Documento subido correctamente');
            }),
            map(respuesta => ({
                exito: true,
                data: respuesta,
                mensaje: 'Documento subido correctamente'
            })),
            catchError(error => {
                console.error('[EducacionService] ❌ Error al subir documento:', error);

                // Intentar con endpoint alternativo de documentos genéricos
                console.log('[EducacionService] Intentando con endpoint alternativo...');
                const alternativeUrl = `${environment.apiUrl}/documents/education/${educacionId}/upload`;

                return this.http.post<Record<string, unknown>>(alternativeUrl, formData).pipe(
                    tap(respuesta => {
                        console.log('[EducacionService] ✅ Documento subido con endpoint alternativo:', respuesta);
                        this.mensajeSubject.next('Documento subido correctamente');
                    }),
                    map(respuesta => ({
                        exito: true,
                        data: respuesta,
                        mensaje: 'Documento subido correctamente'
                    })),
                    catchError(secondError => {
                        console.error('[EducacionService] ❌ Error en todos los intentos:', secondError);
                        return of({
                            exito: false,
                            error: 'No se pudo subir el documento. El servicio podría no estar disponible.',
                            mensaje: 'No se pudo subir el documento. El servicio podría no estar disponible.'
                        });
                    })
                );
            }),
            finalize(() => this.loadingSubject.next(false))
        );
    }

    // Patrón Facade: Método para guardar educación y subir documento en una operación
    guardarEducacionCompleta(educacion: unknown, usuarioId: string, archivo?: File): Observable<OperacionResponse<Educacion>> {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);

        // Log para depurar el objeto de educación antes de enviarlo
        console.log('Objeto para guardar en guardarEducacionCompleta:', JSON.stringify(educacion));

        return this.guardarEducacion(educacion, usuarioId).pipe(
            switchMap(respuesta => {
                // Si no hay éxito en la creación de la educación o no hay archivo, terminar aquí
                if (!respuesta.exito || !respuesta.data) {
                    console.log('No se continuará con la subida de documento: la educación no se guardó correctamente o no hay datos');
                    this.loadingSubject.next(false);
                    return of(respuesta);
                }

                if (!archivo) {
                    console.log('No se continuará con la subida de documento: no se proporcionó ningún archivo');
                    this.loadingSubject.next(false);
                    return of(respuesta);
                }

                const nuevaEducacion = respuesta.data;
                console.log(`Educación guardada correctamente con ID: ${nuevaEducacion.id} (tipo: ${typeof nuevaEducacion.id}), procediendo a subir documento`);

                // Usar el ID tal como viene del backend, sin intentar convertirlo
                if (!nuevaEducacion.id) {
                    console.error('ID de educación no definido para subir documento');
                    return of({
                        exito: true,
                        data: nuevaEducacion,
                        mensaje: 'Educación guardada correctamente, pero no se pudo subir el documento debido a un ID no definido',
                        error: 'ID de educación no definido'
                    });
                }

                return this.subirDocumento(archivo, nuevaEducacion.id).pipe(
                    map(respuestaDoc => {
                        if (!respuestaDoc.exito) {
                            console.warn('Error al subir documento:', respuestaDoc.error);
                            return {
                                exito: true,
                                data: nuevaEducacion,
                                mensaje: 'Educación guardada correctamente, pero hubo un problema al subir el documento',
                                error: respuestaDoc.error
                            };
                        }

                        console.log('Documento subido correctamente');
                        return {
                            exito: true,
                            data: nuevaEducacion,
                            mensaje: 'Educación y documento guardados correctamente'
                        };
                    }),
                    catchError(error => {
                        console.error('Error al subir documento:', error);
                        return of({
                            exito: true,
                            data: nuevaEducacion,
                            mensaje: 'Educación guardada correctamente, pero hubo un error al subir el documento',
                            error: error instanceof Error ? error.message : String(error)
                        });
                    })
                );
            }),
            finalize(() => this.loadingSubject.next(false))
        );
    }

    // Método para guardar educación en modo borrador (localStorage)
    guardarBorrador(educacion: Partial<Educacion>): void {
        localStorage.setItem('educacion_borrador', JSON.stringify(educacion));
    }

    // Método para recuperar borrador
    obtenerBorrador(): Partial<Educacion> | null {
        const borrador = localStorage.getItem('educacion_borrador');
        return borrador ? JSON.parse(borrador) : null;
    }

    // Método para limpiar borrador
    limpiarBorrador(): void {
        localStorage.removeItem('educacion_borrador');
    }

    // Manejador de errores centralizado
    private manejarError(error: unknown, mensajeDefecto: string): Observable<OperacionResponse<Record<string, unknown>>> {
        let mensajeError = mensajeDefecto;
        // Eliminamos variables no utilizadas
        let detallesError: string[] = [];

        if (error instanceof HttpErrorResponse) {
            // Registrar detalles completos del error
            console.error(`Error HTTP ${error.status} (${error.statusText}) en ${error.url}:`, error);

            if (error.status === 0) {
                mensajeError = 'Error de conexión. Verifique su conexión a internet.';
                // Eliminamos variable no utilizada
            } else if (error.status === 404) {
                mensajeError = `Recurso no encontrado: ${error.url}`;
                // Eliminamos variable no utilizada
            } else if (error.status === 400) {
                // Extraer detalles específicos de errores de validación 400 (Bad Request)

                console.log('Respuesta de error 400 completa:', error.error);

                if (error.error) {
                    if (error.error.errors && Array.isArray(error.error.errors)) {
                        // Spring Validation devuelve un array de errores
                        detallesError = error.error.errors.map((e: unknown) => {
                            const eObj = e as Record<string, unknown>;
                            if (eObj['defaultMessage']) return `${eObj['field']}: ${eObj['defaultMessage']}`;
                            if (eObj['message']) return eObj['message'] as string;
                            return JSON.stringify(e);
                        });

                        mensajeError = `Errores de validación: ${detallesError.slice(0, 3).join(', ')}`;
                        if (detallesError.length > 3) {
                            mensajeError += ` y ${detallesError.length - 3} más`;
                        }
                    } else if (error.error.message) {
                        mensajeError = error.error.message;

                        // Buscar detalles de validación en el mensaje
                        if (mensajeError.includes('Validation failed')) {
                            // Intentar extraer errores específicos
                            const regex = /field \[([^\]]+)\]: ([^,;.]+)/g;
                            let match: RegExpExecArray | null;
                            const errores: string[] = [];

                            while ((match = regex.exec(mensajeError)) !== null) {
                                errores.push(`${match[1]}: ${match[2].trim()}`);
                            }

                            if (errores.length > 0) {
                                mensajeError = `Validación fallida: ${errores.join(', ')}`;
                            }
                        }
                    } else if (typeof error.error === 'object') {
                        // Algunos backends pueden devolver objetos de error con propiedades de validación
                        const camposError = Object.keys(error.error)
                            .filter(k => k !== 'status' && k !== 'error' && k !== 'timestamp' && k !== 'path' && k !== 'trace')
                            .map(k => {
                                if (typeof error.error[k] === 'string') {
                                    return `${k}: ${error.error[k]}`;
                                }
                                return null;
                            })
                            .filter(Boolean);

                        if (camposError.length > 0) {
                            mensajeError = `Error en validación: ${camposError.join(', ')}`;
                        } else {
                            mensajeError = 'Error en la solicitud. Verifique los datos enviados.';
                        }
                    } else {
                        mensajeError = 'Error en la solicitud. Verifique los datos enviados.';
                    }
                }
            } else if (error.status >= 400 && error.status < 500) {
                mensajeError = error.error?.mensaje || 'Error en la solicitud. Verifique los datos enviados.';
                // Eliminamos variable no utilizada
            } else if (error.status >= 500) {
                mensajeError = 'Error en el servidor. Intente nuevamente más tarde.';
                // Eliminamos variable no utilizada
            }
        } else if (error instanceof Error) {
            console.error(`Error de JavaScript: ${error.name}:`, error.message, error.stack);
            mensajeError = error.message || mensajeDefecto;
        } else {
            console.error('Error desconocido:', error);
        }

        console.error(mensajeError, error);
        this.errorSubject.next(mensajeError);

        return of({
            exito: false,
            error: mensajeError,
            mensaje: mensajeError,
            detalles: detallesError.length > 0 ? detallesError : undefined
        });
    }

    // Limpiar estado de errores y mensajes
    limpiarEstado(): void {
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);
    }

    /**
     * Normaliza los datos de educación recibidos del servidor para asegurar que
     * todas las propiedades específicas sean accesibles directamente en el objeto
     */
    private normalizarDatosEducacion(educacionData: Record<string, unknown>[]): Educacion[] {
        if (!educacionData || !Array.isArray(educacionData)) {
            console.warn('Datos de educación inválidos:', educacionData);
            return [];
        }

        console.log('Datos sin procesar recibidos del servidor:', JSON.stringify(educacionData));

        return educacionData.map(item => {
            console.log('Procesando item de educación (objeto completo):', JSON.stringify(item));

            // Crear un objeto base con las propiedades comunes
            const educacionBase: Record<string, unknown> = {
                id: item['id'] || '',
                tipo: item['tipo'] || '',
                estado: item['estado'] || '',
                titulo: item['titulo'] || '',
                institucion: item['institucion'] || '',
                fechaEmision: item['fechaEmision'] || null,
                documentoPdf: item['documentoPdf'] || null
            };

            console.log('Propiedades base extraídas:', educacionBase);

            // Explorar todas las propiedades del objeto para detectar datos adicionales
            for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key) && !['id', 'tipo', 'estado', 'titulo', 'institucion', 'fechaEmision', 'documentoPdf'].includes(key)) {
                    if (typeof item[key] === 'object' && item[key] !== null) {
                        console.log(`Propiedad compleja encontrada: ${key}`, item[key]);

                        // Si la propiedad es un objeto, incluir todas sus subpropiedades
                        for (const subKey in item[key]) {
                            if (Object.prototype.hasOwnProperty.call(item[key], subKey)) {
                                const itemObj = item[key] as Record<string, unknown>;
                                educacionBase[subKey] = itemObj[subKey];
                                console.log(`  Subpropiedad añadida: ${subKey} = ${itemObj[subKey]}`);
                            }
                        }
                    } else if (item[key] !== undefined) {
                        educacionBase[key] = item[key];
                        console.log(`Propiedad simple añadida: ${key} = ${item[key]}`);
                    }
                }
            }

            // Propiedades adicionales específicas por tipo de educación
            const posiblesPropiedadesEspecificas = ['propiedadesEspecificas', 'detalle', 'datos', 'detalles', 'datosAdicionales'];

            posiblesPropiedadesEspecificas.forEach(propName => {
                if (item[propName] && typeof item[propName] === 'object') {
                    console.log(`Objeto de propiedades específicas encontrado en '${propName}':`, item[propName]);

                    // Agregar todas las propiedades del detalle directamente en el objeto base
                    Object.keys(item[propName]).forEach(key => {
                        const propObj = item[propName] as Record<string, unknown>;
                        educacionBase[key] = propObj[key];
                        console.log(`  Propiedad específica añadida: ${key} = ${propObj[key]}`);
                    });
                }
            });

            // Si no hay un objeto específico, buscar propiedades conocidas directamente en el item
            const propiedadesEspecificas = [
                'duracionAnios', 'promedio', 'temaTesis', 'cargaHoraria',
                'tuvoEvaluacionFinal', 'tipoActividad', 'tema', 'caracter',
                'lugarFechaExposicion', 'comentarios'
            ];

            propiedadesEspecificas.forEach(prop => {
                if (prop in item) {
                    educacionBase[prop] = item[prop];
                    console.log(`Propiedad específica encontrada directamente: ${prop} = ${item[prop]}`);
                }
            });

            console.log('Item de educación normalizado (resultado final):', educacionBase);
            return educacionBase as Educacion;
        });
    }
}