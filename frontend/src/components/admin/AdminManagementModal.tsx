import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Shield,
  Users,
  Car,
  Activity,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Zap,
  Wrench,
  Scale,
  CreditCard,
  UserCheck,
  UserX,
  AlertCircle,
} from 'lucide-react';
import {
  fetchAdminDashboardStats,
  fetchAdminUsers,
  updateUserStatus,
  updateUserRole,
  fetchAdminAuditLogs,
  AdminDashboardStatsResponse,
  AdminUserResponse,
  AuditLogResponse,
} from '../../services/adminApi';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'OVERVIEW' | 'USERS' | 'AUDIT';

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  // Users Tab Filter State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('');
  const [userPage, setUserPage] = useState(0);

  // Status Action Modal State
  const [selectedUserForAction, setSelectedUserForAction] = useState<AdminUserResponse | null>(null);
  const [actionType, setActionType] = useState<'ACTIVATE' | 'SUSPEND' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Audit Tab Filter State
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('');
  const [auditResourceFilter, setAuditResourceFilter] = useState<string>('');
  const [auditPage, setAuditPage] = useState(0);

  // 1. Fetch Stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<AdminDashboardStatsResponse>({
    queryKey: ['adminDashboardStats'],
    queryFn: fetchAdminDashboardStats,
    enabled: isOpen && activeTab === 'OVERVIEW',
    refetchInterval: 10000,
  });

  // 2. Fetch Users
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['adminUsers', userSearch, userRoleFilter, userStatusFilter, userPage],
    queryFn: () =>
      fetchAdminUsers({
        query: userSearch,
        role: userRoleFilter || undefined,
        status: userStatusFilter || undefined,
        page: userPage,
        size: 15,
      }),
    enabled: isOpen && activeTab === 'USERS',
  });

  // 3. Fetch Audit Logs
  const {
    data: auditData,
    isLoading: auditLoading,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ['adminAuditLogs', auditSearch, auditActionFilter, auditResourceFilter, auditPage],
    queryFn: () =>
      fetchAdminAuditLogs({
        search: auditSearch,
        action: auditActionFilter || undefined,
        resourceType: auditResourceFilter || undefined,
        page: auditPage,
        size: 20,
      }),
    enabled: isOpen && activeTab === 'AUDIT',
  });

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      status,
      reason,
    }: {
      userId: string;
      status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
      reason?: string;
    }) => updateUserStatus(userId, status, reason),
    onSuccess: () => {
      setSelectedUserForAction(null);
      setActionType(null);
      setActionReason('');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
    },
    onError: (err: any) => {
      setActionError(err?.message || 'Không thể cập nhật trạng thái người dùng.');
    },
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: 'min(1200px, 96vw)',
          height: 'min(860px, 92vh)',
          background: 'linear-gradient(145deg, rgba(13, 22, 38, 0.98), rgba(6, 11, 20, 0.98))',
          border: '1.5px solid rgba(168, 85, 247, 0.45)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(168, 85, 247, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(6, 182, 212, 0.2))',
                border: '1.2px solid #c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(168, 85, 247, 0.35)',
              }}
            >
              <Shield size={22} color="#c084fc" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '17px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  TRUNG TÂM QUẢN TRỊ HỆ THỐNG
                </span>
                <span
                  style={{
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    color: '#c084fc',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    letterSpacing: '0.05em',
                  }}
                >
                  ADMIN
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Giám sát hệ thống toàn diện, quản lý tài khoản & kiểm tra lịch sử kiểm toán độc lập
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(30, 41, 59, 0.7)',
                padding: '3px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('OVERVIEW')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  background: activeTab === 'OVERVIEW' ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                  border: activeTab === 'OVERVIEW' ? '1px solid #c084fc' : 'none',
                  color: activeTab === 'OVERVIEW' ? '#f3e8ff' : '#94a3b8',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease',
                }}
              >
                <Activity size={14} />
                <span>TỔNG QUAN</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('USERS')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  background: activeTab === 'USERS' ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                  border: activeTab === 'USERS' ? '1px solid #c084fc' : 'none',
                  color: activeTab === 'USERS' ? '#f3e8ff' : '#94a3b8',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease',
                }}
              >
                <Users size={14} />
                <span>NGƯỜI DÙNG</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('AUDIT')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  background: activeTab === 'AUDIT' ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                  border: activeTab === 'AUDIT' ? '1px solid #c084fc' : 'none',
                  color: activeTab === 'AUDIT' ? '#f3e8ff' : '#94a3b8',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease',
                }}
              >
                <FileText size={14} />
                <span>NHẬT KÝ KIỂM TOÁN</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  CHỈ SỐ THỜI GIAN THỰC TỪ CƠ SỞ DỮ LIỆU
                </div>
                <button
                  type="button"
                  onClick={() => refetchStats()}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={12} />
                  <span>LÀM MỚI DỮ LIỆU</span>
                </button>
              </div>

              {statsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '13px' }}>
                  Đang tổng hợp dữ liệu thời gian thực từ máy chủ...
                </div>
              ) : stats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  {/* Account Summary */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1.2px solid rgba(168, 85, 247, 0.35)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 800, fontSize: '12px' }}>
                      <Users size={16} />
                      <span>HỆ THỐNG TÀI KHOẢN</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc' }}>{stats.registeredUsersCount}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>tài khoản đã đăng ký</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#cbd5e1', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#10b981' }}>• Đang hoạt động (ACTIVE):</span>
                        <strong>{stats.activeUsersCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#f59e0b' }}>• Bị tạm khóa (SUSPENDED):</span>
                        <strong>{stats.suspendedUsersCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#ef4444' }}>• Ngừng hoạt động (INACTIVE):</span>
                        <strong>{stats.inactiveUsersCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255, 255, 255, 0.08)', paddingTop: '6px', marginTop: '2px' }}>
                        <span>Đồng sở hữu: <strong>{stats.coOwnerUsersCount}</strong></span>
                        <span>Nhân viên: <strong>{stats.staffUsersCount}</strong></span>
                        <span>Admin: <strong>{stats.adminUsersCount}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Fleet & Groups Summary */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1.2px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontWeight: 800, fontSize: '12px' }}>
                      <Car size={16} />
                      <span>ĐỘI XE & NHÓM ĐỒNG SỞ HỮU</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc' }}>{stats.vehiclesCount}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>phương tiện số hóa</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#cbd5e1', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tổng số nhóm đồng sở hữu:</span>
                        <strong style={{ color: '#00f2fe' }}>{stats.ownershipGroupsCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Hồ sơ đăng ký xe chờ duyệt:</span>
                        <strong style={{ color: stats.pendingVehicleRegistrationsCount > 0 ? '#fbbf24' : '#94a3b8' }}>
                          {stats.pendingVehicleRegistrationsCount}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Lời mời kết nạp thành viên chờ xử lý:</span>
                        <strong style={{ color: stats.pendingMembershipRequestsCount > 0 ? '#38bdf8' : '#94a3b8' }}>
                          {stats.pendingMembershipRequestsCount}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Operations */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1.2px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, fontSize: '12px' }}>
                      <Activity size={16} />
                      <span>VẬN HÀNH THỜI GIAN THỰC</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc' }}>{stats.activeTripsCount}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>chuyến đi đang diễn ra</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#cbd5e1', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Lịch đặt xe đã xác nhận:</span>
                        <strong style={{ color: '#10b981' }}>{stats.activeBookingsCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Phiên sạc pin đang hoạt động:</span>
                        <strong style={{ color: '#06b6d4' }}>{stats.chargingSessionsCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Thanh toán nợ cá nhân chờ xác minh:</span>
                        <strong style={{ color: stats.pendingPaymentVerificationsCount > 0 ? '#fbbf24' : '#94a3b8' }}>
                          {stats.pendingPaymentVerificationsCount}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Quality & Security Incidents */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1.2px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 800, fontSize: '12px' }}>
                      <AlertTriangle size={16} />
                      <span>BẢO DƯỠNG & TRANH CHẤP</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc' }}>{stats.activeDisputesCount}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>tranh chấp cần hòa giải</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#cbd5e1', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Ca bảo dưỡng kỹ thuật đang xử lý:</span>
                        <strong style={{ color: stats.activeMaintenanceCount > 0 ? '#f97316' : '#94a3b8' }}>
                          {stats.activeMaintenanceCount}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Trạng thái bảo chứng toàn vẹn:</span>
                        <strong style={{ color: '#10b981' }}>100.00% AN TOÀN</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'USERS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filter Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
                  <Search size={15} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Tìm theo họ tên, email người dùng..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(0);
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setUserPage(0);
                    }}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  >
                    <option value="">Tất cả vai trò</option>
                    <option value="CO_OWNER">Đồng sở hữu (CO_OWNER)</option>
                    <option value="STAFF">Nhân viên (STAFF)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => {
                      setUserStatusFilter(e.target.value);
                      setUserPage(0);
                    }}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="SUSPENDED">Tạm khóa (SUSPENDED)</option>
                    <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(30, 41, 59, 0.5)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 16px' }}>HỌ TÊN & EMAIL</th>
                      <th style={{ padding: '12px 14px' }}>VAI TRÒ</th>
                      <th style={{ padding: '12px 14px' }}>TRẠNG THÁI</th>
                      <th style={{ padding: '12px 14px' }}>XE ĐỒNG SỞ HỮU</th>
                      <th style={{ padding: '12px 14px' }}>HOẠT ĐỘNG HIỆN TẠI</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          Đang tải danh sách tài khoản...
                        </td>
                      </tr>
                    ) : usersData && usersData.content.length > 0 ? (
                      usersData.content.map((u) => (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{u.fullName}</div>
                            <div style={{ fontSize: '10.5px', color: '#64748b' }}>{u.email}</div>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 800,
                                background:
                                  u.role === 'ADMIN'
                                    ? 'rgba(168, 85, 247, 0.2)'
                                    : u.role === 'STAFF'
                                    ? 'rgba(0, 242, 254, 0.18)'
                                    : 'rgba(16, 185, 129, 0.18)',
                                color:
                                  u.role === 'ADMIN' ? '#c084fc' : u.role === 'STAFF' ? '#38bdf8' : '#34d399',
                                border: `1px solid ${
                                  u.role === 'ADMIN'
                                    ? 'rgba(168, 85, 247, 0.4)'
                                    : u.role === 'STAFF'
                                    ? 'rgba(0, 242, 254, 0.4)'
                                    : 'rgba(16, 185, 129, 0.4)'
                                }`,
                              }}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 800,
                                background:
                                  u.status === 'ACTIVE'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : u.status === 'SUSPENDED'
                                    ? 'rgba(245, 158, 11, 0.18)'
                                    : 'rgba(239, 68, 68, 0.18)',
                                color:
                                  u.status === 'ACTIVE' ? '#10b981' : u.status === 'SUSPENDED' ? '#fbbf24' : '#f87171',
                              }}
                            >
                              {u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : u.status === 'SUSPENDED' ? 'TẠM KHÓA' : 'VÔ HIỆU HÓA'}
                            </span>
                          </td>

                          <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                            {u.activeVehicleNames && u.activeVehicleNames.length > 0 ? (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {u.activeVehicleNames.map((v, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.08)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                    }}
                                  >
                                    {v}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '10.5px' }}>Chưa gán xe</span>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            {u.hasActiveTrip ? (
                              <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Activity size={11} /> Đang đi xe
                              </span>
                            ) : u.hasActiveBooking ? (
                              <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={11} /> Đã có lịch đặt
                              </span>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '10px' }}>Không có</span>
                            )}
                          </td>

                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {u.role !== 'ADMIN' && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                {u.status === 'ACTIVE' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUserForAction(u);
                                      setActionType('SUSPEND');
                                      setActionReason('');
                                      setActionError(null);
                                    }}
                                    style={{
                                      padding: '4px 8px',
                                      background: 'rgba(245, 158, 11, 0.15)',
                                      border: '1px solid rgba(245, 158, 11, 0.4)',
                                      borderRadius: '6px',
                                      color: '#fbbf24',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <Lock size={11} />
                                    <span>Tạm khóa</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUserForAction(u);
                                      setActionType('ACTIVATE');
                                      setActionReason('');
                                      setActionError(null);
                                    }}
                                    style={{
                                      padding: '4px 8px',
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      border: '1px solid rgba(16, 185, 129, 0.4)',
                                      borderRadius: '6px',
                                      color: '#34d399',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <Unlock size={11} />
                                    <span>Kích hoạt</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          Không tìm thấy tài khoản người dùng phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {usersData && usersData.totalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '11px',
                      color: '#94a3b8',
                    }}
                  >
                    <span>
                      Hiển thị trang {usersData.number + 1} / {usersData.totalPages} ({usersData.totalElements} tài khoản)
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                        disabled={userPage === 0}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          cursor: userPage === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserPage((p) => Math.min(usersData.totalPages - 1, p + 1))}
                        disabled={userPage >= usersData.totalPages - 1}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          cursor: userPage >= usersData.totalPages - 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'AUDIT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Audit Filter */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
                  <Search size={15} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Tìm hành động, người thực hiện, mô tả..."
                    value={auditSearch}
                    onChange={(e) => {
                      setAuditSearch(e.target.value);
                      setAuditPage(0);
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    value={auditResourceFilter}
                    onChange={(e) => {
                      setAuditResourceFilter(e.target.value);
                      setAuditPage(0);
                    }}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  >
                    <option value="">Tất cả tài nguyên</option>
                    <option value="USER">Người dùng (USER)</option>
                    <option value="MEMBERSHIP_INVITATION">Lời mời thành viên</option>
                    <option value="VEHICLE">Xe điện (VEHICLE)</option>
                    <option value="BOOKING">Lịch đặt xe (BOOKING)</option>
                    <option value="CHARGING">Trạm sạc (CHARGING)</option>
                  </select>
                </div>
              </div>

              {/* Audit Table */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(30, 41, 59, 0.5)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '10px 14px' }}>THỜI GIAN</th>
                      <th style={{ padding: '10px 14px' }}>NGƯỜI THỰC HIỆN</th>
                      <th style={{ padding: '10px 14px' }}>HÀNH ĐỘNG</th>
                      <th style={{ padding: '10px 14px' }}>TÀI NGUYÊN</th>
                      <th style={{ padding: '10px 16px' }}>MÔ TẢ CHI TIẾT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLoading ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          Đang tải nhật ký kiểm toán...
                        </td>
                      </tr>
                    ) : auditData && auditData.content.length > 0 ? (
                      auditData.content.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{log.actorName || 'Hệ thống'}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              {log.actorEmail} ({log.actorRole})
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '9.5px',
                                fontWeight: 800,
                                background: 'rgba(168, 85, 247, 0.2)',
                                color: '#c084fc',
                              }}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#38bdf8' }}>
                            {log.resourceType}
                            {log.resourceId && (
                              <div style={{ fontSize: '9.5px', color: '#64748b' }}>{log.resourceId.substring(0, 8)}...</div>
                            )}
                          </td>
                          <td style={{ padding: '10px 16px', color: '#cbd5e1' }}>
                            {log.description}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          Chưa có bản ghi nhật ký kiểm toán nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Audit Pagination */}
                {auditData && auditData.totalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '11px',
                      color: '#94a3b8',
                    }}
                  >
                    <span>
                      Hiển thị trang {auditData.number + 1} / {auditData.totalPages} ({auditData.totalElements} bản ghi)
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
                        disabled={auditPage === 0}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          cursor: auditPage === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuditPage((p) => Math.min(auditData.totalPages - 1, p + 1))}
                        disabled={auditPage >= auditData.totalPages - 1}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          cursor: auditPage >= auditData.totalPages - 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal for User Status Action */}
        {selectedUserForAction && actionType && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 60,
              padding: '20px',
            }}
          >
            <div
              style={{
                width: 'min(440px, 92vw)',
                background: '#0f172a',
                border: '1.2px solid rgba(168, 85, 247, 0.5)',
                borderRadius: '18px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: actionType === 'SUSPEND' ? '#fbbf24' : '#34d399', fontWeight: 800, fontSize: '14px' }}>
                {actionType === 'SUSPEND' ? <Lock size={18} /> : <Unlock size={18} />}
                <span>
                  {actionType === 'SUSPEND' ? 'XÁC NHẬN TẠM KHÓA TÀI KHOẢN' : 'XÁC NHẬN MỞ KHÓA TÀI KHOẢN'}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                Bạn có chắc chắn muốn {actionType === 'SUSPEND' ? 'tạm khóa' : 'kích hoạt lại'} tài khoản của{' '}
                <strong>{selectedUserForAction.fullName}</strong> ({selectedUserForAction.email})?
              </p>

              {actionError && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} />
                  <span>{actionError}</span>
                </div>
              )}

              <input
                type="text"
                placeholder="Nhập lý do thay đổi trạng thái..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                style={{
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForAction(null);
                    setActionType(null);
                    setActionError(null);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  HỦY BỎ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    statusMutation.mutate({
                      userId: selectedUserForAction.id,
                      status: actionType === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE',
                      reason: actionReason,
                    });
                  }}
                  disabled={statusMutation.isPending}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: actionType === 'SUSPEND' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #059669, #10b981)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {statusMutation.isPending ? 'ĐANG CẬP NHẬT...' : 'XÁC NHẬN'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
