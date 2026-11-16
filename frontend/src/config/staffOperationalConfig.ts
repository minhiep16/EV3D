/**
 * Authoritative Centralized Configuration for STAFF 7 Operational Functions
 * Shared between 3D Hologram Carousel and Right-Side Operational Detail Panel
 *
 * Reduced from 8 to 7 functions:
 * "Pin & Sạc" is removed from the operational carousel; charging station interaction
 * is handled directly via 3D Charging Stations and ChargingPanel in the garage world.
 */

export type StaffOperationModuleId =
  | 'BATTERY'
  | 'MAINTENANCE'
  | 'HANDOVER'
  | 'RETURN'
  | 'INSPECTION_3D'
  | 'HISTORY'
  | 'PAYMENT'
  | 'DISPUTE';

export interface StaffOperationalModuleDef {
  id: StaffOperationModuleId;
  title: string;
  label: string; // Alias of title for direct compatibility
  subtitle: string;
  accentColor: string;
  glowColor: string;
  shapeType: 'battery' | 'wrench' | 'key' | 'arrow' | 'magnifier' | 'clock' | 'wallet' | 'scale';
}

export const STAFF_OPERATIONAL_MODULES: StaffOperationalModuleDef[] = [
  {
    id: 'MAINTENANCE',
    title: 'Bảo dưỡng',
    label: 'Bảo dưỡng',
    subtitle: 'Hồ sơ hỏng hóc',
    accentColor: '#F59E0B',
    glowColor: '#FBBF24',
    shapeType: 'wrench',
  },
  {
    id: 'HANDOVER',
    title: 'Bàn giao xe',
    label: 'Bàn giao xe',
    subtitle: 'Kiểm tra & giao khóa',
    accentColor: '#10B981',
    glowColor: '#34D399',
    shapeType: 'key',
  },
  {
    id: 'RETURN',
    title: 'Trả xe',
    label: 'Trả xe',
    subtitle: 'Thu hồi & chốt ODO',
    accentColor: '#38BDF8',
    glowColor: '#7DD3FC',
    shapeType: 'arrow',
  },
  {
    id: 'INSPECTION_3D',
    title: 'Kiểm tra 3D',
    label: 'Kiểm tra 3D',
    subtitle: 'Khảo sát kính lúp',
    accentColor: '#C084FC',
    glowColor: '#E879F9',
    shapeType: 'magnifier',
  },
  {
    id: 'HISTORY',
    title: 'Lịch sử xe',
    label: 'Lịch sử xe',
    subtitle: 'Nhật ký giao nhận',
    accentColor: '#60A5FA',
    glowColor: '#93C5FD',
    shapeType: 'clock',
  },
  {
    id: 'PAYMENT',
    title: 'Xác minh thanh toán',
    label: 'Xác minh thanh toán',
    subtitle: 'Đối soát chi phí',
    accentColor: '#00F2FE',
    glowColor: '#38BDF8',
    shapeType: 'wallet',
  },
  {
    id: 'DISPUTE',
    title: 'Hòa giải & Tranh chấp',
    label: 'Hòa giải & Tranh chấp',
    subtitle: 'Khiếu nại & bồi thường',
    accentColor: '#A855F7',
    glowColor: '#C084FC',
    shapeType: 'scale',
  },
];

export const getStaffOperationalModule = (
  id: string | null | undefined
): StaffOperationalModuleDef | undefined => {
  if (!id) return undefined;
  if (id === 'BATTERY') {
    return {
      id: 'BATTERY',
      title: 'Pin & Sạc',
      label: 'Pin & Sạc',
      subtitle: '⚡ 150kW • 60kW',
      accentColor: '#00D9FF',
      glowColor: '#38BDF8',
      shapeType: 'battery',
    };
  }
  return STAFF_OPERATIONAL_MODULES.find((m) => m.id === id);
};

