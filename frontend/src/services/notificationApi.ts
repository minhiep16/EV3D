import { authenticatedFetch, safeParseResponse } from './api';
import { NotificationResponse } from '../types/notification';

/**
 * Fetch all notifications for current user, sorted newest first.
 */
export async function fetchNotifications(): Promise<NotificationResponse[]> {
  try {
    const res = await authenticatedFetch('/api/notifications');
    if (res.status === 204 || res.status === 404) {
      return [];
    }
    const data = await safeParseResponse<NotificationResponse[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    return [];
  }
}

/**
 * Fetch unread notification count.
 */
export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await authenticatedFetch('/api/notifications/unread-count');
    if (!res.ok) return 0;
    const data = await safeParseResponse<{ count: number }>(res);
    return typeof data?.count === 'number' ? data.count : 0;
  } catch {
    return 0;
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<NotificationResponse | null> {
  try {
    const res = await authenticatedFetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
    if (!res.ok) return null;
    return await safeParseResponse<NotificationResponse>(res);
  } catch {
    return null;
  }
}

/**
 * Mark all notifications as read for current user.
 */
export async function markAllNotificationsAsRead(): Promise<number> {
  try {
    const res = await authenticatedFetch('/api/notifications/read-all', {
      method: 'POST',
    });
    if (!res.ok) return 0;
    const data = await safeParseResponse<{ updatedCount: number }>(res);
    return typeof data?.updatedCount === 'number' ? data.updatedCount : 0;
  } catch {
    return 0;
  }
}

/**
 * Delete a single notification.
 */
export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const res = await authenticatedFetch(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Delete all read notifications for current user.
 */
export async function deleteAllReadNotifications(): Promise<number> {
  try {
    const res = await authenticatedFetch('/api/notifications/read', {
      method: 'DELETE',
    });
    if (!res.ok) return 0;
    const data = await safeParseResponse<{ deletedCount: number }>(res);
    return typeof data?.deletedCount === 'number' ? data.deletedCount : 0;
  } catch {
    return 0;
  }
}

/**
 * Delete all notifications for current user.
 */
export async function deleteAllNotifications(): Promise<number> {
  try {
    const res = await authenticatedFetch('/api/notifications/all', {
      method: 'DELETE',
    });
    if (!res.ok) return 0;
    const data = await safeParseResponse<{ deletedCount: number }>(res);
    return typeof data?.deletedCount === 'number' ? data.deletedCount : 0;
  } catch {
    return 0;
  }
}


