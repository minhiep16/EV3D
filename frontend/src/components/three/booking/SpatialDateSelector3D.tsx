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
  position = [0.0, 3.35, 2.4],
}) => {
  const isToday = (date: Date | string | null | undefined) => {
    try {
      const today = new Date();
      const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date(date || Date.now());
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  };

  const handlePrevDay = () => {
    // Do not allow navigating before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const baseDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date(selectedDate || Date.now());
    const prev = new Date(baseDate);
    prev.setDate(prev.getDate() - 1);
    prev.setHours(0, 0, 0, 0);

    if (prev >= today) {
      onSelectDate(prev);
    }
  };

  const handleNextDay = () => {
    const baseDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date(selectedDate || Date.now());
    const next = new Date(baseDate);
    next.setDate(next.getDate() + 1);
    onSelectDate(next);
  };

  const formatVietnameseDate = (date: Date | string | null | undefined) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date(date || Date.now());
      const checkDate = new Date(d);
      checkDate.setHours(0, 0, 0, 0);

      const diffDays = Math.round((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      if (diffDays === 0) return `Hôm nay, ${day}/${month}/${year}`;
      if (diffDays === 1) return `Ngày mai, ${day}/${month}/${year}`;

      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = dayNames[d.getDay()];
      return `${dayName}, ${day}/${month}/${year}`;
    } catch {
      return '--/--/----';
    }
  };

  const canGoPrev = !isToday(selectedDate);

  return (
    <group position={position}>
      <Billboard follow={true}>
        <Html center distanceFactor={8.0} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(8, 14, 26, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(0, 242, 254, 0.55)',
              borderRadius: '9999px',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 242, 254, 0.3)',
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
                background: canGoPrev ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid ' + (canGoPrev ? 'rgba(0, 242, 254, 0.5)' : 'rgba(255, 255, 255, 0.1)'),
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: canGoPrev ? '#00f2fe' : '#64748b',
                cursor: canGoPrev ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              <ChevronLeft size={17} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 6px' }}>
              <CalendarIcon size={16} color="#00f2fe" />
              <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.02em', color: '#f8fafc' }}>
                {formatVietnameseDate(selectedDate)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              title="Ngày sau"
              style={{
                background: 'rgba(0, 242, 254, 0.2)',
                border: '1px solid rgba(0, 242, 254, 0.5)',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f2fe',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </Html>
      </Billboard>
    </group>
  );
};
