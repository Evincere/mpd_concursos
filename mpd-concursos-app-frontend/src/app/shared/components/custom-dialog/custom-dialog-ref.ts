import { Observable, Subject, firstValueFrom } from 'rxjs';

/**
 * Referencia a un diálogo personalizado
 * Similar a MatDialogRef pero sin dependencias de Material
 */
export class CustomDialogRef<T = any, R = any> {
  private readonly _afterClosed = new Subject<R | undefined>();
  private readonly _beforeClosed = new Subject<R | undefined>();

  /**
   * Observable que emite cuando el diálogo se cierra
   */
  afterClosed(): Observable<R | undefined> {
    return this._afterClosed.asObservable();
  }

  /**
   * Observable que emite justo antes de que el diálogo se cierre
   */
  beforeClosed(): Observable<R | undefined> {
    return this._beforeClosed.asObservable();
  }

  /**
   * Convierte el observable afterClosed a una promesa
   * @returns Promesa que se resuelve cuando el diálogo se cierra
   */
  toPromise(): Promise<R | undefined> {
    return firstValueFrom(this.afterClosed());
  }

  /**
   * Cierra el diálogo
   * @param result Resultado opcional que se emitirá en afterClosed
   */
  close(result?: R): void {
    this._beforeClosed.next(result);
    this._afterClosed.next(result);
    this._beforeClosed.complete();
    this._afterClosed.complete();
  }
}

/**
 * Configuración para un diálogo personalizado
 */
export interface CustomDialogConfig<D = any> {
  /**
   * Datos que se pasarán al diálogo
   */
  data?: D;

  /**
   * Ancho del diálogo
   */
  width?: string;

  /**
   * Altura del diálogo
   */
  height?: string;

  /**
   * Si el diálogo se puede cerrar haciendo clic fuera de él
   */
  disableClose?: boolean;

  /**
   * Si el diálogo se puede cerrar con la tecla Escape
   */
  disableEscClose?: boolean;

  /**
   * Clase CSS personalizada para el diálogo
   */
  panelClass?: string | string[];

  /**
   * Posición del diálogo
   */
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
