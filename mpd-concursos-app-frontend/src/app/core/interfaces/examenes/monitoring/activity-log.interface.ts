export enum ActivityLogType {
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  USER_INTERACTION = 'USER_INTERACTION',
  RESOURCE_USAGE = 'RESOURCE_USAGE',
  NETWORK_ACTIVITY = 'NETWORK_ACTIVITY'
}

export interface ActivityLogDetails {
  message?: string;
  code?: string;
  source?: string;
  [key: string]: unknown;
}

export interface ActivityLog {
  type: ActivityLogType;
  timestamp: number;
  details: ActivityLogDetails;
}
