cancelInscription(inscriptionId: string): Observable<void> {
  console.log('[InscripcionService] Cancelando inscripción:', inscriptionId);
  
  return this.http.delete<void>(`${this.apiUrl}/inscripciones/${inscriptionId}`).pipe(
    tap(() => {
      console.log('[InscripcionService] Inscripción cancelada exitosamente');
    }),
    catchError(error => {
      console.error('[InscripcionService] Error al cancelar la inscripción:', error);
      if (error.status === 400) {
        return throwError(() => new Error(error.error || 'Error al cancelar la inscripción'));
      }
      if (error.status === 500) {
        return throwError(() => new Error('Error interno del servidor. Intente nuevamente más tarde.'));
      }
      return throwError(() => new Error('Error desconocido al cancelar la inscripción'));
    })
  );
} 