import { Observable, Subject, firstValueFrom } from 'rxjs';
import { InjectionToken } from '@angular/core';

/**
 * Token for injecting dialog data
 */
export const DIALOG_DATA = new InjectionToken<any>('DIALOG_DATA');

/**
 * Reference to a dialog
 * @template T Type of data that will be returned when the dialog is closed
 */
export class DialogRef<T = unknown> {
  private readonly _afterClosed = new Subject<T | undefined>();

  /**
   * Observable that emits when the dialog is closed
   * @returns Observable that emits the dialog result
   */
  afterClosed(): Observable<T | undefined> {
    return this._afterClosed.asObservable();
  }

  /**
   * Converts the afterClosed observable to a promise
   * @returns Promise that resolves when the dialog is closed
   */
  toPromise(): Promise<T | undefined> {
    return firstValueFrom(this.afterClosed());
  }

  /**
   * Closes the dialog with an optional result
   * @param result Optional result to return
   */
  close(result?: T): void {
    this._afterClosed.next(result);
    this._afterClosed.complete();
  }
}
