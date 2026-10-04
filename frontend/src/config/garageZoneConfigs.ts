import { GarageZone } from '../store/worldStore';

export interface ZoneConfig {
  id: GarageZone;
  name: string;
  subtitle: string;
  description: string;
  compactSummary: string;
  position: [number, number, number];
  color: string;
  accentColor: string;
}

/**
 * STAFF / OPERATIONS Dedicated Spatial Zone Layout:
 * Top row:
 *                      [ PHÂN TÍCH & GIÁM SÁT (0.0, -5.2) ]
 * Middle row:
 * [ BẢO DƯỠNG (-6.5, 0.5) ]      [ EV01 (0.0, 0.5) ]      [ SẠC (6.5, 0.5) ]
 * Bottom row:
 *                      [ VẬN HÀNH / BÀN GIAO (0.0, 6.2) ]
 */
export const OPERATIONS_ZONE_CONFIGS: Record<GarageZone, ZoneConfig> = {
  VEHICLE: {
    id: 'VEHICLE',
    name: 'KHU VỰC VẬN HÀNH / BÀN GIAO',
    subtitle: 'Trạm điều phối, tiếp nhận & bàn giao xe',
    description: 'Khu vực tiếp nhận, kiểm định kỹ thuật và chuyển giao quyền vận hành cho xe điện đồng sở hữu.',
    compactSummary: 'Trạm bàn giao',
    position: [0.0, 0, 6.2],
    color: '#0284c7',
    accentColor: '#00f2fe',
  },
  CHARGING: {
    id: 'CHARGING',
    name: 'KHU VỰC SẠC',
    subtitle: 'Trạm sạc thông minh công suất cao',
    description: 'Quản lý sạc tốc độ cao tự động và đồng bộ dữ liệu pin xe điện theo thời gian thực.',
    compactSummary: '2 trụ sạc | Sẵn sàng',
    position: [6.5, 0, 0.5],
    color: '#0284c7',
    accentColor: '#00f2fe',
  },
  MAINTENANCE: {
    id: 'MAINTENANCE',
    name: 'KHU VỰC BẢO DƯỠNG',
    subtitle: 'Khu vực chẩn đoán & Dịch vụ kỹ thuật',
    description: 'Theo dõi tình trạng sức khỏe xe, kích nâng kiểm tra linh kiện và quản lý lịch sử bảo dưỡng.',
    compactSummary: '0 yêu cầu đang xử lý',
    position: [-6.5, 0, 0.5],
    color: '#d97706',
    accentColor: '#fbbf24',
  },
  FINANCE: {
    id: 'FINANCE',
    name: 'KHU VỰC TÀI CHÍNH',
    subtitle: 'Quỹ đồng sở hữu & Phân bổ chi phí',
    description: 'Quản lý quỹ chung minh bạch, theo dõi chi phí vận hành và phân bổ doanh thu/chi phí cho các chủ xe.',
    compactSummary: 'Quỹ chung | 25.000.000 ₫',
    position: [-7.5, 0, -4.5],
    color: '#059669',
    accentColor: '#34d399',
  },
  GOVERNANCE: {
    id: 'GOVERNANCE',
    name: 'KHU VỰC QUẢN TRỊ',
    subtitle: 'Bỏ phiếu & Quyết định chung của cổ đông',
    description: 'Biểu quyết các đề xuất nâng cấp xe, phê duyệt quy chế hoạt động và quản trị đồng sở hữu theo tỷ lệ cổ phần.',
    compactSummary: '1 biểu quyết đang mở',
    position: [7.5, 0, -4.5],
    color: '#7c3aed',
    accentColor: '#c084fc',
  },
  ANALYTICS: {
    id: 'ANALYTICS',
    name: 'KHU VỰC PHÂN TÍCH & GIÁM SÁT',
    subtitle: 'Đo lường vận hành & Tiến độ bàn giao',
    description: 'Theo dõi tiến độ bàn giao xe, tần suất hoạt động và phân tích hiệu suất phục vụ ca trực.',
    compactSummary: 'Tiến độ vận hành',
    position: [0.0, 0, -5.2],
    color: '#2563eb',
    accentColor: '#60a5fa',
  },
  AI: {
    id: 'AI',
    name: 'KHU VỰC TRỢ LÝ AI',
    subtitle: 'Trợ lý ảo vận hành đồng sở hữu thông minh',
    description: 'Đề xuất lịch trình tối ưu, cân bằng quyền ưu tiên đặt xe và đưa ra cảnh báo bất thường tự động.',
    compactSummary: 'Sẵn sàng hỗ trợ',
    position: [0.0, 0, 9.0],
    color: '#0284c7',
    accentColor: '#00f2fe',
  },
};

