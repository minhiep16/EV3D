import { BatteryStatus } from '../types/battery';

export interface BatteryVisualConfig {
  position: [number, number, number];
  size: [number, number, number]; // width (x), height (y), length (z)
  moduleRows: number;
  moduleCols: number;
  moduleHeight: number;
  moduleSpacing: number;
  junctionBox: {
    position: [number, number, number];
    size: [number, number, number];
  };
}

export const BATTERY_VISUAL_CONFIGS: Record<'EV01' | 'EV02', BatteryVisualConfig> = {
  EV01: {
    // Under-floor central pack for VinFast VF8 Realistic model
    position: [0, 0.20, 0.05],
    size: [1.38, 0.16, 2.24],
    moduleRows: 5,
    moduleCols: 2,
    moduleHeight: 0.10,
    moduleSpacing: 0.03,
    junctionBox: {
      position: [0, 0.22, 1.20],
      size: [0.38, 0.14, 0.20],
    },
  },
  EV02: {
    // Under-floor central pack for Stylized EV Prototype model
    position: [0, 0.22, -0.05],
    size: [1.28, 0.16, 2.05],
    moduleRows: 4,
    moduleCols: 2,
    moduleHeight: 0.10,
    moduleSpacing: 0.03,
    junctionBox: {
      position: [0, 0.24, 1.05],
      size: [0.34, 0.14, 0.18],
    },
  },
};

export interface BatteryStatusTheme {
  glowColor: string;
  ambientColor: string;
  accentHex: string;
  labelVi: string;
  badgeBg: string;
  badgeBorder: string;
  descriptionVi: string;
}

export const BATTERY_STATUS_THEMES: Record<BatteryStatus, BatteryStatusTheme> = {
  NORMAL: {
    glowColor: '#00f2fe',
    ambientColor: '#0284c7',
    accentHex: '#38bdf8',
    labelVi: 'BÌNH THƯỜNG',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.4)',
    descriptionVi: 'Tất cả các cell pin và hệ thống làm mát cao áp hoạt động tối ưu.',
  },
  WARNING: {
    glowColor: '#fbbf24',
    ambientColor: '#d97706',
    accentHex: '#f59e0b',
    labelVi: 'CẢNH BÁO',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.4)',
    descriptionVi: 'Phát hiện suy giảm nhẹ hoặc chu kỳ sạc tăng cao. Cần theo dõi.',
  },
  CRITICAL: {
    glowColor: '#f87171',
    ambientColor: '#dc2626',
    accentHex: '#ef4444',
    labelVi: 'NGUY HIỂM',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeBorder: 'rgba(239, 68, 68, 0.5)',
    descriptionVi: 'Điện áp hoặc nhiệt độ vượt ngưỡng an toàn quy định. Ngừng vận hành.',
  },
  SERVICE_REQUIRED: {
    glowColor: '#fb923c',
    ambientColor: '#ea580c',
    accentHex: '#f97316',
    labelVi: 'CẦN BẢO DƯỠNG',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
    badgeBorder: 'rgba(249, 115, 22, 0.4)',
    descriptionVi: 'Pin cần được kiểm tra/bảo dưỡng kỹ thuật tại trạm dịch vụ.',
  },
};
