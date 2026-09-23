import React, { useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { SpatialDataLink } from './SpatialDataLink';
import { HolographicPanelFrame3D } from './HolographicPanelFrame3D';
import { useWorldStore, GarageZone } from '../../store/worldStore';
import { 
  Zap, 
  Wrench, 
  DollarSign, 
  Vote, 
  BarChart3, 
  Bot, 
  Car, 
  ChevronRight,
  Info,
  X
} from 'lucide-react';

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

export const ZONE_CONFIGS: Record<GarageZone, ZoneConfig> = {
  VEHICLE: {
    id: 'VEHICLE',
    name: 'KHU VỰC XE',
    subtitle: 'Vị trí đỗ & Bàn giao xe đồng sở hữu',
    description: 'Khu vực tiếp nhận, đỗ xe tập trung và chuyển giao quyền vận hành cho xe điện đồng sở hữu.',
    compactSummary: '', // Handled directly by VehicleStatusLabel on the vehicle
    position: [-8, 0, 4],
    color: '#0369a1',
    accentColor: '#38bdf8',
  },
  CHARGING: {
    id: 'CHARGING',
    name: 'KHU VỰC SẠC',
    subtitle: 'Trạm sạc thông minh công suất cao',
    description: 'Quản lý sạc tốc độ cao tự động và đồng bộ dữ liệu pin xe điện theo thời gian thực.',
    compactSummary: '2 trụ sạc | Sẵn sàng',
    position: [8, 0, 4],
    color: '#0284c7',
    accentColor: '#00f2fe',
  },
  MAINTENANCE: {
    id: 'MAINTENANCE',
    name: 'KHU VỰC BẢO DƯỠNG',
    subtitle: 'Khu vực chẩn đoán & Dịch vụ kỹ thuật',
    description: 'Theo dõi tình trạng sức khỏe xe, kích nâng kiểm tra linh kiện và quản lý lịch sử bảo dưỡng.',
    compactSummary: '0 yêu cầu đang xử lý',
    position: [0, 0, 6],
    color: '#d97706',
    accentColor: '#fbbf24',
  },
  FINANCE: {
    id: 'FINANCE',
    name: 'KHU VỰC TÀI CHÍNH',
    subtitle: 'Quỹ đồng sở hữu & Phân bổ chi phí',
    description: 'Quản lý quỹ chung minh bạch, theo dõi chi phí vận hành và phân bổ doanh thu/chi phí cho các chủ xe.',
    compactSummary: 'Quỹ chung | 25.000.000 ₫',
    position: [-8, 0, -5],
    color: '#059669',
    accentColor: '#34d399',
  },
  GOVERNANCE: {
    id: 'GOVERNANCE',
    name: 'KHU VỰC QUẢN TRỊ',
    subtitle: 'Bỏ phiếu & Quyết định chung của cổ đông',
    description: 'Biểu quyết các đề xuất nâng cấp xe, phê duyệt quy chế hoạt động và quản trị đồng sở hữu theo tỷ lệ cổ phần.',
    compactSummary: '1 biểu quyết đang mở',
    position: [8, 0, -5],
    color: '#7c3aed',
    accentColor: '#c084fc',
  },
  ANALYTICS: {
    id: 'ANALYTICS',
    name: 'KHU VỰC PHÂN TÍCH',
    subtitle: 'Đo lường dữ liệu, Hiệu suất & Công bằng',
    description: 'Phân tích tần suất sử dụng xe, tổng quãng đường vận hành và đánh giá tính công bằng trong chia sẻ phương tiện.',
    compactSummary: 'Dữ liệu vận hành',
    position: [0, 0, -8],
    color: '#2563eb',
    accentColor: '#60a5fa',
  },
  AI: {
    id: 'AI',
    name: 'KHU VỰC TRỢ LÝ AI',
    subtitle: 'Trợ lý ảo vận hành đồng sở hữu thông minh',
    description: 'Đề xuất lịch trình tối ưu, cân bằng quyền ưu tiên đặt xe và đưa ra cảnh báo bất thường tự động.',
    compactSummary: 'Sẵn sàng hỗ trợ',
    position: [0, 0, 13],
    color: '#0284c7',
    accentColor: '#00f2fe',
  },
};

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

  const isSelected = selectedZone === zone.id;
  const isHovered = hoveredZone === zone.id;

  // GLOBAL SPATIAL UI VISIBILITY RULE:
  // When a zone is selected, its world-space label and compact summary are temporarily hidden.
  // For VEHICLE, when either selectedZone === 'VEHICLE' or selectedVehicleId != null, it is considered focused/selected.
  const isZoneFocused = isSelected || (zone.id === 'VEHICLE' && selectedVehicleId != null);
  const showZoneLabelAndSummary = !isZoneFocused;

  // The detailed spatial panel is shown ONLY for the selected zone.
  // For VEHICLE, the single detailed panel is the Spatial Vehicle Information panel rendered by VehicleDigitalTwin.
  const showZoneCard = isSelected && zone.id !== 'VEHICLE';

  useFrame((_, delta) => {
    // Subtle idle animation for landmark object
    if (coreMeshRef.current) {
      if (zone.id === 'FINANCE' || zone.id === 'AI') {
        coreMeshRef.current.rotation.y += delta * 0.8;
      }
      if (zone.id === 'AI') {
        coreMeshRef.current.position.y = 1.6 + Math.sin(Date.now() * 0.003) * 0.12;
      }
    }
    if (coreGroupRef.current && zone.id === 'ANALYTICS') {
      coreGroupRef.current.rotation.y += delta * 0.8;
    }
    if (ringRef.current && isSelected) {
      ringRef.current.rotation.z += delta * 1.2;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectZone(zone.id);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoverZone(zone.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (hoveredZone === zone.id) {
      hoverZone(null);
    }
    document.body.style.cursor = 'auto';
  };

  const emissiveColor = isSelected ? zone.accentColor : isHovered ? zone.accentColor : '#000000';
  const emissiveIntensity = isSelected ? 1.6 : isHovered ? 0.6 : 0;

  return (
    <group
      ref={groupRef}
      position={zone.position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 1. Base Zone Platform */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[4.4, 0.08, 4.4]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>

      {/* Glowing Platform Perimeter Rail */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[4.45, 0.02, 4.45]} />
        <meshStandardMaterial
          color={zone.accentColor}
          emissive={zone.accentColor}
          emissiveIntensity={isSelected ? 1.8 : isHovered ? 1.0 : 0.3}
          wireframe
        />
      </mesh>

      {/* Selected Halo on Ground */}
      {isSelected && (
        <mesh ref={ringRef} position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 2.7, 48]} />
          <meshBasicMaterial
            color={zone.accentColor}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* 2. Zone Specific Landmark Geometries */}
      {/* VEHICLE ZONE: Parking Pad with Wheel Guides & Laser Markers */}
      {zone.id === 'VEHICLE' && (
        <group position={[0, 0.1, 0]}>
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <boxGeometry args={[3.2, 0.04, 3.8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          {/* Wheel Stops */}
          <mesh position={[0.9, 0.1, -1.3]} castShadow>
            <boxGeometry args={[0.5, 0.15, 0.2]} />
            <meshStandardMaterial color="#334155" emissive="#38bdf8" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[-0.9, 0.1, -1.3]} castShadow>
            <boxGeometry args={[0.5, 0.15, 0.2]} />
            <meshStandardMaterial color="#334155" emissive="#38bdf8" emissiveIntensity={0.2} />
          </mesh>
          {/* Laser Corner Pylons */}
          {[[-1.4, -1.7], [1.4, -1.7], [-1.4, 1.7], [1.4, 1.7]].map(([px, pz], i) => (
            <mesh key={i} position={[px, 0.25, pz]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 0.5, 16]} />
              <meshStandardMaterial color="#0284c7" emissive={zone.accentColor} emissiveIntensity={emissiveIntensity + 0.5} />
            </mesh>
          ))}
        </group>
      )}

      {/* CHARGING ZONE: Futuristic Charging Station Tower & Cable Base */}
      {zone.id === 'CHARGING' && (
        <group position={[0, 0.1, 0]}>
          {/* Main Tower */}
          <mesh ref={coreMeshRef} position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[0.7, 2.0, 0.5]} />
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.3}
              metalness={0.8}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          {/* Charging Display Screen */}
          <mesh position={[0, 1.4, 0.26]}>
            <planeGeometry args={[0.5, 0.4]} />
            <meshBasicMaterial color="#00f2fe" />
          </mesh>
          {/* Cable Holster Pedestal */}
          <mesh position={[0.7, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.14, 1.0, 16]} />
            <meshStandardMaterial color="#1e293b" emissive={zone.accentColor} emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}

      {/* MAINTENANCE ZONE: Service Lift Platform & Hydraulic Arms */}
      {zone.id === 'MAINTENANCE' && (
        <group position={[0, 0.1, 0]}>
          {/* Dual Lift Rails */}
          <mesh position={[-1.1, 0.4, 0]} castShadow>
            <boxGeometry args={[0.4, 0.8, 3.4]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
          <mesh position={[1.1, 0.4, 0]} castShadow>
            <boxGeometry args={[0.4, 0.8, 3.4]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
          {/* Diagnostic Console Pedestal */}
          <mesh ref={coreMeshRef} position={[0, 0.7, -1.4]} castShadow>
            <boxGeometry args={[0.8, 1.4, 0.4]} />
            <meshStandardMaterial
              color="#1e293b"
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </group>
      )}

      {/* FINANCE ZONE: Floating Hex Treasury Core & Orbiting Data Rings */}
      {zone.id === 'FINANCE' && (
        <group position={[0, 0.1, 0]}>
          {/* Base Pedestal */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.9, 1.2, 0.8, 6]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
          </mesh>
          {/* Floating Core */}
          <mesh ref={coreMeshRef} position={[0, 1.4, 0]} castShadow>
            <octahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial
              color="#059669"
              emissive={zone.accentColor}
              emissiveIntensity={emissiveIntensity + 0.8}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
          {/* Orbiting Ring */}
          <mesh position={[0, 1.4, 0]} rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.95, 0.03, 16, 32]} />
            <meshStandardMaterial color={zone.accentColor} emissive={zone.accentColor} emissiveIntensity={1.2} />
          </mesh>
        </group>
      )}

      {/* GOVERNANCE ZONE: Holographic Voting Podium & Voting Pillars */}
      {zone.id === 'GOVERNANCE' && (
        <group position={[0, 0.1, 0]}>
          {/* Circular Stage */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[1.3, 1.5, 0.6, 32]} />
            <meshStandardMaterial color="#1e1b4b" roughness={0.4} metalness={0.8} />
          </mesh>
          {/* Central Voting Column */}
          <mesh ref={coreMeshRef} position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 1.4, 16]} />
            <meshStandardMaterial
              color="#4c1d95"
              emissive={zone.accentColor}
              emissiveIntensity={emissiveIntensity + 0.6}
            />
          </mesh>
          {/* Holographic Header Disc */}
          <mesh position={[0, 1.7, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.04, 32]} />
            <meshBasicMaterial color={zone.accentColor} transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* ANALYTICS ZONE: Tiered Data Metric Cylinders */}
      {zone.id === 'ANALYTICS' && (
        <group position={[0, 0.1, 0]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[1.4, 1.6, 0.4, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
          {/* Tiered Bar Columns */}
          <group ref={coreGroupRef} position={[0, 0.4, 0]}>
            {[
              { pos: [-0.6, 0.5, -0.4], h: 1.0 },
              { pos: [0.0, 0.8, -0.6], h: 1.6 },
              { pos: [0.6, 0.6, -0.3], h: 1.2 },
              { pos: [-0.4, 0.9, 0.4], h: 1.8 },
              { pos: [0.4, 0.7, 0.5], h: 1.4 },
            ].map((col, idx) => (
              <mesh key={idx} position={[col.pos[0], col.h / 2, col.pos[2]]} castShadow>
                <boxGeometry args={[0.3, col.h, 0.3]} />
                <meshStandardMaterial
                  color="#1e3a8a"
                  emissive={zone.accentColor}
                  emissiveIntensity={emissiveIntensity + (idx % 2 === 0 ? 0.9 : 0.5)}
                />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* AI ZONE: Pulsing AI Core Orb & Floating Gyroscopic Rings */}
      {zone.id === 'AI' && (
        <group position={[0, 0.1, 0]}>
          {/* Spire Pedestal */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.9, 1.2, 8]} />
            <meshStandardMaterial color="#082f49" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Suspended AI Core Orb */}
          <mesh ref={coreMeshRef} position={[0, 1.6, 0]} castShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive={zone.accentColor}
              emissiveIntensity={isSelected ? 2.5 : isHovered ? 1.8 : 1.2}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          {/* Ambient Gyroscope Ring */}
          <mesh position={[0, 1.6, 0]} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
            <torusGeometry args={[0.8, 0.025, 16, 32]} />
            <meshBasicMaterial color={zone.accentColor} />
          </mesh>
        </group>
      )}

      {/* 3. Readable World-Space Zone Label & Compact Summary (Visible when unselected) */}
      {showZoneLabelAndSummary && (
        <Html
          position={[0, 2.5, 0]}
          center
          distanceFactor={11}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            style={{
              background: isHovered
                ? 'rgba(10, 15, 29, 0.92)'
                : 'rgba(10, 15, 29, 0.75)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${isHovered ? zone.accentColor : 'rgba(255, 255, 255, 0.18)'}`,
              borderRadius: '9999px',
              padding: '6px 16px',
              color: '#f8fafc',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: isHovered ? `0 0 16px ${zone.accentColor}88` : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: zone.accentColor,
                boxShadow: isHovered ? `0 0 6px ${zone.accentColor}` : 'none',
              }}
            />
            <span>{zone.name}</span>
            {zone.compactSummary && (
              <>
                <span style={{ color: '#475569' }}>|</span>
                <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600 }}>
                  {zone.compactSummary}
                </span>
              </>
            )}
          </div>
        </Html>
      )}

      {/* 4. World-Space Zone Information Card with 3D Holographic Frame & Connector */}
      {showZoneCard && (
        <>
          {/* Visible 3D Laser Connector linking zone landmark to detailed panel */}
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
              background: 'rgba(8, 12, 22, 0.94)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${zone.accentColor}`,
              boxShadow: `0 20px 45px rgba(0, 0, 0, 0.85), 0 0 25px ${zone.accentColor}33`,
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
              {zone.name}
            </h3>

            <div
              style={{
                fontSize: '12px',
                color: zone.accentColor,
                fontWeight: 600,
                marginBottom: '10px',
              }}
            >
              {zone.subtitle}
            </div>

            <p
              style={{
                color: '#94a3b8',
                fontSize: '12px',
                lineHeight: 1.5,
                marginBottom: '14px',
              }}
            >
              {zone.description}
            </p>

            {zone.compactSummary && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
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
                <strong style={{ color: zone.accentColor }}>{zone.compactSummary}</strong>
              </div>
            )}

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
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
              <strong style={{ color: '#38bdf8' }}>Tính năng sẽ khả dụng ở giai đoạn tiếp theo</strong>
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
