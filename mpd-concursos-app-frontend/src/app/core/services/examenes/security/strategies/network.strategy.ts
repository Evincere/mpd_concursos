import { Injectable, Inject } from '@angular/core';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenNotificationService } from '../../notification/examen-notification.service';

@Injectable()
export class NetworkSecurityStrategy implements ISecurityStrategy {
  constructor(
    @Inject(ExamenNotificationService) private notificationService: ExamenNotificationService
  ) {}

  getType(): SecurityViolationType {
    return SecurityViolationType.NETWORK_VIOLATION;
  }

  handleViolation(details?: any): void {
    this.notificationService.showSecurityWarning(
      SecurityViolationType.NETWORK_VIOLATION
    );
  }
}
