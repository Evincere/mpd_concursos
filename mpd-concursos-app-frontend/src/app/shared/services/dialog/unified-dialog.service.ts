import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, Type, Injector, Renderer2, RendererFactory2 } from '@angular/core';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { LoggingService } from '../../../core/services/logging/logging.service';

/**
 * Reference to a unified dialog
 * @template T Type of data that will be returned when the dialog closes
 */
export class UnifiedDialogRef<T = unknown> {
  private readonly _afterClosed = new Subject<T | undefined>();
  private _closeCallback?: (result?: T) => void;
  private loggingService: LoggingService; // Added loggingService

  constructor(loggingService: LoggingService) {
    this.loggingService = loggingService;
    this.loggingService.debug('[UnifiedDialogRef] New dialog reference created.', undefined, 'DialogService');
  }

  /**
   * Observable that emits when the dialog closes
   * @returns Observable that emits the dialog result
   */
  afterClosed(): Observable<T | undefined> {
    return this._afterClosed.asObservable();
  }

  /**
   * Converts the afterClosed observable to a promise
   * @returns Promise that resolves when the dialog closes
   */
  toPromise(): Promise<T | undefined> {
    this.loggingService.debug('[UnifiedDialogRef] Converting afterClosed to Promise.', undefined, 'DialogService');
    return firstValueFrom(this.afterClosed());
  }

  /**
   * Sets the callback that will be executed when the dialog closes
   * @param callback Function that handles the actual closing of the dialog
   */
  setCloseCallback(callback: (result?: T) => void): void {
    this.loggingService.debug('[UnifiedDialogRef] Setting close callback.', undefined, 'DialogService');
    this._closeCallback = callback;
  }

  /**
   * Closes the dialog with an optional result
   * @param result Optional result to return
   */
  close(result?: T): void {
    this.loggingService.info(`[UnifiedDialogRef] Closing dialog with result: ${result !== undefined ? JSON.stringify(result) : 'undefined'}.`, undefined, 'DialogService');

    // Execute the close callback if available
    if (this._closeCallback) {
      this.loggingService.debug('[UnifiedDialogRef] Executing stored close callback.', undefined, 'DialogService');
      this._closeCallback(result);
    } else {
      this.loggingService.warn('[UnifiedDialogRef] No close callback set, emitting directly.', undefined, 'DialogService');
      this._afterClosed.next(result);
      this._afterClosed.complete();
    }
  }
}

/**
 * Injection token for dialog data
 */
export const DIALOG_DATA = 'DIALOG_DATA';

/**
 * Configuration for a unified dialog
 */
export interface UnifiedDialogConfig<D = any> {
  /**
   * Dialog title
   */
  title?: string;

  /**
   * Dialog icon (Font Awesome class name)
   */
  icon?: string;

  /**
   * Dialog size
   */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';

  /**
   * Data to pass to the dialog
   */
  data?: D;

  /**
   * Dialog width
   */
  width?: string;

  /**
   * Dialog height
   */
  height?: string;

  /**
   * Whether the dialog can be closed by clicking outside of it
   */
  disableClose?: boolean;

  /**
   * Whether the dialog can be closed with the Escape key
   */
  disableEscClose?: boolean;

  /**
   * Show close button
   */
  showCloseButton?: boolean;

  /**
   * Show dialog footer
   */
  showFooter?: boolean;

  /**
   * Show cancel button
   */
  showCancelButton?: boolean;

  /**
   * Show confirm button
   */
  showConfirmButton?: boolean;

  /**
   * Text for the cancel button
   */
  cancelButtonText?: string;

  /**
   * Text for the confirm button
   */
  confirmButtonText?: string;

  /**
   * Color for the confirm button
   */
  confirmButtonColor?: 'primary' | 'accent' | 'warn';

  /**
   * Custom CSS class for the dialog
   */
  panelClass?: string | string[];

  /**
   * Dialog position
   */
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Unified dialog service
 * This is a minimal component that will be used to create the dialog container
 */
@Injectable({
  providedIn: 'root'
})
export class UnifiedDialogService {
  private activeDialogs: ComponentRef<any>[] = [];
  private renderer: Renderer2;

  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector,
    private loggingService: LoggingService, // Inject LoggingService
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loggingService.debug('[UnifiedDialogService] Initializing UnifiedDialogService.', undefined, 'DialogService');
  }

