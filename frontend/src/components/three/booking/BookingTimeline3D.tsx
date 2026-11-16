import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Booking } from '../../../types/booking';
import { INTERACTION_CONFIG } from '../../../config/interactionConfig';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';

export type SlotState = 'AVAILABLE' | 'SELECTED' | 'BOOKED' | 'PAST' | 'RESTRICTED';

export interface BookingTimelineSlot {
  id: string;               // Stable unique ID: e.g. "2026-09-24T15:00"
  hour: number;             // 15
  timeLabel: string;        // "15:00"
  startTimeIso: string;
  endTimeIso: string;
  state: SlotState;
  bookedBy?: string;
  isMyBooking?: boolean;
  booking?: Booking;
  rowIndex: number;         // 0 for Row 1, 1 for Row 2
  colIndex: number;
  xOffset: number;
  yOffset: number;
}

// Authoritative right booking panel dimensions and safe area in screen space
export const BOOKING_PANEL_WIDTH_PX = 495;
export const BOOKING_PANEL_RIGHT_GAP_PX = 20;
export const BOOKING_PANEL_SAFE_GAP_PX = 0;

export const RESERVED_RIGHT_PANEL_WIDTH_PX = 515; // 495px panel + 20px right margin

export const BOOKING_LEFT_MARGIN_PX = 24; // px left boundary margin
export const BOOKING_PANEL_CLEARANCE_PX = 28; // px visual clearance from panel boundary

// Backwards-compatible aliases
export const BOOKING_PANEL_WIDTH = BOOKING_PANEL_WIDTH_PX;
export const BOOKING_PANEL_GAP = BOOKING_PANEL_RIGHT_GAP_PX + BOOKING_PANEL_SAFE_GAP_PX;
export const RESERVED_RIGHT_PANEL_WIDTH = RESERVED_RIGHT_PANEL_WIDTH_PX;

/**
 * Authoritative 3D projection & safe-area layout resolver:
 * Converts usable screen viewport (excluding the fixed right-side booking panel)
 * into precise world-space boundaries and safe composition center.
 */
export function computeBookingLayoutMetrics(
  viewportWidth: number,
  viewportHeight: number,
  camera: THREE.Camera,
  planeZ: number = 2.4,
  overrides?: {
    propSafeCenterX?: number;
    propUsableSafeWidth?: number;
    propRightSafeX?: number;
  }
) {
  const camZ = camera.position.z;
  const distance = Math.max(1, camZ - planeZ);
  const fovRad = (((camera as THREE.PerspectiveCamera).fov || 40) * Math.PI) / 180;
  const visibleHeight3D = 2 * Math.tan(fovRad / 2) * distance;
  const aspect = viewportWidth / Math.max(1, viewportHeight);
  const visibleWidth3D = visibleHeight3D * aspect;

  const pixelToWorld = visibleWidth3D / Math.max(1, viewportWidth);

  // Screen space boundaries:
  // Usable screen area: [BOOKING_LEFT_MARGIN_PX, viewportWidth - RESERVED_RIGHT_PANEL_WIDTH_PX]
  const screenLeftPx = BOOKING_LEFT_MARGIN_PX;
  const screenRightPx = Math.max(screenLeftPx + 100, viewportWidth - RESERVED_RIGHT_PANEL_WIDTH_PX);
  const usableWidthPx = screenRightPx - screenLeftPx;
  const safeCenterScreenPx = screenLeftPx + usableWidthPx / 2;

  // Convert to world coordinates at timeline depth planeZ
  const camX = camera.position.x;
  const leftFrustumX = camX - visibleWidth3D / 2;

  const computedRightSafeX = leftFrustumX + (screenRightPx / viewportWidth) * visibleWidth3D;
  const computedLeftSafeX = leftFrustumX + (screenLeftPx / viewportWidth) * visibleWidth3D;
  const computedSafeCenterX = leftFrustumX + (safeCenterScreenPx / viewportWidth) * visibleWidth3D;
  const computedUsableWidth = computedRightSafeX - computedLeftSafeX;

  const rightSafeX = overrides?.propRightSafeX ?? computedRightSafeX;
  const leftSafeX = computedLeftSafeX;
  const usableSafeWidth = overrides?.propUsableSafeWidth ?? computedUsableWidth;
  const safeCenterX = overrides?.propSafeCenterX ?? computedSafeCenterX;

  const clearance3D = BOOKING_PANEL_CLEARANCE_PX * pixelToWorld;

  return {
    planeZ,
    visibleWidth3D,
    visibleHeight3D,
    pixelToWorld,
    screenLeftPx,
    screenRightPx,
    usableWidthPx,
    leftSafeX,
    rightSafeX,
    safeCenterX,
    usableSafeWidth,
    clearance3D,
  };
}

