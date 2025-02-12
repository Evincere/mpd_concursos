export enum SignatureType {
    PIN = 'PIN',
    DIGITAL_CERT = 'DIGITAL_CERT',
    BIOMETRIC = 'BIOMETRIC',
    DECLARATION = 'DECLARATION'
}

export enum AcknowledgementLevel {
    NONE = 'NONE',
    SIMPLE = 'SIMPLE',
    SIGNATURE_BASIC = 'SIGNATURE_BASIC',
    SIGNATURE_ADVANCED = 'SIGNATURE_ADVANCED'
}

export interface NotificationAcknowledgement {
    signatureType: SignatureType;
    signatureValue: string;
    declaration: string | null;
    timestamp: string;
}

export interface Notification {
    id: string;
    subject: string;
    content: string;
    status: 'PENDING' | 'SENT' | 'READ' | 'ACKNOWLEDGED';
    acknowledgeLevel: AcknowledgementLevel;
    // ... otros campos ...
} 