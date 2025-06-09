import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { NavigationService } from './navigation.service';
import { LoaderService } from './loader.service';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Interface to define a keyboard shortcut.
 */
export interface KeyboardShortcut {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
  global?: boolean; // Indicates if the shortcut is global (active across all routes/contexts)
}

/**
 * Service for managing keyboard shortcuts in the application.
 * Allows registering, unregistering, and executing keyboard shortcuts.
 */
@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService implements OnDestroy {
  private shortcuts: KeyboardShortcut[] = [];
  private destroy$ = new Subject<void>();
  private enabled = true;
  private readonly LOG_TAG = 'KeyboardShortcutsService'; // Tag for logging

  constructor(
    private router: Router,
    private navigationService: NavigationService,
    private loaderService: LoaderService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing KeyboardShortcutsService.`, undefined, this.LOG_TAG);
    // Subscribe to keyboard events
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (this.enabled) {
          this.handleKeyDown(event);
        } else {
          this.loggingService.debug(`[${this.LOG_TAG}] Keyboard shortcuts are disabled. Skipping handleKeyDown.`, undefined, this.LOG_TAG);
        }
      });

    // Register global shortcuts on service initialization
    this.registerGlobalShortcuts();
  }

  /**
   * Registers a new keyboard shortcut.
   * Checks if a shortcut with the same key combination already exists.
   * @param shortcut Keyboard shortcut to register.
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    const exists = this.shortcuts.some(s =>
      s.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!s.altKey === !!shortcut.altKey && // Use !! to normalize boolean values
      !!s.ctrlKey === !!shortcut.ctrlKey &&
      !!s.shiftKey === !!shortcut.shiftKey
    );

    if (!exists) {
      this.shortcuts.push(shortcut);
      this.loggingService.info(`[${this.LOG_TAG}] Registered shortcut: ${this.getShortcutDescription(shortcut)}.`, shortcut, this.LOG_TAG);
    } else {
      this.loggingService.warn(`[${this.LOG_TAG}] Shortcut already exists and was not registered again: ${this.getShortcutDescription(shortcut)}.`, shortcut, this.LOG_TAG);
    }
  }

  /**
   * Unregisters a keyboard shortcut.
   * @param shortcut Keyboard shortcut to unregister.
   */
  unregisterShortcut(shortcut: KeyboardShortcut): void {
    const initialLength = this.shortcuts.length;
    this.shortcuts = this.shortcuts.filter(s =>
      !(s.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!s.altKey === !!shortcut.altKey &&
        !!s.ctrlKey === !!shortcut.ctrlKey &&
        !!s.shiftKey === !!shortcut.shiftKey)
    );
    if (this.shortcuts.length < initialLength) {
      this.loggingService.info(`[${this.LOG_TAG}] Unregistered shortcut: ${this.getShortcutDescription(shortcut)}.`, shortcut, this.LOG_TAG);
    } else {
      this.loggingService.warn(`[${this.LOG_TAG}] Attempted to unregister a shortcut that was not found: ${this.getShortcutDescription(shortcut)}.`, shortcut, this.LOG_TAG);
    }
  }

  /**
   * Enables or disables keyboard shortcuts.
   * @param enabled true to enable, false to disable.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.loggingService.info(`[${this.LOG_TAG}] Keyboard shortcuts are now ${enabled ? 'enabled' : 'disabled'}.`, undefined, this.LOG_TAG);
  }

  /**
   * Gets all registered keyboard shortcuts.
   * @returns List of keyboard shortcuts.
   */
  getShortcuts(): KeyboardShortcut[] {
    this.loggingService.debug(`[${this.LOG_TAG}] Getting all registered shortcuts. Count: ${this.shortcuts.length}.`, undefined, this.LOG_TAG);
    return [...this.shortcuts]; // Return a copy to prevent external modification
  }

  /**
   * Gets a readable description of a keyboard shortcut.
   * @param shortcut Keyboard shortcut.
   * @returns Readable description.
   */
  getShortcutDescription(shortcut: KeyboardShortcut): string {
    const modifiers = [];

    if (shortcut.ctrlKey) {
      modifiers.push('Ctrl');
    }

    if (shortcut.altKey) {
      modifiers.push('Alt');
    }

    if (shortcut.shiftKey) {
      modifiers.push('Shift');
    }

    // Handle special keys for display purposes if needed, e.g., ' ' -> 'Space'
    const key = shortcut.key.toUpperCase();

    return [...modifiers, key].join(' + ');
  }

  /**
   * Clears all registered keyboard shortcuts and re-registers global ones.
   */
  clearShortcuts(): void {
    this.loggingService.info(`[${this.LOG_TAG}] Clearing all shortcuts. Total removed: ${this.shortcuts.length}.`, undefined, this.LOG_TAG);
    this.shortcuts = []; // Clear all shortcuts
    this.registerGlobalShortcuts(); // Re-register only the global ones
    this.loggingService.info(`[${this.LOG_TAG}] Shortcuts cleared and global shortcuts re-registered. Total now: ${this.shortcuts.length}.`, undefined, this.LOG_TAG);
  }

  ngOnDestroy(): void {
    this.loggingService.info(`[${this.LOG_TAG}] KeyboardShortcutsService destroyed. Unsubscribing from keydown events.`, undefined, this.LOG_TAG);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handles keyboard down events.
   * Prevents default action if a matching shortcut is found and executed.
   * @param event Keyboard event.
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore events in text input fields to allow normal typing
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' ||
                         target.tagName === 'TEXTAREA' ||
                         target.isContentEditable;

    if (isInputField) {
      this.loggingService.debug(`[${this.LOG_TAG}] Keydown ignored: Event originated from an input field (${target.tagName}).`, event, this.LOG_TAG);
      return;
    }

    // Find shortcuts that match the key combination
    const matchingShortcuts = this.shortcuts.filter(shortcut =>
      shortcut.key.toLowerCase() === event.key.toLowerCase() &&
      !!shortcut.altKey === event.altKey &&
      !!shortcut.ctrlKey === event.ctrlKey &&
      !!shortcut.shiftKey === event.shiftKey
    );

    if (matchingShortcuts.length > 0) {
      // Prevent default browser action (e.g., preventing Alt+Left from navigating back in browser)
      event.preventDefault();
      const executedShortcut = matchingShortcuts[0]; // Execute the first matching shortcut

      this.loggingService.info(`[${this.LOG_TAG}] Executing shortcut: ${this.getShortcutDescription(executedShortcut)}.`, executedShortcut, this.LOG_TAG);
      executedShortcut.action(); // Perform the shortcut's action
    } else {
      this.loggingService.debug(`[${this.LOG_TAG}] No matching shortcut found for key combination: ${this.getShortcutDescription(event as any)}.`, event, this.LOG_TAG);
    }
  }

  /**
   * Registers global keyboard shortcuts that are active across the application.
   */
  private registerGlobalShortcuts(): void {
    this.loggingService.info(`[${this.LOG_TAG}] Registering global shortcuts.`, undefined, this.LOG_TAG);

    // Navigate back
    this.registerShortcut({
      key: 'ArrowLeft',
      altKey: true,
      description: 'Navegar hacia atrás',
      global: true,
      action: () => {
        this.loggingService.debug(`[${this.LOG_TAG}] Action: Navigate back.`, undefined, this.LOG_TAG);
        this.navigationService.goBack();
      }
    });

    // Navigate forward
    this.registerShortcut({
      key: 'ArrowRight',
      altKey: true,
      description: 'Navegar hacia adelante',
      global: true,
      action: () => {
        this.loggingService.debug(`[${this.LOG_TAG}] Action: Navigate forward.`, undefined, this.LOG_TAG);
        this.navigationService.goForward();
      }
    });

    // Go to admin dashboard (example)
    this.registerShortcut({
      key: 'h',
      altKey: true,
      description: 'Ir al dashboard de administrador',
      global: true,
      action: () => {
        this.loggingService.debug(`[${this.LOG_TAG}] Action: Go to admin dashboard.`, undefined, this.LOG_TAG);
        this.router.navigate(['/admin/dashboard']);
      }
    });

    // Toggle between admin and user view (example)
    this.registerShortcut({
      key: 'u',
      altKey: true,
      description: 'Alternar entre vista de administrador y usuario',
      global: true,
      action: () => {
        this.loggingService.debug(`[${this.LOG_TAG}] Action: Toggle view to user dashboard.`, undefined, this.LOG_TAG);
        this.router.navigate(['/dashboard']); // Assuming '/dashboard' is the user view
      }
    });

    // Show keyboard shortcuts help (example)
    this.registerShortcut({
      key: '?',
      shiftKey: true, // Often used with Shift for help
      description: 'Mostrar ayuda de atajos de teclado',
      global: true,
      action: () => {
        this.loggingService.info(`[${this.LOG_TAG}] Action: Show keyboard shortcuts help (dialog not implemented here).`, undefined, this.LOG_TAG);
        // Here you would typically open a dialog with the list of shortcuts
        // this.dialogService.open(KeyboardShortcutsHelpDialogComponent);
      }
    });
  }
}
