/**
 * EVShare 3D — Unified Formatting Utilities
 * Standardized vi-VN formatting for Currency, Percentage, Battery SOC, Distance, Energy, and Duration.
 * Guarantees zero NaN, undefined, or null display regressions.
 */

import { formatDateTime, formatDate, formatTime } from './dateTimeUtils';

export { formatDateTime, formatDate, formatTime };

/**
 * Format Vietnamese Currency (₫)
 */
export function formatCurrencyVnd(
  amount: number | null | undefined,
  fallback: string = '0 ₫'
): string {
  if (amount == null || isNaN(amount)) return fallback;
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))} ₫`;
}

/**
 * Format Percentage (%)
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1,
  fallback: string = '0%'
): string {
  if (value == null || isNaN(value)) return fallback;
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format Battery State of Charge (SOC)
 */
export function formatBatterySoc(
  soc: number | null | undefined,
  fallback: string = '--%'
): string {
  if (soc == null || isNaN(soc)) return fallback;
  const clamped = Math.max(0, Math.min(100, Math.round(soc)));
  return `${clamped}%`;
}

/**
 * Format Distance in Kilometers (km)
 */
export function formatDistanceKm(
  distanceKm: number | null | undefined,
  decimals: number = 1,
  fallback: string = '0 km'
): string {
  if (distanceKm == null || isNaN(distanceKm)) return fallback;
  const num = Number(distanceKm);
  return `${num.toFixed(decimals % 1 === 0 ? 0 : decimals)} km`;
}

/**
 * Format Energy in Kilowatt-hours (kWh)
 */
export function formatEnergyKwh(
  energyKwh: number | null | undefined,
  decimals: number = 2,
  fallback: string = '0 kWh'
): string {
  if (energyKwh == null || isNaN(energyKwh)) return fallback;
  return `${Number(energyKwh).toFixed(decimals)} kWh`;
}

/**
 * Format Power in Kilowatts (kW)
 */
export function formatPowerKw(
  powerKw: number | null | undefined,
  decimals: number = 1,
  fallback: string = '0 kW'
): string {
  if (powerKw == null || isNaN(powerKw)) return fallback;
  return `${Number(powerKw).toFixed(decimals)} kW`;
}

/**
 * Format Tariff in VND per kWh
 */
export function formatTariffVndPerKwh(
  tariff: number | null | undefined,
  fallback: string = '0 đ/kWh'
): string {
  if (tariff == null || isNaN(tariff)) return fallback;
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(tariff))} đ/kWh`;
}

/**
 * Format Duration in minutes or hours/minutes
 */
export function formatDurationMinutes(
  minutes: number | null | undefined,
  fallback: string = '0 phút'
): string {
  if (minutes == null || isNaN(minutes) || minutes <= 0) return fallback;
  const totalMin = Math.round(minutes);
  const hours = Math.floor(totalMin / 60);
  const remainingMin = totalMin % 60;

  if (hours === 0) {
    return `${remainingMin} phút`;
  }
  if (remainingMin === 0) {
    return `${hours} giờ`;
  }
  return `${hours} giờ ${remainingMin} phút`;
}

/**
 * Validates whether a string is a standard 36-character UUID format (8-4-4-4-12 hex).
 * Prevents synthetic/temporary preview IDs (e.g. 'application-...') from being sent to backend UUID endpoints
 * while safely supporting all valid hex UUIDs including database seeds (e.g. 11111111-1111-1111-1111-111111111111).
 */
export function isValidUuid(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