interface BookingTimeline3DProps {
  selectedDate: Date;
  bookings: Booking[];
  startHour: number | null;
  endHour: number | null;
  onSelectSlot: (hour: number) => void;
  position?: [number, number, number];
  safeCenterX?: number;
  usableSafeWidth?: number;
  rightSafeX?: number;
  vehicleStatus?: string;
}

const BASE_SLOT_WIDTH = 0.44;
const BASE_SLOT_HEIGHT = 0.38;
const SLOT_DEPTH = 0.08;
const BASE_GAP_X = 0.08;
const ROW_GAP_Y = 0.44;

export const BookingTimeline3D: React.FC<BookingTimeline3DProps> = ({
  selectedDate,
  bookings,
  startHour,
  endHour,
  onSelectSlot,
  position = [0.0, 2.45, 2.4],
  safeCenterX: propSafeCenterX,
  usableSafeWidth: propUsableSafeWidth,
  rightSafeX: propRightSafeX,
  vehicleStatus,
}) => {
  const { size, camera } = useThree();
  const user = useAuthStore((s) => s.user);
  const inspectedBooking = useWorldStore((s) => s.bookingInspectedBooking);
  const setBookingInspectedBooking = useWorldStore((s) => s.setBookingInspectedBooking);

  // Stable slot ID tracked on hover (matches exact clicked slot ID)
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);

  // Full-day 24/7 operating hours: 00:00 to 23:00 (24 slots organized in 4 compact rows of 6)
  const HOURS = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const row0Hours = useMemo(() => HOURS.slice(0, 6), [HOURS]);   // 00:00 - 05:00 (6 slots)
  const row1Hours = useMemo(() => HOURS.slice(6, 12), [HOURS]);  // 06:00 - 11:00 (6 slots)
  const row2Hours = useMemo(() => HOURS.slice(12, 18), [HOURS]); // 12:00 - 17:00 (6 slots)
  const row3Hours = useMemo(() => HOURS.slice(18, 24), [HOURS]); // 18:00 - 23:00 (6 slots)
  const maxSlotsInRow = 6;

  // Calculate 3D viewport safe boundaries at timeline plane depth (world Z = 2.4)
  const layoutMetrics = useMemo(() => {
    const worldPlaneZ = (position[2] !== undefined && position[2] < 1.5) ? position[2] + 1.8 : (position[2] ?? 2.4);
    return computeBookingLayoutMetrics(size.width, size.height, camera, worldPlaneZ, {
      propSafeCenterX,
      propUsableSafeWidth,
      propRightSafeX,
    });
  }, [position, camera, size.width, size.height, propSafeCenterX, propUsableSafeWidth, propRightSafeX]);

  // Compute dynamic slot sizing & layout that strictly guarantees all slots fit inside usable safe width
  const {
    slotWidth,
    slotHeight,
    gapX,
    rowTotalWidth,
    rowStartX,
    effectiveCenterX,
  } = useMemo(() => {
    const maxTimelineWidth = Math.min(layoutMetrics.usableSafeWidth - layoutMetrics.clearance3D * 2, 4.60);
    const baseTotal = maxSlotsInRow * BASE_SLOT_WIDTH + (maxSlotsInRow - 1) * BASE_GAP_X; // ~3.04

    let w = BASE_SLOT_WIDTH;
    let g = BASE_GAP_X;

    if (baseTotal > maxTimelineWidth) {
      const shrinkRatio = Math.max(0.68, maxTimelineWidth / baseTotal);
      w = Math.max(0.32, BASE_SLOT_WIDTH * shrinkRatio);
      g = Math.max(0.04, BASE_GAP_X * shrinkRatio);
    } else {
      const expandRatio = Math.min(1.08, maxTimelineWidth / baseTotal);
      w = BASE_SLOT_WIDTH * expandRatio;
      g = BASE_GAP_X * expandRatio;
    }

    const h = (w / BASE_SLOT_WIDTH) * BASE_SLOT_HEIGHT;

    const rWidth = maxSlotsInRow * w + (maxSlotsInRow - 1) * g;
    const rStartX = -rWidth / 2 + w / 2;

    // Panel-safe center: centers the timeline within the usable screen area
    const rawSafeCenter = layoutMetrics.safeCenterX;

    // Strictly enforce that timeline right edge does NOT cross (rightSafeX - clearance3D)
    const maxAllowedCenter = layoutMetrics.rightSafeX - rWidth / 2 - layoutMetrics.clearance3D;
    const minAllowedCenter = layoutMetrics.leftSafeX + rWidth / 2 + layoutMetrics.clearance3D;

    const clampedCenter = Math.max(minAllowedCenter, Math.min(rawSafeCenter, maxAllowedCenter));

    return {
      slotWidth: w,
      slotHeight: h,
      gapX: g,
      rowTotalWidth: rWidth,
      rowStartX: rStartX,
      effectiveCenterX: clampedCenter,
    };
  }, [layoutMetrics, maxSlotsInRow]);

  // Memoized box & edges geometries: shared across all slot meshes for performance & zero memory leaks
  const slotBoxGeometry = useMemo(
    () => new THREE.BoxGeometry(slotWidth, slotHeight, SLOT_DEPTH),
    [slotWidth, slotHeight]
  );
  const slotEdgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(slotBoxGeometry),
    [slotBoxGeometry]
  );

  // Stable date string key for slot IDs (e.g. "2026-09-24")
  const dateKey = useMemo(() => {
    try {
      const d = selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date(selectedDate || Date.now());
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return '2026-10-05';
    }
  }, [selectedDate]);

  // Build full array of first-class slot objects with stable IDs and precise coordinates
  const slots = useMemo<BookingTimelineSlot[]>(() => {
    const now = new Date();
    const d = selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date(selectedDate || Date.now());
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const selDayStart = new Date(d);
    selDayStart.setHours(0, 0, 0, 0);
    const isPastDay = selDayStart.getTime() < todayStart.getTime();

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
      let matchedBooking: Booking | undefined = undefined;
      let isMyBooking = false;

      if (isPastDay || (isToday && hour <= now.getHours())) {
        state = 'PAST';
      } else {
        const conflicting = bookings.find((b) => {
          if (b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;
          if (b.status === 'COMPLETED') {
            // Early return release: completed bookings only occupy actual completed duration
            const bStart = new Date(b.startTime);
            const bEnd = new Date(b.endTime);
            const effectiveEnd = Math.min(bEnd.getTime(), Date.now());
            return bStart.getTime() < slotEnd.getTime() && effectiveEnd > slotStart.getTime();
          }
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          return bStart < slotEnd && bEnd > slotStart;
        });

        if (conflicting) {
          state = 'BOOKED';
          matchedBooking = conflicting;
          isMyBooking = Boolean(
            (user?.id && conflicting.userId && conflicting.userId === user.id) ||
            (user?.email && conflicting.userEmail && conflicting.userEmail === user.email)
          );
          bookedBy = conflicting.userName || (isMyBooking ? (user?.fullName || 'Bạn') : 'Đồng sở hữu');
        } else if (startHour !== null && endHour !== null) {
          if (hour >= startHour && hour < endHour) {
            state = 'SELECTED';
          }
        } else if (vehicleStatus === 'MAINTENANCE' && isToday) {
          state = 'RESTRICTED';
        }
      }

      const xOffset = startX + colIndex * (slotWidth + gapX);

      return {
        id,
        hour,
        timeLabel,
        startTimeIso: slotStart.toISOString(),
        endTimeIso: slotEnd.toISOString(),
        state,
        bookedBy,
        isMyBooking,
        booking: matchedBooking,
        rowIndex,
        colIndex,
        xOffset,
        yOffset,
      };
    };

    const result: BookingTimelineSlot[] = [];
    const ROWS = [
      { rowIndex: 0, hours: row0Hours },
      { rowIndex: 1, hours: row1Hours },
      { rowIndex: 2, hours: row2Hours },
      { rowIndex: 3, hours: row3Hours },
    ];

    ROWS.forEach(({ rowIndex, hours }) => {
      const yOffset = (1.5 - rowIndex) * ROW_GAP_Y;
      hours.forEach((hour, colIndex) => {
        result.push(evaluateSlot(hour, rowIndex, colIndex, rowStartX, yOffset));
      });
    });

    return result;
  }, [dateKey, selectedDate, bookings, startHour, endHour, row0Hours, row1Hours, row2Hours, row3Hours, rowStartX, slotWidth, gapX, user?.id, user?.email, user?.fullName, vehicleStatus]);

  const handleSlotClick = (slot: BookingTimelineSlot) => {
    if (slot.state === 'PAST') {
      return;
    }
    if (slot.state === 'BOOKED') {
      console.log(`[3D TIMELINE] CLICK BOOKED slot=${slot.timeLabel} id=${slot.id}`);
      if (inspectedBooking && slot.booking && inspectedBooking.id === slot.booking.id) {
        setBookingInspectedBooking(null);
      } else {
        setBookingInspectedBooking(
          slot.booking || {
            id: slot.id,
            startTime: slot.startTimeIso,
            endTime: slot.endTimeIso,
            userName: slot.bookedBy,
            status: 'CONFIRMED',
          }
        );
      }
      return;
    }
    console.log(`[3D TIMELINE] CLICK slot=${slot.timeLabel} id=${slot.id}`);
    setBookingInspectedBooking(null);
    onSelectSlot(slot.hour);
  };

  const handleSlotPointerOver = (slot: BookingTimelineSlot) => {
    console.log(`[3D TIMELINE] HOVER slot=${slot.timeLabel} id=${slot.id}`);
    setHoveredSlotId(slot.id);
    if (slot.state === 'AVAILABLE' || slot.state === 'SELECTED' || slot.state === 'BOOKED') {
      document.body.style.cursor = 'pointer';
    }
  };

  const handleSlotPointerOut = (slot: BookingTimelineSlot) => {
    setHoveredSlotId((current) => (current === slot.id ? null : current));
    document.body.style.cursor = 'auto';
  };

  const timelineGroupPosition: [number, number, number] = [
    position[0] !== undefined ? position[0] : effectiveCenterX,
    position[1] ?? 2.45,
    position[2] ?? 0.6,
  ];

  return (
    <group position={timelineGroupPosition}>
      {slots.map((slot) => {
        const isHovered = hoveredSlotId === slot.id;
        const isInspected = Boolean(
          slot.state === 'BOOKED' &&
          inspectedBooking &&
          slot.booking &&
          inspectedBooking.id === slot.booking.id
        );

        // Visual styles based on state
        let baseColor = '#064e3b';
        let emissiveColor = '#059669';
        let emissiveIntensity = 0.35;
        let badgeText = 'Có thể đặt';
        let badgeColor = '#34d399';
        let badgeBg = 'rgba(16, 185, 129, 0.2)';
        let zOffset = 0;

        if (slot.state === 'SELECTED') {
          baseColor = '#0284c7';
          emissiveColor = '#38bdf8';
          emissiveIntensity = 0.95;
          badgeText = 'Đang chọn';
          badgeColor = '#e0f2fe';
          badgeBg = 'rgba(56, 189, 248, 0.4)';
          zOffset = 0.06;
        } else if (slot.state === 'BOOKED') {
          if (slot.isMyBooking) {
            // Purple: Current user's booking
            baseColor = isInspected ? '#4c1d95' : '#581c87';
            emissiveColor = isInspected ? '#d8b4fe' : '#c084fc';
            emissiveIntensity = isInspected ? 1.0 : 0.65;
            badgeText = slot.bookedBy ? (slot.bookedBy.length > 9 ? slot.bookedBy.slice(0, 8) + '…' : slot.bookedBy) : 'Của tôi';
            badgeColor = '#f3e8ff';
            badgeBg = 'rgba(168, 85, 247, 0.45)';
            zOffset = isInspected ? 0.08 : 0.04;
          } else {
            // Muted red: Another member's booking
            baseColor = isInspected ? '#7f1d1d' : '#5c1d1d';
            emissiveColor = isInspected ? '#f87171' : '#ef4444';
            emissiveIntensity = isInspected ? 0.95 : 0.45;
            badgeText = slot.bookedBy ? (slot.bookedBy.length > 9 ? slot.bookedBy.slice(0, 8) + '…' : slot.bookedBy) : 'Đồng sở hữu';
            badgeColor = '#fca5a5';
            badgeBg = 'rgba(239, 68, 68, 0.25)';
            zOffset = isInspected ? 0.08 : 0.02;
          }
        } else if (slot.state === 'RESTRICTED') {
          // Amber: Temporarily unavailable or restricted
          baseColor = '#78350f';
          emissiveColor = '#f59e0b';
          emissiveIntensity = 0.45;
          badgeText = 'Bảo dưỡng';
          badgeColor = '#fde68a';
          badgeBg = 'rgba(245, 158, 11, 0.25)';
        } else if (slot.state === 'PAST') {
          // Gray: Past time slot
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
              onClick={(e: any) => {
                if (e && 'delta' in e && e.delta > INTERACTION_CONFIG.clickDragThresholdPx) return;
                // Strict input safety: ignore clicks if pointer falls within reserved right panel area
                if (e && typeof e.clientX === 'number' && e.clientX >= size.width - RESERVED_RIGHT_PANEL_WIDTH_PX) {
                  return;
                }
                e.stopPropagation();
                handleSlotClick(slot);
              }}
              onPointerOver={(e: any) => {
                // Strict input safety: ignore hover if pointer is within reserved right panel area
                if (e && typeof e.clientX === 'number' && e.clientX >= size.width - RESERVED_RIGHT_PANEL_WIDTH_PX) {
                  return;
                }
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
              distanceFactor={8.0}
              pointerEvents="none"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div
                style={{
                  width: '64px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-family)',
                  color: '#ffffff',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: slot.state === 'SELECTED' ? '#f3e8ff' : '#ffffff',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
                    lineHeight: 1.15,
                    pointerEvents: 'none',
                  }}
                >
                  {slot.timeLabel}
                </div>

                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: badgeColor,
                    background: badgeBg,
                    borderRadius: '4px',
                    padding: '2px 4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    pointerEvents: 'none',
                  }}
                >
                  {badgeText}
                </div>
              </div>
            </Html>

            {/* 4. Accessible Tooltip on Hover (supports long Vietnamese names) */}
            {isHovered && (
              <Html
                position={[0, slotHeight / 2 + 0.36, 0.14]}
                center
                distanceFactor={7.5}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                <div
                  style={{
                    background: 'rgba(7, 20, 38, 0.97)',
                    backdropFilter: 'blur(16px)',
                    border: `1.5px solid ${emissiveColor}`,
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    boxShadow: `0 4px 18px rgba(0, 0, 0, 0.8), 0 0 12px ${emissiveColor}45`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#ffffff' }}>
                    {slot.timeLabel} – {String((slot.hour + 1) % 24).padStart(2, '0')}:00{slot.hour === 23 ? ' (+1 ngày)' : ''}
                  </div>
                  {slot.state === 'BOOKED' ? (
                    <>
                      <div style={{ color: slot.isMyBooking ? '#c084fc' : '#fca5a5', fontWeight: 800, fontSize: '10.5px' }}>
                        {slot.isMyBooking ? '👤 Lịch của bạn' : '👥 Lịch thành viên khác'}
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '10px' }}>
                        Người đặt: <strong style={{ color: '#ffffff' }}>{slot.bookedBy || 'Đồng sở hữu'}</strong>
                      </div>
                    </>
                  ) : slot.state === 'PAST' ? (
                    <div style={{ color: '#94a3b8', fontSize: '10px' }}>Khung giờ đã qua</div>
                  ) : slot.state === 'RESTRICTED' ? (
                    <div style={{ color: '#fbbf24', fontSize: '10px' }}>Xe đang bảo dưỡng kỹ thuật</div>
                  ) : slot.state === 'SELECTED' ? (
                    <div style={{ color: '#38bdf8', fontSize: '10px' }}>Khung giờ đang chọn</div>
                  ) : (
                    <div style={{ color: '#34d399', fontSize: '10px' }}>Khung giờ có thể đặt (Nhấp để chọn)</div>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
