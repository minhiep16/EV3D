import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import {
  CoOwnershipGroupResponse,
  GroupMemberResponse,
  AvailableUserResponse,
} from '../../../types/coOwnership';
import {
  fetchVehicleCoOwnership,
  removeMemberFromGroup,
  searchAvailableUsers,
  addMemberToGroup,
} from '../../../services/coOwnershipApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import {
  Users,
  Car,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  UserPlus,
  Trash2,
  Mail,
  Calendar,
  Search,
  Loader2,
  Sparkles,
  Award,
  ArrowLeft,
  User,
} from 'lucide-react';

interface CoOwnerOwnershipPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

const OWNER_ORB_COLORS = [
  '#00f2fe', // Cyan
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#8b5cf6', // Violet
];

const STATUS_LABELS: Record<
  GroupMemberResponse['status'],
  { label: string; color: string }
> = {
  ACTIVE: { label: 'Đang hoạt động', color: '#10b981' },
  PENDING: { label: 'Đang chờ duyệt', color: '#f59e0b' },
  INACTIVE: { label: 'Ngừng hoạt động', color: '#ef4444' },
  REMOVED: { label: 'Đã rời nhóm', color: '#6b7280' },
};

const ROLE_LABELS: Record<string, string> = {
  REPRESENTATIVE: 'Đại diện nhóm',
  ADMIN: 'Quản trị viên',
  MEMBER: 'Đồng sở hữu',
};

