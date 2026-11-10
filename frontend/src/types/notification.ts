export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED';

export type NotificationEntityType =
  | 'DAMAGE'
  | 'PROPOSAL'
  | 'VOTE'
  | 'MAINTENANCE'
  | 'FINANCE'
  | 'SYSTEM'
  | 'BOOKING'
  | 'HANDOVER'
  | 'TRIP';

export interface NotificationResponse {
  id: string;
  recipientUserId: string;
  vehicleId?: string | null;
  groupId?: string | null;
  entityType: NotificationEntityType;
  entityId?: string | null;
  eventType: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  readAt?: string | null;
  createdAt: string;
  isRead: boolean;
}

