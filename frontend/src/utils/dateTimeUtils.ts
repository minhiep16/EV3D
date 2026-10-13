/**
 * Shared Safe Date & Time Formatting Utilities for EVShare 3D.
 * Prevents runtime ReferenceErrors, handles null/undefined/invalid dates gracefully,
 * and standardizes Vietnamese date/time representations.
 */

export function formatDateTime(
  isoString?: string | null,
  fallback: string = 'Chưa có thông tin thời gian'
): string {
  if (!isoString) return fallback;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return fallback;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return fallback;
  }
}

export function formatDate(
  isoString?: string | null,
  fallback: string = '--/--/----'
): string {
  if (!isoString) return fallback;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return fallback;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fallback;
  }
}

export function formatTime(
  isoString?: string | null,
  fallback: string = '--:--'
): string {
  if (!isoString) return fallback;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return fallback;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return fallback;
  }
}
