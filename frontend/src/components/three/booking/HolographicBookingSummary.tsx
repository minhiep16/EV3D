import React from 'react';
import { Html, Billboard } from '@react-three/drei';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import { SpatialDataLink } from '../SpatialDataLink';
import {
  Calendar,
  Clock,
  Car,
  CheckCircle,
  AlertTriangle,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface HolographicBookingSummaryProps {
  vehicleName: string;
  selectedDate: Date;
  startHour: number;
  endHour: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  timelinePosition?: [number, number, number];
  panelPosition?: [number, number, number];
}

export const HolographicBookingSummary: React.FC<HolographicBookingSummaryProps> = ({
  vehicleName,
  selectedDate,
  startHour,
  endHour,
  isSubmitting,
  errorMessage,
  successMessage,
  onConfirm,
  onCancel,
  timelinePosition = [4.8, 1.25, 2.4],
  panelPosition = [7.3, 1.55, 0.8],
}) => {
  const durationHours = Math.max(1, endHour - startHour);

  const formatVietnameseDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const startTimeStr = `${String(startHour).padStart(2, '0')}:00`;
  const endTimeStr = `${String(endHour).padStart(2, '0')}:00`;

  return (
    <>
      {/* 1. Spatial Laser Link connecting Selected Timeline to Holographic Panel */}
      <SpatialDataLink
        start={timelinePosition}
        end={[panelPosition[0] - 0.45, panelPosition[1], panelPosition[2]]}
        color="#a855f7"
      />

      {/* 2. Holographic Panel */}
      <group position={panelPosition}>
        <Billboard follow={true}>
          <HolographicPanelFrame3D width={2.7} height={3.6} color="#a855f7" />

          <Html center distanceFactor={8.8} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '320px',
                background: 'rgba(8, 12, 22, 0.94)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(168, 85, 247, 0.65)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                color: '#ffffff',
                fontFamily: 'var(--font-family)',
                position: 'relative',
              }}
            >
              {/* Close / Dismiss Selection */}
              <button
                type="button"
                onClick={onCancel}
                title="Đóng bảng đặt xe"
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              >
                <X size={14} />
              </button>

              {/* Header Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#c084fc',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                <Sparkles size={13} />
                ĐẶT LỊCH XE
              </div>

              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  margin: '0 0 16px 0',
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                Thông Tin Lịch Đặt
              </h3>

              {/* Details Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {/* Vehicle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                    <Car size={14} color="#38bdf8" />
                    <span>Xe</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                    {vehicleName}
                  </span>
                </div>

                {/* Date */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                    <Calendar size={14} color="#c084fc" />
                    <span>Ngày</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                    {formatVietnameseDate(selectedDate)}
                  </span>
                </div>

                {/* Time Range */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#c084fc' }}>
                    <Clock size={14} />
                    <span>Khung giờ</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f3e8ff' }}>
                    {startTimeStr} - {endTimeStr}
                  </span>
                </div>

                {/* Duration */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Thời lượng</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                    {durationHours} giờ
                  </span>
                </div>
              </div>

              {/* Spatial Conflict Error Banner */}
              {errorMessage && (
                <div
                  style={{
                    marginBottom: '14px',
                    padding: '10px 12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '11px',
                    lineHeight: '1.4',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '2px' }}>
                    <AlertTriangle size={13} />
                    <span>{errorMessage.includes('đã được đặt') ? 'KHUNG GIỜ NÀY ĐÃ ĐƯỢC ĐẶT' : 'KHÔNG THỂ ĐẶT XE'}</span>
                  </div>
                  <div>Vui lòng chọn thời gian khác hoặc kiểm tra lại khung giờ.</div>
                </div>
              )}

              {/* Success Notification Banner */}
              {successMessage && (
                <div
                  style={{
                    marginBottom: '14px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.55)',
                    borderRadius: '8px',
                    color: '#34d399',
                    fontSize: '11px',
                    lineHeight: '1.4',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '2px' }}>
                    <CheckCircle size={13} />
                    <span>{successMessage}</span>
                  </div>
                  <div>Lịch đặt đã được đồng bộ vào hệ thống.</div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onConfirm}
                  style={{
                    flex: 1.6,
                    padding: '10px 12px',
                    background: isSubmitting
                      ? 'rgba(168, 85, 247, 0.3)'
                      : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                    border: '1px solid #c084fc',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.55)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.35)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="spin-animate" />
                      <span>ĐANG XÁC NHẬN...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={13} />
                      <span>XÁC NHẬN ĐẶT XE</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onCancel}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    fontFamily: 'inherit',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                >
                  HỦY LỰA CHỌN
                </button>
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    </>
  );
};
