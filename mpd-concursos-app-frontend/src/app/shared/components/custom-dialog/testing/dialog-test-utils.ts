import { Observable, of } from 'rxjs';
import { CustomDialogRef } from '../custom-dialog-ref';

/**
 * Crea un mock de CustomDialogRef para pruebas
 * @param result Resultado que se emitirá en afterClosed
 * @returns Mock de CustomDialogRef
 */
export function createMockDialogRef<T, R>(result?: R): CustomDialogRef<T, R> {
  const dialogRef = new CustomDialogRef<T, R>();

  // Espiar el método close
  spyOn(dialogRef, 'close').and.callThrough();

  // Sobrescribir el método afterClosed para devolver el resultado
  spyOn(dialogRef, 'afterClosed').and.returnValue(of(result));

  // Sobrescribir el método beforeClosed para devolver el resultado
  spyOn(dialogRef, 'beforeClosed').and.returnValue(of(result));

  return dialogRef;
}
