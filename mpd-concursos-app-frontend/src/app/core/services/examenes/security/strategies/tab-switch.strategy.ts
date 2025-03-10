import { Injectable, Inject } from '@angular/core';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';
import { BaseSecurityStrategy } from './base-security.strategy';

@Injectable()
export class TabSwitchSecurityStrategy extends BaseSecurityStrategy {
  constructor(
    @Inject(ExamenNotificationService) private notificationService: ExamenNotificationService
  ) {
    super();
  }

  override getType(): SecurityViolationType {
    return SecurityViolationType.TAB_SWITCH;
  }

  override handleViolation(details?: any): void {
    this.notificationService.showSecurityWarning(
      SecurityViolationType.TAB_SWITCH,
      'No se permite cambiar de pestaña durante el examen'
    );
    this.violations$.next(this.getType());
  }

  override async activate(): Promise<void> {
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  override deactivate(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.handleViolation();
    }
  }
}
