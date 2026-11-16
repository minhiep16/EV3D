import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorldStore } from '../../store/worldStore';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Car,
  X,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  fetchAdminUsers,
  updateUserStatus,
  updateUserRole,
  AdminUserResponse,
  AdminDashboardStatsResponse,
} from '../../services/adminApi';
import { EVCarLoader } from '../common/EVCarLoader';

interface AdminUserManagementPanelProps {
  onClose: () => void;
  stats?: AdminDashboardStatsResponse;
}

export const AdminUserManagementPanel: React.FC<AdminUserManagementPanelProps> = ({ onClose, stats }) => {
  const queryClient = useQueryClient();
  const setAdminActiveModule = useWorldStore((state) => state.setAdminActiveModule);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  // Status/Role action state
  const [selectedUserForAction, setSelectedUserForAction] = useState<AdminUserResponse | null>(null);
  const [actionType, setActionType] = useState<'ACTIVATE' | 'SUSPEND' | 'CHANGE_ROLE' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'STAFF' | 'CO_OWNER'>('CO_OWNER');
  const [actionError, setActionError] = useState<string | null>(null);

  // Users query
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['adminUsers', search, roleFilter, statusFilter, page],
    queryFn: () =>
      fetchAdminUsers({
        query: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        size: 10,
      }),
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'; reason?: string }) =>
      updateUserStatus(userId, status, reason),
    onSuccess: () => {
      setSelectedUserForAction(null);
      setActionType(null);
      setActionReason('');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái người dùng.');
    },
  });

  // Role mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role, reason }: { userId: string; role: 'ADMIN' | 'STAFF' | 'CO_OWNER'; reason?: string }) =>
      updateUserRole(userId, role, reason),
    onSuccess: () => {
      setSelectedUserForAction(null);
      setActionType(null);
      setActionReason('');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message || err?.message || 'Không thể cập nhật vai trò người dùng.');
    },
  });

  const users = usersData?.content || [];
  const totalPages = usersData?.totalPages || 1;

  return (
    <aside
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: 'clamp(460px, 34vw, 580px)',
        height: 'min(820px, calc(100dvh - 100px))',
        background: 'rgba(8, 28, 48, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(168, 85, 247, 0.5)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(168, 85, 247, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        color: '#f8fafc',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1.2px solid #a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(168, 85, 247, 0.35)',
            }}
          >
            <Users size={18} color="#c084fc" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              QUẢN LÝ NGƯỜI DÙNG & TÀI KHOẢN
            </div>
            <div style={{ fontSize: '11px', color: '#c084fc' }}>
              Trung tâm giám sát tài khoản hệ thống • Vai trò & Trạng thái
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setAdminActiveModule('SECURITY_AUDIT')}
            title="Mở Nhật ký Kiểm toán & An ninh hệ thống"
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '8px',
              color: '#fbbf24',
              padding: '5px 11px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.28)';
              e.currentTarget.style.borderColor = '#fbbf24';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            }}
          >
            <Shield size={13} color="#fbbf24" />
            <span>NHẬT KÝ KIỂM TOÁN</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#94a3b8',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          padding: '12px 16px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Tổng tài khoản</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
            {stats?.registeredUsersCount || usersData?.totalElements || 0}
          </div>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#6ee7b7' }}>Hoạt động</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
            {stats?.activeUsersCount || 0}
          </div>
        </div>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#fca5a5' }}>Bị khóa</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>
            {stats?.suspendedUsersCount || 0}
          </div>
        </div>
        <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#d8b4fe' }}>Chủ xe / Staff</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#c084fc' }}>
            {stats?.coOwnerUsersCount || 0}/{stats?.staffUsersCount || 0}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '11.5px',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(0);
          }}
          style={{
            padding: '7px 8px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '11px',
            outline: 'none',
          }}
        >
          <option value="">Tất cả vai trò</option>
          <option value="CO_OWNER">Đồng sở hữu</option>
          <option value="STAFF">Nhân viên (STAFF)</option>
          <option value="ADMIN">Quản trị viên (ADMIN)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          style={{
            padding: '7px 8px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '11px',
            outline: 'none',
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="SUSPENDED">Bị khóa</option>
          <option value="INACTIVE">Vô hiệu</option>
        </select>
      </div>

      {/* User List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isLoading ? (
          <EVCarLoader variant="inline" message="Đang tải dữ liệu người dùng..." />
        ) : users.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
            Không tìm thấy tài khoản phù hợp với điều kiện lọc.
          </div>
        ) : (
          users.map((u) => {
            const isSuspended = u.status === 'SUSPENDED';
            const isActive = u.status === 'ACTIVE';

            return (
              <div
                key={u.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: isSuspended ? '1.2px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: u.role === 'ADMIN' ? 'rgba(168, 85, 247, 0.25)' : u.role === 'STAFF' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                        border: `1px solid ${u.role === 'ADMIN' ? '#a855f7' : u.role === 'STAFF' ? '#38bdf8' : '#10b981'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#f8fafc',
                      }}
                    >
                      {u.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>{u.fullName}</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{u.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Role badge */}
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: u.role === 'ADMIN' ? 'rgba(168, 85, 247, 0.2)' : u.role === 'STAFF' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        color: u.role === 'ADMIN' ? '#c084fc' : u.role === 'STAFF' ? '#38bdf8' : '#cbd5e1',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {u.role}
                    </span>

                    {/* Status badge */}
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: isActive ? '#34d399' : '#f87171',
                      }}
                    >
                      {isActive ? 'Hoạt động' : isSuspended ? 'Đã khóa' : u.status}
                    </span>
                  </div>
                </div>

                {/* Sub-info: Groups & Active statuses */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{u.activeGroupsCount || 0} Nhóm xe</span>
                    {u.hasActiveTrip && <span style={{ color: '#38bdf8', fontWeight: 700 }}>• Đang có chuyến đi</span>}
                    {u.hasActiveBooking && <span style={{ color: '#f59e0b', fontWeight: 700 }}>• Đang có lịch đặt</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserForAction(u);
                        setActionType(isSuspended ? 'ACTIVATE' : 'SUSPEND');
                        setActionReason('');
                        setActionError(null);
                      }}
                      title={isSuspended ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      style={{
                        padding: '3px 8px',
                        background: isSuspended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${isSuspended ? '#10b981' : '#ef4444'}`,
                        borderRadius: '6px',
                        color: isSuspended ? '#34d399' : '#f87171',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {isSuspended ? <Unlock size={11} /> : <Lock size={11} />}
                      <span>{isSuspended ? 'Mở khóa' : 'Khóa'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserForAction(u);
                        setActionType('CHANGE_ROLE');
                        setNewRole(u.role);
                        setActionReason('');
                        setActionError(null);
                      }}
                      title="Phân quyền vai trò"
                      style={{
                        padding: '3px 8px',
                        background: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid #a855f7',
                        borderRadius: '6px',
                        color: '#c084fc',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Vai trò
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#94a3b8',
        }}
      >
        <span>Trang {page + 1} / {totalPages}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            style={{
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '6px',
              color: page === 0 ? '#475569' : '#f8fafc',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            style={{
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '6px',
              color: page >= totalPages - 1 ? '#475569' : '#f8fafc',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Action Dialog Overlay */}
      {selectedUserForAction && actionType && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(8, 14, 26, 0.92)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1.2px solid rgba(168, 85, 247, 0.5)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
              {actionType === 'ACTIVATE'
                ? `Mở khóa tài khoản: ${selectedUserForAction.fullName}`
                : actionType === 'SUSPEND'
                ? `Khóa tài khoản: ${selectedUserForAction.fullName}`
                : `Thay đổi vai trò: ${selectedUserForAction.fullName}`}
            </div>

            {actionError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '8px', color: '#fca5a5', fontSize: '11px' }}>
                {actionError}
              </div>
            )}

            {actionType === 'CHANGE_ROLE' && (
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Vai trò mới:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                >
                  <option value="CO_OWNER">Đồng sở hữu (CO_OWNER)</option>
                  <option value="STAFF">Nhân viên vận hành (STAFF)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Lý do thực hiện (Lưu vào nhật ký kiểm toán):
              </label>
              <textarea
                rows={3}
                placeholder="Nhập lý do thực hiện thao tác quản trị..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '11.5px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setSelectedUserForAction(null)}
                style={{
                  padding: '7px 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={statusMutation.isPending || roleMutation.isPending}
                onClick={() => {
                  if (actionType === 'CHANGE_ROLE') {
                    roleMutation.mutate({
                      userId: selectedUserForAction.id,
                      role: newRole,
                      reason: actionReason,
                    });
                  } else {
                    statusMutation.mutate({
                      userId: selectedUserForAction.id,
                      status: actionType === 'ACTIVATE' ? 'ACTIVE' : 'SUSPENDED',
                      reason: actionReason,
                    });
                  }
                }}
                style={{
                  padding: '7px 16px',
                  background: actionType === 'SUSPEND' ? '#ef4444' : 'linear-gradient(135deg, #a855f7, #6366f1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