export const CoOwnerOwnershipPanel: React.FC<CoOwnerOwnershipPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const selectedOwnerId = useWorldStore((state) => state.selectedOwnerId);
  const clearOwnerSelection = useWorldStore((state) => state.clearOwnerSelection);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<AvailableUserResponse | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const vehicleCode = resolveVehicleCode(vehicle) || vehicle.name || 'EV01';

  // 1. TanStack Query: Co-ownership Group for Vehicle
  const {
    data: coOwnership,
    isLoading,
    isError,
    error,
  } = useQuery<CoOwnershipGroupResponse>({
    queryKey: ['coOwnership', vehicle.id],
    queryFn: () => fetchVehicleCoOwnership(vehicle.id),
    staleTime: 6000,
  });

  // Check if current user is active REPRESENTATIVE
  const canManage = useMemo(() => {
    if (!currentUser || !coOwnership) return false;
    if (currentUser.role !== 'CO_OWNER') return false;
    const currentMembership = coOwnership.members?.find((m) => m.userId === currentUser.id);
    return (
      currentMembership !== undefined &&
      currentMembership.status === 'ACTIVE' &&
      currentMembership.memberRole === 'REPRESENTATIVE'
    );
  }, [currentUser, coOwnership]);

  // Active members sorted by ownership percentage descending
  const activeMembers = useMemo(() => {
    if (!coOwnership?.members) return [];
    const active = coOwnership.members.filter((m) => m.status === 'ACTIVE');
    return [...active].sort((a, b) => {
      const shareA = a.share?.percentage ?? 0;
      const shareB = b.share?.percentage ?? 0;
      return shareB - shareA;
    });
  }, [coOwnership?.members]);

  // Selected member based on 3D representative interaction in showroom
  const selectedMember = useMemo(() => {
    if (!selectedOwnerId || activeMembers.length === 0) return null;
    return activeMembers.find((m) => m.id === selectedOwnerId) || null;
  }, [selectedOwnerId, activeMembers]);

  const selectedMemberIndex = useMemo(() => {
    if (!selectedMember) return 0;
    const idx = activeMembers.findIndex((m) => m.id === selectedMember.id);
    return idx >= 0 ? idx : 0;
  }, [selectedMember, activeMembers]);

  const selectedMemberColor = OWNER_ORB_COLORS[selectedMemberIndex % OWNER_ORB_COLORS.length];

  // Search available users for adding
  const { data: availableUsers = [], isLoading: isSearchingUsers } = useQuery<AvailableUserResponse[]>({
    queryKey: ['availableUsers', coOwnership?.id, searchTerm],
    queryFn: () => (coOwnership?.id ? searchAvailableUsers(coOwnership.id, searchTerm) : Promise.resolve([])),
    enabled: Boolean(isAddMemberOpen && coOwnership?.id),
  });

  // Add Member Mutation
  const addMutation = useMutation({
    mutationFn: (userId: string) => {
      if (!coOwnership?.id) throw new Error('Không tìm thấy thông tin nhóm.');
      return addMemberToGroup(coOwnership.id, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coOwnership', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['coOwnership'] });
      setIsAddMemberOpen(false);
      setSelectedUserToAdd(null);
      setSearchTerm('');
      setAddError(null);
    },
    onError: (err: any) => {
      setAddError(err?.message || 'Không thể thêm thành viên vào nhóm.');
    },
  });

  // Remove Member Mutation
  const removeMutation = useMutation({
    mutationFn: (memberId: string) => {
      if (!coOwnership?.id) throw new Error('Không tìm thấy thông tin nhóm.');
      return removeMemberFromGroup(coOwnership.id, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coOwnership', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['coOwnership'] });
      setConfirmRemoveId(null);
      setRemoveError(null);
      clearOwnerSelection();
    },
    onError: (err: any) => {
      setRemoveError(err?.message || 'Không thể xoá thành viên khỏi nhóm.');
    },
  });

  const memberCount = activeMembers.length || 3;
  const vehicleCount = coOwnership?.vehicles && coOwnership.vehicles.length > 0 ? coOwnership.vehicles.length : 1;
  const totalPercentage = coOwnership?.totalOwnershipPercentage ?? 100;
  const isComplete = totalPercentage === 100;
  const statusLabel = coOwnership?.statusLabel || (isComplete ? 'Hoàn chỉnh' : 'Chưa phân bổ đủ');

  // Shared container styles
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '76px',
    right: '24px',
    width: 'clamp(340px, 28vw, 420px)',
    maxHeight: 'calc(100vh - 96px)',
    zIndex: 40,
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, rgba(8, 16, 30, 0.95) 0%, rgba(6, 12, 24, 0.97) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1.5px solid rgba(34, 230, 255, 0.35)',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(34, 230, 255, 0.14)',
    color: '#ffffff',
    overflow: 'hidden',
    userSelect: 'none',
    fontFamily: 'var(--font-family, system-ui, -apple-system, sans-serif)',
  };

  // =========================================================================
  // VIEW MODE A: MEMBER DETAIL PANEL (Triggered when 3D representative clicked)
  // Mutual exclusivity rule: Group summary hides while member detail is open
  // =========================================================================
  if (selectedMember) {
    const isRep = selectedMember.memberRole === 'REPRESENTATIVE';
    const memberPercentage = selectedMember.share?.percentage ?? 0;
    const memberStatus = STATUS_LABELS[selectedMember.status] || {
      label: 'Đang hoạt động',
      color: '#10b981',
    };

    return (
      <aside
        role="region"
        aria-label={`Chi tiết thành viên ${selectedMember.fullName}`}
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {/* HEADER BAR: Back to Group Summary + Title + Close */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(34, 230, 255, 0.18)',
            background: 'linear-gradient(90deg, rgba(34, 230, 255, 0.08) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => clearOwnerSelection()}
            title="Quay lại bảng thông tin đồng sở hữu"
            style={{
              background: 'rgba(34, 230, 255, 0.10)',
              border: '1px solid rgba(34, 230, 255, 0.30)',
              borderRadius: '8px',
              padding: '5px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#22e6ff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={13} />
            <span>Quay lại nhóm</span>
          </button>

          <div
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.02em',
            }}
          >
            Chi tiết thành viên
          </div>

          <button
            type="button"
            onClick={() => clearOwnerSelection()}
            title="Đóng chi tiết thành viên"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* CONTENT BODY */}
        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flex: 1,
          }}
        >
          {/* Member Identity Card */}
          <div
            style={{
              background: 'rgba(7, 20, 38, 0.75)',
              border: `1.5px solid ${selectedMemberColor}40`,
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: `0 0 20px ${selectedMemberColor}20`,
            }}
          >
            {/* Avatar or Circular Holographic Representative Icon */}
            {selectedMember.avatarUrl ? (
              <img
                src={selectedMember.avatarUrl}
                alt={selectedMember.fullName}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${selectedMemberColor}`,
                  boxShadow: `0 0 12px ${selectedMemberColor}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${selectedMemberColor}35, rgba(7, 20, 38, 0.9))`,
                  border: `2px solid ${selectedMemberColor}`,
                  boxShadow: `0 0 14px ${selectedMemberColor}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedMemberColor,
                  fontWeight: 800,
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                <User size={22} color={selectedMemberColor} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedMember.fullName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isRep ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                    border: isRep ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: isRep ? '#10b981' : '#cbd5e1',
                  }}
                >
                  {ROLE_LABELS[selectedMember.memberRole || 'MEMBER'] || 'Đồng sở hữu'}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: memberStatus.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: memberStatus.color,
                      boxShadow: `0 0 6px ${memberStatus.color}`,
                    }}
                  />
                  {memberStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Member Information Data Fields */}
          <div
            style={{
              background: 'rgba(7, 20, 38, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Award size={14} color="#22e6ff" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#22e6ff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                HỒ SƠ THÀNH VIÊN
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Họ tên:</span>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {selectedMember.fullName}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Vai trò:</span>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {ROLE_LABELS[selectedMember.memberRole || 'MEMBER'] || 'Đồng sở hữu'}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Tỷ lệ sở hữu:</span>
                <div style={{ fontWeight: 800, color: selectedMemberColor, marginTop: '2px', fontFamily: 'monospace', fontSize: '14px' }}>
                  {memberPercentage}%
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Trạng thái thành viên:</span>
                <div style={{ fontWeight: 700, color: memberStatus.color, marginTop: '2px' }}>
                  {memberStatus.label}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Email liên hệ:</span>
                <div style={{ fontWeight: 600, color: '#cbd5e1', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={12} color="#94a3b8" />
                  {selectedMember.email || 'Chưa cung cấp email'}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Ngày tham gia:</span>
                <div style={{ fontWeight: 600, color: '#cbd5e1', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={12} color="#94a3b8" />
                  {selectedMember.joinedAt
                    ? new Date(selectedMember.joinedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'Chưa cập nhật'}
                </div>
              </div>
            </div>

            {/* Remove Member Action (Only for authorized Representative, not for self) */}
            {canManage && selectedMember.userId !== currentUser?.id && (
              <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {confirmRemoveId === selectedMember.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#fca5a5' }}>
                      Xác nhận xóa thành viên {selectedMember.fullName} khỏi nhóm?
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(selectedMember.id)}
                        disabled={removeMutation.isPending}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          background: 'rgba(239, 68, 68, 0.85)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {removeMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(null)}
                        style={{
                          padding: '7px 12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveId(selectedMember.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#f87171',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Xóa thành viên khỏi nhóm</span>
                  </button>
                )}
                {removeError && (
                  <div style={{ color: '#f87171', fontSize: '10.5px', marginTop: '4px' }}>
                    {removeError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER BAR */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '9.5px',
            color: '#64748b',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={11} color={selectedMemberColor} />
            <span>Đại diện 3D showroom</span>
          </div>
          <span style={{ fontFamily: 'monospace', color: '#475569' }}>
            EVSHARE PRO
          </span>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE B: SIMPLIFIED GROUP SUMMARY PANEL
  // Keeps ONLY:
  // 1. Header (Title, vehicle identity, group status badge, close button)
  // 2. Tổng quan nhóm (Thành viên, Xe nhóm, Tổng tỷ lệ, Trạng thái)
  // 3. Add member action ("+ THÊM THÀNH VIÊN VÀO NHÓM")
  // REMOVED COMPLETELY:
  // - Danh sách tỷ lệ sở hữu
  // - member rows
  // - progress bars
  // - member percentages list
  // - embedded member detail section
  // =========================================================================
  return (
    <aside
      role="region"
      aria-label="Thông tin đồng sở hữu xe"
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={panelStyle}
    >
      {/* =================================================== */}
      {/* 1. HEADER BAR                                       */}
      {/* =================================================== */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(34, 230, 255, 0.18)',
          background: 'linear-gradient(90deg, rgba(34, 230, 255, 0.08) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(34, 230, 255, 0.25), rgba(8, 16, 30, 0.9))',
              border: '1px solid #22e6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22e6ff',
              boxShadow: '0 0 12px rgba(34, 230, 255, 0.3)',
            }}
          >
            <Users size={16} />
          </div>
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              Thông tin đồng sở hữu
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
              {vehicleCode} • {vehicle.licensePlate || 'Xe số hóa'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#10b981',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            {statusLabel}
          </span>

          <button
            type="button"
            onClick={onClose}
            title="Đóng bảng đồng sở hữu"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* =================================================== */}
      {/* 2. CONTENT BODY                                     */}
      {/* =================================================== */}
      <div
        style={{
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          flex: 1,
        }}
      >
        {/* Loading / Error States */}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              color: '#22e6ff',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span>Đang tải dữ liệu đồng sở hữu...</span>
          </div>
        )}

        {isError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              padding: '10px 12px',
              color: '#fca5a5',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={14} />
            <span>{error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}</span>
          </div>
        )}

        {/* =================================================== */}
        {/* 2. TỔNG QUAN NHÓM (4 Core Metrics)                  */}
        {/* =================================================== */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(34, 230, 255, 0.18)',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              TỔNG QUAN NHÓM
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
              {coOwnership?.name || `${vehicleCode} Co-ownership`}
            </span>
          </div>

          {/* 4 Concise Metric Readouts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '7px 9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={12} color="#94a3b8" />
                Thành viên:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                {memberCount}
              </span>
            </div>

            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '7px 9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Car size={12} color="#94a3b8" />
                Xe nhóm:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                {vehicleCount}
              </span>
            </div>

            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '7px 9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <PieChart size={12} color="#22e6ff" />
                Tổng tỷ lệ:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#22e6ff' }}>
                {totalPercentage}%
              </span>
            </div>

            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '7px 9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={12} color="#10b981" />
                Trạng thái:
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* =================================================== */}
        {/* 3. 3D SHOWROOM REPRESENTATIVES CUE                  */}
        {/* Guides user to interact with 3D orbs/avatars        */}
        {/* =================================================== */}
        <div
          style={{
            background: 'rgba(7, 20, 38, 0.50)',
            border: '1px dashed rgba(34, 230, 255, 0.25)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(34, 230, 255, 0.15)',
              border: '1px solid #22e6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22e6ff',
              flexShrink: 0,
              boxShadow: '0 0 10px rgba(34, 230, 255, 0.3)',
            }}
          >
            <Sparkles size={14} />
          </div>
          <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>
            <span style={{ color: '#22e6ff', fontWeight: 700 }}>Đại diện thành viên 3D:</span> Nhấp trực tiếp vào quả cầu hoặc đại diện của từng đồng sở hữu trong showroom để xem hồ sơ chi tiết.
          </div>
        </div>

        {/* =================================================== */}
        {/* 4. ADD MEMBER ACTION                                */}
        {/* =================================================== */}
        {canManage && (
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!isAddMemberOpen ? (
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(true)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  background: 'linear-gradient(135deg, rgba(34, 230, 255, 0.22), rgba(8, 16, 30, 0.95))',
                  border: '1.5px solid #22e6ff',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(34, 230, 255, 0.2)',
                  transition: 'all 0.2s ease',
                }}
              >
                <UserPlus size={15} color="#22e6ff" />
                <span>+ THÊM THÀNH VIÊN VÀO NHÓM</span>
              </button>
            ) : (
              <div
                style={{
                  background: 'rgba(7, 20, 38, 0.92)',
                  border: '1.5px solid rgba(34, 230, 255, 0.4)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#22e6ff' }}>
                    TÌM KIẾM & THÊM THÀNH VIÊN
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMemberOpen(false);
                      setSelectedUserToAdd(null);
                      setAddError(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Search Input */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                  }}
                >
                  <Search size={13} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11px',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                </div>

                {/* Available Users List */}
                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {isSearchingUsers ? (
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', textAlign: 'center', padding: '8px' }}>
                      Đang tìm kiếm người dùng...
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div style={{ fontSize: '10.5px', color: '#64748b', textAlign: 'center', padding: '8px' }}>
                      Không có người dùng khả dụng.
                    </div>
                  ) : (
                    availableUsers.map((u) => {
                      const isChosen = selectedUserToAdd?.id === u.id;
                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUserToAdd(u)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: isChosen ? 'rgba(34, 230, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: isChosen ? '1px solid #22e6ff' : '1px solid transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
                              {u.displayName}
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                              {u.email}
                            </div>
                          </div>
                          {isChosen && <CheckCircle2 size={13} color="#22e6ff" />}
                        </div>
                      );
                    })
                  )}
                </div>

                {addError && (
                  <div style={{ color: '#f87171', fontSize: '10px' }}>
                    {addError}
                  </div>
                )}

                {/* Confirm Add Button */}
                <button
                  type="button"
                  disabled={!selectedUserToAdd || addMutation.isPending}
                  onClick={() => {
                    if (selectedUserToAdd) addMutation.mutate(selectedUserToAdd.id);
                  }}
                  style={{
                    padding: '7px 12px',
                    background: selectedUserToAdd
                      ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                      : 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '8px',
                    color: selectedUserToAdd ? '#ffffff' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: selectedUserToAdd ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang thêm...</span>
                    </>
                  ) : (
                    <span>Xác nhận thêm thành viên</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================== */}
      {/* 5. FOOTER BAR                                       */}
      {/* =================================================== */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9.5px',
          color: '#64748b',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Sparkles size={11} color="#22e6ff" />
          <span>Mô hình nhóm đồng sở hữu theo xe</span>
        </div>
        <span style={{ fontFamily: 'monospace', color: '#475569' }}>
          EVSHARE PRO
        </span>
      </div>
    </aside>
  );
};