/**
 * CO_OWNER Dedicated Garage Zone Spatial Layout (Reference Design):
 * Rear-Center:
 *                      [ TRỢ LÝ AI (-2.2, -4.2) ]
 * Mid row:
 * [ TÀI CHÍNH (-5.4, -0.6) ]                  [ PHÂN TÍCH (3.0, -4.0) ]
 * Foreground hero:
 *                  [ EV01 (0.0, 1.8) ]        [ SẠC (5.0, 0.8) ]
 */
export const CO_OWNER_ZONE_CONFIGS: Record<GarageZone, ZoneConfig> = {
  VEHICLE: {
    ...OPERATIONS_ZONE_CONFIGS.VEHICLE,
    position: [0.0, 0, 1.8],
  },
  CHARGING: {
    ...OPERATIONS_ZONE_CONFIGS.CHARGING,
    position: [5.2, 0, 0.5],
  },
  MAINTENANCE: {
    ...OPERATIONS_ZONE_CONFIGS.MAINTENANCE,
    position: [-9.0, 0, 0.5],
  },
  FINANCE: {
    ...OPERATIONS_ZONE_CONFIGS.FINANCE,
    position: [-4.2, 0, 3.2],
  },
  GOVERNANCE: {
    ...OPERATIONS_ZONE_CONFIGS.GOVERNANCE,
    position: [9.0, 0, -4.5],
  },
  ANALYTICS: {
    ...OPERATIONS_ZONE_CONFIGS.ANALYTICS,
    position: [3.2, 0, -3.8],
  },
  AI: {
    ...OPERATIONS_ZONE_CONFIGS.AI,
    position: [-3.2, 0, -3.8],
  },
};

/**
 * ADMIN Dedicated Garage Zone Spatial Layout:
 * Management-focused layout with EV01 center-stage and oversight stations
 */
export const ADMIN_ZONE_CONFIGS: Record<GarageZone, ZoneConfig> = {
  ...OPERATIONS_ZONE_CONFIGS,
  VEHICLE: {
    ...OPERATIONS_ZONE_CONFIGS.VEHICLE,
    position: [0.0, 0, 6.2],
  },
  GOVERNANCE: {
    ...OPERATIONS_ZONE_CONFIGS.GOVERNANCE,
    position: [-6.5, 0, -2.5],
  },
  ANALYTICS: {
    ...OPERATIONS_ZONE_CONFIGS.ANALYTICS,
    position: [0.0, 0, -5.2],
  },
};

export const ZONE_CONFIGS = OPERATIONS_ZONE_CONFIGS;

export function getZoneConfig(zoneId: GarageZone, role?: string): ZoneConfig {
  if (role === 'ADMIN') {
    return ADMIN_ZONE_CONFIGS[zoneId] || OPERATIONS_ZONE_CONFIGS[zoneId];
  }
  const isCoOwner = !role || role === 'CO_OWNER';
  return isCoOwner ? CO_OWNER_ZONE_CONFIGS[zoneId] : OPERATIONS_ZONE_CONFIGS[zoneId];
}
