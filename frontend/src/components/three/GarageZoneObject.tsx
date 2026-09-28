import React, { useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { SpatialDataLink } from './SpatialDataLink';
import { HolographicPanelFrame3D } from './HolographicPanelFrame3D';
import { useWorldStore, GarageZone } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { canAccessZone } from '../../utils/roleCapabilities';
import { 
  Zap, 
  Wrench, 
  DollarSign, 
  Vote, 
  BarChart3, 
  Bot, 
  Car, 
  Info,
  X,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { INTERACTION_CONFIG } from '../../config/interactionConfig';
import {
  shouldShowZoneLabel,
  shouldShowZoneSummary,
  shouldShowOverviewZoneUI,
  isGarageZoneFocused,
} from '../../config/garageZoneVisibility';

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
    position: [-5.2, 0, 0.5],
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

interface GarageZoneObjectProps {
  zone: ZoneConfig;
}

export const GarageZoneObject: React.FC<GarageZoneObjectProps> = ({ zone }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const coreGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const hoveredZone = useWorldStore((state) => state.hoveredZone);
  const selectZone = useWorldStore((state) => state.selectZone);
  const hoverZone = useWorldStore((state) => state.hoverZone);
  const clearSelection = useWorldStore((state) => state.clearSelection);

  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const vehicleCoOwnershipMode = useWorldStore((state) => state.vehicleCoOwnershipMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const vehicleTripStartMode = useWorldStore((state) => state.vehicleTripStartMode);
  const vehicleTripVisualizationMode = useWorldStore((state) => state.vehicleTripVisualizationMode);
  const vehicleReceiptReviewMode = useWorldStore((state) => state.vehicleReceiptReviewMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const isVehicleSelected = useWorldStore((state) => state.isVehicleSelected);
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const selectedVehiclePartCode = useWorldStore((state) => state.selectedVehiclePartCode);

  const focusState = React.useMemo(
    () => ({
      selectedZone,
      selectedVehicleId,
      isVehicleSelected,
      vehicleBookingMode,
      vehicleCoOwnershipMode,
      vehicleHandoverMode,
      vehicleReceiptReviewMode,
      vehicleTripStartMode,
      vehicleTripVisualizationMode,
      vehicleDamageMappingMode,
      vehicleInspectionMode,
      selectedVehiclePartId,
      selectedVehiclePartCode,
    }),
    [
      selectedZone,
      selectedVehicleId,
      isVehicleSelected,
      vehicleBookingMode,
      vehicleCoOwnershipMode,
      vehicleHandoverMode,
      vehicleReceiptReviewMode,
      vehicleTripStartMode,
      vehicleTripVisualizationMode,
      vehicleDamageMappingMode,
      vehicleInspectionMode,
      selectedVehiclePartId,
      selectedVehiclePartCode,
    ]
  );

  const isSelected = selectedZone === zone.id;
  const isHovered = hoveredZone === zone.id;

  const isFocusedBusinessMode =
    vehicleDamageMappingMode ||
    vehicleTripVisualizationMode ||
    vehicleTripStartMode ||
    vehicleHandoverMode ||
    vehicleReceiptReviewMode ||
    vehicleBookingMode ||
    vehicleInspectionMode ||
    vehicleCoOwnershipMode;

  const user = useAuthStore((state) => state.user);
  const isAccessible = canAccessZone(user?.role, zone.id);

  const isOperationsRole = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const zoneName = React.useMemo(() => {
    if (zone.id === 'ANALYTICS') {
      return isOperationsRole ? 'KHU VỰC PHÂN TÍCH & GIÁM SÁT' : 'KHU VỰC PHÂN TÍCH';
    }
    if (zone.id === 'VEHICLE') {
      return isOperationsRole ? 'KHU VỰC VẬN HÀNH / BÀN GIAO' : 'KHU VỰC XE';
    }
    return zone.name;
  }, [zone.id, zone.name, isOperationsRole]);

  const zoneSubtitle = React.useMemo(() => {
    if (zone.id === 'ANALYTICS') {
      if (isAdmin) return 'Giám sát toàn diện hệ thống & Chỉ số vận hành';
      if (user?.role === 'STAFF') return 'Đo lường vận hành & Tiến độ bàn giao';
      return 'Đo lường dữ liệu, Hiệu suất & Công bằng';
    }
    if (zone.id === 'GOVERNANCE') {
      return 'Quản trị hệ thống & Giám sát phân quyền';
    }
    if (zone.id === 'VEHICLE') {
      return isOperationsRole
        ? 'Trạm điều phối, tiếp nhận & bàn giao xe'
        : 'Vị trí đỗ & Bàn giao xe đồng sở hữu';
    }
    return zone.subtitle;
  }, [zone.id, zone.subtitle, isAdmin, user?.role, isOperationsRole]);

  const zoneDescription = React.useMemo(() => {
    if (zone.id === 'ANALYTICS') {
      if (isAdmin) {
        return 'Theo dõi các chỉ số SLA, tình trạng đội xe toàn hệ thống và phân tích dữ liệu hiệu suất vận hành.';
      }
      if (user?.role === 'STAFF') {
        return 'Theo dõi tiến độ bàn giao xe, tần suất hoạt động và phân tích hiệu suất phục vụ ca trực.';
      }
      return zone.description;
    }
    if (zone.id === 'GOVERNANCE') {
      return 'Quản lý phân quyền người dùng (RBAC), kiểm soát quy chế vận hành và giám sát an toàn nền tảng.';
    }
    if (zone.id === 'VEHICLE') {
      return isOperationsRole
        ? 'Khu vực tiếp nhận, kiểm định kỹ thuật và chuyển giao quyền vận hành cho xe điện đồng sở hữu.'
        : 'Khu vực tiếp nhận, đỗ xe tập trung và chuyển giao quyền vận hành cho xe điện đồng sở hữu.';
    }
    return zone.description;
  }, [zone.id, zone.description, isAdmin, user?.role, isOperationsRole]);

  const zoneCompactSummary = React.useMemo(() => {
    if (zone.id === 'ANALYTICS') {
      if (isAdmin) return 'Chỉ số hệ thống';
      if (user?.role === 'STAFF') return 'Tiến độ vận hành';
      return 'Dữ liệu vận hành';
    }
    if (zone.id === 'GOVERNANCE') {
      return 'Quản trị hệ thống';
    }
    if (zone.id === 'VEHICLE') {
      return isOperationsRole ? 'Trạm bàn giao' : '';
    }
    return zone.compactSummary;
  }, [zone.id, zone.compactSummary, isAdmin, user?.role, isOperationsRole]);

  // Centralized focus visibility logic:
  // - In overview mode (selectedZoneId == null): all zone labels & summaries are shown
  // - In focused mode (selectedZoneId != null): ALL overview labels & summaries are hidden (unmounted)
  //   The focused zone detail panel is the sole authoritative information surface.
  const showZoneLabel = shouldShowZoneLabel(zone.id, focusState);
  const showZoneSummary = shouldShowZoneSummary(zone.id, focusState);
  const showZoneLabelAndSummary =
    showZoneLabel && !(zone.id === 'VEHICLE' && (selectedVehicleId != null || isVehicleSelected));
  const showZoneCard = isSelected && zone.id !== 'VEHICLE';

  useFrame((_, delta) => {
    if (coreMeshRef.current) {
      if (zone.id === 'FINANCE') {
        coreMeshRef.current.rotation.y += delta * 0.8;
      }
    }
    if (coreGroupRef.current) {
      if (zone.id === 'AI') {
        coreGroupRef.current.position.y = 1.35 + Math.sin(Date.now() * 0.0025) * 0.08;
      }
      if (zone.id === 'ANALYTICS') {
        coreGroupRef.current.rotation.y += delta * 0.4;
      }
    }
    if (ringRef.current && isSelected) {
      ringRef.current.rotation.z += delta * 1.2;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > INTERACTION_CONFIG.clickDragThresholdPx) return;
    e.stopPropagation();
    if (isFocusedBusinessMode || !isAccessible) return;
    selectZone(zone.id);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isFocusedBusinessMode || !isAccessible) return;
    hoverZone(zone.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isFocusedBusinessMode || !isAccessible) return;
    if (hoveredZone === zone.id) {
      hoverZone(null);
    }
    document.body.style.cursor = 'auto';
  };

  const getZoneIcon = (id: GarageZone) => {
    switch (id) {
      case 'VEHICLE':
        return <Car size={13} color="#00f2fe" />;
      case 'CHARGING':
        return <Zap size={13} color="#00f2fe" />;
      case 'FINANCE':
        return <DollarSign size={13} color="#00f2fe" />;
      case 'AI':
        return <MessageSquare size={13} color="#00f2fe" />;
      case 'ANALYTICS':
        return <BarChart3 size={13} color="#00f2fe" />;
      case 'MAINTENANCE':
        return <Wrench size={13} color="#fbbf24" />;
      case 'GOVERNANCE':
        return <Vote size={13} color="#c084fc" />;
      default:
        return <Info size={13} color="#00f2fe" />;
    }
  };

  return (
    <group
      ref={groupRef}
      position={zone.position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* =========================================================================
          1. REALISTIC CIRCULAR RAISED PLATFORMS WITH THIN CYAN EMISSIVE RINGS
          ========================================================================= */}
      {zone.id === 'VEHICLE' && !isOperationsRole ? (
        /* HERO PLATFORM FOR EV01: Largest Circular Multi-Tiered Showroom Turntable */
        <group position={[0, 0, 0]}>
          {/* Base Stepped Turntable Pad */}
          <mesh position={[0, 0.035, 0]} receiveShadow>
            <cylinderGeometry args={[2.85, 2.95, 0.07, 64]} />
            <meshStandardMaterial
              color="#f8fafc"
              roughness={0.2}
              metalness={0.25}
            />
          </mesh>

          {/* Outer Polished Aluminum Bevel Rim */}
          <mesh position={[0, 0.072, 0]}>
            <cylinderGeometry args={[2.80, 2.86, 0.015, 64]} />
            <meshStandardMaterial
              color="#94a3b8"
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>

          {/* Outer Recessed Thin Cyan Emissive Neon Halo */}
          <mesh position={[0, 0.076, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.72, 2.80, 64]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.75}
            />
          </mesh>

          {/* Middle Elevated Stepped Tier */}
          <mesh position={[0, 0.09, 0]} receiveShadow>
            <cylinderGeometry args={[2.55, 2.62, 0.035, 64]} />
            <meshStandardMaterial
              color="#eef2f6"
              roughness={0.22}
              metalness={0.25}
            />
          </mesh>

          {/* Inner Recessed Thin Cyan LED Ring */}
          <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.38, 2.44, 64]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={0.65}
            />
          </mesh>

          {/* Top Glossy Vehicle Turntable Surface */}
          <mesh position={[0, 0.114, 0]} receiveShadow>
            <cylinderGeometry args={[2.40, 2.40, 0.012, 64]} />
            <meshStandardMaterial
              color="#ffffff"
              roughness={0.16}
              metalness={0.22}
            />
          </mesh>
        </group>
      ) : (
        /* STANDARD CIRCULAR RAISED PLATFORMS FOR FINANCE, AI, ANALYTICS, CHARGING */
        <group position={[0, 0, 0]}>
          {/* Base Chamfered Station Pad */}
          <mesh position={[0, 0.04, 0]} receiveShadow>
            <cylinderGeometry args={[1.9, 1.98, 0.08, 48]} />
            <meshStandardMaterial
              color="#f8fafc"
              roughness={0.2}
              metalness={0.25}
            />
          </mesh>

          {/* Outer Brushed Metal Bevel Rim */}
          <mesh position={[0, 0.082, 0]}>
            <cylinderGeometry args={[1.88, 1.92, 0.015, 48]} />
            <meshStandardMaterial
              color="#94a3b8"
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>

          {/* Recessed Thin Cyan Emissive Ring */}
          <mesh position={[0, 0.086, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.76, 1.85, 48]} />
            <meshBasicMaterial
              color={zone.accentColor}
              transparent
              opacity={isSelected ? 0.95 : isHovered ? 0.8 : 0.6}
            />
          </mesh>

          {/* Inner Upper Platform Disc */}
          <mesh position={[0, 0.09, 0]} receiveShadow>
            <cylinderGeometry args={[1.74, 1.74, 0.015, 48]} />
            <meshStandardMaterial
              color="#f1f5f9"
              roughness={0.2}
              metalness={0.2}
            />
          </mesh>

          {/* Selection Rotating Ground Disc */}
          {isSelected && (
            <mesh ref={ringRef} position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[2.15, 2.25, 48]} />
              <meshBasicMaterial
                color={zone.accentColor}
                side={THREE.DoubleSide}
                transparent
                opacity={0.8}
              />
            </mesh>
          )}
        </group>
      )}

      {/* =========================================================================
          2. ZONE-SPECIFIC REALISTIC SMART EQUIPMENT LANDMARKS (NATIVE GEOMETRY ONLY)
          ========================================================================= */}

      {/* VEHICLE ZONE: Handover Dispatch Terminal Console (STAFF / OPERATIONS ONLY) */}
      {zone.id === 'VEHICLE' && isOperationsRole && (
        <group position={[0, 0.07, 0]}>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.22, 0.3, 0.9, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.88, 0]}>
            <cylinderGeometry args={[0.24, 0.22, 0.08, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
          <group position={[0, 1.05, 0.08]} rotation={[-Math.PI / 5, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.7, 0.05, 0.45]} />
              <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.027, 0]}>
              <planeGeometry args={[0.62, 0.37]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
          </group>
          {[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([px, pz], i) => (
            <mesh key={i} position={[px, 0.15, pz]} castShadow>
              <cylinderGeometry args={[0.04, 0.06, 0.3, 16]} />
              <meshStandardMaterial color="#0284c7" emissive={zone.accentColor} emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      )}

      {/* CHARGING ZONE: Clean White EV Fast Charger Kiosk + Holographic Charging HUD */}
      {zone.id === 'CHARGING' && (
        <group position={[0, 0.08, 0]}>
          {/* Main White Charger Tower Body */}
          <group position={[0.42, 0, 0]}>
            <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.64, 1.88, 0.42]} />
              <meshStandardMaterial
                color="#ffffff"
                roughness={0.2}
                metalness={0.22}
              />
            </mesh>
            {/* Side Brushed Alloy Trim Strips */}
            <mesh position={[-0.325, 0.95, 0]}>
              <boxGeometry args={[0.02, 1.9, 0.4]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.325, 0.95, 0]}>
              <boxGeometry args={[0.02, 1.9, 0.4]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Front Black Beveled Glass Frame */}
            <mesh position={[0, 1.15, 0.215]}>
              <boxGeometry args={[0.48, 1.05, 0.02]} />
              <meshStandardMaterial color="#0b1320" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* Active Vertical Cyan Touch Screen */}
            <mesh position={[0, 1.2, 0.23]}>
              <planeGeometry args={[0.4, 0.8]} />
              <meshBasicMaterial color="#00f2fe" />
            </mesh>
            {/* Lightning bolt indicator plate */}
            <mesh position={[0, 1.25, 0.232]}>
              <planeGeometry args={[0.18, 0.32]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
            </mesh>
            {/* Top Status LED Arch */}
            <mesh position={[0, 1.9, 0]}>
              <boxGeometry args={[0.56, 0.04, 0.32]} />
              <meshBasicMaterial color="#00f2fe" />
            </mesh>
            {/* Side CCS2 Charging Cable Holster & Plug */}
            <mesh position={[0.42, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 0.9, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.7} />
            </mesh>
            <mesh position={[0.42, 0.9, 0.05]} rotation={[Math.PI / 4, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.06, 0.25, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>
            <mesh position={[0.42, 0.98, 0.12]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial color="#0284c7" emissive="#00f2fe" emissiveIntensity={0.8} />
            </mesh>
          </group>

          {/* Floating Holographic Charging Status HUD Panel */}
          <group position={[-0.65, 1.18, 0.15]} rotation={[0, 0.32, 0]}>
            {/* Translucent Glass HUD Backing */}
            <mesh>
              <planeGeometry args={[0.9, 0.72]} />
              <meshStandardMaterial
                color="#041b2d"
                roughness={0.1}
                metalness={0.8}
                transparent
                opacity={0.75}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Cyan Border Frame */}
            <mesh position={[0, 0, 0.005]}>
              <planeGeometry args={[0.92, 0.74]} />
              <meshBasicMaterial color="#00f2fe" wireframe transparent opacity={0.6} />
            </mesh>
            {/* Simulated EV Wireframe Silhouette */}
            <mesh position={[0, 0.14, 0.01]}>
              <planeGeometry args={[0.55, 0.24]} />
              <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.85} />
            </mesh>
            {/* Battery Level Gauge Bars */}
            {[-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((bx, bidx) => (
              <mesh key={bidx} position={[bx, -0.12, 0.01]}>
                <planeGeometry args={[0.07, 0.14]} />
                <meshBasicMaterial color={bidx < 5 ? '#00f2fe' : '#64748b'} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* FINANCE ZONE: Square Pedestal + Floating Emerald-Cyan Crystal + Coin Stacks + Holographic Chart */}
      {zone.id === 'FINANCE' && (
        <group position={[0, 0.08, 0]}>
          {/* Stepped Clean White Pedestal */}
          <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.15, 0.24, 1.15]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[0.92, 0.06, 0.92]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.355, 0]}>
            <boxGeometry args={[0.82, 0.015, 0.82]} />
            <meshBasicMaterial color="#00f2fe" transparent opacity={0.8} />
          </mesh>

          {/* Floating Faceted Emerald-Cyan Crystal Core */}
          <mesh ref={coreMeshRef} position={[0, 1.15, 0]} castShadow>
            <octahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#059669"
              emissiveIntensity={isSelected ? 1.6 : 1.1}
              roughness={0.12}
              metalness={0.65}
            />
          </mesh>
          {/* Floating Cyan Orbital Ring */}
          <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.78, 0.02, 16, 32]} />
            <meshBasicMaterial color="#00f2fe" />
          </mesh>

          {/* Stacks of Metallic Cyan / Gold Coins */}
          {[
            { pos: [0.65, 0.08, 0.35], count: 5 },
            { pos: [0.88, 0.08, 0.08], count: 8 },
            { pos: [0.55, 0.08, -0.28], count: 4 },
          ].map((stack, sIdx) => (
            <group key={sIdx} position={stack.pos as [number, number, number]}>
              {Array.from({ length: stack.count }).map((_, cIdx) => (
                <mesh key={cIdx} position={[0, cIdx * 0.035, 0]} castShadow>
                  <cylinderGeometry args={[0.13, 0.13, 0.03, 24]} />
                  <meshStandardMaterial
                    color="#38bdf8"
                    emissive="#0284c7"
                    emissiveIntensity={0.25}
                    metalness={0.9}
                    roughness={0.18}
                  />
                </mesh>
              ))}
            </group>
          ))}

          {/* Standing Holographic Growth Chart Panel */}
          <group position={[0.82, 0.95, -0.45]} rotation={[0, -0.42, 0]}>
            {/* Glass panel */}
            <mesh>
              <planeGeometry args={[0.82, 0.62]} />
              <meshStandardMaterial
                color="#061a2b"
                roughness={0.1}
                metalness={0.8}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, 0, 0.005]}>
              <planeGeometry args={[0.84, 0.64]} />
              <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.6} />
            </mesh>
            {/* Mini Bar Columns */}
            {[-0.25, -0.12, 0.0, 0.12, 0.25].map((barX, bIdx) => {
              const h = 0.12 + bIdx * 0.06;
              return (
                <mesh key={bIdx} position={[barX, -0.16 + h / 2, 0.01]}>
                  <planeGeometry args={[0.07, h]} />
                  <meshBasicMaterial color="#34d399" />
                </mesh>
              );
            })}
            {/* Upward Trend Line */}
            <mesh position={[0, 0.08, 0.012]} rotation={[0, 0, 0.35]}>
              <planeGeometry args={[0.62, 0.02]} />
              <meshBasicMaterial color="#00f2fe" />
            </mesh>
          </group>
        </group>
      )}

      {/* ANALYTICS ZONE: 3D Bar-Chart Columns + Large Holographic Analytics HUD Panel */}
      {zone.id === 'ANALYTICS' && (
        <group position={[0, 0.08, 0]}>
          {/* Circular Stage Collar */}
          <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.3, 1.42, 0.28, 32]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.3} />
          </mesh>

          {/* 3D Bar-Chart Columns on the platform */}
          <group position={[0, 0.28, 0]}>
            {[
              { pos: [-0.48, 0.15], h: 0.55 },
              { pos: [-0.22, 0.1], h: 0.9 },
              { pos: [0.05, 0.0], h: 1.35 },
              { pos: [0.32, -0.08], h: 1.7 },
              { pos: [0.58, -0.14], h: 1.15 },
              { pos: [0.18, 0.32], h: 0.75 },
            ].map((col, idx) => (
              <group key={idx} position={[col.pos[0], 0, col.pos[1]]}>
                {/* Column Body */}
                <mesh position={[0, col.h / 2, 0]} castShadow>
                  <boxGeometry args={[0.22, col.h, 0.22]} />
                  <meshStandardMaterial
                    color="#0284c7"
                    roughness={0.2}
                    metalness={0.5}
                    transparent
                    opacity={0.88}
                  />
                </mesh>
                {/* Glowing Top Cap */}
                <mesh position={[0, col.h + 0.01, 0]}>
                  <boxGeometry args={[0.225, 0.02, 0.225]} />
                  <meshBasicMaterial color="#00f2fe" />
                </mesh>
              </group>
            ))}
          </group>

          {/* Large Floating Holographic Analytics HUD Panel */}
          <group position={[0, 1.35, -0.45]}>
            {/* Curved / Angled Glass HUD Screen */}
            <mesh>
              <planeGeometry args={[1.85, 0.95]} />
              <meshStandardMaterial
                color="#031526"
                roughness={0.1}
                metalness={0.85}
                transparent
                opacity={0.78}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, 0, 0.005]}>
              <planeGeometry args={[1.87, 0.97]} />
              <meshBasicMaterial color="#00f2fe" wireframe transparent opacity={0.65} />
            </mesh>
            {/* Line graph line */}
            <mesh position={[-0.35, 0.1, 0.012]} rotation={[0, 0, 0.15]}>
              <planeGeometry args={[0.9, 0.015]} />
              <meshBasicMaterial color="#00f2fe" />
            </mesh>
            {/* KPI Circular Donut Ring */}
            <mesh position={[0.55, 0.1, 0.01]}>
              <ringGeometry args={[0.18, 0.24, 32]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            {/* Mini metrics horizontal bars */}
            {[-0.2, -0.28].map((my, mi) => (
              <mesh key={mi} position={[-0.35, my, 0.01]}>
                <planeGeometry args={[0.85, 0.04]} />
                <meshBasicMaterial color={mi === 0 ? '#00f2fe' : '#0284c7'} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* AI ZONE: Floating Spherical AI Bot Assistant + Floating Holographic Panels */}
      {zone.id === 'AI' && (
        <group position={[0, 0.08, 0]}>
          {/* Circular Ground Stage Collar */}
          <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.85, 1.05, 0.32, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.3} />
          </mesh>

          {/* Floating Cyan Magnetic Levitation Ring */}
          <mesh position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.62, 0.035, 16, 32]} />
            <meshBasicMaterial color="#00f2fe" />
          </mesh>

          {/* Cute Floating Spherical AI Assistant Bot (Animated smoothly via coreGroupRef) */}
          <group ref={coreGroupRef} position={[0, 1.35, 0]}>
            {/* Glossy Pearl-White Spherical Head / Body */}
            <mesh castShadow>
              <sphereGeometry args={[0.52, 32, 32]} />
              <meshStandardMaterial
                color="#ffffff"
                roughness={0.15}
                metalness={0.25}
              />
            </mesh>

            {/* Inset Curved Dark Glass Face Visor */}
            <mesh position={[0, 0.04, 0.33]}>
              <boxGeometry args={[0.52, 0.28, 0.16]} />
              <meshStandardMaterial
                color="#070c18"
                roughness={0.1}
                metalness={0.9}
              />
            </mesh>

            {/* Glowing Cyan Visor Display (Curved Eyes / Smiling Waveform) */}
            <mesh position={[0, 0.04, 0.42]}>
              <planeGeometry args={[0.34, 0.12]} />
              <meshBasicMaterial color="#00f2fe" transparent opacity={0.95} />
            </mesh>

            {/* Left Sleek Audio Ear Pod */}
            <group position={[-0.53, 0.04, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.18, 0.18, 0.08, 24]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.3} />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.16, 0.02, 16, 24]} />
                <meshBasicMaterial color="#00f2fe" />
              </mesh>
            </group>

            {/* Right Sleek Audio Ear Pod */}
            <group position={[0.53, 0.04, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.18, 0.18, 0.08, 24]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.3} />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.16, 0.02, 16, 24]} />
                <meshBasicMaterial color="#00f2fe" />
              </mesh>
            </group>
          </group>

          {/* Left Floating Holographic Speech Bubble HUD */}
          <group position={[-0.92, 1.45, 0.2]} rotation={[0, 0.35, 0]}>
            <mesh>
              <planeGeometry args={[0.55, 0.42]} />
              <meshStandardMaterial
                color="#06192c"
                roughness={0.1}
                metalness={0.8}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, 0, 0.005]}>
              <planeGeometry args={[0.57, 0.44]} />
              <meshBasicMaterial color="#00f2fe" wireframe transparent opacity={0.65} />
            </mesh>
            {/* Chat Dots */}
            {[-0.12, 0.0, 0.12].map((cx, ci) => (
              <mesh key={ci} position={[cx, 0.02, 0.01]}>
                <circleGeometry args={[0.035, 16]} />
                <meshBasicMaterial color="#00f2fe" />
              </mesh>
            ))}
          </group>

          {/* Right Floating Holographic Soundwave Telemetry HUD */}
          <group position={[0.92, 1.45, 0.2]} rotation={[0, -0.35, 0]}>
            <mesh>
              <planeGeometry args={[0.55, 0.42]} />
              <meshStandardMaterial
                color="#06192c"
                roughness={0.1}
                metalness={0.8}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, 0, 0.005]}>
              <planeGeometry args={[0.57, 0.44]} />
              <meshBasicMaterial color="#00f2fe" wireframe transparent opacity={0.65} />
            </mesh>
            {/* Soundwave bars */}
            {[-0.18, -0.09, 0.0, 0.09, 0.18].map((sx, si) => {
              const swH = [0.08, 0.18, 0.25, 0.15, 0.09][si];
              return (
                <mesh key={si} position={[sx, 0, 0.01]}>
                  <planeGeometry args={[0.03, swH]} />
                  <meshBasicMaterial color="#00f2fe" />
                </mesh>
              );
            })}
          </group>
        </group>
      )}

      {/* MAINTENANCE ZONE: Service Lift Platform & Diagnostic Console (STAFF / OPERATIONS ONLY) */}
      {zone.id === 'MAINTENANCE' && (
        <group position={[0, 0.07, 0]}>
          <mesh position={[-0.9, 0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.35, 0.4, 2.8]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0.9, 0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.35, 0.4, 2.8]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh ref={coreMeshRef} position={[0, 0.65, -1.0]} castShadow>
            <boxGeometry args={[0.7, 1.3, 0.35]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.85, -0.82]}>
            <planeGeometry args={[0.55, 0.4]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
        </group>
      )}

      {/* GOVERNANCE ZONE: Modern Executive Voting Podium (ADMIN / OPERATIONS ONLY) */}
      {zone.id === 'GOVERNANCE' && (
        <group position={[0, 0.07, 0]}>
          <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.0, 1.2, 0.44, 32]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.3} />
          </mesh>
          <mesh ref={coreMeshRef} position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 1.2, 16]} />
            <meshStandardMaterial
              color="#6d28d9"
              emissive="#c084fc"
              emissiveIntensity={isSelected ? 1.2 : 0.5}
            />
          </mesh>
          <mesh position={[0, 1.45, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.03, 32]} />
            <meshBasicMaterial color="#c084fc" transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* =========================================================================
          3. CLEAN FLOATING ZONE BADGES MATCHING THE REFERENCE IMAGE
          ========================================================================= */}
      {showZoneLabelAndSummary && (
        <Html
          position={
            !isOperationsRole && zone.id === 'VEHICLE'
              ? [0, 0.32, 3.45]
              : [0, 2.35, 0]
          }
          center
          distanceFactor={11}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            style={{
              background: isHovered
                ? 'rgba(11, 23, 38, 0.94)'
                : 'rgba(13, 27, 42, 0.88)',
              backdropFilter: 'blur(16px)',
              border: `1.5px solid ${isHovered ? '#00f2fe' : 'rgba(0, 242, 254, 0.5)'}`,
              borderRadius: '9999px',
              padding: '6px 18px',
              color: '#ffffff',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              boxShadow: isHovered
                ? '0 0 18px rgba(0, 242, 254, 0.45), 0 8px 20px rgba(0, 0, 0, 0.4)'
                : '0 4px 14px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
            }}
          >
            {getZoneIcon(zone.id)}
            <span style={{ color: '#ffffff' }}>{zoneName}</span>
            {showZoneSummary && zoneCompactSummary && isOperationsRole && (
              <>
                <span style={{ color: '#64748b' }}>|</span>
                <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600 }}>
                  {zoneCompactSummary}
                </span>
              </>
            )}
          </div>
        </Html>
      )}

      {/* =========================================================================
          4. WORLD-SPACE ZONE INFORMATION CARD WITH HOLOGRAPHIC FRAME & DATA LINK
          ========================================================================= */}
      {showZoneCard && (
        <>
          <SpatialDataLink
            start={[0, 1.2, 0]}
            end={[2.3 - 0.35, 1.6, 0]}
            color={zone.accentColor}
          />

          <group position={[2.3, 1.6, 0]}>
            <Billboard follow={true}>
              <HolographicPanelFrame3D width={2.35} height={2.65} color={zone.accentColor} />
              <Html
                center
                distanceFactor={8.0}
                style={{ pointerEvents: 'auto', userSelect: 'none' }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '320px',
                    background: 'rgba(13, 27, 42, 0.94)',
                    backdropFilter: 'blur(20px)',
                    border: `1.5px solid ${zone.accentColor}`,
                    boxShadow: `0 20px 45px rgba(0, 0, 0, 0.75), 0 0 25px ${zone.accentColor}33`,
                    borderRadius: '16px',
                    padding: '20px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-family)',
                    position: 'relative',
                  }}
                >
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => clearSelection()}
                    title="Đóng thông tin khu vực"
                    style={{
                      position: 'absolute',
                      top: '14px',
                      right: '14px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: zone.accentColor,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    <Info size={12} />
                    Thông tin Khu Vực Không Gian
                  </div>

                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                      margin: '0 0 4px 0',
                      color: '#ffffff',
                    }}
                  >
                    {zoneName}
                  </h3>

                  <div
                    style={{
                      fontSize: '12px',
                      color: zone.accentColor,
                      fontWeight: 600,
                      marginBottom: '10px',
                    }}
                  >
                    {zoneSubtitle}
                  </div>

                  <p
                    style={{
                      color: '#cbd5e1',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      marginBottom: '14px',
                    }}
                  >
                    {zoneDescription}
                  </p>

                  {zoneCompactSummary && (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '7px 12px',
                        fontSize: '11px',
                        color: '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>Chỉ số khu vực:</span>
                      <strong style={{ color: zone.accentColor }}>{zoneCompactSummary}</strong>
                    </div>
                  )}

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>Trạng thái:</span>
                    <strong style={{ color: '#38bdf8' }}>Sẵn sàng hoạt động</strong>
                  </div>
                </div>
              </Html>
            </Billboard>
          </group>
        </>
      )}
    </group>
  );
};
