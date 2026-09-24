import React, { useMemo } from 'react';
import { Html, Billboard } from '@react-three/drei';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { CoOwnershipGroupResponse, GroupMemberResponse } from '../../../types/coOwnership';
import { fetchVehicleCoOwnership } from '../../../services/coOwnershipApi';
import { useWorldStore } from '../../../store/worldStore';
import { OwnerOrb3D } from './OwnerOrb3D';
import { HolographicOwnerDetailPanel } from './HolographicOwnerDetailPanel';
import { GroupSummaryPanel3D } from './GroupSummaryPanel3D';
import { SpatialDataLink } from '../SpatialDataLink';
import {
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface VehicleCoOwnershipWorldProps {
  vehicle: VehicleResponse;
}

const OWNER_ORB_COLORS = [
  '#00f2fe', // Cyan (Nguyen Van A - 40%)
  '#a855f7', // Purple (Tran Thi B - 30%)
  '#10b981', // Emerald (Le Van C - 30%)
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#8b5cf6', // Violet
];

// Clean vertical ownership column parameters on the LEFT side:
// - Members stacked vertically from upper-left down to lower-left
const BASE_X = -3.6;
const BASE_Z = 0.1;
const START_Y = 1.35;
const VERTICAL_GAP = 0.58;

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

  // Filter only ACTIVE members from database
  const activeMembers = useMemo(() => {
    if (!coOwnership?.members) return [];
    return coOwnership.members.filter((m) => m.status === 'ACTIVE');
  }, [coOwnership?.members]);

  // Deterministic sorting by percentage descending, then member.id tiebreaker
  // Yields:
  // 1. Nguyen Van A (40%) -> upper-left (START_Y = 1.7)
  // 2. Tran Thi B (30%)   -> middle-left (START_Y - 0.7 = 1.0)
  // 3. Le Van C (30%)     -> lower-left  (START_Y - 1.4 = 0.3)
  const sortedMembers = useMemo(() => {
    return [...activeMembers].sort((a, b) => {
      const shareA = a.share?.percentage ?? 0;
      const shareB = b.share?.percentage ?? 0;
      const diff = shareB - shareA;
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
  }, [activeMembers]);

  // Build clean vertical owner nodes on the left side
  const ownerNodes = useMemo<OwnerNode[]>(() => {
    if (sortedMembers.length === 0) return [];

    return sortedMembers.map((member, index) => {
      const yPos = parseFloat((START_Y - index * VERTICAL_GAP).toFixed(2));
      const position: [number, number, number] = [BASE_X, yPos, BASE_Z];
      const color = OWNER_ORB_COLORS[index % OWNER_ORB_COLORS.length];

      return {
        id: member.id,
        member,
        position,
        color,
      };
    });
  }, [sortedMembers]);

  // Find currently selected owner node by stable ID
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
  if (!coOwnership || ownerNodes.length === 0) {
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
                CHƯA CÓ THÀNH VIÊN HOẠT ĐỘNG TRONG NHÓM
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  const spineTopY = START_Y;
  const spineBottomY = START_Y - (ownerNodes.length - 1) * VERTICAL_GAP;
  const spineCenterY = (spineTopY + spineBottomY) / 2;
  const spineHeight = Math.max(0.1, spineTopY - spineBottomY);

  return (
    <group>
      {/* 1. Group Summary Panel in Upper-Middle-Left Area (Requirements 1 & 2) */}
      <GroupSummaryPanel3D
        group={coOwnership}
        vehicleCode={coOwnership.vehicleCode || vehicle.name || 'EV01'}
        position={[-2.1, 2.50, 0.0]}
        onClose={() => exitVehicleCoOwnershipMode()}
      />

      {/* 2. Vertical Ownership Network Spine linking the members on the Left */}
      {ownerNodes.length > 1 && (
        <mesh position={[BASE_X, spineCenterY, BASE_Z]}>
          <cylinderGeometry args={[0.005, 0.005, spineHeight, 12]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.35} />
        </mesh>
      )}

      {/* 3. Vertical Ownership Member Nodes on the Left Side (Requirements 2, 3, 6, 7) */}
      {ownerNodes.map((node) => (
        <OwnerOrb3D
          key={node.id}
          member={node.member}
          position={node.position}
          color={node.color}
        />
      ))}

      {/* 4. Spatial Relationships & Connections (Requirement 6: ● [EV01] --------> [OWNER DETAIL PANEL]) */}
      {selectedNode && (
        <>
          {/* Link 1: Selected Member Orb -> EV01 Anchor */}
          <SpatialDataLink
            start={selectedNode.position}
            end={[-0.75, 0.75, 0.1]}
            color={selectedNode.color}
          />

          {/* Link 2: EV01 Anchor -> Right Owner Detail Panel */}
          <SpatialDataLink
            start={[0.75, 0.75, 0.1]}
            end={[2.0, 1.25, 0.2]}
            color={selectedNode.color}
          />

          {/* 5. Holographic Owner Detail Panel on the Right Side (Requirements 5 & 6) */}
          <HolographicOwnerDetailPanel
            key={selectedNode.id}
            member={selectedNode.member}
            groupName={coOwnership.name}
            vehicleCode={coOwnership.vehicleCode || vehicle.name || 'EV01'}
            orbPosition={selectedNode.position}
            panelPosition={[3.3, 1.25, 0.2]}
            color={selectedNode.color}
            renderLink={false}
            onClose={() => clearOwnerSelection()}
          />
        </>
      )}
    </group>
  );
};
