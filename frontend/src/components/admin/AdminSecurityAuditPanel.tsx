import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorldStore } from '../../store/worldStore';
import {
  Users,
  Shield,
  FileText,
  Search,
  Filter,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  PieChart,
} from 'lucide-react';
import {
  fetchAdminAuditLogs,
  fetchAdminFinancialOverview,
  AuditLogResponse,
  AdminFinancialOverviewResponse,
} from '../../services/adminApi';

interface AdminSecurityAuditPanelProps {
  onClose: () => void;
}

export const AdminSecurityAuditPanel: React.FC<AdminSecurityAuditPanelProps> = ({ onClose }) => {
  const setAdminActiveModule = useWorldStore((state) => state.setAdminActiveModule);
  const [activeSubTab, setActiveSubTab] = useState<'AUDIT' | 'FINANCE'>('AUDIT');

  // Audit Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [actorRoleFilter, setActorRoleFilter] = useState('');
  const [page, setPage] = useState(0);

  // Selected audit entry for expanded inspection
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);

  // Query Audit Logs
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['adminAuditLogs', search, actionFilter, resourceFilter, actorRoleFilter, page],
    queryFn: () =>
      fetchAdminAuditLogs({
        search: search || undefined,
        action: actionFilter || undefined,
        resourceType: resourceFilter || undefined,
        actorRole: actorRoleFilter || undefined,
        page,
        size: 12,
      }),
    enabled: activeSubTab === 'AUDIT',
  });

  // Query Financial Overview
  const { data: financeOverview, isLoading: financeLoading } = useQuery<AdminFinancialOverviewResponse>({
    queryKey: ['adminFinancialOverview'],
    queryFn: fetchAdminFinancialOverview,
    enabled: activeSubTab === 'FINANCE',
    staleTime: 15000,
  });

  const logs = auditData?.content || [];
  const totalPages = auditData?.totalPages || 1;

  return (
    <aside
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: 'clamp(480px, 35vw, 620px)',
        height: 'min(820px, calc(100dvh - 100px))',
        background: 'rgba(8, 28, 48, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(255, 191, 54, 0.5)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 191, 54, 0.2)',
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
          borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
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
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1.2px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Shield size={18} color="#fbbf24" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              AN NINH, KIỂM TOÁN & TÀI CHÍNH
            </div>
            <div style={{ fontSize: '11px', color: '#fbbf24' }}>
              Nhật ký kiểm toán tập trung & Giám sát chi phí độc lập
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* SubTab Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(30, 41, 59, 0.7)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveSubTab('AUDIT')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: activeSubTab === 'AUDIT' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                border: activeSubTab === 'AUDIT' ? '1px solid #f59e0b' : 'none',
                color: activeSubTab === 'AUDIT' ? '#fbbf24' : '#94a3b8',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Kiểm toán
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('FINANCE')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: activeSubTab === 'FINANCE' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                border: activeSubTab === 'FINANCE' ? '1px solid #f59e0b' : 'none',
                color: activeSubTab === 'FINANCE' ? '#fbbf24' : '#94a3b8',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tài chính
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAdminActiveModule('USER_MANAGEMENT')}
            title="Mở Quản lý người dùng"
            style={{
              background: 'rgba(168, 85, 247, 0.16)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '8px',
              color: '#c084fc',
              padding: '5px 10px',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.28)';
              e.currentTarget.style.borderColor = '#c084fc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.16)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
            }}
          >
            <Users size={12} color="#c084fc" />
            <span>NGƯỜI DÙNG</span>
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

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {activeSubTab === 'AUDIT' ? (
          <>
            {/* Audit Filters Bar */}
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.4)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                <input
                  type="text"
                  placeholder="Tìm hành động, người dùng, IP..."
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
                    fontSize: '11px',
                    outline: 'none',
                  }}
                />
              </div>

              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
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
                <option value="">Tất cả hành vi</option>
                <option value="UPDATE_USER_STATUS">Khóa/Mở tài khoản</option>
                <option value="UPDATE_USER_ROLE">Phân quyền</option>
                <option value="CONTRACT_SIGNING">Ký hợp đồng</option>
                <option value="PAYMENT_VERIFIED">Xác minh thanh toán</option>
                <option value="OWNERSHIP_TRANSFER">Chuyển nhượng</option>
              </select>

              <select
                value={actorRoleFilter}
                onChange={(e) => {
                  setActorRoleFilter(e.target.value);
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
                <option value="">Tất cả tác nhân</option>
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
                <option value="CO_OWNER">CO_OWNER</option>
              </select>
            </div>

            {/* Audit Log Entries */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {auditLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  Đang truy vấn sổ kiểm toán bất biến...
                </div>
              ) : logs.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  Không tìm thấy bản ghi kiểm toán phù hợp.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          {log.action}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                          {log.actorName || 'Hệ thống'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          ({log.actorRole || 'SYSTEM'})
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                      {log.description}
                    </div>

                    {/* Expanded details */}
                    {selectedLog?.id === log.id && (
                      <div
                        style={{
                          marginTop: '6px',
                          paddingTop: '6px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '10.5px',
                          color: '#94a3b8',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <div>• Loại tài nguyên: {log.resourceType} (ID: {log.resourceId || 'N/A'})</div>
                        <div>• Trạng thái trước: {log.previousState || 'N/A'} → Trạng thái sau: {log.newState || 'N/A'}</div>
                        <div>• Địa chỉ IP mạng: {log.ipAddress || '127.0.0.1'}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
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
          </>
        ) : (
          /* SubTab: Financial Supervision */
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {financeLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                Đang tổng hợp dữ liệu chi phí và xác minh thanh toán...
              </div>
            ) : financeOverview ? (
              <>
                {/* Financial KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Tổng chi phí phát sinh</div>
                    <div style={{ fontSize: '17px', fontWeight: 900, color: '#f8fafc', marginTop: '2px' }}>
                      {financeOverview.totalRecordedExpenses?.toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '10px', color: '#38bdf8' }}>Chi phí vận hành thực tế</div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontSize: '10.5px', color: '#6ee7b7' }}>Đã xác minh thanh toán</div>
                    <div style={{ fontSize: '17px', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
                      {financeOverview.verifiedPayments?.toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '10px', color: '#6ee7b7' }}>Staff đã phê duyệt</div>
                  </div>

                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontSize: '10.5px', color: '#fca5a5' }}>Nghĩa vụ còn nợ</div>
                    <div style={{ fontSize: '17px', fontWeight: 900, color: '#ef4444', marginTop: '2px' }}>
                      {financeOverview.outstandingObligations?.toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '10px', color: '#fca5a5' }}>Chưa thanh toán hoàn tất</div>
                  </div>

                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontSize: '10.5px', color: '#fde68a' }}>Chờ Staff đối soát</div>
                    <div style={{ fontSize: '17px', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>
                      {financeOverview.paymentsAwaitingVerificationCount} khoản
                    </div>
                    <div style={{ fontSize: '10px', color: '#fde68a' }}>Ủy nhiệm chi Demo</div>
                  </div>
                </div>

                {/* Expenses by Category */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                    PHÂN BỔ CHI PHÍ THEO HẠNG MỤC
                  </div>
                  {Object.entries(financeOverview.expensesByCategory || {}).length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Chưa có chi phí ghi nhận.</div>
                  ) : (
                    Object.entries(financeOverview.expensesByCategory || {}).map(([cat, amt]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1' }}>
                        <span>{cat}</span>
                        <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                          {Number(amt).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Expenses by Vehicle */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                    PHÂN BỔ CHI PHÍ THEO PHƯƠNG TIỆN
                  </div>
                  {Object.entries(financeOverview.expensesByVehicle || {}).length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Chưa có chi phí phương tiện.</div>
                  ) : (
                    Object.entries(financeOverview.expensesByVehicle || {}).map(([veh, amt]) => (
                      <div key={veh} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1' }}>
                        <span>{veh}</span>
                        <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                          {Number(amt).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
};
