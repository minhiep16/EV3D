import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  DisputeResponse,
  DisputeSummaryResponse,
  DisputeCategory,
  DisputeStatus,
  DISPUTE_CATEGORY_LABELS,
  DISPUTE_STATUS_COLORS,
  DISPUTE_PRIORITY_COLORS,
  BookingConflictIncident,
  INCIDENT_STATE_LABELS,
} from '../../../types/dispute';
import {
  fetchStaffDisputeDashboard,
  fetchDisputeSummary,
  assignStaffMediator,
  fetchActiveIncidentsForStaff,
} from '../../../services/disputeApi';
import { DisputeDetailModal } from './DisputeDetailModal';
import { EVCarLoader } from '../../common/EVCarLoader';
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
} from 'lucide-react';

interface StaffDisputeDashboardModalProps {
  onClose: () => void;
}

export const StaffDisputeDashboardModal: React.FC<StaffDisputeDashboardModalProps> = ({
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

  const dashboardContent = (
    <>
      <div
        data-ui-interactive="true"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={modalOverlayStyle}
      >
        <div style={modalCardStyle}>
          {/* Header */}
          <div style={modalHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={iconBoxStyle}>
                <Scale size={22} color="#00f2fe" />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  TRUNG TÂM HÒA GIẢI & XỬ LÝ TRANH CHẤP
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Không gian điều phối và hòa giải khiếu nại giữa các thành viên đồng sở hữu
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} style={closeBtnStyle}>
              <X size={20} color="#94a3b8" />
            </button>
          </div>

          {/* Main Tab Switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('DISPUTES')}
              style={{
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'DISPUTES' ? '2px solid #00f2fe' : '2px solid transparent',
                color: activeTab === 'DISPUTES' ? '#00f2fe' : '#94a3b8',
                fontWeight: activeTab === 'DISPUTES' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Scale size={15} />
              Hồ sơ khiếu nại chính thức ({disputes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INCIDENTS')}
              style={{
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'INCIDENTS' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === 'INCIDENTS' ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === 'INCIDENTS' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldAlert size={15} />
              Sự cố phát hiện tự động ({incidents.length})
            </button>
          </div>

          {/* Summary KPI Cards Row (Dispute tab only) */}
          {activeTab === 'DISPUTES' && summary && (
            <div style={summaryRowStyle}>
              <div style={summaryCardStyle('rgba(0, 242, 254, 0.12)', '#00f2fe')}>
                <span style={summaryCountStyle}>{summary.totalDisputes ?? summary.total ?? 0}</span>
                <span style={summaryLabelStyle}>Tổng hồ sơ</span>
              </div>
              <div style={summaryCardStyle('rgba(234, 179, 8, 0.12)', '#eab308')}>
                <span style={summaryCountStyle}>{summary.submittedCount ?? summary.submitted ?? 0}</span>
                <span style={summaryLabelStyle}>Chờ tiếp nhận</span>
              </div>
              <div style={summaryCardStyle('rgba(59, 130, 246, 0.12)', '#60a5fa')}>
                <span style={summaryCountStyle}>{summary.underReviewCount ?? summary.underReview ?? 0}</span>
                <span style={summaryLabelStyle}>Đang rà soát</span>
              </div>
              <div style={summaryCardStyle('rgba(249, 115, 22, 0.12)', '#fb923c')}>
                <span style={summaryCountStyle}>{summary.awaitingEvidenceCount ?? summary.awaitingEvidence ?? 0}</span>
                <span style={summaryLabelStyle}>Chờ bằng chứng</span>
              </div>
              <div style={summaryCardStyle('rgba(168, 85, 247, 0.12)', '#c084fc')}>
                <span style={summaryCountStyle}>{summary.mediationCount ?? summary.mediation ?? 0}</span>
                <span style={summaryLabelStyle}>Đang hòa giải</span>
              </div>
              <div style={summaryCardStyle('rgba(34, 197, 94, 0.12)', '#4ade80')}>
                <span style={summaryCountStyle}>{summary.resolvedCount ?? summary.resolved ?? 0}</span>
                <span style={summaryLabelStyle}>Đã hòa giải</span>
              </div>
              <div style={summaryCardStyle('rgba(148, 163, 184, 0.12)', '#94a3b8')}>
                <span style={summaryCountStyle}>{summary.closedCount ?? summary.closed ?? 0}</span>
                <span style={summaryLabelStyle}>Đã đóng</span>
              </div>
            </div>
          )}

          {/* Filter Bar (Dispute tab only) */}
          {activeTab === 'DISPUTES' && (
            <div style={filterBarStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Tìm mã DSP, tên xe, người khiếu nại..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ ...filterInputStyle, paddingLeft: '32px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as DisputeStatus | '')}
                  style={filterSelectStyle}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="SUBMITTED">Mới gửi</option>
                  <option value="UNDER_REVIEW">Đang rà soát</option>
                  <option value="AWAITING_EVIDENCE">Chờ bằng chứng</option>
                  <option value="MEDIATION">Đang hòa giải</option>
                  <option value="PROPOSED_RESOLUTION">Chờ phản hồi hòa giải</option>
                  <option value="VOTING_IN_PROGRESS">Đang biểu quyết nhóm</option>
                  <option value="RESOLVED">Đã hòa giải thành công</option>
                  <option value="CLOSED">Đã đóng</option>
                  <option value="REOPENED">Mở lại</option>
                  <option value="REJECTED">Bác bỏ</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as DisputeCategory | '')}
                  style={filterSelectStyle}
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

          {/* Table / List Body */}
          <div style={modalBodyStyle}>
            {activeTab === 'INCIDENTS' ? (
              loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Đang tải danh sách sự cố đối chiếu...
                </div>
              ) : incidents.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Không phát hiện sự cố chậm trễ bàn giao phương tiện nào tại thời điểm hiện tại.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {incidents.map((inc) => {
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
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: `1.5px solid ${st.border}`,
                          borderRadius: '10px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                              {inc.vehiclePlate} ({inc.vehicleName})
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                              {st.label}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              Mã sự cố: #{inc.incidentId}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {inc.hasFormalDispute && inc.formalDisputeId && (
                              <button
                                type="button"
                                onClick={() => setSelectedDisputeId(inc.formalDisputeId!)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #38bdf8',
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  color: '#38bdf8',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Xem hồ sơ khiếu nại #{inc.formalDisputeReference}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Booking Pair Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(0, 0, 0, 0.3)', padding: '10px', borderRadius: '8px', fontSize: '11px' }}>
                          <div>
                            <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>LỊCH ĐẶT TRƯỚC:</span>
                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{inc.previousBookingUserDisplay}</span>
                            <span style={{ color: '#94a3b8', display: 'block' }}>
                              Kết thúc: {new Date(inc.previousBookingEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(inc.previousBookingEndTime).toLocaleDateString('vi-VN')})
                            </span>
                            <span style={{ color: inc.returnRequestedAt ? '#4ade80' : '#fb923c', display: 'block', marginTop: '2px' }}>
                              {inc.returnRequestedAt ? `Tài xế yêu cầu trả: ${new Date(inc.returnRequestedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Chưa ghi nhận yêu cầu trả xe'}
                            </span>
                          </div>

                          <div>
                            <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>LỊCH ĐẶT TIẾP THEO (BỊ ẢNH HƯỞNG):</span>
                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{inc.impactedBookingUserDisplay}</span>
                            <span style={{ color: '#94a3b8', display: 'block' }}>
                              Bắt đầu: {new Date(inc.impactedBookingStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(inc.impactedBookingStartTime).toLocaleDateString('vi-VN')})
                            </span>
                            <span style={{ color: inc.returnVerifiedAt ? '#4ade80' : '#f87171', display: 'block', marginTop: '2px' }}>
                              {inc.returnVerifiedAt ? `NV nghiệm thu lúc: ${new Date(inc.returnVerifiedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Chưa xác nhận bàn giao về bãi'}
                            </span>
                          </div>
                        </div>

                        {/* Objective Diagnosis */}
                        <div style={{ fontSize: '11px', padding: '8px 10px', borderRadius: '6px', background: inc.returnRequestedAt ? 'rgba(56, 189, 248, 0.1)' : 'rgba(249, 115, 22, 0.1)', color: inc.returnRequestedAt ? '#7dd3fc' : '#fed7aa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={14} />
                          <span>
                            {inc.returnRequestedAt
                              ? 'Tài xế đã yêu cầu trả xe trên hệ thống. Sự chậm trễ hiện tại thuộc quy trình nghiệm thu của Nhân viên hoặc kiểm tra kỹ thuật.'
                              : 'Chưa có yêu cầu trả xe từ tài xế trước thời điểm kiểm tra. Cần nhân viên liên hệ xác minh tình trạng thực tế.'}
                          </span>
                        </div>

                        {/* Accordion Toggle */}
                        <button
                          type="button"
                          onClick={() => setExpandedIncidentId(isExpanded ? null : inc.incidentId)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 0',
                          }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {isExpanded ? 'Ẩn đối chiếu dòng thời gian' : 'Xem dòng thời gian sự kiện đối chiếu'}
                        </button>

                        {isExpanded && inc.timelineEvents && (
                          <div style={{ background: 'rgba(0, 0, 0, 0.5)', padding: '10px', borderRadius: '6px', fontSize: '10px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {inc.timelineEvents.map((ev, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                                  [{new Date(ev.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}]
                                </span>
                                <span style={{ color: '#e2e8f0' }}>{ev.description}</span>
                                <span style={{ color: '#64748b' }}>({ev.source})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : loading ? (
              <EVCarLoader variant="panel" message="Đang tải dữ liệu hồ sơ khiếu nại & hòa giải..." minHeight="200px" />
            ) : filteredDisputes.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Không tìm thấy hồ sơ khiếu nại nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredDisputes.map((d) => {
                  const sColor = DISPUTE_STATUS_COLORS[d.status] || {
                    bg: 'rgba(255,255,255,0.1)',
                    text: '#fff',
                    border: 'transparent',
                  };
                  const pColor = DISPUTE_PRIORITY_COLORS[d.priority] || {
                    bg: 'rgba(255,255,255,0.1)',
                    text: '#fff',
                  };

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDisputeId(d.id)}
                      style={rowCardStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#00f2fe', width: '130px' }}>
                            {d.referenceCode}
                          </span>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                              {d.title}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span>{d.vehicleName} ({d.vehicleLicensePlate})</span>
                              <span>•</span>
                              <span>Người tạo: {d.createdByName}</span>
                              <span>•</span>
                              <span>{new Date(d.createdAt).toLocaleDateString('vi-VN')}</span>
                              {d.disputedAmount != null && d.disputedAmount > 0 && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: '#fca5a5', fontWeight: 600 }}>
                                    Yêu cầu: {d.disputedAmount.toLocaleString('vi-VN')} đ
                                  </span>
                                </>
                              )}
                              {d.approvedAmount != null && d.approvedAmount > 0 && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: '#4ade80', fontWeight: 600 }}>
                                    Duyệt: {d.approvedAmount.toLocaleString('vi-VN')} đ
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: pColor.bg,
                              color: pColor.text,
                            }}
                          >
                            {d.priorityVietnamese}
                          </span>

                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '2px 9px',
                              borderRadius: '12px',
                              background: sColor.bg,
                              color: sColor.text,
                              border: `1px solid ${sColor.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {d.statusVietnamese}
                          </span>

                          {d.assignedStaffName ? (
                            <span style={{ fontSize: '11.5px', color: '#94a3b8', width: '130px', textAlign: 'right' }}>
                              {d.assignedStaffName}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleClaim(d.id, e)}
                              style={claimBtnStyle}
                            >
                              <UserCheck size={13} /> Tiếp nhận
                            </button>
                          )}

                          <ChevronRight size={16} color="#64748b" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDisputeId && (
        <DisputeDetailModal
          disputeId={selectedDisputeId}
          onClose={() => setSelectedDisputeId(null)}
          onUpdated={loadData}
        />
      )}
    </>
  );

  return typeof document !== 'undefined' ? createPortal(dashboardContent, document.body) : dashboardContent;
};

// Styles
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  zIndex: 9998,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  pointerEvents: 'auto',
};

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '1080px',
  maxHeight: '90vh',
  background: 'rgba(10, 20, 36, 0.96)',
  border: '1.5px solid rgba(0, 242, 254, 0.35)',
  borderRadius: '20px',
  boxShadow: '0 24px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 242, 254, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '18px 24px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const iconBoxStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '12px',
  background: 'rgba(0, 242, 254, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const summaryRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
  gap: '8px',
  padding: '14px 24px',
  background: 'rgba(0, 0, 0, 0.3)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
};

function summaryCardStyle(bg: string, borderColor: string): React.CSSProperties {
  return {
    background: bg,
    border: `1px solid ${borderColor}40`,
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };
}

const summaryCountStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#ffffff',
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  marginTop: '2px',
};

const filterBarStyle: React.CSSProperties = {
  padding: '12px 24px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
};

const filterInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#f8fafc',
  fontSize: '12.5px',
  outline: 'none',
  boxSizing: 'border-box',
};

const filterSelectStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#f8fafc',
  fontSize: '12.5px',
  outline: 'none',
  cursor: 'pointer',
};

const modalBodyStyle: React.CSSProperties = {
  padding: '16px 24px',
  overflowY: 'auto',
  flex: 1,
};

const rowCardStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const claimBtnStyle: React.CSSProperties = {
  background: 'rgba(34, 197, 94, 0.2)',
  border: '1px solid rgba(34, 197, 94, 0.4)',
  borderRadius: '6px',
  color: '#4ade80',
  padding: '5px 10px',
  fontSize: '11.5px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};