  /**
   * Opens a dialog with a custom component
   * @param component Component to display in the dialog
   * @param config Dialog configuration
   * @returns Reference to the dialog
   */
  open<T, D = any, R = any>(component: Type<T>, config?: UnifiedDialogConfig<D>): UnifiedDialogRef<R> {
    this.loggingService.info(`[UnifiedDialogService] Attempting to open dialog with component: ${component.name}.`, config, 'DialogService');

    // Close any existing dialogs to ensure only one is open at a time (configurable behavior)
    if (this.activeDialogs.length > 0) {
      this.loggingService.warn('[UnifiedDialogService] Closing existing dialogs before opening a new one.', undefined, 'DialogService');
      this.closeAll();
    }

    // Create dialog reference
    const dialogRef = new UnifiedDialogRef<R>(this.loggingService); // Pass loggingService to UnifiedDialogRef

    let dialogComponentRef: ComponentRef<any>;
    let contentComponentRef: ComponentRef<any>;

    // Configure the close callback for UnifiedDialogRef
    dialogRef.setCloseCallback((result?: R) => {
      this.loggingService.debug('[UnifiedDialogService] UnifiedDialogRef close callback triggered.', result, 'DialogService');
      this.closeDialog(dialogComponentRef, contentComponentRef, dialogRef, result);
    });

    // Dynamically import CustomDialogComponent
    import('../../components/custom-form/custom-dialog/custom-dialog.component').then(module => {
      this.loggingService.debug('[UnifiedDialogService] CustomDialogComponent imported dynamically.', undefined, 'DialogService');
      const CustomDialogComponent = module.CustomDialogComponent;

      const hostElement = this.renderer.createElement('div');
      this.renderer.addClass(hostElement, 'unified-dialog-container');

      // Apply custom CSS classes if provided
      if (config?.panelClass) {
        if (Array.isArray(config.panelClass)) {
          config.panelClass.forEach(className => {
            if (className) this.renderer.addClass(hostElement, className);
          });
          this.loggingService.debug('[UnifiedDialogService] Applied multiple panelClasses to hostElement.', config.panelClass, 'DialogService');
        } else if (typeof config.panelClass === 'string') {
          this.renderer.addClass(hostElement, config.panelClass);
          this.loggingService.debug('[UnifiedDialogService] Applied single panelClass to hostElement.', config.panelClass, 'DialogService');
        }
      }
      this.renderer.appendChild(document.body, hostElement);
      this.loggingService.debug('[UnifiedDialogService] Host element appended to body.', hostElement, 'DialogService');


      // Create the dialog container component
      dialogComponentRef = createComponent(CustomDialogComponent, {
        environmentInjector: this.environmentInjector,
        hostElement: hostElement // Mount to the created hostElement
      });
      this.loggingService.debug('[UnifiedDialogService] CustomDialogComponent created.', dialogComponentRef, 'DialogService');


      // Create a custom injector for the content component
      const injector = Injector.create({
        parent: this.environmentInjector,
        providers: [
          { provide: UnifiedDialogRef, useValue: dialogRef },
          { provide: DIALOG_DATA, useValue: config?.data || {} }
        ]
      });
      this.loggingService.debug('[UnifiedDialogService] Custom injector created for content component.', undefined, 'DialogService');

      // Create the content component with the custom injector
      contentComponentRef = createComponent(component, {
        environmentInjector: this.environmentInjector,
        elementInjector: injector,
        hostElement: this.renderer.createElement('div') // Create a temporary host element for content
      });
      this.loggingService.debug('[UnifiedDialogService] Content component created.', contentComponentRef, 'DialogService');


      // Configure dialog instance properties
      const dialogInstance = dialogComponentRef.instance;
      dialogInstance.title = config?.title || '';
      dialogInstance.icon = config?.icon || '';
      dialogInstance.size = config?.size || 'medium';
      dialogInstance.showCloseButton = config?.showCloseButton !== false; // Default to true
      dialogInstance.showFooter = config?.showFooter !== false;         // Default to true
      dialogInstance.showCancelButton = config?.showCancelButton !== false; // Default to true
      dialogInstance.showConfirmButton = config?.showConfirmButton !== false; // Default to true
      dialogInstance.cancelButtonText = config?.cancelButtonText || 'Cancelar';
      dialogInstance.confirmButtonText = config?.confirmButtonText || 'Confirmar';
      dialogInstance.confirmButtonColor = config?.confirmButtonColor || 'primary';
      dialogInstance.disableClose = config?.disableClose || false;
      dialogInstance.disableEscClose = config?.disableEscClose || false;
      this.loggingService.debug('[UnifiedDialogService] CustomDialogComponent instance configured.', dialogInstance, 'DialogService');


      // Configure event subscriptions for the dialog
      dialogInstance.dialogClose.subscribe(() => {
        this.loggingService.debug('[UnifiedDialogService] dialogClose event triggered by CustomDialogComponent.', undefined, 'DialogService');
        dialogRef.close(); // Use UnifiedDialogRef's close to trigger the callback
      });

      dialogInstance.dialogCancel.subscribe(() => {
        this.loggingService.debug('[UnifiedDialogService] dialogCancel event triggered by CustomDialogComponent.', undefined, 'DialogService');
        dialogRef.close(false as R); // Typically false for cancel
      });

      dialogInstance.dialogConfirm.subscribe(() => {
        this.loggingService.debug('[UnifiedDialogService] dialogConfirm event triggered by CustomDialogComponent.', undefined, 'DialogService');
        let result: any = undefined;
        try {
          // Attempt to get result from content component if it has a getResult method
          if (contentComponentRef?.instance && typeof (contentComponentRef.instance as any).getResult === 'function') {
            result = (contentComponentRef.instance as any).getResult();
            this.loggingService.debug('[UnifiedDialogService] Result obtained from content component.', result, 'DialogService');
          }
        } catch (error) {
          this.loggingService.error('[UnifiedDialogService] Error getting result from content component:', error, 'DialogService');
        }
        dialogRef.close(result); // Use UnifiedDialogRef's close
      });

      dialogInstance.dialogDismiss.subscribe(() => {
        this.loggingService.debug('[UnifiedDialogService] dialogDismiss event triggered by CustomDialogComponent.', undefined, 'DialogService');
        dialogRef.close(); // Use UnifiedDialogRef's close
      });


      // Attach component views to the application's view tree
      this.appRef.attachView(dialogComponentRef.hostView);
      this.appRef.attachView(contentComponentRef.hostView);
      this.loggingService.debug('[UnifiedDialogService] Dialog and content component views attached to appRef.', undefined, 'DialogService');


      // Append the content component's native element to the dialog's content area
      // Use setTimeout to ensure the dialog's DOM is rendered before appending content
      setTimeout(() => {
        try {
          const contentElement = contentComponentRef?.location?.nativeElement;
          // Query the dialog's shadow DOM for the content insertion point if it uses shadow DOM
          const dialogContentElement = dialogComponentRef?.location?.nativeElement?.querySelector('.dialog-content');

          if (dialogContentElement && contentElement) {
            // Ensure the element is not already in the DOM (e.g., if a previous attempt failed)
            if (contentElement.parentNode) {
              this.renderer.removeChild(contentElement.parentNode, contentElement);
              this.loggingService.debug('[UnifiedDialogService] Removed content element from previous parent.', undefined, 'DialogService');
            }
            this.renderer.appendChild(dialogContentElement, contentElement);
            this.loggingService.debug('[UnifiedDialogService] Content component appended to dialog content area.', undefined, 'DialogService');
          } else {
            this.loggingService.warn('[UnifiedDialogService] Could not find dialog content element or content element.', { dialogContentElement, contentElement }, 'DialogService');
          }
        } catch (error) {
          this.loggingService.error('[UnifiedDialogService] Error appending content component to dialog:', error, 'DialogService');
        }
      }, 0); // Use 0ms timeout for next tick execution

      // Store references to active dialogs for later cleanup
      this.activeDialogs.push(dialogComponentRef, contentComponentRef);
      this.loggingService.debug('[UnifiedDialogService] Dialog and content component references stored.', this.activeDialogs, 'DialogService');

      // Prevent body scrolling
      this.renderer.setStyle(document.body, 'overflow', 'hidden');

    }).catch(error => {
      this.loggingService.error('[UnifiedDialogService] Error loading CustomDialogComponent dynamically:', error, 'DialogService');
      dialogRef.close(); // Close the dialogRef if the main dialog component cannot be loaded
    });

    return dialogRef;
  }

