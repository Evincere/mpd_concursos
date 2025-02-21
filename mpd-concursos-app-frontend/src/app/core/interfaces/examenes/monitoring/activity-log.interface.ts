export enum ActivityLogType {
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  USER_INTERACTION = 'USER_INTERACTION',
  RESOURCE_USAGE = 'RESOURCE_USAGE',
  NETWORK_ACTIVITY = 'NETWORK_ACTIVITY'
}

export interface ActivityLog {
  type: ActivityLogType;
  timestamp: number;
  details: any;
}
