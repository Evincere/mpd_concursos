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
    // Inyección de HttpClient
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
        // El constructor está vacío, sin operaciones.
    }

    /**
     * Carga los registros de educación para un usuario específico.
     * @param usuarioId El ID del usuario para el que se cargarán los registros.
     * @returns Un Observable con la respuesta de la operación.
     */
    cargarEducacionPorUsuario(usuarioId: string): Observable<OperacionResponse<Educacion[]>> {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);
        this.mensajeSubject.next(null); // Limpiar mensajes previos

        return this.http.get<Educacion[]>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
            map((educacionData: Educacion[]) => {
                const educacionNormalizada = this.normalizarDatosEducacion(educacionData);
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
                // Manejar el error y asegurar que el tipo de retorno sea compatible
                return this.manejarError<Educacion[]>(error, 'Error al cargar educación');
            }),
            finalize(() => this.loadingSubject.next(false))
        );
    }

    /**
     * Guarda un nuevo registro de educación.
     * @param educacion El objeto de educación a guardar.
     * @param usuarioId El ID del usuario al que pertenece la educación.
     * @returns Un Observable con la respuesta de la operación.
     */
    guardarEducacion(educacion: unknown, usuarioId: string): Observable<OperacionResponse<Educacion>> {
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);
        this.loadingSubject.next(true);

        return this.http.post<Educacion>(`${this.apiUrl}/usuario/${usuarioId}`, educacion)
            .pipe(
                tap(nuevaEducacion => {
                    const educacionActual = this.educacionSubject.getValue();
                    this.educacionSubject.next([...educacionActual, nuevaEducacion]);
                    this.mensajeSubject.next('Educación guardada correctamente');
                }),
                map(nuevaEducacion => {
                    // Mover la creación de la respuesta de OperacionResponse aquí desde tap
                    return {
                        exito: true,
                        data: nuevaEducacion,
                        mensaje: 'Educación guardada correctamente'
                    } as OperacionResponse<Educacion>;
                }),
                catchError(error => {
                    console.error('Error detallado al guardar educación:', error);
                    let mensajeDetallado = 'Error al guardar educación';

                    if (error instanceof HttpErrorResponse) {
                        if (error.status === 400) {
                            if (error.error?.errors && Array.isArray(error.error.errors)) {
                                const validationErrors = error.error.errors.map((e: any) => {
                                    if (e.field && e.defaultMessage) return `${e.field}: ${e.defaultMessage}`;
                                    if (e.message) return e.message as string;
                                    return JSON.stringify(e);
                                });
                                mensajeDetallado = `Errores de validación: ${validationErrors.slice(0, 3).join(', ')}`;
                                if (validationErrors.length > 3) {
                                    mensajeDetallado += ` y ${validationErrors.length - 3} más`;
                                }
                            } else if (error.error?.message) {
                                mensajeDetallado = error.error.message;
                            } else if (error.error?.error) {
                                mensajeDetallado = `Error de validación: ${error.error.error}`;
                            }
                        }
                    }
                    // Asegurar que manejarError devuelve un Observable compatible
                    return this.manejarError<Educacion>(error, mensajeDetallado);
                }),
                finalize(() => this.loadingSubject.next(false))
            );
    }

    /**
     * Actualiza un registro de educación existente.
     * @param educacion El objeto de educación a actualizar.
     * @returns Un Observable con la respuesta de la operación.
     */
    actualizarEducacion(educacion: Educacion): Observable<OperacionResponse<Educacion>> {
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);
        this.loadingSubject.next(true);

        return this.http.put<Educacion>(`${this.apiUrl}/${educacion.id}`, educacion).pipe(
            tap(educacionActualizada => {
                const educacionActual = this.educacionSubject.getValue();
                const index = educacionActual.findIndex(e => e.id === educacion.id);

                if (index !== -1) {
                    educacionActual[index] = educacionActualizada;
                    this.educacionSubject.next([...educacionActual]);
                }
                this.mensajeSubject.next('Educación actualizada correctamente');
            }),
            map(educacionActualizada => {
                // Mover la creación de la respuesta de OperacionResponse aquí desde tap
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

    /**
     * Elimina un registro de educación.
     * @param educacionId El ID del registro de educación a eliminar.
     * @returns Un Observable con la respuesta de la operación.
     */
    eliminarEducacion(educacionId: string): Observable<OperacionResponse<void>> {
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);
        this.loadingSubject.next(true);

        return this.http.delete<void>(`${this.apiUrl}/${educacionId}`).pipe(
            tap(() => {
                const educacionActual = this.educacionSubject.getValue();
                const educacionFiltrada = educacionActual.filter(e => e.id !== educacionId);
                this.educacionSubject.next(educacionFiltrada);
                this.mensajeSubject.next('Educación eliminada correctamente');
            }),
            map(() => {
                // Mover la creación de la respuesta de OperacionResponse aquí desde tap
                return {
                    exito: true,
                    mensaje: 'Educación eliminada correctamente'
                } as OperacionResponse<void>;
            }),
            catchError(error => {
                // Manejar el caso específico de 404 Not Found (remover del estado local si el backend indica éxito pero no encontró el recurso)
                if (error instanceof HttpErrorResponse && error.status === 404) {
                    const educacionActual = this.educacionSubject.getValue();
                    const educacionFiltrada = educacionActual.filter(e => e.id !== educacionId);
                    this.educacionSubject.next(educacionFiltrada);
                    this.mensajeSubject.next('Educación eliminada correctamente (recurso no encontrado en el servidor)');

                    return of({
                        exito: true,
                        mensaje: 'Educación eliminada correctamente (recurso no encontrado en el servidor)'
                    } as OperacionResponse<void>);
                }
                return this.manejarError<void>(error, 'Error al eliminar educación');
            }),
            finalize(() => this.loadingSubject.next(false))
        );
    }

    /**
     * Sube un documento PDF asociado a un registro de educación.
     * @param archivo El archivo PDF a subir.
     * @param educacionId El ID del registro de educación al que se asociará el documento.
     * @returns Un Observable con la respuesta de la operación.
     */
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
        return this.http.post<Record<string, unknown>>(`${this.apiUrl}/${educacionId}/documento`, formData).pipe(
            map(respuesta => ({
                exito: true,
                data: respuesta,
                mensaje: 'Documento subido correctamente'
            })),
            catchError(error => {
                console.error('[EducacionService] ❌ Error al subir documento:', error);

                let mensajeError = 'No se pudo subir el documento.';
                if (error instanceof HttpErrorResponse) {
                    if (error.status === 404) {
                        mensajeError = 'El registro de educación no fue encontrado.';
                    } else if (error.status === 400) {
                        mensajeError = 'El archivo no es válido o está vacío.';
                    } else if (error.status === 500) {
                        mensajeError = 'Error interno del servidor al procesar el documento.';
                    }
                }

                this.errorSubject.next(mensajeError);
                return of({
                    exito: false,
                    error: mensajeError,
                    mensaje: mensajeError
                });
            }),
            finalize(() => this.loadingSubject.next(false))
        );
    }

    /**
     * Patrón Facade: Guarda un registro de educación y, opcionalmente, sube un documento PDF en una única operación.
     * @param educacion El objeto de educación a guardar.
     * @param usuarioId El ID del usuario al que pertenece la educación.
     * @param archivo (Opcional) El archivo PDF a subir.
     * @returns Un Observable con la respuesta de la operación.
     */
    guardarEducacionCompleta(educacion: unknown, usuarioId: string, archivo?: File): Observable<OperacionResponse<Educacion>> {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);

        return this.guardarEducacion(educacion, usuarioId).pipe(
            switchMap(respuesta => {
                // Si no hay éxito en la creación de la educación o no hay datos, terminar aquí
                if (!respuesta.exito || !respuesta.data) {
                    return of(respuesta);
                }

                // Si no hay archivo para subir, retornar la respuesta actual
                if (!archivo) {
                    return of(respuesta);
                }

                const nuevaEducacion = respuesta.data;

                // Asegurarse de que el ID de la nueva educación esté definido para subir el documento
                if (!nuevaEducacion.id) {
                    console.error('ID de educación no definido para subir documento');
                    return of({
                        exito: true, // Se considera éxito en la creación de la educación
                        data: nuevaEducacion,
                        mensaje: 'Educación guardada correctamente, pero no se pudo subir el documento debido a un ID no definido',
                        error: 'ID de educación no definido'
                    });
                }

                return this.subirDocumento(archivo, nuevaEducacion.id).pipe(
                    map(respuestaDoc => {
                        if (!respuestaDoc.exito) {
                            console.warn('Error al subir documento (respuesta interna):', respuestaDoc.error);
                            return {
                                exito: true, // La educación se guardó, solo falló el documento
                                data: nuevaEducacion,
                                mensaje: 'Educación guardada correctamente, pero hubo un problema al subir el documento',
                                error: respuestaDoc.error
                            };
                        }
                        return {
                            exito: true,
                            data: nuevaEducacion,
                            mensaje: 'Educación y documento guardados correctamente'
                        };
                    }),
                    catchError(error => {
                        console.error('Error al subir documento (catchError del switchMap):', error);
                        // Retornar una respuesta de éxito para la educación, pero con error del documento
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

    /**
     * Guarda un borrador de un registro de educación en el almacenamiento local.
     * @param educacion El objeto parcial de educación a guardar como borrador.
     */
    guardarBorrador(educacion: Partial<Educacion>): void {
        localStorage.setItem('educacion_borrador', JSON.stringify(educacion));
    }

    /**
     * Recupera un borrador de un registro de educación del almacenamiento local.
     * @returns El objeto parcial de educación guardado como borrador o `null` si no existe.
     */
    obtenerBorrador(): Partial<Educacion> | null {
        const borrador = localStorage.getItem('educacion_borrador');
        return borrador ? JSON.parse(borrador) : null;
    }

    /**
     * Limpia el borrador del registro de educación del almacenamiento local.
     */
    limpiarBorrador(): void {
        localStorage.removeItem('educacion_borrador');
    }

    /**
     * Manejador de errores centralizado para operaciones HTTP.
     * @param error El objeto de error recibido.
     * @param mensajeDefecto El mensaje de error por defecto si no se puede determinar uno más específico.
     * @returns Un Observable con la respuesta de la operación de error.
     */
    private manejarError<T>(error: unknown, mensajeDefecto: string): Observable<OperacionResponse<T>> {
        let mensajeError = mensajeDefecto;
        let detallesError: string[] = [];

        if (error instanceof HttpErrorResponse) {
            console.error(`Error HTTP ${error.status} (${error.statusText}) en ${error.url}:`, error);

            if (error.status === 0) {
                mensajeError = 'Error de conexión. Verifique su conexión a internet.';
            } else if (error.status === 404) {
                mensajeError = `Recurso no encontrado: ${error.url}`;
            } else if (error.status === 400) {
                // Extraer detalles específicos de errores de validación 400 (Bad Request)
                if (error.error?.errors && Array.isArray(error.error.errors)) {
                    detallesError = error.error.errors.map((e: any) => {
                        if (e['defaultMessage']) return `${e['field']}: ${e['defaultMessage']}`;
                        if (e['message']) return e['message'] as string;
                        return JSON.stringify(e);
                    });
                    mensajeError = `Errores de validación: ${detallesError.slice(0, 3).join(', ')}`;
                    if (detallesError.length > 3) {
                        mensajeError += ` y ${detallesError.length - 3} más`;
                    }
                } else if (error.error?.message) {
                    mensajeError = error.error.message;
                    // Buscar detalles de validación en el mensaje
                    if (mensajeError.includes('Validation failed')) {
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
            } else if (error.status >= 400 && error.status < 500) {
                mensajeError = error.error?.mensaje || 'Error en la solicitud. Verifique los datos enviados.';
            } else if (error.status >= 500) {
                mensajeError = 'Error en el servidor. Intente nuevamente más tarde.';
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

    /**
     * Limpia el estado de errores y mensajes del servicio.
     */
    limpiarEstado(): void {
        this.errorSubject.next(null);
        this.mensajeSubject.next(null);
    }

    /**
     * Normaliza los datos de educación recibidos del servidor para asegurar que
     * todas las propiedades específicas sean accesibles directamente en el objeto.
     * Esto es útil si el backend devuelve propiedades anidadas según el tipo de educación.
     * @param educacionData Los datos de educación tal como se reciben del servidor.
     * @returns Un array de objetos Educacion normalizados.
     */
    private normalizarDatosEducacion(educacionData: Record<string, unknown>[]): Educacion[] {
        if (!educacionData || !Array.isArray(educacionData)) {
            console.warn('Datos de educación inválidos:', educacionData);
            return [];
        }

        return educacionData.map(item => {
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

            // Intentar extraer propiedades específicas de objetos anidados si existen
            const posiblesPropiedadesEspecificas = [
                'posgrado', 'universitaria', 'terciaria', 'secundaria', 'curso', 'otro'
            ];

            posiblesPropiedadesEspecificas.forEach(propName => {
                if (item[propName] && typeof item[propName] === 'object') {
                    const propObj = item[propName] as Record<string, unknown>;
                    for (const key in propObj) {
                        if (Object.prototype.hasOwnProperty.call(propObj, key)) {
                            educacionBase[key] = propObj[key];
                        }
                    }
                }
            });

            // Buscar propiedades conocidas directamente en el item si no fueron extraídas de objetos específicos
            const propiedadesEspecificas = [
                'duracionAnios', 'promedio', 'temaTesis', 'cargaHoraria',
                'tuvoEvaluacionFinal', 'tipoActividad', 'tema', 'caracter',
                'lugarFechaExposicion', 'comentarios'
            ];

            propiedadesEspecificas.forEach(prop => {
                if (prop in item && educacionBase[prop] === undefined) { // Evitar sobrescribir si ya se asignó
                    educacionBase[prop] = item[prop];
                }
            });

            return educacionBase as Educacion;
        });
    }
}