  /**
   * Closes a specific dialog.
   */
  private closeDialog<R>(
    dialogComponentRef: ComponentRef<any>,
    contentComponentRef: ComponentRef<any>,
    dialogRef: UnifiedDialogRef<R>,
    result?: R
  ): void {
    this.loggingService.info('[UnifiedDialogService] Closing a specific dialog.', { dialogRef, result }, 'DialogService');
    try {
      // Cleanup the dialog component
      if (dialogComponentRef) {
        const hostElement = dialogComponentRef?.location?.nativeElement;
        if (hostElement && hostElement.parentNode) {
          this.renderer.removeChild(hostElement.parentNode, hostElement);
          this.loggingService.debug('[UnifiedDialogService] Removed dialog host element from DOM.', undefined, 'DialogService');
        }
        this.appRef.detachView(dialogComponentRef.hostView);
        dialogComponentRef.destroy();
        this.loggingService.debug('[UnifiedDialogService] Dialog component destroyed.', undefined, 'DialogService');
      }

      // Cleanup the content component
      if (contentComponentRef) {
        this.appRef.detachView(contentComponentRef.hostView);
        contentComponentRef.destroy();
        this.loggingService.debug('[UnifiedDialogService] Content component destroyed.', undefined, 'DialogService');
      }

      // Remove from the list of active dialogs
      this.activeDialogs = this.activeDialogs.filter(ref =>
        ref !== dialogComponentRef && ref !== contentComponentRef);
      this.loggingService.debug('[UnifiedDialogService] References removed from active dialogs list.', this.activeDialogs, 'DialogService');


      // Emit the close event directly to UnifiedDialogRef's subject
      // This is crucial to avoid recursion if dialogRef.close() was called already
      dialogRef['_afterClosed'].next(result);
      dialogRef['_afterClosed'].complete();
      this.loggingService.debug('[UnifiedDialogService] UnifiedDialogRef _afterClosed subject completed.', undefined, 'DialogService');


      // Restore body scrolling if no other dialogs are open
      if (this.activeDialogs.length === 0) {
        this.renderer.setStyle(document.body, 'overflow', '');
        this.loggingService.debug('[UnifiedDialogService] Body scrolling restored (no active dialogs).', undefined, 'DialogService');
      }

      // Perform general cleanup of any remaining dialog-related DOM elements
      this.cleanupDialogElements();

      this.loggingService.info('[UnifiedDialogService] Dialog successfully closed and cleaned.', undefined, 'DialogService');
    } catch (error) {
      this.loggingService.error('[UnifiedDialogService] Error during closeDialog cleanup:', error, 'DialogService');
    }
  }

