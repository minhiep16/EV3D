/**
 * Authoritative Centralized Configuration for CO_OWNER 8 Operational Functions
 * Shared by 3D Hologram Carousel and Garage Scene Presentation Machine
 */

export type CoOwnerOperationModuleId =
  | 'BOOKING'
  | 'EXPLORATION'
  | 'MAINTENANCE'
  | 'BATTERY_XRAY'
  | 'VOTING'
  | 'DISPUTE'
  | 'CO_OWNERSHIP'
  | 'CONTRACT';

export interface CoOwnerOperationalModuleDef {
  id: CoOwnerOperationModuleId;
  title: string;
  label: string; // Alias for compatibility
  subtitle: string;
  accentColor: string;
  glowColor: string;
  shapeType:
    | 'calendar'
    | 'magnifier'
    | 'wrench'
    | 'battery'
    | 'ballot_box'
    | 'scale'
    | 'network'
    | 'contract';
}

export const CO_OWNER_OPERATIONAL_MODULES: CoOwnerOperationalModuleDef[] = [
  {
    id: 'BOOKING',
    title: 'Đặt lịch',
    label: 'Đặt lịch',
    subtitle: 'Lịch sử dụng xe',
    accentColor: '#00D9FF',
    glowColor: '#38BDF8',
    shapeType: 'calendar',
  },
  {
    id: 'EXPLORATION',
    title: 'Khám phá',
    label: 'Khám phá',
    subtitle: 'Khám phá xe 3D',
    accentColor: '#C084FC',
    glowColor: '#E879F9',
    shapeType: 'magnifier',
  },
  {
    id: 'MAINTENANCE',
    title: 'Bảo dưỡng',
    label: 'Bảo dưỡng',
    subtitle: 'Đề xuất & kiểm tra',
    accentColor: '#F59E0B',
    glowColor: '#FBBF24',
    shapeType: 'wrench',
  },
  {
    id: 'BATTERY_XRAY',
    title: 'X-Ray pin',
    label: 'X-Ray pin',
    subtitle: 'Tình trạng pin 3D',
    accentColor: '#00F2FE',
    glowColor: '#38BDF8',
    shapeType: 'battery',
  },
  {
    id: 'VOTING',
    title: 'Biểu quyết',
    label: 'Biểu quyết',
    subtitle: 'Quyết định nhóm',
    accentColor: '#60A5FA',
    glowColor: '#93C5FD',
    shapeType: 'ballot_box',
  },
  {
    id: 'DISPUTE',
    title: 'Tranh chấp',
    label: 'Tranh chấp',
    subtitle: 'Khiếu nại & hòa giải',
    accentColor: '#A855F7',
    glowColor: '#C084FC',
    shapeType: 'scale',
  },
  {
    id: 'CO_OWNERSHIP',
    title: 'Nhóm sở hữu',
    label: 'Nhóm sở hữu',
    subtitle: 'Thành viên & cổ phần',
    accentColor: '#10B981',
    glowColor: '#34D399',
    shapeType: 'network',
  },
  {
    id: 'CONTRACT',
    title: 'Hợp đồng',
    label: 'Hợp đồng',
    subtitle: 'Hồ sơ pháp lý điện tử',
    accentColor: '#38BDF8',
    glowColor: '#7DD3FC',
    shapeType: 'contract',
  },
];

export const getCoOwnerOperationalModule = (
  id: string | null | undefined
): CoOwnerOperationalModuleDef | undefined => {
  if (!id) return undefined;
  return CO_OWNER_OPERATIONAL_MODULES.find((m) => m.id === id);
};
