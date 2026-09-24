import React, { useState, useEffect, useMemo } from 'react';
import { Billboard, Html } from '@react-three/drei';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import { TripData } from '../../../types/trip';
import { VehicleResponse } from '../../../types/vehicle';
import { useWorldStore } from '../../../store/worldStore';
import {
  Car,
  Clock,
  Battery,
  Gauge,
  User,
  ArrowLeft,
  Activity,
  Navigation,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';

interface TripTelemetryPanel3DProps {
  vehicle: VehicleResponse;
  trip: TripData;
  onBack: () => void;
  panelPosition?: [number, number, number];
}

export const TripTelemetryPanel3D: React.FC<TripTelemetryPanel3DProps> = ({
  vehicle,
  trip,
  onBack,
  panelPosition = [2.7, 1.45, 0],
}) => {
  const selectedTripRouteNode = useWorldStore((state) => state.selectedTripRouteNode);
  const selectTripRouteNode = useWorldStore((state) => state.selectTripRouteNode);

  // Client-side elapsed time calculation (Requirement 11: Zero DB polling/writes)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!trip.startedAt) return 0;
    try {
      const started = new Date(trip.startedAt).getTime();
      return Math.max(0, Math.floor((Date.now() - started) / 1000));
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (!trip.startedAt) return;
    const interval = setInterval(() => {
      try {
        const started = new Date(trip.startedAt).getTime();
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
      } catch {
        // Fallback
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [trip.startedAt]);

  const formattedElapsedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  const startedAtFormatted = useMemo(() => {
    if (!trip.startedAt) return '--:--:--';
    try {
      const d = new Date(trip.startedAt);
      return (
        d.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) +
        ' (' +
        d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) +
        ')'
      );
    } catch {
      return trip.startedAt;
    }
  }, [trip.startedAt]);

  const bookingTimeRange = useMemo(() => {
    if (!trip.bookingStartTime || !trip.bookingEndTime) return '--:-- - --:--';
    try {
      const s = new Date(trip.bookingStartTime).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const e = new Date(trip.bookingEndTime).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${s} - ${e}`;
    } catch {
      return '--:-- - --:--';
    }
  }, [trip.bookingStartTime, trip.bookingEndTime]);

  return (
    <group position={panelPosition}>
      <Billboard follow={true}>
        {/* Holographic Glowing Frame */}
        <HolographicPanelFrame3D width={2.75} height={4.3} color="#00f2fe" />

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
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '320px',
              background: 'rgba(5, 14, 26, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid #00f2fe',
              borderRadius: '16px',
              padding: '18px 20px',
              color: '#ffffff',
              boxShadow:
                '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 242, 254, 0.25)',
              boxSizing: 'border-box',
            }}
          >
            {/* Top Subtitle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '9.5px',
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              <Activity size={12} color="#00f2fe" />
              <span>TRỰC QUAN HÓA CHUYẾN ĐI 3D</span>
            </div>

            {/* Header: Title & Vehicle Code */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                CHUYẾN ĐI ĐANG DIỄN RA
              </h3>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#00f2fe',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  letterSpacing: '0.05em',
                }}
              >
                EV01
              </span>
            </div>

            {/* User & Start Time Section */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Người sử dụng:</span>
                <span
                  style={{
                    color: '#ffffff',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <User size={12} color="#38bdf8" />
                  {trip.userName || 'Thành viên nhóm'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Bắt đầu lúc:</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                  {startedAtFormatted}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Khung giờ đặt:</span>
                <span style={{ color: '#00f2fe', fontWeight: 700 }}>
                  {bookingTimeRange}
                </span>
              </div>
            </div>

            {/* Elapsed Time Ticker (Requirement 10 & 11) */}
            <div
              style={{
                background: 'rgba(2, 132, 199, 0.18)',
                border: '1px solid rgba(0, 242, 254, 0.45)',
                boxShadow: '0 0 16px rgba(0, 242, 254, 0.15)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <Clock size={12} color="#00f2fe" />
                <span>THỜI GIAN ĐÃ ĐI</span>
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#00f2fe',
                  letterSpacing: '0.08em',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: '0 0 12px rgba(0, 242, 254, 0.6)',
                }}
              >
                {formattedElapsedTime}
              </div>
              <div style={{ fontSize: '9.5px', color: '#67e8f9', marginTop: '2px' }}>
                Tính toán thời gian thực tại trình duyệt
              </div>
            </div>

            {/* Initial Snapshot Telemetry (Requirement 10 & 12) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {/* Start Battery */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                }}
              >
                <div
                  style={{
                    fontSize: '9.5px',
                    color: '#94a3b8',
                    marginBottom: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Battery size={11} color="#34d399" />
                  <span>PIN BẮT ĐẦU</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                  {trip.startBatteryLevel}%
                </div>
              </div>

              {/* Start Odometer */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                }}
              >
                <div
                  style={{
                    fontSize: '9.5px',
                    color: '#94a3b8',
                    marginBottom: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Gauge size={11} color="#38bdf8" />
                  <span>ODO BẮT ĐẦU</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  {Number(trip.startOdometer).toLocaleString()} km
                </div>
              </div>
            </div>

            {/* Vehicle Status Badge */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '8px 12px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                TRẠNG THÁI XE
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#00f2fe',
                  background: 'rgba(0, 242, 254, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#00f2fe',
                    boxShadow: '0 0 6px #00f2fe',
                  }}
                />
                ĐANG SỬ DỤNG
              </span>
            </div>

            {/* Route Progress Status Node Info */}
            <div
              style={{
                background: 'rgba(8, 20, 36, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                padding: '8px 12px',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  fontSize: '9.5px',
                  color: '#38bdf8',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                <Navigation size={11} color="#38bdf8" />
                <span>ĐIỂM KIỂM SOÁT LỘ TRÌNH</span>
              </div>
              <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600 }}>
                {selectedTripRouteNode === 'START'
                  ? 'Điểm bắt đầu — Trạm đỗ EVShare'
                  : selectedTripRouteNode === 'DESTINATION'
                  ? 'Điểm dự kiến — Điểm đến hành trình'
                  : 'Tiến trình hiện tại — Đang di chuyển'}
              </div>
            </div>

            {/* Mode Exit Button: [ QUAY LẠI XE ] (Requirement 23) */}
            <button
              type="button"
              onClick={onBack}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '11px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.borderColor = '#00f2fe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <ArrowLeft size={14} />
              <span>QUAY LẠI XE</span>
            </button>
          </div>
        </Html>
      </Billboard>
    </group>
  );
};
