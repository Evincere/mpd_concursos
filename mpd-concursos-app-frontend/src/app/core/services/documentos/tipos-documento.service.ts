import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { shareReplay, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TipoDocumento } from '../../models/documento.model';

@Injectable({
  providedIn: 'root'
})
export class TiposDocumentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/documentos/tipos`;

  private tiposDocumentoCache$: Observable<TipoDocumento[]> | null = null;

  getTiposDocumento(forzarRecarga = false): Observable<TipoDocumento[]> {
    if (!this.tiposDocumentoCache$ || forzarRecarga) {
      this.tiposDocumentoCache$ = this.http.get<TipoDocumento[]>(this.apiUrl).pipe(
        tap(() => console.log('Tipos de documento cargados desde API')),
        shareReplay(1),
        catchError(error => {
          console.error('Error al cargar tipos de documento', error);
          return of([]); // Devolver un array vacío en caso de error
        })
      );
    }
    return this.tiposDocumentoCache$;
  }
}
