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
    signatureMetadata?: { [key: string]: string };
}

export interface NotificationRequest {
    recipientUsername: string;
    subject: string;
    content: string;
    acknowledgementLevel: AcknowledgementLevel;
}

export interface NotificationAcknowledgementRequest {
    notificationId: string;
    signatureType: SignatureType;
    signatureValue: string;
    declaration?: string;
    metadata?: { [key: string]: string };
}

export interface NotificationResponse extends Notification {}
