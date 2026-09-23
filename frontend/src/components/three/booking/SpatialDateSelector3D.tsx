import React from 'react';
import { Billboard, Html } from '@react-three/drei';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface SpatialDateSelector3DProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  position?: [number, number, number];
}

export const SpatialDateSelector3D: React.FC<SpatialDateSelector3DProps> = ({
  selectedDate,
  onSelectDate,
  position = [3.2, 2.15, 2.4],
}) => {
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handlePrevDay = () => {
    // Do not allow navigating before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    prev.setHours(0, 0, 0, 0);

    if (prev >= today) {
      onSelectDate(prev);
    }
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onSelectDate(next);
  };

  const formatVietnameseDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (diffDays === 0) return `Hôm nay, ${day}/${month}/${year}`;
    if (diffDays === 1) return `Ngày mai, ${day}/${month}/${year}`;

    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = dayNames[date.getDay()];
    return `${dayName}, ${day}/${month}/${year}`;
  };

  const canGoPrev = !isToday(selectedDate);

  return (
    <group position={position}>
      <Billboard follow={true}>
        <Html center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 242, 254, 0.45)',
              borderRadius: '9999px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 242, 254, 0.25)',
              color: '#ffffff',
              fontFamily: 'var(--font-family)',
              whiteSpace: 'nowrap',
            }}
          >
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={handlePrevDay}
              title="Ngày trước"
              style={{
                background: canGoPrev ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid ' + (canGoPrev ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.1)'),
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: canGoPrev ? '#00f2fe' : '#64748b',
                cursor: canGoPrev ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              <ChevronLeft size={15} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px' }}>
              <CalendarIcon size={14} color="#00f2fe" />
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em', color: '#e2e8f0' }}>
                {formatVietnameseDate(selectedDate)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              title="Ngày sau"
              style={{
                background: 'rgba(0, 242, 254, 0.15)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f2fe',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </Html>
      </Billboard>
    </group>
  );
};
