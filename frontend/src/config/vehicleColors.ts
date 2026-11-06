/**
 * Centralized Vehicle Exterior Paint & Color Configuration (Phase 25)
 *
 * Provides standardized automotive exterior colors for:
 * - Real-time 3D vehicle preview in Onboarding & Garage
 * - Vehicle registration wizard Step 1 swatch selector
 * - Authoritative color persistence across drafts and real vehicles
 */

export interface VehicleExteriorColor {
  id: string;
  nameVi: string;
  hex: string;
  code: string;
  badgeTextColor: string;
  descriptionVi?: string;
}

export const VEHICLE_EXTERIOR_COLORS: VehicleExteriorColor[] = [
  {
    id: 'WHITE',
    code: 'WHITE',
    nameVi: 'Trắng ngọc trai',
    hex: '#F8F9FA',
    badgeTextColor: '#0f172a',
    descriptionVi: 'Sơn ngọc trai 3 lớp ánh sáng tinh tế',
  },
  {
    id: 'BLACK',
    code: 'BLACK',
    nameVi: 'Đen huyền bí',
    hex: '#1A1A1A',
    badgeTextColor: '#ffffff',
    descriptionVi: 'Đen sâu kim loại bóng loáng sang trọng',
  },
  {
    id: 'SILVER',
    code: 'SILVER',
    nameVi: 'Xám bạc',
    hex: '#8E9297',
    badgeTextColor: '#ffffff',
    descriptionVi: 'Xám kim loại titan hiện đại thể thao',
  },
  {
    id: 'BLUE',
    code: 'BLUE',
    nameVi: 'Xanh đại dương',
    hex: '#10447C',
    badgeTextColor: '#ffffff',
    descriptionVi: 'Xanh thẫm metallic đặc trưng xe điện cao cấp',
  },
  {
    id: 'RED',
    code: 'RED',
    nameVi: 'Đỏ thẫm',
    hex: '#A31A24',
    badgeTextColor: '#ffffff',
    descriptionVi: 'Đỏ ruby quyến rũ năng động',
  },
];

export const DEFAULT_VEHICLE_COLOR = VEHICLE_EXTERIOR_COLORS[0]; // Trắng ngọc trai

/**
 * Resolves a color string, name, or code to a valid CSS/ThreeJS hex color string.
 * Supports exact hex strings, Vietnamese names, and English keys with fallback to pearl white.
 */
export function resolveVehicleColorHex(colorIdentifier?: string | null): string {
  if (!colorIdentifier) return DEFAULT_VEHICLE_COLOR.hex;

  const trimmed = colorIdentifier.trim();

  // If already a valid hex
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();

  const matched = VEHICLE_EXTERIOR_COLORS.find(
    (c) =>
      c.id.toLowerCase() === lower ||
      c.code.toLowerCase() === lower ||
      c.nameVi.toLowerCase() === lower ||
      c.nameVi.toLowerCase().includes(lower) ||
      lower.includes(c.nameVi.toLowerCase())
  );

  if (matched) return matched.hex;

  // Keyword fallbacks
  if (lower.includes('trắng') || lower.includes('white') || lower.includes('ngọc')) return '#F8F9FA';
  if (lower.includes('đen') || lower.includes('black') || lower.includes('huyền')) return '#1A1A1A';
  if (lower.includes('xám') || lower.includes('bạc') || lower.includes('silver') || lower.includes('titan')) return '#8E9297';
  if (lower.includes('dương') || lower.includes('blue') || lower.includes('xanh') || lower.includes('hồ')) return '#10447C';
  if (lower.includes('đỏ') || lower.includes('red') || lower.includes('ruby')) return '#A31A24';
  if (lower.includes('hổ phách') || lower.includes('amber') || lower.includes('vàng')) return '#D97706';

  return DEFAULT_VEHICLE_COLOR.hex;
}

/**
 * Resolves full color definition from an identifier.
 */
export function getVehicleColorDef(colorIdentifier?: string | null): VehicleExteriorColor {
  const hex = resolveVehicleColorHex(colorIdentifier);
  const found = VEHICLE_EXTERIOR_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  return found || DEFAULT_VEHICLE_COLOR;
}

/**
 * Validates if a color is compatible with a vehicle model.
 * All standard electric vehicle models in Phase 25 support the 5 core automotive paints.
 */
export function isColorCompatibleWithModel(_colorId: string, _modelName?: string): boolean {
  return true;
}

