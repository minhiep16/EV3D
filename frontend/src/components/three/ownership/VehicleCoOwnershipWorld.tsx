import React, { useMemo } from 'react';
import { Html, Billboard } from '@react-three/drei';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { CoOwnershipGroupResponse, GroupMemberResponse } from '../../../types/coOwnership';
import { fetchVehicleCoOwnership } from '../../../services/coOwnershipApi';
import { useWorldStore } from '../../../store/worldStore';
import { CentralOwnershipTotal3D } from './CentralOwnershipTotal3D';
import { OwnerOrb3D } from './OwnerOrb3D';
import { HolographicOwnerDetailPanel } from './HolographicOwnerDetailPanel';
import {
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface VehicleCoOwnershipWorldProps {
  vehicle: VehicleResponse;
}

const OWNER_ORB_COLORS = [
  '#00f2fe', // Cyan (Owner A)
  '#a855f7', // Violet (Owner B)
  '#10b981', // Emerald (Owner C)
  '#f59e0b', // Amber (Owner D)
  '#ec4899', // Pink (Owner E)
];

// Curated spatial positions around EV01 in Left / Center-Left composition:
// - Owner A (40%): Upper-left of EV01 [-2.6, 1.7, 0.2]
// - Owner B (30%): Left-middle of EV01 [-3.2, 1.2, 1.2]
// - Owner C (30%): Lower-left of EV01 [-1.6, 0.85, 2.8]
const DEFAULT_ORB_POSITIONS: [number, number, number][] = [
  [-2.6, 1.7, 0.2],   // Owner A 40% (Upper-left)
  [-3.2, 1.2, 1.2],   // Owner B 30% (Left-middle)
  [-1.6, 0.85, 2.8],  // Owner C 30% (Lower-left)
  [-2.8, 1.2, -1.6],  // Fallback Owner D
  [-0.2, 1.1, 3.4],   // Fallback Owner E
];

interface OwnerNode {
  id: string;
  member: GroupMemberResponse;
  position: [number, number, number];
  color: string;
}

export const VehicleCoOwnershipWorld: React.FC<VehicleCoOwnershipWorldProps> = ({
  vehicle,
}) => {
  const exitVehicleCoOwnershipMode = useWorldStore(
    (state) => state.exitVehicleCoOwnershipMode
  );
  const selectedOwnerId = useWorldStore((state) => state.selectedOwnerId);
  const clearOwnerSelection = useWorldStore((state) => state.clearOwnerSelection);

  const {
    data: coOwnership,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<CoOwnershipGroupResponse>({
    queryKey: ['coOwnership', vehicle.id],
    queryFn: () => fetchVehicleCoOwnership(vehicle.id),
  });

  // Build deterministic owner node array mapped from members
  const ownerNodes = useMemo<OwnerNode[]>(() => {
    if (!coOwnership?.members || coOwnership.members.length === 0) return [];

    // Sort by ownership percentage descending: 40% (Owner A), 30% (Owner B), 30% (Owner C)
    const sortedMembers = [...coOwnership.members].sort((a, b) => {
      const shareA = a.share?.percentage ?? 0;
      const shareB = b.share?.percentage ?? 0;
      return shareB - shareA;
    });

    return sortedMembers.map((member, index) => {
      const position =
        index < DEFAULT_ORB_POSITIONS.length
          ? DEFAULT_ORB_POSITIONS[index]
          : ([
              Math.cos((index / sortedMembers.length) * Math.PI * 2) * 3.2,
              1.2,
              Math.sin((index / sortedMembers.length) * Math.PI * 2) * 3.2,
            ] as [number, number, number]);

      const color = OWNER_ORB_COLORS[index % OWNER_ORB_COLORS.length];

      return {
        id: member.id,
        member,
        position,
        color,
      };
    });
  }, [coOwnership?.members]);

  // Find currently selected owner node by ID
  const selectedNode = useMemo(() => {
    if (!selectedOwnerId) return null;
    return ownerNodes.find((node) => node.id === selectedOwnerId) ?? null;
  }, [ownerNodes, selectedOwnerId]);

  // 1. Loading State in 3D Space
  if (isLoading) {
    return (
      <group position={[0, 1.8, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              style={{
                background: 'rgba(8, 12, 22, 0.94)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                borderRadius: '9999px',
                padding: '10px 22px',
                color: '#c084fc',
                fontFamily: 'var(--font-family)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 25px rgba(168, 85, 247, 0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={14} color="#a855f7" />
              <span>ĐANG TẢI DỮ LIỆU ĐỒNG SỞ HỮU...</span>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  // 2. Error State in 3D Space
  if (isError) {
    return (
      <group position={[0, 1.8, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
            <div
              style={{
                width: '300px',
                background: 'rgba(15, 10, 20, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '14px',
                padding: '18px',
                color: '#f8fafc',
                fontFamily: 'var(--font-family)',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                <AlertTriangle size={15} />
                KHÔNG THỂ TẢI DỮ LIỆU ĐỒNG SỞ HỮU
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 14px 0' }}>
                {error instanceof Error ? error.message : 'Lỗi kết nối máy chủ'}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => refetch()}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={12} />
                  THỬ LẠI
                </button>
                <button
                  type="button"
                  onClick={() => exitVehicleCoOwnershipMode()}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  QUAY LẠI
                </button>
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  // 3. Empty State in 3D Space
  if (!coOwnership || coOwnership.members.length === 0) {
    return (
      <group position={[0, 1.8, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
            <div
              style={{
                background: 'rgba(8, 12, 22, 0.94)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '14px',
                padding: '16px 20px',
                color: '#ffffff',
                fontFamily: 'var(--font-family)',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc' }}>
                CHƯA CÓ NHÓM ĐỒNG SỞ HỮU
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  return (
    <group>
      {/* 1. Central 3D Total Ownership Visualization Dual-Ring */}
      <CentralOwnershipTotal3D
        totalPercentage={coOwnership.totalOwnershipPercentage}
        availablePercentage={coOwnership.availablePercentage}
        position={[0, 2.4, 0]}
      />

      {/* 3. 3D Spatial Owner Orbs placed around EV01 */}
      {ownerNodes.map((node) => (
        <OwnerOrb3D
          key={node.id}
          member={node.member}
          position={node.position}
          color={node.color}
        />
      ))}

      {/* 4. Holographic Detail Panel when an Owner is Selected */}
      {selectedNode && (
        <HolographicOwnerDetailPanel
          key={selectedNode.id}
          member={selectedNode.member}
          orbPosition={selectedNode.position}
          panelPosition={[3.6, 1.5, 0.5]}
          color={selectedNode.color}
          onClose={() => clearOwnerSelection()}
        />
      )}
    </group>
  );
};
