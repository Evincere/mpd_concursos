export enum NotificationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    READ = 'READ',
    ACKNOWLEDGED = 'ACKNOWLEDGED'
}

export enum AcknowledgementLevel {
    NONE = 'NONE',
    SIMPLE = 'SIMPLE',
    SIGNATURE_BASIC = 'SIGNATURE_BASIC',
    SIGNATURE_ADVANCED = 'SIGNATURE_ADVANCED'
}

export enum SignatureType {
    PIN = 'PIN',
    DIGITAL_CERT = 'DIGITAL_CERT',
    BIOMETRIC = 'BIOMETRIC',
    DECLARATION = 'DECLARATION'
}

export enum NotificationType {
    INSCRIPTION = 'INSCRIPTION',
    SYSTEM = 'SYSTEM',
    CONTEST = 'CONTEST',
    DOCUMENT = 'DOCUMENT',
    EXAM = 'EXAM'
}

export interface Notification {
    id: string;
    recipientId: string;
    subject: string;
    content: string;
    status: NotificationStatus;
    sentAt: string;
    readAt?: string;
    acknowledgedAt?: string;
    acknowledgementLevel: AcknowledgementLevel;
    signatureType?: string;
    signatureValue?: string;
    signatureMetadata?: Record<string, string>;
    type?: NotificationType;
    metadata?: {
        inscriptionId?: string;
        contestId?: string;
        contestTitle?: string;
        inscriptionStatus?: string;
        [key: string]: string | number | boolean | null | undefined;
    };
}

export interface NotificationRequest {
    recipientUsername: string;
    subject: string;
    content: string;
    acknowledgementLevel: AcknowledgementLevel;
    type?: NotificationType;
    metadata?: {
        inscriptionId?: string;
        contestId?: string;
        contestTitle?: string;
        inscriptionStatus?: string;
        [key: string]: string | number | boolean | null | undefined;
    };
}

export interface NotificationAcknowledgementRequest {
    notificationId: string;
    signatureType: SignatureType;
    signatureValue: string;
    declaration?: string;
    metadata?: Record<string, string>;
}

// Alias de tipo en lugar de interfaz vacía para evitar errores de linting
export type NotificationResponse = Notification;

// Spanish localization for notification states
export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
    [NotificationStatus.PENDING]: 'Pendiente',
    [NotificationStatus.SENT]: 'Enviada',
    [NotificationStatus.READ]: 'Leída',
    [NotificationStatus.ACKNOWLEDGED]: 'Acusada'
};

export const ACKNOWLEDGEMENT_LEVEL_LABELS: Record<AcknowledgementLevel, string> = {
    [AcknowledgementLevel.NONE]: 'Sin acuse',
    [AcknowledgementLevel.SIMPLE]: 'Acuse simple',
    [AcknowledgementLevel.SIGNATURE_BASIC]: 'Firma básica',
    [AcknowledgementLevel.SIGNATURE_ADVANCED]: 'Firma avanzada'
};

export const SIGNATURE_TYPE_LABELS: Record<SignatureType, string> = {
    [SignatureType.PIN]: 'PIN',
    [SignatureType.DIGITAL_CERT]: 'Certificado digital',
    [SignatureType.BIOMETRIC]: 'Biométrica',
    [SignatureType.DECLARATION]: 'Declaración jurada'
};

// Helper functions for notification state management
export function getNotificationStatusColor(status: NotificationStatus): string {
    switch (status) {
        case NotificationStatus.PENDING:
            return 'orange'; // Pending actions
        case NotificationStatus.SENT:
            return 'blue'; // Informational
        case NotificationStatus.READ:
            return 'green'; // Completed
        case NotificationStatus.ACKNOWLEDGED:
            return 'green'; // Completed
        default:
            return 'blue';
    }
}

export function getAcknowledgementLevelColor(level: AcknowledgementLevel): string {
    switch (level) {
        case AcknowledgementLevel.NONE:
            return 'blue'; // Informational
        case AcknowledgementLevel.SIMPLE:
            return 'orange'; // Requires action
        case AcknowledgementLevel.SIGNATURE_BASIC:
            return 'red'; // Urgent/requires signature
        case AcknowledgementLevel.SIGNATURE_ADVANCED:
            return 'red'; // Urgent/requires advanced signature
        default:
            return 'blue';
    }
}

export function requiresAcknowledgment(notification: Notification): boolean {
    return notification.acknowledgementLevel !== AcknowledgementLevel.NONE &&
           notification.status !== NotificationStatus.ACKNOWLEDGED;
}

export function requiresSignature(notification: Notification): boolean {
    return notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_BASIC ||
           notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_ADVANCED;
}
