import React, { useMemo, useState } from 'react';
import { Html, Billboard } from '@react-three/drei';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { CoOwnershipGroupResponse, GroupMemberResponse } from '../../../types/coOwnership';
import { fetchVehicleCoOwnership } from '../../../services/coOwnershipApi';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { OwnerOrb3D } from './OwnerOrb3D';
import { HolographicOwnerDetailPanel } from './HolographicOwnerDetailPanel';
import { GroupSummaryPanel3D } from './GroupSummaryPanel3D';
import { AddMemberModal3D } from './AddMemberModal3D';
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
const BASE_X = -3.5;
const BASE_Z = 0.1;

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

  const currentUser = useAuthStore((state) => state.user);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

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

  const canManage = useMemo(() => {
    if (!currentUser || !coOwnership) return false;
    if (currentUser.role !== 'CO_OWNER') return false;

    // Future-proof rule: ONLY the CURRENT ACTIVE GROUP REPRESENTATIVE (Nhóm trưởng) has management authority.
    // coOwnership.createdBy ("người tạo nhóm") is intentionally NOT permanent authority.
    // Phase 21 will later handle voting/election to update the REPRESENTATIVE.
    const currentMembership = coOwnership.members?.find((m) => m.userId === currentUser.id);
    return (
      currentMembership !== undefined &&
      currentMembership.status === 'ACTIVE' &&
      currentMembership.memberRole === 'REPRESENTATIVE'
    );
  }, [currentUser, coOwnership]);

  // Filter only ACTIVE members from database
  const activeMembers = useMemo(() => {
    if (!coOwnership?.members) return [];
    return coOwnership.members.filter((m) => m.status === 'ACTIVE');
  }, [coOwnership?.members]);

  // Deterministic sorting by percentage descending, then member.id tiebreaker
  const sortedMembers = useMemo(() => {
    return [...activeMembers].sort((a, b) => {
      const shareA = a.share?.percentage ?? 0;
      const shareB = b.share?.percentage ?? 0;
      const diff = shareB - shareA;
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
  }, [activeMembers]);

  // Build clean vertical owner nodes on the left side with dynamic adaptive spacing for 2, 3, 4, 5+ members
  const ownerNodes = useMemo<OwnerNode[]>(() => {
    if (sortedMembers.length === 0) return [];

    const count = sortedMembers.length;
    const dynamicGap = count > 3 ? Math.max(0.35, 1.60 / (count - 1)) : 0.60;
    const dynamicStartY = count > 3 ? 1.85 : 1.45;

    return sortedMembers.map((member, index) => {
      const yPos = parseFloat((dynamicStartY - index * dynamicGap).toFixed(2));
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

  // 3. Not Found State in 3D Space
  if (!coOwnership) {
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
                CHƯA TÌM THẤY NHÓM ĐỒNG SỞ HỮU CHO XE
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  const spineTopY = ownerNodes[0]?.position[1] ?? 1.45;
  const spineBottomY = ownerNodes[ownerNodes.length - 1]?.position[1] ?? 0.25;
  const spineCenterY = (spineTopY + spineBottomY) / 2;
  const spineHeight = Math.max(0.1, spineTopY - spineBottomY);

  return (
    <group>
      {/* 1. Group Summary Panel Centered Directly Above EV01 (Requirements 1, 2, 3) */}
      <GroupSummaryPanel3D
        group={coOwnership}
        vehicleCode={coOwnership.vehicleCode || vehicle.name || 'EV01'}
        position={[0.0, 2.70, 0.0]}
        canManage={canManage}
        onAddMemberClick={() => setIsAddMemberModalOpen(true)}
        onClose={() => exitVehicleCoOwnershipMode()}
      />

      {/* 2. Vertical Spatial Data Link connecting EV01 Roof to Group Panel (Requirement 4) */}
      <SpatialDataLink
        start={[0.0, 1.50, 0.0]}
        end={[0.0, 2.05, 0.0]}
        color="#a855f7"
      />

      {/* 3. Vertical Ownership Network Spine linking the members on the Left */}
      {ownerNodes.length > 1 && (
        <mesh position={[BASE_X, spineCenterY, BASE_Z]}>
          <cylinderGeometry args={[0.005, 0.005, spineHeight, 12]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.35} />
        </mesh>
      )}

      {/* 4. Vertical Ownership Member Nodes on the Left Side (Requirements 5, 8, 11) */}
      {ownerNodes.length === 0 ? (
        <group position={[BASE_X, 1.25, BASE_Z]}>
          <Billboard follow={true}>
            <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div
                style={{
                  background: 'rgba(8, 12, 22, 0.94)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  color: '#c084fc',
                  fontFamily: 'var(--font-family)',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.25)',
                }}
              >
                CHƯA CÓ THÀNH VIÊN HOẠT ĐỘNG TRONG NHÓM
              </div>
            </Html>
          </Billboard>
        </group>
      ) : (
        ownerNodes.map((node) => (
          <OwnerOrb3D
            key={node.id}
            member={node.member}
            position={node.position}
            color={node.color}
          />
        ))
      )}

      {/* 5. Spatial Relationships & Connections (Requirements 6 & 7: ● [EV01] --------> [OWNER DETAIL PANEL]) */}
      {selectedNode && (
        <>
          {/* Link 1: Selected Member Orb on Left -> EV01 Left Anchor */}
          <SpatialDataLink
            start={selectedNode.position}
            end={[-0.85, 0.75, 0.1]}
            color={selectedNode.color}
          />

          {/* Link 2: EV01 Right Anchor -> Right Owner Detail Panel */}
          <SpatialDataLink
            start={[0.85, 0.75, 0.1]}
            end={[2.1, 1.25, 0.2]}
            color={selectedNode.color}
          />

          {/* 6. Holographic Owner Detail Panel on the Right Side (Requirements 6 & 7) */}
          <HolographicOwnerDetailPanel
            key={selectedNode.id}
            member={selectedNode.member}
            groupName={coOwnership.name}
            vehicleCode={coOwnership.vehicleCode || vehicle.name || 'EV01'}
            vehicleId={vehicle.id}
            orbPosition={selectedNode.position}
            panelPosition={[3.3, 1.25, 0.2]}
            color={selectedNode.color}
            renderLink={false}
            canManage={canManage}
            onClose={() => clearOwnerSelection()}
          />
        </>
      )}

      {/* 7. Holographic Add Member Modal */}
      {isAddMemberModalOpen && coOwnership && (
        <AddMemberModal3D
          groupId={coOwnership.id}
          vehicleId={vehicle.id}
          position={[0.0, 1.50, 0.8]}
          onClose={() => setIsAddMemberModalOpen(false)}
        />
      )}
    </group>
  );
};
