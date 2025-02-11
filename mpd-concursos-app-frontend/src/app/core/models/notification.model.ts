export enum NotificationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    READ = 'READ',
    ACKNOWLEDGED = 'ACKNOWLEDGED'
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
    acknowledgementSignature?: string;
}

export interface NotificationAcknowledgementRequest {
    notificationId: string;
    signature: string;
}

export interface NotificationResponse extends Notification {}
