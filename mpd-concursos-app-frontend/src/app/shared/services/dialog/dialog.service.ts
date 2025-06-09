import { Injectable, Type, inject } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { UnifiedDialogService } from './unified-dialog.service';

/**
 * Servicio unificado para diálogos
 * Este servicio actúa como fachada para todos los servicios de diálogo
 * y proporciona una API consistente para todos los diálogos
 */
@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private unifiedDialogService = inject(UnifiedDialogService);
  private loggingService = inject(LoggingService);

  /**
   * Abre un diálogo
   * @param component Componente a mostrar en el diálogo
   * @param options Opciones del diálogo
   * @returns Referencia al diálogo
   */
  open<T, D = any, R = any>(
    component: Type<T>,
    options?: {
      title?: string;
      size?: 'small' | 'medium' | 'large';
      data?: D;
      showCloseButton?: boolean;
      showFooter?: boolean;
      showCancelButton?: boolean;
      showConfirmButton?: boolean;
      cancelButtonText?: string;
      confirmButtonText?: string;
      confirmButtonColor?: 'primary' | 'accent' | 'warn';
      icon?: string;
      panelClass?: string | string[];
    }
  ): DialogRef<R> {
    const dialogRef = this.unifiedDialogService.open<T, D, R>(component, options);
    return new DialogRef<R>(dialogRef, this.loggingService);
  }

  /**
   * Abre un diálogo de confirmación
   * @param options Opciones del diálogo
   * @returns Referencia al diálogo
   */
  confirm(options: {
    title?: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: 'primary' | 'accent' | 'warn';
    icon?: string;
    size?: 'small' | 'medium' | 'large';
  }): DialogRef<boolean> {
    const dialogRef = this.unifiedDialogService.openConfirm(options);
    return new DialogRef<boolean>(dialogRef, this.loggingService);
  }

  /**
   * Abre un diálogo de alerta
   * @param options Opciones del diálogo
   * @returns Referencia al diálogo
   */
  alert(options: {
    title?: string;
    message: string;
    buttonText?: string;
    buttonColor?: 'primary' | 'accent' | 'warn';
    icon?: string;
    size?: 'small' | 'medium' | 'large';
  }): DialogRef<void> {
    // Crear una referencia al diálogo
    const dialogRef = new DialogRef<void>(null, this.loggingService);

    // Implementar cuando se cree el componente de alerta
    // Por ahora, simplemente devolvemos una referencia vacía
    console.warn('El método alert() no está completamente implementado');

    return dialogRef;
  }

  /**
   * Abre un diálogo de entrada de texto
   * @param options Opciones del diálogo
   * @returns Referencia al diálogo
   */
  prompt(options: {
    title?: string;
    message?: string;
    placeholder?: string;
    initialValue?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: 'primary' | 'accent' | 'warn';
    icon?: string;
    size?: 'small' | 'medium' | 'large';
  }): DialogRef<string> {
    // Crear una referencia al diálogo
    const dialogRef = new DialogRef<string>(null, this.loggingService);

    // Implementar cuando se cree el componente de prompt
    // Por ahora, simplemente devolvemos una referencia vacía
    console.warn('El método prompt() no está completamente implementado');

    return dialogRef;
  }
}

/**
 * Referencia a un diálogo
 */
export class DialogRef<R> {
  private afterClosedSubject = new Subject<R>();
  readonly afterClosed$ = this.afterClosedSubject.asObservable();

  constructor(
    private dialogRef: any,
    private loggingService: LoggingService
  ) {
    if (this.dialogRef) {
      this.dialogRef.afterClosed().subscribe((result: R) => {
        this.afterClosedSubject.next(result);
        this.afterClosedSubject.complete();
      });
    }
  }

  /**
   * Cierra el diálogo
   * @param result Resultado del diálogo
   */
  close(result?: R): void {
    if (this.dialogRef) {
      this.dialogRef.close(result);
    } else {
      this.afterClosedSubject.next(result as R);
      this.afterClosedSubject.complete();
    }
  }

  /**
   * Observable que emite cuando el diálogo se cierra
   * @returns Observable con el resultado del diálogo
   */
  afterClosed(): Observable<R> {
    return this.afterClosed$;
  }

  /**
   * Convierte el observable afterClosed a una promesa
   * @returns Promesa que se resuelve cuando el diálogo se cierra
   */
  toPromise(): Promise<R | undefined> {
    return firstValueFrom(this.afterClosed());
  }
}