  /**
   * Closes all active dialogs.
   */
  closeAll(): void {
    this.loggingService.info('[UnifiedDialogService] Closing all active dialogs.', undefined, 'DialogService');
    // Make a copy of active dialogs to avoid issues when modifying the array during iteration
    const activeDialogsCopy = [...this.activeDialogs];

    activeDialogsCopy.forEach(ref => {
      try {
        const hostElement = ref?.location?.nativeElement;
        if (hostElement && hostElement.parentNode) {
          this.renderer.removeChild(hostElement.parentNode, hostElement);
          this.loggingService.debug('[UnifiedDialogService] Removed host element during closeAll:', hostElement, 'DialogService');
        }
        this.appRef.detachView(ref.hostView);
        ref.destroy();
        this.loggingService.debug('[UnifiedDialogService] ComponentRef destroyed during closeAll:', ref, 'DialogService');
      } catch (error) {
        this.loggingService.error('[UnifiedDialogService] Error closing active dialog during closeAll:', error, 'DialogService');
      }
    });

    // Clear the list of active dialogs
    this.activeDialogs = [];
    this.loggingService.debug('[UnifiedDialogService] Active dialogs list cleared.', undefined, 'DialogService');

    // Restore body scrolling
    this.renderer.setStyle(document.body, 'overflow', '');
    this.loggingService.debug('[UnifiedDialogService] Body scrolling restored after closeAll.', undefined, 'DialogService');

    // Clean up any remaining dialog-related DOM elements
    this.cleanupDialogElements();
  }

