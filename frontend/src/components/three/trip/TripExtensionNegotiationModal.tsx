import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExtensionRequestByIdApi,
  acceptExtensionRequestApi,
  rejectExtensionRequestApi,
} from '../../../services/tripApi';
import { TripExtensionRequestData } from '../../../types/trip';
import {
  Clock,
  Car,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface TripExtensionNegotiationModalProps {
  requestId: string;
  onClose: () => void;
}

function formatClockTime(isoString?: string | null): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    const time = d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const date = d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
    return `${time} (${date})`;
  } catch {
    return '--:--';
  }
}

export const TripExtensionNegotiationModal: React.FC<TripExtensionNegotiationModalProps> = ({
  requestId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: request, isLoading, isError } = useQuery<TripExtensionRequestData>({
    queryKey: ['extensionRequest', requestId],
    queryFn: () => fetchExtensionRequestByIdApi(requestId),
    enabled: !!requestId,
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptExtensionRequestApi(requestId),
    onSuccess: () => {
      setSuccessMessage('Đã đồng ý nhường lịch thành công. Lịch đặt của bạn đã được cập nhật.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['vehicleBookings'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['activeTrip'] });
      setTimeout(() => {
        onClose();
      }, 1800);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Không thể đồng ý yêu cầu lúc này.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectExtensionRequestApi(requestId),
    onSuccess: () => {
      setSuccessMessage('Bạn đã từ chối yêu cầu nhường lịch.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setTimeout(() => {
        onClose();
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Không thể từ chối yêu cầu.');
    },
  });

  const isSubmitting = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 6, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(180deg, #091528 0%, #050d1a 100%)',
          border: '1.5px solid rgba(0, 242, 254, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.15)',
          padding: '22px',
          color: '#ffffff',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <X size={15} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f2fe',
            }}
          >
            <Clock size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
              YÊU CẦU NHƯỜNG LỊCH SỬ DỤNG XE
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
              Thành viên đang sử dụng xe muốn xin gia hạn thêm thời gian
            </p>
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#00f2fe' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <span style={{ fontSize: '12px' }}>Đang tải thông tin yêu cầu...</span>
          </div>
        ) : isError || !request ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#f87171', fontSize: '12px' }}>
            Không thể tải thông tin yêu cầu nhường lịch hoặc yêu cầu không tồn tại.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Requester Info */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '11.5px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Thành viên yêu cầu:</span>
                <strong style={{ color: '#00f2fe' }}>{request.requesterName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>
                  {request.vehicleName} ({request.licensePlate})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Thời lượng xin gia hạn:</span>
                <span
                  style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    fontWeight: 800,
                    padding: '1px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                  }}
                >
                  +{request.additionalMinutes} PHÚT
                </span>
              </div>
              {request.reason && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px', marginTop: '2px' }}>
                  <span style={{ color: '#94a3b8' }}>Lý do: </span>
                  <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>"{request.reason}"</span>
                </div>
              )}
            </div>

            {/* Time Comparison Schedule Card */}
            <div
              style={{
                background: 'rgba(0, 242, 254, 0.06)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
                THAY ĐỔI LỊCH ĐẶT CỦA BẠN:
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Lịch hiện tại</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#f87171' }}>
                    {formatClockTime(request.originalAffectedStartTime)} - {formatClockTime(request.affectedEndTime)}
                  </div>
                </div>

                <ArrowRight size={16} color="#00f2fe" />

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Lịch đề xuất mới</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#34d399' }}>
                    {formatClockTime(request.proposedAffectedStartTime)} - {formatClockTime(request.affectedEndTime)}
                  </div>
                </div>
              </div>

              {/* Strict Non-extending end time disclosure (Section 10) */}
              <div
                style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldCheck size={13} color="#34d399" style={{ flexShrink: 0 }} />
                <span>
                  Bạn chỉ nhường <strong>{request.additionalMinutes} phút đầu</strong>. Giờ trả xe của bạn vẫn giữ nguyên lúc{' '}
                  <strong style={{ color: '#ffffff' }}>{formatClockTime(request.affectedEndTime)}</strong>.
                </span>
              </div>

              {request.responseDeadline && (
                <div style={{ fontSize: '10px', color: '#fbbf24', textAlign: 'right' }}>
                  Hạn phản hồi: {formatDateTime(request.responseDeadline)}
                </div>
              )}
            </div>

            {/* Error / Success Banners */}
            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: '#f87171',
                  fontSize: '11px',
                }}
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: '#34d399',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {successMessage}
              </div>
            )}

            {/* Action Buttons */}
            {request.status === 'PENDING' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => rejectMutation.mutate()}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#f87171',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                >
                  <XCircle size={14} />
                  <span>TỪ CHỐI</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => acceptMutation.mutate()}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#050c18',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(0, 242, 254, 0.35)',
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  <span>ĐỒNG Ý NHƯỜNG LỊCH</span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  color: '#94a3b8',
                }}
              >
                Yêu cầu này đã ở trạng thái: <strong>{request.status}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
