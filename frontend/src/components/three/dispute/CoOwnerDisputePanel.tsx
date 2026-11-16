import React, { useState, useEffect, useMemo } from 'react';
import { VehicleResponse } from '../../../types/vehicle';
import {
  DisputeResponse,
  DisputeCategory,
  DisputePriority,
  CreateDisputeRequest,
  DISPUTE_CATEGORY_LABELS,
  DISPUTE_STATUS_COLORS,
  DISPUTE_PRIORITY_COLORS,
  BookingConflictIncident,
  INCIDENT_STATE_LABELS,
} from '../../../types/dispute';
import {
  fetchDisputesForVehicle,
  createDispute,
  fetchIncidentsForVehicle,
} from '../../../services/disputeApi';
import { DisputeDetailModal } from './DisputeDetailModal';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { EVCarLoader } from '../../common/EVCarLoader';
import {
  Scale,
  Plus,
  X,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter,
  ShieldCheck,
} from 'lucide-react';

interface CoOwnerDisputePanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const CoOwnerDisputePanel: React.FC<CoOwnerDisputePanelProps> = ({
  vehicle,
  onClose,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [incidents, setIncidents] = useState<BookingConflictIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  const disputePrefillData = useWorldStore((state) => state.disputePrefillData);
  const setDisputePrefillData = useWorldStore((state) => state.setDisputePrefillData);

  // Creation form state
  const [category, setCategory] = useState<DisputeCategory>('BOOKING');
  const [priority, setPriority] = useState<DisputePriority>('HIGH');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [disputedAmount, setDisputedAmount] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [disputeData, incidentData] = await Promise.all([
        fetchDisputesForVehicle(vehicle.id),
        fetchIncidentsForVehicle(vehicle.id),
      ]);
      setDisputes(disputeData);
      setIncidents(incidentData);
    } catch (err: any) {
      console.warn('Lỗi tải dữ liệu khiếu nại & sự cố:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vehicle.id]);

  useEffect(() => {
    if (disputePrefillData) {
      setActiveTab('CREATE');
      setCategory(disputePrefillData.category || 'BOOKING');
      setPriority(disputePrefillData.priority || 'HIGH');
      setTitle(disputePrefillData.suggestedTitle || '');
      setDescription(disputePrefillData.suggestedDescription || '');
    }
  }, [disputePrefillData]);

  const relevantIncidents = useMemo(() => {
    return incidents.filter(
      (inc) =>
        !inc.impactedBookingUserId ||
        inc.impactedBookingUserId === currentUser?.id ||
        currentUser?.role === 'STAFF' ||
        currentUser?.role === 'ADMIN'
    );
  }, [incidents, currentUser?.id, currentUser?.role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFormError('Vui lòng nhập đầy đủ tiêu đề và nội dung mô tả.');
      return;
    }

    // Prevent duplicate submission for the same incident/booking
    if (disputePrefillData?.bookingId) {
      const existingDispute = disputes.find((d) => d.bookingId === disputePrefillData.bookingId);
      if (existingDispute) {
        setFormError(`Sự cố của lịch đặt này đã được lập hồ sơ khiếu nại (${existingDispute.referenceCode}).`);
        setSelectedDisputeId(existingDispute.id);
        return;
      }
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const parsedAmount = disputedAmount ? parseFloat(disputedAmount) : undefined;
      const initialEvidences = evidenceUrl.trim()
        ? [
            {
              title: evidenceTitle.trim() || 'Tài liệu ban đầu',
              fileUrl: evidenceUrl.trim(),
            },
          ]
        : undefined;

      const req: CreateDisputeRequest = {
        vehicleId: vehicle.id,
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
        disputedAmount: parsedAmount,
        bookingId: disputePrefillData?.bookingId,
        tripId: disputePrefillData?.tripId || undefined,
        handoverId: disputePrefillData?.handoverId || undefined,
        respondentUserIds: disputePrefillData?.respondentUserIds,
        initialEvidences,
      };

      const res = await createDispute(req);
      setTitle('');
      setDescription('');
      setDisputedAmount('');
      setEvidenceUrl('');
      setEvidenceTitle('');
      setDisputePrefillData(null);
      setActiveTab('LIST');
      await loadData();
      setSelectedDisputeId(res.id);
    } catch (err: any) {
      setFormError(err.message || 'Không thể tạo hồ sơ khiếu nại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        data-ui-interactive="true"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={panelContainerStyle}
      >
        {/* Panel Header */}
        <div style={panelHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={iconBoxStyle}>
              <Scale size={18} color="#00f2fe" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                KHIẾU NẠI & TRANH CHẤP
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                {vehicle.name} • {vehicle.licensePlate}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeBtnStyle}>
            <X size={18} color="#94a3b8" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={tabBarStyle}>
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            style={navTabBtnStyle(activeTab === 'LIST')}
          >
            Hồ sơ khiếu nại ({disputes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CREATE')}
            style={navTabBtnStyle(activeTab === 'CREATE')}
          >
            <Plus size={14} /> Gửi khiếu nại mới
          </button>
        </div>

        {/* Panel Body */}
        <div style={panelBodyStyle}>
          {activeTab === 'LIST' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loading ? (
                <EVCarLoader variant="panel" message="Đang tải hồ sơ khiếu nại & sự cố..." minHeight="180px" />
              ) : (
                <>
                  {/* Section 7: SỰ CỐ ĐƯỢC HỆ THỐNG PHÁT HIỆN (Detected Incidents) */}
                  {relevantIncidents.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={14} color="#f59e0b" />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
                            SỰ CỐ ĐƯỢC HỆ THỐNG PHÁT HIỆN ({relevantIncidents.length})
                          </span>
                        </div>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>Chưa chính thức khiếu nại</span>
                      </div>

                      {relevantIncidents.map((inc) => {
                        const matchedDispute = disputes.find((d) => d.bookingId === inc.impactedBookingId);
                        const hasDispute = Boolean(inc.hasFormalDispute || matchedDispute);
                        const disputeIdToOpen = matchedDispute?.id || inc.formalDisputeId;

                        return (
                          <div
                            key={inc.incidentId}
                            style={{
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
                              border: '1.2px solid rgba(245, 158, 11, 0.45)',
                              boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)',
                              borderRadius: '12px',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>
                                Xe: {inc.vehiclePlate || vehicle.licensePlate} • Lịch #{inc.impactedBookingId.slice(0, 8)}
                              </span>
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(239, 68, 68, 0.25)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                }}
                              >
                                {INCIDENT_STATE_LABELS[inc.state]?.label || 'Quá giờ bàn giao'}
                              </span>
                            </div>

                            <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
                              Phát hiện: <strong style={{ color: '#f8fafc' }}>{new Date(inc.detectedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(inc.detectedAt).toLocaleDateString('vi-VN')}</strong>
                              <br />
                              Trạng thái: <span style={{ color: '#38bdf8' }}>{inc.previousTripStatus === 'ACTIVE' ? 'Xe đang được sử dụng (quá giờ)' : 'Chờ nhân viên tiếp nhận & bàn giao'}</span>
                            </div>

                            {hasDispute && disputeIdToOpen ? (
                              <button
                                type="button"
                                onClick={() => setSelectedDisputeId(disputeIdToOpen)}
                                style={{
                                  marginTop: '2px',
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  border: '1px solid rgba(56, 189, 248, 0.4)',
                                  borderRadius: '6px',
                                  padding: '6px 8px',
                                  color: '#38bdf8',
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Scale size={12} color="#38bdf8" />
                                <span>XEM HỒ SƠ TRANH CHẤP</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setDisputePrefillData(inc.prefilledDispute);
                                  setActiveTab('CREATE');
                                }}
                                style={{
                                  marginTop: '2px',
                                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 8px',
                                  color: '#041325',
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Scale size={12} color="#041325" />
                                <span>GỬI TRANH CHẤP</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Section: Formal Submitted Disputes */}
                  {disputes.length === 0 ? (
                    relevantIncidents.length > 0 ? (
                      <div style={{ ...emptyCardStyle, padding: '16px 12px' }}>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>
                          Chưa có hồ sơ khiếu nại chính thức nào được tạo cho phương tiện này.
                        </p>
                      </div>
                    ) : (
                      <div style={emptyCardStyle}>
                        <Scale size={28} color="#64748b" style={{ margin: '0 auto 10px auto' }} />
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                          Không có khiếu nại nào cho phương tiện này.
                        </p>
                        <p style={{ margin: '6px 0 14px 0', fontSize: '11.5px', color: '#64748b' }}>
                          Nếu có phát sinh tranh chấp về lịch đặt, kiểm tra xe hoặc phân bổ chi phí, bạn có thể gửi yêu cầu hòa giải.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('CREATE')}
                          style={primarySmallBtnStyle}
                        >
                          <Plus size={14} /> Gửi khiếu nại ngay
                        </button>
                      </div>
                    )
                  ) : (
                    disputes.map((d) => {
                      const sColor = DISPUTE_STATUS_COLORS[d.status] || {
                        bg: 'rgba(255,255,255,0.1)',
                        text: '#fff',
                        border: 'transparent',
                      };
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDisputeId(d.id)}
                          style={disputeCardStyle}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#00f2fe' }}>
                              {d.referenceCode}
                            </span>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '10px',
                                background: sColor.bg,
                                color: sColor.text,
                                border: `1px solid ${sColor.border}`,
                              }}
                            >
                              {d.statusVietnamese}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                            {d.title}
                          </div>
                          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px 0', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {d.description}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {d.categoryVietnamese} • {new Date(d.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                            <span style={{ fontSize: '11px', color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                              Chi tiết <ChevronRight size={13} />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          ) : (
            /* CREATE TAB */
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {disputePrefillData && (
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(6, 78, 119, 0.25)',
                    border: '1.5px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={16} color="#38bdf8" />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
                        DỮ LIỆU ĐỐI CHIẾU SỰ CỐ TỰ ĐỘNG ({disputePrefillData.incidentReference})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDisputePrefillData(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '10px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Bỏ liên kết
                    </button>
                  </div>

                  {/* Concise System Evidence Timeline - Read-only fields */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '10.5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                      <span style={{ color: '#00f2fe', fontWeight: 700 }}>{disputePrefillData.vehiclePlate || vehicle.licensePlate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Mã lịch đặt bị ảnh hưởng:</span>
                      <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>#{disputePrefillData.bookingId.slice(0, 8)}</span>
                    </div>
                    {disputePrefillData.tripId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Mã chuyến đi liên quan:</span>
                        <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>#{disputePrefillData.tripId.slice(0, 8)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Thời điểm phát hiện:</span>
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>{new Date(disputePrefillData.detectedAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.45', margin: 0 }}>
                    {disputePrefillData.systemEvidenceSummary}
                  </p>

                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '10px',
                      color: '#cbd5e1',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '100px',
                      overflowY: 'auto',
                      lineHeight: 1.4,
                    }}
                  >
                    {disputePrefillData.objectiveTimelineText}
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#64748b', fontStyle: 'italic' }}>
                    * Dữ liệu đối chiếu hệ thống trên là trường thông tin chỉ đọc (read-only) được tự động ghi nhận nhằm đảm bảo tính khách quan. Quý thành viên vui lòng bổ sung mô tả thực tế và yêu cầu hòa giải bên dưới.
                  </span>
                </div>
              )}

              {formError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '12px' }}>
                  {formError}
                </div>
              )}

              <div>
                <label style={labelStyle}>Phân loại tranh chấp / khiếu nại</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DisputeCategory)}
                  style={inputStyle}
                >
                  {Object.entries(DISPUTE_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k} style={{ background: '#0a1424', color: '#fff' }}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Mức độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as DisputePriority)}
                  style={inputStyle}
                >
                  <option value="LOW" style={{ background: '#0a1424', color: '#fff' }}>Thấp (Góp ý / Tình tiết nhỏ)</option>
                  <option value="MEDIUM" style={{ background: '#0a1424', color: '#fff' }}>Trung bình (Quy chuẩn tiêu chuẩn)</option>
                  <option value="HIGH" style={{ background: '#0a1424', color: '#fff' }}>Cao (Ảnh hưởng lịch sử dụng)</option>
                  <option value="CRITICAL" style={{ background: '#0a1424', color: '#fff' }}>Nghiêm trọng (Hư hỏng lớn / Sai lệch tài chính)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tiêu đề khiếu nại *</label>
                <input
                  type="text"
                  placeholder="Vd: Sai lệch số liệu pin bàn giao, Tranh chấp lịch đặt xe..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Nội dung chi tiết *</label>
                <textarea
                  rows={4}
                  placeholder="Trình bày chi tiết bối cảnh, sự việc, các bằng chứng và yêu cầu giải quyết..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Số tiền bồi thường yêu cầu (Claimed Amount — VND, nếu có)</label>
                <input
                  type="number"
                  placeholder="Vd: 100000"
                  value={disputedAmount}
                  onChange={(e) => setDisputedAmount(e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '3px' }}>
                  Lưu ý: Đây là số tiền yêu cầu ban đầu. Nhân viên hòa giải sẽ điều tra đối soát và đề xuất phương án chính thức.
                </span>
              </div>

              <div>
                <label style={labelStyle}>Tài liệu / Bằng chứng ban đầu (URL liên kết)</label>
                <input
                  type="text"
                  placeholder="Tiêu đề tài liệu đính kèm..."
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  style={{ ...inputStyle, marginBottom: '6px' }}
                />
                <input
                  type="url"
                  placeholder="https://... hoặc đường dẫn hình ảnh"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  style={secondaryBtnStyle}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={submitBtnStyle}
                >
                  {submitting ? (
                    <EVCarLoader variant="button" message="Đang gửi..." />
                  ) : (
                    'Gửi yêu cầu hòa giải'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Full detail modal */}
      {selectedDisputeId && (
        <DisputeDetailModal
          disputeId={selectedDisputeId}
          onClose={() => setSelectedDisputeId(null)}
          onUpdated={loadData}
        />
      )}
    </>
  );
};

// Styles
const panelContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: '76px',
  right: '20px',
  bottom: '20px',
  width: 'clamp(440px, 28vw, 495px)',
  maxWidth: 'min(495px, calc(100vw - 32px))',
  maxHeight: 'calc(100vh - 96px)',
  background: 'rgba(7, 20, 38, 0.94)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1.5px solid rgba(0, 242, 254, 0.3)',
  borderRadius: '20px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 242, 254, 0.16)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 100,
  overflow: 'hidden',
  pointerEvents: 'auto',
};

const panelHeaderStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const iconBoxStyle: React.CSSProperties = {
  width: '34px',
  height: '34px',
  borderRadius: '8px',
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

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(0, 0, 0, 0.2)',
};

function navTabBtnStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '9px 12px',
    background: active ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #00f2fe' : '2px solid transparent',
    color: active ? '#00f2fe' : '#94a3b8',
    fontSize: '12px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  };
}

const panelBodyStyle: React.CSSProperties = {
  padding: '14px 16px',
  overflowY: 'auto',
  flex: 1,
};

const emptyCardStyle: React.CSSProperties = {
  padding: '24px 16px',
  textAlign: 'center',
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: '12px',
  border: '1px dashed rgba(255, 255, 255, 0.1)',
};

const disputeCardStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(15, 23, 42, 0.7)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'all 0.18s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11.5px',
  fontWeight: 600,
  color: '#cbd5e1',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  padding: '8px 10px',
  color: '#f8fafc',
  fontSize: '12.5px',
  outline: 'none',
  boxSizing: 'border-box',
};

const primarySmallBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
  border: 'none',
  borderRadius: '6px',
  color: '#071426',
  padding: '7px 14px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
};

const submitBtnStyle: React.CSSProperties = {
  flex: 2,
  background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
  border: 'none',
  borderRadius: '8px',
  color: '#071426',
  padding: '9px 16px',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(255, 255, 255, 0.08)',
  border: 'none',
  borderRadius: '8px',
  color: '#94a3b8',
  padding: '9px 14px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

