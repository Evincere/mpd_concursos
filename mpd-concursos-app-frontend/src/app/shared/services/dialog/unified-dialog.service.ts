import { Injectable, Type, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { LoggingService } from '../../../core/services/logging/logging.service';
import { BasicDialogService, BasicDialogRef, BASIC_DIALOG_DATA } from './basic-dialog.service';

// Export the DIALOG_DATA token for backward compatibility
export const DIALOG_DATA = BASIC_DIALOG_DATA;

/**
 * Reference to a unified dialog - now wraps BasicDialogRef
 * @template T Type of data that will be returned when the dialog closes
 */
export class UnifiedDialogRef<T = unknown> {
  constructor(private basicDialogRef: BasicDialogRef<T>, private loggingService: LoggingService) {
    this.loggingService.debug('[UnifiedDialogRef] Creating new UnifiedDialogRef wrapper.', undefined, 'DialogService');
  }

  /**
   * Observable that emits when the dialog is closed
   */
  afterClosed(): Observable<T | undefined> {
    return this.basicDialogRef.afterClosed();
  }

  /**
   * Observable that emits just before the dialog is closed
   */
  beforeClosed(): Observable<T | undefined> {
    return this.basicDialogRef.afterClosed(); // BasicDialogRef doesn't have beforeClosed, so we use afterClosed
  }

  /**
   * Closes the dialog with an optional result
   * @param result Optional result to pass when closing
   */
  close(result?: T): void {
    this.loggingService.debug('[UnifiedDialogRef] Closing dialog with result:', result, 'DialogService');
    this.basicDialogRef.close(result);
  }
}

/**
 * Configuration for a unified dialog
 */
export interface UnifiedDialogConfig<D = any> {
  title?: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  data?: D;
  showCloseButton?: boolean;
  showFooter?: boolean;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  cancelButtonText?: string;
  confirmButtonText?: string;
  confirmButtonColor?: 'primary' | 'accent' | 'warn';
  panelClass?: string | string[];
  disableClose?: boolean;
  disableEscClose?: boolean;
}

/**
 * Unified dialog service - now wraps BasicDialogService
 */
@Injectable({
  providedIn: 'root'
})
export class UnifiedDialogService {
  constructor(
    private basicDialogService: BasicDialogService,
    private loggingService: LoggingService
  ) {
    this.loggingService.debug('[UnifiedDialogService] Initializing UnifiedDialogService wrapper.', undefined, 'DialogService');
  }

  /**
   * Opens a dialog with a custom component
   * @param component Component to display in the dialog
   * @param config Dialog configuration
   * @returns Reference to the dialog
   */
  open<T, D = any, R = any>(component: Type<T>, config?: UnifiedDialogConfig<D>): UnifiedDialogRef<R> {
    this.loggingService.info(`[UnifiedDialogService] Opening dialog with component: ${component.name}.`, config, 'DialogService');

    // Create the UnifiedDialogRef first
    const basicDialogRef = new BasicDialogRef<R>();
    const unifiedDialogRef = new UnifiedDialogRef<R>(basicDialogRef, this.loggingService);

    // Convert UnifiedDialogConfig to BasicDialogConfig with the dialog ref provider
    const basicConfig = {
      title: config?.title,
      size: config?.size,
      data: config?.data,
      showCloseButton: config?.showCloseButton,
      providers: [
        { provide: UnifiedDialogRef, useValue: unifiedDialogRef }
      ]
    };

    // Use BasicDialogService to open the dialog
    const actualBasicDialogRef = this.basicDialogService.open(component, basicConfig);

    // Replace the placeholder with the actual dialog ref
    (unifiedDialogRef as any).basicDialogRef = actualBasicDialogRef;

    return unifiedDialogRef;
  }

  /**
   * Opens a confirmation dialog
   * @param options Confirmation dialog options
   * @returns Reference to the dialog
   */
  openConfirm(options: {
    title?: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: 'primary' | 'accent' | 'warn';
    icon?: string;
    size?: 'small' | 'medium' | 'large';
  }): UnifiedDialogRef<boolean> {
    this.loggingService.info('[UnifiedDialogService] Opening confirmation dialog.', options, 'DialogService');
    
    // For now, return a simple dialog ref that resolves to false
    // This can be enhanced later with a proper confirmation component
    const basicDialogRef = new BasicDialogRef<boolean>();
    setTimeout(() => basicDialogRef.close(false), 100);
    
    return new UnifiedDialogRef<boolean>(basicDialogRef, this.loggingService);
  }

  /**
   * Closes all active dialogs
   */
  closeAll(): void {
    this.loggingService.info('[UnifiedDialogService] Closing all active dialogs.', undefined, 'DialogService');
    this.basicDialogService.closeAll();
  }
}
