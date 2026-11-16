import React, { useState, useEffect } from 'react';
import {
  DisputeResponse,
  DisputeSummaryResponse,
  DisputeCategory,
  DisputeStatus,
  DISPUTE_CATEGORY_LABELS,
  DISPUTE_STATUS_COLORS,
  DISPUTE_STATUS_LABELS,
  DISPUTE_PRIORITY_COLORS,
  DISPUTE_PRIORITY_LABELS,
  BookingConflictIncident,
  INCIDENT_STATE_LABELS,
} from '../../types/dispute';
import {
  fetchStaffDisputeDashboard,
  fetchDisputeSummary,
  assignStaffMediator,
  fetchActiveIncidentsForStaff,
} from '../../services/disputeApi';
import { DisputeDetailModal } from '../three/dispute/DisputeDetailModal';
import {
  Scale,
  X,
  Filter,
  UserCheck,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Search,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

interface StaffDisputeDashboardViewProps {
  selectedVehicleId?: string | null;
  onClose?: () => void;
}

export const StaffDisputeDashboardView: React.FC<StaffDisputeDashboardViewProps> = ({
  selectedVehicleId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'DISPUTES' | 'INCIDENTS'>('DISPUTES');
  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [incidents, setIncidents] = useState<BookingConflictIncident[]>([]);
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);
  const [summary, setSummary] = useState<DisputeSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<DisputeStatus | ''>('');
  const [filterCategory, setFilterCategory] = useState<DisputeCategory | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [listData, sumData, incData] = await Promise.all([
        fetchStaffDisputeDashboard({
          status: filterStatus || undefined,
          category: filterCategory || undefined,
        }),
        fetchDisputeSummary(),
        fetchActiveIncidentsForStaff(),
      ]);
      setDisputes(listData);
      setSummary(sumData);
      setIncidents(incData);
    } catch (err: any) {
      console.warn('Lỗi tải bảng tranh chấp nhân viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterCategory]);

  const handleClaim = async (disputeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await assignStaffMediator(disputeId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi tiếp nhận hồ sơ');
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.referenceCode.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.vehicleName.toLowerCase().includes(q) ||
      d.createdByName.toLowerCase().includes(q)
    );
  });

  // If a dispute is selected, replace the dispute list with the embedded detail panel view
  if (selectedDisputeId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '8px' }}>
        {/* Detail Panel Top Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px' }}>
          <button
            type="button"
            onClick={() => setSelectedDisputeId(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={13} />
            <span>Quay lại danh sách</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Đóng bảng"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Embedded Dispute Detail View */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <DisputeDetailModal
            disputeId={selectedDisputeId}
            embedded={true}
            onClose={() => {
              setSelectedDisputeId(null);
              loadData();
            }}
            onUpdated={() => {
              loadData();
            }}
          />
        </div>
      </div>
    );
  }

  // Pre-calculate verified KPI metrics
  const totalVal = summary ? (summary.totalDisputes ?? summary.total ?? 0) : null;
  const inProgressVal = summary
    ? (
        (summary.submittedCount ?? summary.submitted ?? 0) +
        (summary.underReviewCount ?? summary.underReview ?? 0) +
        (summary.awaitingEvidenceCount ?? summary.awaitingEvidence ?? 0) +
        (summary.mediationCount ?? summary.mediation ?? 0) +
        (summary.proposedResolutionCount ?? summary.proposedResolution ?? 0) +
        (summary.votingInProgressCount ?? summary.votingInProgress ?? 0)
      )
    : null;
  const resolvedVal = summary ? (summary.resolvedCount ?? summary.resolved ?? 0) : null;
  const closedVal = summary ? (summary.closedCount ?? summary.closed ?? 0) : null;

  const formatMetric = (val: number | null): string => {
    if (val === null || val === undefined || isNaN(val)) return '--';
    return val.toLocaleString('vi-VN');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1.2px solid #c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
            }}
          >
            <Scale size={15} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
            HÒA GIẢI & TRANH CHẤP
          </span>
        </div>

        <button
          type="button"
          onClick={loadData}
          title="Làm mới dữ liệu"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c084fc',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* 2. Summary KPI Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            padding: '8px 6px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#38bdf8' }}>{formatMetric(totalVal)}</div>
          <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#94a3b8', marginTop: '2px' }}>TỔNG SỐ</div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '8px 6px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#f59e0b' }}>
            {formatMetric(inProgressVal)}
          </div>
          <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#94a3b8', marginTop: '2px' }}>ĐANG XỬ LÝ</div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '8px 6px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#10b981' }}>{formatMetric(resolvedVal)}</div>
          <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#94a3b8', marginTop: '2px' }}>HÒA GIẢI XONG</div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '10px',
            padding: '8px 6px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#94a3b8' }}>{formatMetric(closedVal)}</div>
          <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>ĐÃ ĐÓNG</div>
        </div>
      </div>

      {/* 3. Tab Buttons: KHIẾU NẠI vs SỰ CỐ GIAO NHẬN */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid rgba(168, 85, 247, 0.25)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('DISPUTES')}
          style={{
            padding: '7px 8px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 800,
            background: activeTab === 'DISPUTES' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
            border: activeTab === 'DISPUTES' ? '1px solid #c084fc' : '1px solid transparent',
            color: activeTab === 'DISPUTES' ? '#c084fc' : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <FileText size={12} />
          <span>HỒ SƠ TRANH CHẤP</span>
          {disputes.length > 0 && (
            <span
              style={{
                background: '#a855f7',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '999px',
              }}
            >
              {disputes.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INCIDENTS')}
          style={{
            padding: '7px 8px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 800,
            background: activeTab === 'INCIDENTS' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            border: activeTab === 'INCIDENTS' ? '1px solid #ef4444' : '1px solid transparent',
            color: activeTab === 'INCIDENTS' ? '#f87171' : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <ShieldAlert size={12} />
          <span>SỰ CỐ ĐỐI CHIẾU</span>
          {incidents.length > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '999px',
              }}
            >
              {incidents.length}
            </span>
          )}
        </button>
      </div>

      {/* 4. Filter & Search Controls (Disputes Tab) */}
      {activeTab === 'DISPUTES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} color="#64748b" style={{ position: 'absolute', left: '9px', top: '9px' }} />
            <input
              type="text"
              placeholder="Tìm mã DSP, tên xe, người khiếu nại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 28px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as DisputeStatus | '')}
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                color: '#c084fc',
                fontSize: '10.5px',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SUBMITTED">Mới gửi</option>
              <option value="UNDER_REVIEW">Đang rà soát</option>
              <option value="AWAITING_EVIDENCE">Chờ bằng chứng</option>
              <option value="MEDIATION">Đang hòa giải</option>
              <option value="PROPOSED_RESOLUTION">Chờ phản hồi</option>
              <option value="VOTING_IN_PROGRESS">Đang biểu quyết</option>
              <option value="RESOLVED">Đã hòa giải xong</option>
              <option value="CLOSED">Đã đóng</option>
              <option value="REJECTED">Bác bỏ</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as DisputeCategory | '')}
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                color: '#c084fc',
                fontSize: '10.5px',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              <option value="">Tất cả lĩnh vực</option>
              {Object.entries(DISPUTE_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 5. Main Body List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ padding: '30px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
            <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 8px' }} />
            <div>Đang tải danh sách hồ sơ...</div>
          </div>
        ) : activeTab === 'INCIDENTS' ? (
          incidents.length === 0 ? (
            <div
              style={{
                padding: '32px 14px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '11px',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
              }}
            >
              <ShieldCheck size={24} style={{ margin: '0 auto 8px', opacity: 0.4, color: '#10b981' }} />
              <div>Không phát hiện sự cố chậm trễ bàn giao nào.</div>
            </div>
          ) : (
            incidents.map((inc) => {
              const st = INCIDENT_STATE_LABELS[inc.state] || {
                label: inc.state,
                bg: 'rgba(255,255,255,0.1)',
                text: '#fff',
                border: 'transparent',
              };
              const isExpanded = expandedIncidentId === inc.incidentId;

              return (
                <div
                  key={inc.incidentId}
                  style={{
                    background: 'rgba(11, 28, 54, 0.65)',
                    border: `1.2px solid ${st.border || 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                        {inc.vehiclePlate} ({inc.vehicleName})
                      </div>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                        Mã sự cố: #{inc.incidentId}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: st.bg,
                        color: st.text,
                        border: `1px solid ${st.border}`,
                      }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Summary of before/after bookings */}
                  <div
                    style={{
                      background: 'rgba(4, 16, 30, 0.6)',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#94a3b8' }}>Lịch trước: </span>
                      <strong style={{ color: '#e2e8f0' }}>{inc.previousBookingUserDisplay}</strong>
                      <span style={{ color: '#64748b' }}>
                        {' '}(kết thúc: {new Date(inc.previousBookingEndTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })})
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#f87171' }}>Bị ảnh hưởng: </span>
                      <strong style={{ color: '#e2e8f0' }}>{inc.impactedBookingUserDisplay}</strong>
                      <span style={{ color: '#64748b' }}>
                        {' '}(bắt đầu: {new Date(inc.impactedBookingStartTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })})
                      </span>
                    </div>
                  </div>

                  {inc.hasFormalDispute && inc.formalDisputeId && (
                    <button
                      type="button"
                      onClick={() => setSelectedDisputeId(inc.formalDisputeId!)}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <ExternalLink size={11} />
                      <span>Xem hồ sơ khiếu nại #{inc.formalDisputeReference}</span>
                    </button>
                  )}
                </div>
              );
            })
          )
        ) : filteredDisputes.length === 0 ? (
          <div
            style={{
              padding: '32px 14px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '11px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <CheckCircle2 size={24} style={{ margin: '0 auto 8px', opacity: 0.4, color: '#10b981' }} />
            <div>Không tìm thấy hồ sơ khiếu nại nào theo bộ lọc.</div>
          </div>
        ) : (
          filteredDisputes.map((d) => {
            const stColor = DISPUTE_STATUS_COLORS[d.status] || { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
            const prColor = DISPUTE_PRIORITY_COLORS[d.priority] || { bg: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8' };
            const catLabel = DISPUTE_CATEGORY_LABELS[d.category] || d.category;
            const statusLabel = d.statusVietnamese || DISPUTE_STATUS_LABELS[d.status] || d.status;
            const priorityLabel = d.priorityVietnamese || DISPUTE_PRIORITY_LABELS[d.priority] || d.priority;

            return (
              <div
                key={d.id}
                onClick={() => setSelectedDisputeId(d.id)}
                style={{
                  background: 'rgba(11, 28, 54, 0.65)',
                  border: '1.2px solid rgba(168, 85, 247, 0.35)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#c084fc';
                  e.currentTarget.style.background = 'rgba(11, 28, 54, 0.85)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)';
                  e.currentTarget.style.background = 'rgba(11, 28, 54, 0.65)';
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#c084fc', fontFamily: 'monospace' }}>
                        #{d.referenceCode}
                      </span>
                      <span
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '999px',
                          background: prColor.bg,
                          color: prColor.text,
                          border: `1px solid ${prColor.text}44`,
                        }}
                      >
                        {priorityLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                      {d.title}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: stColor.bg,
                      color: stColor.text,
                      border: `1px solid ${stColor.border}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Vehicle & Creator Meta */}
                <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{d.vehicleName} ({d.vehicleLicensePlate || 'EV'})</span>
                  <span>{d.createdByName}</span>
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span
                    style={{
                      fontSize: '9.5px',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#cbd5e1',
                    }}
                  >
                    {catLabel}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!d.assignedStaffId && d.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={(e) => handleClaim(d.id, e)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'rgba(168, 85, 247, 0.2)',
                          border: '1px solid #c084fc',
                          color: '#c084fc',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <UserCheck size={11} />
                        <span>Tiếp nhận</span>
                      </button>
                    )}

                    <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <span>Chi tiết</span>
                      <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