  /**
   * Opens a confirmation dialog.
   * @param options Confirmation dialog options.
   * @returns Reference to the dialog.
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
    // Create a new dialog reference for this confirmation
    const dialogRef = new UnifiedDialogRef<boolean>(this.loggingService);

    // Dynamically import the ConfirmDialogComponent
    import('../../components/confirm-dialog/confirm-dialog.component').then(module => {
      this.loggingService.debug('[UnifiedDialogService] ConfirmDialogComponent imported dynamically.', undefined, 'DialogService');
      const ConfirmDialogComponent = module.ConfirmDialogComponent;

      const innerDialogRef = this.open<any, any, boolean>(ConfirmDialogComponent, {
        title: options.title || 'Confirmar',
        icon: options.icon || 'question-circle',
        size: options.size || 'small',
        data: {
          message: options.message
        },
        showCloseButton: true,
        showFooter: true,
        showCancelButton: true,
        showConfirmButton: true,
        cancelButtonText: options.cancelButtonText || 'Cancelar',
        confirmButtonText: options.confirmButtonText || 'Confirmar',
        confirmButtonColor: options.confirmButtonColor || 'primary'
      });

      // Connect the inner dialog reference with the external one
      innerDialogRef.afterClosed().subscribe(result => {
        this.loggingService.debug('[UnifiedDialogService] Confirm dialog inner dialog closed. Propagating result.', result, 'DialogService');
        dialogRef.close(result); // Close the outer dialogRef with the result from the inner dialog
      });
    }).catch(error => {
      this.loggingService.error('[UnifiedDialogService] Error loading ConfirmDialogComponent dynamically:', error, 'DialogService');
      dialogRef.close(false); // Close the confirm dialog with false if component fails to load
    });

    return dialogRef;
  }

  /**
   * Cleans up any remaining dialog elements in the DOM.
   */
  private cleanupDialogElements(): void {
    this.loggingService.debug('[UnifiedDialogService] Initiating cleanup of residual dialog elements in DOM.', undefined, 'DialogService');
    try {
      // Selectors for dialog-related elements that might remain in the DOM
      const selectors = [
        '.dialog-backdrop',
        '.dialog-container', // This is the host element for CustomDialogComponent
        '.unified-dialog-container', // This is the host element created by this service
        '.custom-dialog-container', // Another potential class if used
        '[class*="dialog-"]:not(.mat-dialog-container)' // Generic selector for elements containing "dialog-" in their class, excluding material dialogs
      ];

      const combinedSelector = selectors.join(', ');
      const dialogElements = document.querySelectorAll(combinedSelector);

      if (dialogElements.length > 0) {
        this.loggingService.info(`[UnifiedDialogService] Found ${dialogElements.length} residual dialog elements. Removing...`, undefined, 'DialogService');
        dialogElements.forEach(element => {
          try {
            if (element.parentNode) {
              this.renderer.removeChild(element.parentNode, element);
              this.loggingService.debug('[UnifiedDialogService] Removed residual dialog element from DOM:', element, 'DialogService');
            }
          } catch (removeErr) {
            this.loggingService.error('[UnifiedDialogService] Error removing residual dialog element from DOM:', removeErr, 'DialogService');
          }
        });
      } else {
        this.loggingService.debug('[UnifiedDialogService] No residual dialog elements found in DOM.', undefined, 'DialogService');
      }
    } catch (error) {
      this.loggingService.error('[UnifiedDialogService] Error during cleanup of dialog elements:', error, 'DialogService');
    }
  }
}
