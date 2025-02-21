import { Injectable, Inject } from '@angular/core';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';

@Injectable()
export class TabSwitchSecurityStrategy implements ISecurityStrategy {
  constructor(
    @Inject(ExamenNotificationService) private notificationService: ExamenNotificationService
  ) {}

  getType(): SecurityViolationType {
    return SecurityViolationType.TAB_SWITCH;
  }

  handleViolation(details?: any): void {
    this.notificationService.showSecurityWarning(
      SecurityViolationType.TAB_SWITCH
    );
  }
}
