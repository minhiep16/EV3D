import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck2,
  ShieldCheck,
  Car,
  Users,
  Crown,
  DollarSign,
  Clock,
  Search,
  RefreshCw,
  X,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  XCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { onboardingApi, OnboardingApplicationResponse } from '../../services/onboardingApi';
import { useWorldStore } from '../../store/worldStore';
import { findCatalogEntryByModel } from '../../data/vehicleCatalog';
import { EVCarLoader } from '../common/EVCarLoader';

interface AdminApplicationReviewPanelProps {
  onClose: () => void;
}

const resolveVehicleColorHex = (colorName?: string): string => {
  if (!colorName) return '#F8FAFC';
  const lower = colorName.toLowerCase();
  if (lower.includes('trắng') || lower.includes('white')) return '#F8FAFC';
  if (lower.includes('đen') || lower.includes('black')) return '#0F172A';
  if (lower.includes('đỏ') || lower.includes('red')) return '#DC2626';
  if (lower.includes('xanh dương') || lower.includes('blue') || lower.includes('hải quân')) return '#1D4ED8';
  if (lower.includes('xanh lá') || lower.includes('green')) return '#059669';
  if (lower.includes('xám') || lower.includes('ghi') || lower.includes('grey') || lower.includes('gray')) return '#64748B';
  if (lower.includes('bạc') || lower.includes('silver')) return '#CBD5E1';
  if (lower.includes('vàng') || lower.includes('gold') || lower.includes('yellow')) return '#EAB308';
  if (lower.includes('cam') || lower.includes('orange')) return '#EA580C';
  return '#38BDF8';
};

