import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Booking } from '../../../types/booking';

export type SlotState = 'AVAILABLE' | 'SELECTED' | 'BOOKED' | 'PAST';

export interface BookingTimelineSlot {
  id: string;               // Stable unique ID: e.g. "2026-09-24T15:00"
  hour: number;             // 15
  timeLabel: string;        // "15:00"
  startTimeIso: string;
  endTimeIso: string;
  state: SlotState;
  bookedBy?: string;
  rowIndex: number;         // 0 for Row 1, 1 for Row 2
  colIndex: number;
  xOffset: number;
  yOffset: number;
}

interface BookingTimeline3DProps {
  selectedDate: Date;
  bookings: Booking[];
  startHour: number | null;
  endHour: number | null;
  onSelectSlot: (hour: number) => void;
  position?: [number, number, number];
}

const SLOT_WIDTH = 0.52;
const SLOT_HEIGHT = 0.46;
const SLOT_DEPTH = 0.08;
const GAP_X = 0.10;
const ROW_GAP_Y = 0.68;

export const BookingTimeline3D: React.FC<BookingTimeline3DProps> = ({
  selectedDate,
  bookings,
  startHour,
  endHour,
  onSelectSlot,
  position = [3.2, 1.25, 2.4],
}) => {
  // Stable slot ID tracked on hover (matches exact clicked slot ID)
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);

  // Memoized box & edges geometries: shared across all slot meshes for performance & zero memory leaks
  const slotBoxGeometry = useMemo(
    () => new THREE.BoxGeometry(SLOT_WIDTH, SLOT_HEIGHT, SLOT_DEPTH),
    []
  );
  const slotEdgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(slotBoxGeometry),
    [slotBoxGeometry]
  );

  // Stable date string key for slot IDs (e.g. "2026-09-24")
  const dateKey = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // Operational hours: 07:00 to 21:00 (15 hours)
  const HOURS = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 7), []);
  const row1Hours = useMemo(() => HOURS.slice(0, 7), [HOURS]); // 07:00 - 13:00 (7 slots)
  const row2Hours = useMemo(() => HOURS.slice(7), [HOURS]);    // 14:00 - 21:00 (8 slots)

  const row1TotalWidth = 7 * SLOT_WIDTH + 6 * GAP_X; // 4.24
  const row2TotalWidth = 8 * SLOT_WIDTH + 7 * GAP_X; // 4.86

  const row1StartX = -row1TotalWidth / 2 + SLOT_WIDTH / 2;
  const row2StartX = -row2TotalWidth / 2 + SLOT_WIDTH / 2;

  // Build full array of first-class slot objects with stable IDs and precise coordinates
  const slots = useMemo<BookingTimelineSlot[]>(() => {
    const now = new Date();
    const isToday =
      selectedDate.getDate() === now.getDate() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear();

    const evaluateSlot = (
      hour: number,
      rowIndex: number,
      colIndex: number,
      startX: number,
      yOffset: number
    ): BookingTimelineSlot => {
      const hourStr = String(hour).padStart(2, '0');
      const id = `${dateKey}T${hourStr}:00`;
      const timeLabel = `${hourStr}:00`;

      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(selectedDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      let state: SlotState = 'AVAILABLE';
      let bookedBy: string | undefined = undefined;

      if (isToday && hour <= now.getHours()) {
        state = 'PAST';
      } else {
        const conflicting = bookings.find((b) => {
          if (b.status === 'CANCELLED') return false;
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          return bStart < slotEnd && bEnd > slotStart;
        });

        if (conflicting) {
          state = 'BOOKED';
          bookedBy = conflicting.userName || 'Đồng sở hữu';
        } else if (startHour !== null && endHour !== null) {
          if (hour >= startHour && hour < endHour) {
            state = 'SELECTED';
          }
        }
      }

      const xOffset = startX + colIndex * (SLOT_WIDTH + GAP_X);

      return {
        id,
        hour,
        timeLabel,
        startTimeIso: slotStart.toISOString(),
        endTimeIso: slotEnd.toISOString(),
        state,
        bookedBy,
        rowIndex,
        colIndex,
        xOffset,
        yOffset,
      };
    };

    const result: BookingTimelineSlot[] = [];

    // Row 1: 07:00 - 13:00 (y = +ROW_GAP_Y / 2)
    row1Hours.forEach((hour, colIndex) => {
      result.push(evaluateSlot(hour, 0, colIndex, row1StartX, ROW_GAP_Y / 2));
    });

    // Row 2: 14:00 - 21:00 (y = -ROW_GAP_Y / 2)
    row2Hours.forEach((hour, colIndex) => {
      result.push(evaluateSlot(hour, 1, colIndex, row2StartX, -ROW_GAP_Y / 2));
    });

    return result;
  }, [dateKey, selectedDate, bookings, startHour, endHour, row1Hours, row2Hours, row1StartX, row2StartX]);

  const handleSlotClick = (slot: BookingTimelineSlot) => {
    if (slot.state === 'PAST' || slot.state === 'BOOKED') {
      return;
    }
    console.log(`[3D TIMELINE] CLICK slot=${slot.timeLabel} id=${slot.id}`);
    onSelectSlot(slot.hour);
  };

  const handleSlotPointerOver = (slot: BookingTimelineSlot) => {
    console.log(`[3D TIMELINE] HOVER slot=${slot.timeLabel} id=${slot.id}`);
    setHoveredSlotId(slot.id);
    if (slot.state === 'AVAILABLE' || slot.state === 'SELECTED') {
      document.body.style.cursor = 'pointer';
    }
  };

  const handleSlotPointerOut = (slot: BookingTimelineSlot) => {
    setHoveredSlotId((current) => (current === slot.id ? null : current));
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={position}>
      {slots.map((slot) => {
        const isHovered = hoveredSlotId === slot.id;

        // Visual styles based on state
        let baseColor = '#064e3b';
        let emissiveColor = '#059669';
        let emissiveIntensity = 0.35;
        let badgeText = 'Có thể đặt';
        let badgeColor = '#34d399';
        let badgeBg = 'rgba(16, 185, 129, 0.2)';
        let zOffset = 0;

        if (slot.state === 'SELECTED') {
          baseColor = '#581c87';
          emissiveColor = '#c084fc';
          emissiveIntensity = 0.95;
          badgeText = 'Đang chọn';
          badgeColor = '#e9d5ff';
          badgeBg = 'rgba(168, 85, 247, 0.4)';
          zOffset = 0.06;
        } else if (slot.state === 'BOOKED') {
          baseColor = '#7f1d1d';
          emissiveColor = '#ef4444';
          emissiveIntensity = 0.45;
          badgeText = 'Đã có lịch';
          badgeColor = '#fca5a5';
          badgeBg = 'rgba(239, 68, 68, 0.25)';
        } else if (slot.state === 'PAST') {
          baseColor = '#0f172a';
          emissiveColor = '#334155';
          emissiveIntensity = 0.15;
          badgeText = 'Đã qua';
          badgeColor = '#64748b';
          badgeBg = 'rgba(100, 116, 139, 0.15)';
        }

        if (isHovered && slot.state === 'AVAILABLE') {
          emissiveIntensity = 0.7;
          zOffset = 0.04;
        }

        return (
          <group
            key={slot.id}
            position={[slot.xOffset, slot.yOffset, zOffset]}
          >
            {/* 1. Raycastable Physical 3D Slot Tile: handlers attached DIRECTLY to mesh */}
            <mesh
              castShadow
              receiveShadow
              geometry={slotBoxGeometry}
              userData={{ bookingSlotId: slot.id, hour: slot.hour, timeLabel: slot.timeLabel }}
              onClick={(e) => {
                e.stopPropagation();
                handleSlotClick(slot);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                handleSlotPointerOver(slot);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                handleSlotPointerOut(slot);
              }}
            >
              <meshStandardMaterial
                color={baseColor}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
                roughness={0.25}
                metalness={0.7}
              />
            </mesh>

            {/* 2. Outer glowing edge line wireframe: raycast DISABLED to prevent Line threshold interference */}
            <lineSegments geometry={slotEdgesGeometry} raycast={() => null}>
              <lineBasicMaterial color={emissiveColor} transparent opacity={0.8} />
            </lineSegments>

            {/* 3. 3D Face Typography: pointerEvents="none" strictly ensures no DOM click interception */}
            <Html
              position={[0, 0, 0.05]}
              center
              distanceFactor={8.8}
              pointerEvents="none"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div
                style={{
                  width: '54px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-family)',
                  color: '#ffffff',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: slot.state === 'SELECTED' ? '#f3e8ff' : '#ffffff',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
                    lineHeight: 1.1,
                    pointerEvents: 'none',
                  }}
                >
                  {slot.timeLabel}
                </div>

                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '8px',
                    fontWeight: 700,
                    color: badgeColor,
                    background: badgeBg,
                    borderRadius: '4px',
                    padding: '1px 3px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    pointerEvents: 'none',
                  }}
                >
                  {slot.state === 'BOOKED' && slot.bookedBy ? slot.bookedBy : badgeText}
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
