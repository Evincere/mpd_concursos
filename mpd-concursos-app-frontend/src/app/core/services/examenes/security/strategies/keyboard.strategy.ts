import { Injectable, Inject } from '@angular/core';

import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';
import { BaseSecurityStrategy } from './base-security.strategy';

@Injectable()
export class KeyboardSecurityStrategy extends BaseSecurityStrategy {
  private readonly BLOCKED_KEYS = [
    'F12', 'PrintScreen', 'Tab',
    'c', 'v', 'x', // Cuando Ctrl está presionado
  ];

  constructor(
    @Inject(ExamenNotificationService) private notificationService: ExamenNotificationService
  ) {
    super();
  }

  override getType(): SecurityViolationType {
    return SecurityViolationType.KEYBOARD_SHORTCUT;
  }

  override handleViolation(details?: unknown): void {
    const detailsObj = details as { key?: string } || {};
    this.notificationService.showSecurityWarning(
      SecurityViolationType.KEYBOARD_SHORTCUT,
      `Atajo de teclado no permitido${detailsObj.key ? `: ${detailsObj.key}` : ''}`
    );
    this.violations$.next(this.getType());
  }

  isBlockedKey(event: KeyboardEvent): boolean {
    if (event.ctrlKey && this.BLOCKED_KEYS.includes(event.key.toLowerCase())) {
      return true;
    }
    return this.BLOCKED_KEYS.includes(event.key);
  }

  override async activate(): Promise<void> {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  override deactivate(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.isBlockedKey(event)) {
      event.preventDefault();
      this.handleViolation({ key: event.key });
    }
  }
}
