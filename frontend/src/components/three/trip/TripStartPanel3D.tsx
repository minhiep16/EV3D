import React from 'react';
import { Billboard, Html } from '@react-three/drei';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import { TripData, TripStartEligibilityData } from '../../../types/trip';
import { VehicleHandoverData } from '../../../types/handover';
import { VehicleResponse } from '../../../types/vehicle';
import {
  Car,
  Clock,
  ShieldCheck,
  Battery,
  Gauge,
  Play,
  RotateCcw,
  Loader2,
  AlertTriangle,
  User,
  CheckCircle2,
} from 'lucide-react';

interface TripStartPanel3DProps {
  vehicle: VehicleResponse;
  handover: VehicleHandoverData | null;
  activeTrip: TripData | null;
  eligibility: TripStartEligibilityData | null;
  isStarting: boolean;
  onStartTrip: () => Promise<void>;
  onBack: () => void;
  panelPosition?: [number, number, number];
}

export const TripStartPanel3D: React.FC<TripStartPanel3DProps> = ({
  vehicle,
  handover,
  activeTrip,
  eligibility,
  isStarting,
  onStartTrip,
  onBack,
  panelPosition = [2.7, 1.45, 0],
}) => {
  // Format dates and time ranges
  const timeRangeStr = React.useMemo(() => {
    if (!handover?.bookingStartTime || !handover?.bookingEndTime) return '--:-- - --:--';
    try {
      const start = new Date(handover.bookingStartTime);
      const end = new Date(handover.bookingEndTime);
      const startTimeStr = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const endTimeStr = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${startTimeStr} - ${endTimeStr}`;
    } catch {
      return '--:-- - --:--';
    }
  }, [handover]);

  const bookingDateStr = React.useMemo(() => {
    if (!handover?.bookingStartTime) return 'Hôm nay';
    try {
      const start = new Date(handover.bookingStartTime);
      return start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Hôm nay';
    }
  }, [handover]);

  const startedAtStr = React.useMemo(() => {
    if (!activeTrip?.startedAt) return '';
    try {
      const d = new Date(activeTrip.startedAt);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' (' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ')';
    } catch {
      return activeTrip.startedAt;
    }
  }, [activeTrip]);

  const isTripActive = !!activeTrip && activeTrip.status === 'ACTIVE';

  return (
    <group position={panelPosition}>
      <Billboard follow={true}>
        {/* Holographic Frame with glowing cyan / emerald accent */}
        <HolographicPanelFrame3D
          width={2.7}
          height={3.8}
          color={isTripActive ? '#10b981' : '#00f2fe'}
        />

        <Html
          center
          distanceFactor={8.8}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          }}
        >
          <div
            style={{
              width: '340px',
              padding: '18px 20px',
              background: 'rgba(9, 14, 26, 0.94)',
              backdropFilter: 'blur(20px)',
              border: isTripActive
                ? '1px solid rgba(16, 185, 129, 0.55)'
                : '1px solid rgba(0, 242, 254, 0.55)',
              borderRadius: '18px',
              color: '#ffffff',
              boxShadow: isTripActive
                ? '0 16px 40px rgba(16, 185, 129, 0.25), inset 0 0 24px rgba(16, 185, 129, 0.12)'
                : '0 16px 40px rgba(0, 242, 254, 0.25), inset 0 0 24px rgba(0, 242, 254, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Header: Title & Badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: isTripActive ? '#34d399' : '#38bdf8',
                    textTransform: 'uppercase',
                    marginBottom: '2px',
                  }}
                >
                  {isTripActive ? 'CHUYẾN ĐI ĐANG DIỄN RA' : 'BẮT ĐẦU CHUYẾN ĐI'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  {vehicle.name || 'EV01'}
                </div>
              </div>

              <div
                style={{
                  background: isTripActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  border: isTripActive ? '1px solid #10b981' : '1px solid #38bdf8',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isTripActive ? '#34d399' : '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isTripActive ? (
                  <>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                    <span>ĐANG SỬ DỤNG</span>
                  </>
                ) : (
                  <>
                    <Car size={13} />
                    <span>SẴN SÀNG</span>
                  </>
                )}
              </div>
            </div>

            {/* Information Card */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} color="#38bdf8" />
                  Người sử dụng:
                </span>
                <span style={{ fontWeight: 700, color: '#f1f5f9' }}>
                  {handover?.coOwnerName || activeTrip?.userName || 'Đồng sở hữu'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} color="#38bdf8" />
                  Lịch đặt:
                </span>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{bookingDateStr}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{timeRangeStr}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={13} color="#10b981" />
                  Bàn giao xe:
                </span>
                <span style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} />
                  Đã hoàn tất
                </span>
              </div>
            </div>

            {/* Vehicle Telemetry Snapshot */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: '#94a3b8' }}>
                  <Battery size={13} color="#38bdf8" />
                  <span>{isTripActive ? 'Pin lúc bắt đầu' : 'Mức pin hiện tại'}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>
                  {isTripActive
                    ? `${activeTrip.startBatteryLevel}%`
                    : `${eligibility?.currentBatteryLevel ?? vehicle.currentBatteryLevel}%`}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: '#94a3b8' }}>
                  <Gauge size={13} color="#a855f7" />
                  <span>{isTripActive ? 'Odo lúc bắt đầu' : 'Odometer'}</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#c084fc' }}>
                  {isTripActive
                    ? `${Number(activeTrip.startOdometer).toLocaleString()} km`
                    : `${Number(eligibility?.currentOdometer ?? vehicle.odometer).toLocaleString()} km`}
                </div>
              </div>
            </div>

            {/* If Trip is ACTIVE: Success Summary Card */}
            {isTripActive && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '12px', fontWeight: 800 }}>
                  <CheckCircle2 size={15} />
                  <span>CHUYẾN ĐI ĐÃ BẮT ĐẦU THÀNH CÔNG</span>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                  Bắt đầu lúc: <strong style={{ color: '#ffffff' }}>{startedAtStr}</strong>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Phương tiện đã chuyển sang trạng thái <strong>ĐANG SỬ DỤNG</strong>. Chúc bạn có một hành trình an toàn!
                </div>
              </div>
            )}

            {/* If Not Active: Eligibility Warning (if any) */}
            {!isTripActive && eligibility && !eligibility.eligible && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#f87171',
                  fontSize: '11.5px',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={16} />
                <span>{eligibility.message || 'Chưa đủ điều kiện bắt đầu chuyến đi.'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {!isTripActive && (
                <button
                  type="button"
                  disabled={isStarting || (eligibility ? !eligibility.eligible : false)}
                  onClick={onStartTrip}
                  style={{
                    width: '100%',
                    background:
                      eligibility && !eligibility.eligible
                        ? 'rgba(75, 85, 99, 0.4)'
                        : 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    cursor:
                      isStarting || (eligibility && !eligibility.eligible)
                        ? 'not-allowed'
                        : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow:
                      eligibility && !eligibility.eligible
                        ? 'none'
                        : '0 4px 18px rgba(6, 182, 212, 0.35)',
                    opacity: isStarting || (eligibility && !eligibility.eligible) ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isStarting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>ĐANG XỬ LÝ BẮT ĐẦU CHUYẾN ĐI...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" />
                      <span>BẮT ĐẦU CHUYẾN ĐI</span>
                    </>
                  )}
                </button>
              )}

              {/* Secondary CTA: Quay lại xe */}
              <button
                type="button"
                onClick={onBack}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '9px',
                  color: '#94a3b8',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={13} />
                <span>QUAY LẠI XE</span>
              </button>
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
};
