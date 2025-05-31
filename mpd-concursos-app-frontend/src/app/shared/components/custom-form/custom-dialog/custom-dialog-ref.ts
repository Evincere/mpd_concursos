import { Observable, Subject } from 'rxjs';

/**
 * Referencia a un diálogo personalizado.
 * @template T Tipo de dato que se devolverá al cerrar el diálogo.
 */
export class CustomDialogRef<T = unknown> {
  private readonly _afterClosed = new Subject<T | undefined>();

  /**
   * Observable que emite cuando el diálogo se cierra.
   * @returns Observable que emite el resultado del diálogo.
   */
  afterClosed(): Observable<T | undefined> {
    return this._afterClosed.asObservable();
  }

  /**
   * Cierra el diálogo con un resultado opcional.
   * @param result Resultado opcional a devolver.
   */
  close(result?: T): void {
    this._afterClosed.next(result);
    this._afterClosed.complete();
  }
}
