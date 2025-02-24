import { Injectable, Inject } from '@angular/core';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';

@Injectable()
export class KeyboardSecurityStrategy implements ISecurityStrategy {
  private readonly BLOCKED_KEYS = [
    'F12', 'PrintScreen', 'Tab',
    'c', 'v', 'x', // Cuando Ctrl está presionado
  ];

  constructor(
    @Inject(ExamenNotificationService) private notificationService: ExamenNotificationService
  ) {}

  getType(): SecurityViolationType {
    return SecurityViolationType.KEYBOARD_SHORTCUT;
  }

  handleViolation(details?: any): void {
    this.notificationService.showSecurityWarning(
      SecurityViolationType.KEYBOARD_SHORTCUT
    );
  }

  isBlockedKey(event: KeyboardEvent): boolean {
    if (event.ctrlKey && this.BLOCKED_KEYS.includes(event.key.toLowerCase())) {
      return true;
    }
    return this.BLOCKED_KEYS.includes(event.key);
  }

  async activate(): Promise<void> {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  deactivate(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.isBlockedKey(event)) {
      event.preventDefault();
      this.handleViolation({ key: event.key });
    }
  }
}
