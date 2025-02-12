@Component({
    // ... configuración ...
})
export class NotificationItemComponent {
    // ... código existente ...

    get canAcknowledge(): boolean {
        return this.notification.status !== 'ACKNOWLEDGED' && 
               this.notification.acknowledgeLevel !== 'NONE';
    }

    get statusText(): string {
        switch(this.notification.status) {
            case 'ACKNOWLEDGED': return 'Acusado';
            case 'READ': return 'Leído';
            case 'SENT': return 'Enviado';
            default: return 'Pendiente';
        }
    }
} 