export const AdminApplicationReviewPanel: React.FC<AdminApplicationReviewPanelProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const setAdminApplicationPreviewVehicle = useWorldStore((state) => state.setAdminApplicationPreviewVehicle);

  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'>('ALL');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFeedbackMessage, setReviewFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch pending applications
  const {
    data: pendingApplications = [],
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useQuery<OnboardingApplicationResponse[]>({
    queryKey: ['staffApplications', 'PENDING'],
    queryFn: () => onboardingApi.getStaffApplications('PENDING'),
    staleTime: 10000,
    refetchInterval: 15000,
  });

  // 2. Fetch history applications
  const {
    data: historyApplications = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery<OnboardingApplicationResponse[]>({
    queryKey: ['staffApplications', 'HISTORY'],
    queryFn: () => onboardingApi.getStaffApplications('HISTORY'),
    staleTime: 15000,
  });

  // Filtered Pending
  const filteredPending = useMemo(() => {
    if (!searchQuery.trim()) return pendingApplications;
    const q = searchQuery.trim().toLowerCase();
    return pendingApplications.filter((a) => {
      return (
        (a.creatorName && a.creatorName.toLowerCase().includes(q)) ||
        (a.creatorEmail && a.creatorEmail.toLowerCase().includes(q)) ||
        (a.licensePlate && a.licensePlate.toLowerCase().includes(q)) ||
        (a.plateNumber && a.plateNumber.toLowerCase().includes(q)) ||
        (a.model && a.model.toLowerCase().includes(q)) ||
        (a.groupName && a.groupName.toLowerCase().includes(q)) ||
        (a.vin && a.vin.toLowerCase().includes(q))
      );
    });
  }, [pendingApplications, searchQuery]);

  // Selected application
  const selectedApp = useMemo(() => {
    if (activeTab === 'PENDING') {
      if (selectedAppId) {
        const found = pendingApplications.find((a) => a.id === selectedAppId);
        if (found) return found;
      }
      return filteredPending.length > 0 ? filteredPending[0] : null;
    }
    return null;
  }, [activeTab, selectedAppId, pendingApplications, filteredPending]);

  // Set 3D vehicle preview when selected application changes
  useEffect(() => {
    if (selectedApp) {
      const modelCandidate = selectedApp.model || selectedApp.vehicleName || '';
      const catalogEntry = findCatalogEntryByModel(modelCandidate);
      const resolvedModelUrl = selectedApp.model3dUrl || catalogEntry?.model3dUrl || '/models/ev01-realistic.glb';
      const resolvedColor =
        selectedApp.exteriorColor ||
        catalogEntry?.defaultColorNameVi ||
        catalogEntry?.defaultColorHex ||
        'Trắng ngọc trai';
      const resolvedManufacturer =
        selectedApp.manufacturer ||
        catalogEntry?.brand ||
        (modelCandidate.toLowerCase().includes('tesla') ? 'Tesla' : 'VinFast');
      const resolvedDisplayName =
        selectedApp.vehicleName || catalogEntry?.displayName || modelCandidate || 'Xe điện EVShare';
      const resolvedModel = selectedApp.model || catalogEntry?.model || modelCandidate || 'EV';
      const resolvedPlate = selectedApp.licensePlate || selectedApp.plateNumber || 'CHỜ CẤP BIỂN';

      const previewVehicle = {
        id: `application-${selectedApp.id}`,
        name: resolvedDisplayName,
        model: resolvedModel,
        vehicleName: resolvedDisplayName,
        code: catalogEntry?.id || 'PREVIEW_EV',
        licensePlate: resolvedPlate,
        plateNumber: resolvedPlate,
        exteriorColor: resolvedColor,
        manufacturer: resolvedManufacturer,
        model3dUrl: resolvedModelUrl,
        batteryCapacityKwh:
          Number(selectedApp.batteryCapacityKwh) ||
          Number(selectedApp.batteryCapacity) ||
          catalogEntry?.batteryCapacityKwh ||
          75,
        isApplicationPreview: true,
        status: 'PENDING_APPROVAL',
        batteryLevel: 100,
        isAvailable: false,
        vin: selectedApp.vin || 'VIN-PREVIEW',
      };
      setAdminApplicationPreviewVehicle(previewVehicle);
    } else {
      setAdminApplicationPreviewVehicle(null);
    }

    return () => {
      // Clear preview on unmount
      setAdminApplicationPreviewVehicle(null);
    };
  }, [selectedApp, setAdminApplicationPreviewVehicle]);

  // Handle Close
  const handleClose = () => {
    setAdminApplicationPreviewVehicle(null);
    onClose();
  };

  // Co-owners metrics
  const proposedOwners = selectedApp?.coOwners || [];
  const sumProposedShare = proposedOwners.reduce(
    (acc, curr) => acc + (Number(curr.sharePercentage) || 0),
    0
  );
  const isShare100 = Math.abs(sumProposedShare - 100.0) < 0.05;
  const vehicleVal = Number(selectedApp?.vehicleValue || 1200000000);

  // History counts and filtering
  const approvedCount = historyApplications.filter((a) => a.status === 'APPROVED').length;
  const changesCount = historyApplications.filter((a) => a.status === 'CHANGES_REQUESTED').length;
  const rejectedCount = historyApplications.filter((a) => a.status === 'REJECTED').length;

  const filteredHistory = useMemo(() => {
    return historyApplications.filter((a) => {
      if (historyFilter !== 'ALL' && a.status !== historyFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        (a.creatorName && a.creatorName.toLowerCase().includes(q)) ||
        (a.creatorEmail && a.creatorEmail.toLowerCase().includes(q)) ||
        (a.licensePlate && a.licensePlate.toLowerCase().includes(q)) ||
        (a.plateNumber && a.plateNumber.toLowerCase().includes(q)) ||
        (a.model && a.model.toLowerCase().includes(q)) ||
        (a.groupName && a.groupName.toLowerCase().includes(q)) ||
        (a.reviewerName && a.reviewerName.toLowerCase().includes(q)) ||
        (a.vin && a.vin.toLowerCase().includes(q))
      );
    });
  }, [historyApplications, historyFilter, searchQuery]);

  // Review handler
  const handleReviewAction = async (action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT') => {
    if (!selectedApp) return;

    if (action === 'APPROVE' && !isShare100) {
      setReviewFeedbackMessage({
        type: 'error',
        text: 'Không thể phê duyệt vì tổng tỷ lệ phân bổ cổ phần chưa đúng 100.0%. Vui lòng yêu cầu thành viên chỉnh sửa.',
      });
      return;
    }

    if ((action === 'REQUEST_CHANGES' || action === 'REJECT') && !reviewNotes.trim()) {
      setReviewFeedbackMessage({
        type: 'error',
        text: 'Vui lòng nhập lý do hoặc ý kiến thẩm định trước khi từ chối hoặc yêu cầu bổ sung.',
      });
      return;
    }

    setIsSubmittingReview(true);
    setReviewFeedbackMessage(null);

    try {
      await onboardingApi.reviewApplication(selectedApp.id, {
        decision: action,
        action,
        reason: reviewNotes.trim() || undefined,
      });

      setReviewFeedbackMessage({
        type: 'success',
        text:
          action === 'APPROVE'
            ? `Đã phê duyệt thành công hồ sơ ${selectedApp.licensePlate || selectedApp.plateNumber || selectedApp.model}! Phương tiện và nhóm đồng sở hữu đã được kích hoạt.`
            : action === 'REQUEST_CHANGES'
            ? `Đã gửi yêu cầu chỉnh sửa hồ sơ tới đại diện nhóm (${selectedApp.creatorName}).`
            : `Đã từ chối hồ sơ đăng ký phương tiện ${selectedApp.licensePlate || selectedApp.plateNumber}.`,
      });

      setReviewNotes('');
      setSelectedAppId(null);
      setAdminApplicationPreviewVehicle(null);
      queryClient.invalidateQueries({ queryKey: ['staffApplications'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    } catch (err: any) {
      setReviewFeedbackMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi thực hiện thao tác xét duyệt.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <aside
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: 'clamp(414px, 31vw, 510px)',
        height: 'min(820px, calc(100dvh - 100px))',
        background: 'rgba(8, 28, 48, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 217, 255, 0.45)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(0, 217, 255, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        color: '#F1F5F9',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
          background: 'rgba(10, 32, 56, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(0, 217, 255, 0.15)',
              border: '1.2px solid #00D9FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(0, 217, 255, 0.3)',
              color: '#00D9FF',
            }}
          >
            <FileCheck2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#F1F5F9', letterSpacing: '0.02em' }}>
              XÉT DUYỆT HỒ SƠ
            </div>
            <div style={{ fontSize: '11px', color: '#00D9FF' }}>
              Thẩm định phương tiện & nhóm đồng sở hữu mới
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            color: '#94A3B8',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94A3B8';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* 2 Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          padding: '6px 16px',
          background: 'rgba(6, 20, 36, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('PENDING');
            setReviewFeedbackMessage(null);
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            background:
              activeTab === 'PENDING'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(0, 217, 255, 0.25))'
                : 'transparent',
            border: activeTab === 'PENDING' ? '1px solid #F59E0B' : '1px solid transparent',
            color: activeTab === 'PENDING' ? '#FFFFFF' : '#94A3B8',
            fontSize: '11.5px',
            fontWeight: activeTab === 'PENDING' ? 800 : 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <AlertTriangle size={13} color={activeTab === 'PENDING' ? '#F59E0B' : '#94A3B8'} />
          <span>Hồ sơ chờ xét duyệt</span>
          {pendingApplications.length > 0 && (
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 900,
                background: '#F59E0B',
                color: '#000000',
                borderRadius: '10px',
                padding: '0 6px',
                lineHeight: '16px',
              }}
            >
              {pendingApplications.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('HISTORY');
            setReviewFeedbackMessage(null);
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            background:
              activeTab === 'HISTORY'
                ? 'linear-gradient(135deg, rgba(16, 230, 163, 0.3), rgba(0, 217, 255, 0.25))'
                : 'transparent',
            border: activeTab === 'HISTORY' ? '1px solid #10E6A3' : '1px solid transparent',
            color: activeTab === 'HISTORY' ? '#FFFFFF' : '#94A3B8',
            fontSize: '11.5px',
            fontWeight: activeTab === 'HISTORY' ? 800 : 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ShieldCheck size={13} color={activeTab === 'HISTORY' ? '#10E6A3' : '#94A3B8'} />
          <span>Lịch sử xét duyệt</span>
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 800,
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#CBD5E1',
              borderRadius: '10px',
              padding: '0 6px',
              lineHeight: '16px',
            }}
          >
            {historyApplications.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 217, 255, 0.3) rgba(10, 32, 56, 0.5)',
        }}
      >
        {/* Search & Refresh Bar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm người nộp, biển số, VIN, nhóm xe..."
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#F1F5F9',
                fontSize: '11px',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'PENDING') refetchPending();
              else refetchHistory();
            }}
            style={{
              background: 'rgba(0, 217, 255, 0.1)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '8px',
              color: '#00D9FF',
              padding: '7px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
            }}
            title="Làm mới danh sách"
          >
            <RefreshCw size={13} className={pendingLoading || historyLoading ? 'spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Tab 1: PENDING APPLICATIONS */}
        {activeTab === 'PENDING' ? (
          pendingLoading ? (
            <EVCarLoader variant="panel" message="Đang tải danh sách hồ sơ chờ duyệt..." />
          ) : filteredPending.length === 0 ? (
            <div
              style={{
                background: 'rgba(16, 42, 67, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '40px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <ShieldCheck size={42} color="#10E6A3" />
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#F1F5F9' }}>
                {pendingApplications.length === 0
                  ? 'Không có hồ sơ nào đang chờ xét duyệt'
                  : 'Không tìm thấy hồ sơ phù hợp với từ khóa'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#94A3B8', maxWidth: '360px', lineHeight: 1.5 }}>
                {pendingApplications.length === 0
                  ? 'Tất cả hồ sơ đăng ký xe đã được Quản trị viên xử lý hoặc chưa có hồ sơ mới gửi lên hệ thống.'
                  : 'Vui lòng kiểm tra lại từ khóa tìm kiếm biển số, số khung hoặc tên thành viên.'}
              </div>
            </div>
          ) : (
            <>
              {/* Horizontal Application Selector Cards */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  scrollbarWidth: 'thin',
                }}
              >
                {filteredPending.map((app) => {
                  const isSelectedApp = app.id === selectedApp?.id;
                  return (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedAppId(app.id);
                        setReviewFeedbackMessage(null);
                      }}
                      style={{
                        flex: '0 0 200px',
                        background: isSelectedApp
                          ? 'linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(245, 158, 11, 0.15))'
                          : 'rgba(16, 42, 67, 0.7)',
                        border: isSelectedApp
                          ? '1.5px solid #F59E0B'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelectedApp ? '0 0 12px rgba(245, 158, 11, 0.35)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#F1F5F9' }}>
                          {app.licensePlate || app.plateNumber || 'Chưa có biển'}
                        </span>
                        <span
                          style={{
                            fontSize: '8.5px',
                            fontWeight: 800,
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#F59E0B',
                            padding: '1px 5px',
                            borderRadius: '4px',
                          }}
                        >
                          CHỜ DUYỆT
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#00D9FF', fontWeight: 700 }}>
                        {app.model || app.vehicleName || 'Xe điện EVShare'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                        Người nộp: <strong style={{ color: '#E2E8F0' }}>{app.creatorName}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedApp && (
                /* Detailed Application Viewer */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Summary Header */}
                  <div
                    style={{
                      background: 'rgba(16, 42, 67, 0.8)',
                      border: '1.2px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Car size={16} color="#00D9FF" />
                          <span>{selectedApp.manufacturer || 'VinFast'} {selectedApp.model || selectedApp.vehicleName}</span>
                          <span style={{ color: '#00D9FF' }}>({selectedApp.licensePlate || selectedApp.plateNumber})</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                          Mã hồ sơ: <code style={{ color: '#E2E8F0', background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: '4px' }}>{selectedApp.id}</code>
                          {' • '}
                          Nộp lúc: {selectedApp.submittedAt ? new Date(selectedApp.submittedAt).toLocaleString('vi-VN') : 'Mới nộp'}
                        </div>
                      </div>
                      <span
                        style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid rgba(245, 158, 11, 0.5)',
                          color: '#F59E0B',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                        }}
                      >
                        CHỜ QUẢN TRỊ VIÊN XÉT DUYỆT
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: '#CBD5E1', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                      <div>
                        Người nộp: <strong style={{ color: '#F1F5F9' }}>{selectedApp.creatorName}</strong>
                      </div>
                      <div>
                        Email: <span style={{ color: '#94A3B8' }}>{selectedApp.creatorEmail || 'Chưa cung cấp'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 1: Vehicle Specifications */}
                  <div
                    style={{
                      background: 'rgba(16, 42, 67, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#00D9FF', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      THÔNG TIN PHƯƠNG TIỆN ĐĂNG KÝ
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Biển số xe: </span>
                        <strong style={{ color: '#F1F5F9' }}>{selectedApp.licensePlate || selectedApp.plateNumber}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Số khung (VIN): </span>
                        <strong style={{ color: '#F1F5F9', letterSpacing: '0.04em' }}>{selectedApp.vin || 'N/A'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#94A3B8' }}>Màu sắc: </span>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: resolveVehicleColorHex(selectedApp.exteriorColor),
                            border: '1px solid rgba(255,255,255,0.4)',
                            display: 'inline-block',
                          }}
                        />
                        <strong style={{ color: '#F1F5F9' }}>{selectedApp.exteriorColor || 'Trắng ngọc trai'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Dung lượng pin: </span>
                        <strong style={{ color: '#10E6A3' }}>
                          {selectedApp.batteryCapacityKwh || selectedApp.batteryCapacity || 75} kWh
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Định giá xe: </span>
                        <strong style={{ color: '#FFBF36' }}>
                          {vehicleVal.toLocaleString('vi-VN')} ₫
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Năm sản xuất: </span>
                        <strong style={{ color: '#F1F5F9' }}>{selectedApp.manufactureYear || selectedApp.modelYear || 2025}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Proposed Group & Governance */}
                  <div
                    style={{
                      background: 'rgba(16, 42, 67, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#A855F7', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      NHÓM ĐỒNG SỞ HỮU & QUY CHẾ HOẠT ĐỘNG
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Tên nhóm đề xuất: </span>
                        <strong style={{ color: '#F1F5F9' }}>{selectedApp.groupName}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Trưởng nhóm: </span>
                        <strong style={{ color: '#FFBF36' }}>{selectedApp.creatorName}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Biểu quyết: </span>
                        <span style={{ color: '#CBD5E1' }}>
                          {selectedApp.votingRule === 'PROPORTIONAL_WEIGHTED' || !selectedApp.votingRule
                            ? 'Theo trọng số cổ phần'
                            : selectedApp.votingRule}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Túc số (Quorum): </span>
                        <strong style={{ color: '#00D9FF' }}>{selectedApp.quorumPercentage || 51}%</strong>
                        {' • '}
                        <span style={{ color: '#94A3B8' }}>Ngưỡng duyệt: </span>
                        <strong style={{ color: '#00D9FF' }}>{selectedApp.approvalThresholdPercentage || 65}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Proposed Co-Owners & Shares Allocation */}
                  <div
                    style={{
                      background: 'rgba(16, 42, 67, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#10E6A3', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        CƠ CẤU CỔ PHẦN ĐỀ XUẤT ({proposedOwners.length} THÀNH VIÊN)
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isShare100 ? 'rgba(16, 230, 163, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isShare100 ? '#10E6A3' : '#F87171',
                          border: isShare100 ? '1px solid rgba(16, 230, 163, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                        }}
                      >
                        {isShare100 ? '✓ 100.0% HỢP LỆ' : `⚠️ TỔNG: ${sumProposedShare.toFixed(1)}% (CHƯA ĐỦ 100%)`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {proposedOwners.map((owner, idx) => {
                        const pct = Number(owner.sharePercentage || 0);
                        const capitalContrib = Math.round((vehicleVal * pct) / 100);
                        const isRep = idx === 0 || owner.role === 'REPRESENTATIVE';
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '8px',
                              fontSize: '11px',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {isRep && <Crown size={12} color="#FFBF36" />}
                                <span>{owner.fullName || owner.email || `Thành viên #${idx + 1}`}</span>
                              </div>
                              <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                                {owner.email} • {isRep ? 'Đại diện trưởng nhóm' : 'Thành viên đồng sở hữu'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '13px', fontWeight: 900, color: '#00D9FF' }}>
                                {pct.toFixed(1)}%
                              </div>
                              <div style={{ fontSize: '9.5px', color: '#CBD5E1' }}>
                                {capitalContrib.toLocaleString('vi-VN')} ₫
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card 4: Admin Review Actions */}
                  <div
                    style={{
                      background: 'rgba(16, 42, 67, 0.85)',
                      border: '1.2px solid rgba(0, 217, 255, 0.3)',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} color="#00D9FF" />
                      <span>QUYẾT ĐỊNH XÉT DUYỆT CỦA QUẢN TRỊ VIÊN</span>
                    </div>

                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Nhập ý kiến thẩm định hoặc lý do (bắt buộc khi Từ chối hoặc Yêu cầu bổ sung)..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#F1F5F9',
                        fontSize: '11.5px',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />

                    {/* Action Feedback Message */}
                    {reviewFeedbackMessage && (
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background:
                            reviewFeedbackMessage.type === 'success'
                              ? 'rgba(16, 230, 163, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          border:
                            reviewFeedbackMessage.type === 'success'
                              ? '1px solid rgba(16, 230, 163, 0.4)'
                              : '1px solid rgba(239, 68, 68, 0.4)',
                          color:
                            reviewFeedbackMessage.type === 'success' ? '#10E6A3' : '#F87171',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {reviewFeedbackMessage.type === 'success' ? (
                          <CheckCircle size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                        <span>{reviewFeedbackMessage.text}</span>
                      </div>
                    )}

                    {/* Action Buttons in a Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {/* APPROVE */}
                      <button
                        type="button"
                        onClick={() => handleReviewAction('APPROVE')}
                        disabled={isSubmittingReview || !isShare100}
                        title={
                          !isShare100
                            ? 'Tổng tỷ lệ cổ phần đề xuất chưa bằng đúng 100%'
                            : 'Phê duyệt hồ sơ, kích hoạt xe và nhóm đồng sở hữu'
                        }
                        style={{
                          padding: '9px 12px',
                          borderRadius: '8px',
                          background: !isShare100
                            ? 'rgba(100, 116, 139, 0.2)'
                            : 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                          border: !isShare100
                            ? '1px solid rgba(100, 116, 139, 0.4)'
                            : '1px solid #10B981',
                          color: !isShare100 ? '#64748B' : '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '11px',
                          cursor: isSubmittingReview || !isShare100 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease',
                          boxShadow: isShare100 ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none',
                        }}
                      >
                        <CheckCircle size={13} />
                        <span>Phê duyệt</span>
                      </button>

                      {/* REQUEST CHANGES */}
                      <button
                        type="button"
                        onClick={() => handleReviewAction('REQUEST_CHANGES')}
                        disabled={isSubmittingReview}
                        title="Yêu cầu người nộp hồ sơ chỉnh sửa hoặc bổ sung thông tin"
                        style={{
                          padding: '9px 12px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                          border: '1px solid #0284C7',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '11px',
                          cursor: isSubmittingReview ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>Yêu cầu bổ sung</span>
                      </button>

                      {/* REJECT */}
                      <button
                        type="button"
                        onClick={() => handleReviewAction('REJECT')}
                        disabled={isSubmittingReview}
                        title="Từ chối hồ sơ đăng ký xe"
                        style={{
                          padding: '9px 12px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                          border: '1px solid #EF4444',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '11px',
                          cursor: isSubmittingReview ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <XCircle size={13} />
                        <span>Từ chối</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          /* Tab 2: HISTORY APPLICATIONS */
          historyLoading ? (
            <EVCarLoader variant="panel" message="Đang tải lịch sử xét duyệt..." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* History Filter Chips */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { key: 'ALL', label: `Tất cả (${historyApplications.length})` },
                  { key: 'APPROVED', label: `Đã duyệt (${approvedCount})` },
                  { key: 'CHANGES_REQUESTED', label: `Yêu cầu bổ sung (${changesCount})` },
                  { key: 'REJECTED', label: `Đã từ chối (${rejectedCount})` },
                ].map((f) => {
                  const isFActive = historyFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setHistoryFilter(f.key as any)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: isFActive
                          ? '1px solid #00D9FF'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isFActive ? 'rgba(0, 217, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        color: isFActive ? '#FFFFFF' : '#94A3B8',
                        fontSize: '10.5px',
                        fontWeight: isFActive ? 800 : 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* History Application Cards List */}
              {filteredHistory.length === 0 ? (
                <div
                  style={{
                    padding: '30px',
                    textAlign: 'center',
                    color: '#94A3B8',
                    fontSize: '11.5px',
                    background: 'rgba(16, 42, 67, 0.5)',
                    borderRadius: '10px',
                  }}
                >
                  Chưa có hồ sơ nào trong mục lịch sử này.
                </div>
              ) : (
                filteredHistory.map((app) => {
                  const isAppApproved = app.status === 'APPROVED';
                  const isAppChanges = app.status === 'CHANGES_REQUESTED';

                  const badgeColor = isAppApproved
                    ? '#10E6A3'
                    : isAppChanges
                    ? '#38BDF8'
                    : '#F87171';
                  const badgeBg = isAppApproved
                    ? 'rgba(16, 230, 163, 0.15)'
                    : isAppChanges
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)';
                  const badgeLabel = isAppApproved
                    ? '✓ ĐÃ PHÊ DUYỆT'
                    : isAppChanges
                    ? '⚠️ YÊU CẦU BỔ SUNG'
                    : '✕ ĐÃ TỪ CHỐI';

                  return (
                    <div
                      key={app.id}
                      style={{
                        background: 'rgba(16, 42, 67, 0.75)',
                        border: `1px solid ${isAppApproved ? 'rgba(16, 230, 163, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#F1F5F9' }}>
                          {app.model || app.vehicleName} •{' '}
                          <span style={{ color: '#00D9FF' }}>{app.licensePlate || app.plateNumber}</span>
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            background: badgeBg,
                            color: badgeColor,
                            padding: '2px 7px',
                            borderRadius: '5px',
                            border: `1px solid ${badgeColor}44`,
                          }}
                        >
                          {badgeLabel}
                        </span>
                      </div>

                      <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>
                        Nhóm: <strong style={{ color: '#E2E8F0' }}>{app.groupName}</strong>
                        {' • '}
                        Người nộp: <span style={{ color: '#E2E8F0' }}>{app.creatorName}</span>
                      </div>

                      <div style={{ fontSize: '10.5px', color: '#CBD5E1', display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          Người duyệt: <strong style={{ color: '#00D9FF' }}>{app.reviewerName || 'Quản trị viên (ADMIN)'}</strong>
                        </span>
                        <span style={{ color: '#64748B', fontSize: '9.5px' }}>
                          {app.reviewedAt ? new Date(app.reviewedAt).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>

                      {(app.reviewReason || app.adminReviewNotes) && (
                        <div
                          style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            fontSize: '10.5px',
                            color: '#E2E8F0',
                            marginTop: '2px',
                          }}
                        >
                          <span style={{ color: '#94A3B8', fontWeight: 700 }}>Ý kiến thẩm định: </span>
                          {app.reviewReason || app.adminReviewNotes}
                        </div>
                      )}

                      {isAppApproved && app.createdVehicleId && (
                        <div style={{ fontSize: '9.5px', color: '#10E6A3', marginTop: '2px', fontWeight: 700 }}>
                          ✓ Đã kích hoạt phương tiện ID: {app.createdVehicleId}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )
        )}
      </div>
    </aside>
  );
};
