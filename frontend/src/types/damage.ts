import { VehiclePartId } from './vehiclePart';

export type DamageType =
  | 'SCRATCH'
  | 'DENT'
  | 'CRACK'
  | 'BROKEN'
  | 'PAINT_DAMAGE'
  | 'GLASS_DAMAGE'
  | 'TIRE_DAMAGE'
  | 'OTHER';

export type DamageSeverity = 'MINOR' | 'MODERATE' | 'SEVERE';

export type DamageStatus = 'OPEN' | 'UNDER_MAINTENANCE' | 'RESOLVED';

export interface DamageRecordData {
  id: string;
  vehicleId: string;
  tripId: string;
  bookingId: string;
  handoverId?: string;
  vehiclePartCode: VehiclePartId | string;
  damageType: DamageType;
  severity: DamageSeverity;
  status: DamageStatus;
  note?: string;
  resolvedAt?: string | null;
  resolvedByMaintenanceRequestId?: string | null;
  localPositionX: number;
  localPositionY: number;
  localPositionZ: number;
  createdByUserId: string;
  createdByName?: string;
  createdAt: string;
}

export type DamageRecordResponse = DamageRecordData;

export interface CreateDamagePayload {
  vehiclePartCode: string;
  damageType: DamageType;
  severity: DamageSeverity;
  note?: string;
  localPositionX: number;
  localPositionY: number;
  localPositionZ: number;
}

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  SCRATCH: 'TRẦY XƯỚC',
  DENT: 'MÓP',
  CRACK: 'NỨT',
  BROKEN: 'VỠ',
  PAINT_DAMAGE: 'HƯ SƠN',
  GLASS_DAMAGE: 'HƯ KÍNH',
  TIRE_DAMAGE: 'HƯ LỐP',
  OTHER: 'KHÁC',
};

export const DAMAGE_STATUS_CONFIG: Record<
  DamageStatus,
  { label: string; labelVi: string; color: string; bg: string; borderColor: string }
> = {
  OPEN: {
    label: 'TỒN TẠI',
    labelVi: 'ĐANG TỒN TẠI',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  UNDER_MAINTENANCE: {
    label: 'ĐANG XỬ LÝ',
    labelVi: 'ĐANG BẢO DƯỠNG',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.18)',
    borderColor: 'rgba(245, 158, 11, 0.55)',
  },
  RESOLVED: {
    label: 'ĐÃ KHẮC PHỤC',
    labelVi: 'ĐÃ KHẮC PHỤC',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
};

export const DAMAGE_SEVERITY_CONFIG: Record<
  DamageSeverity,
  { label: string; labelVi: string; color: string; bg: string; borderColor: string }
> = {
  MINOR: {
    label: 'NHẸ',
    labelVi: 'NHẸ',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.6)',
  },
  MODERATE: {
    label: 'TRUNG BÌNH',
    labelVi: 'TRUNG BÌNH',
    color: '#fb923c',
    bg: 'rgba(249, 115, 22, 0.2)',
    borderColor: 'rgba(249, 115, 22, 0.6)',
  },
  SEVERE: {
    label: 'NGHIÊM TRỌNG',
    labelVi: 'NGHIÊM TRỌNG',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
};
