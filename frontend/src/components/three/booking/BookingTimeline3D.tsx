import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Booking } from '../../../types/booking';
import { INTERACTION_CONFIG } from '../../../config/interactionConfig';

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

// Authoritative right booking panel dimensions and safe area in screen space
export const BOOKING_PANEL_WIDTH_PX = 350;
export const BOOKING_PANEL_RIGHT_GAP_PX = 20;
export const BOOKING_PANEL_SAFE_GAP_PX = 24;

export const RESERVED_RIGHT_PANEL_WIDTH_PX =
  BOOKING_PANEL_WIDTH_PX + BOOKING_PANEL_RIGHT_GAP_PX + BOOKING_PANEL_SAFE_GAP_PX; // 394px

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
}

const BASE_SLOT_WIDTH = 0.48;
const BASE_SLOT_HEIGHT = 0.46;
const SLOT_DEPTH = 0.08;
const BASE_GAP_X = 0.06;
const ROW_GAP_Y = 0.68;

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
}) => {
  const { size, camera } = useThree();

  // Stable slot ID tracked on hover (matches exact clicked slot ID)
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);

  // Operational hours: 07:00 to 21:00 (15 hours)
  const HOURS = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 7), []);
  const row1Hours = useMemo(() => HOURS.slice(0, 7), [HOURS]); // 07:00 - 13:00 (7 slots)
  const row2Hours = useMemo(() => HOURS.slice(7), [HOURS]);    // 14:00 - 21:00 (8 slots)
  const maxSlotsInRow = Math.max(row1Hours.length, row2Hours.length); // 8 slots

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
    row1TotalWidth,
    row2TotalWidth,
    row1StartX,
    row2StartX,
    effectiveCenterX,
  } = useMemo(() => {
    const maxTimelineWidth = Math.min(layoutMetrics.usableSafeWidth - layoutMetrics.clearance3D * 2, 4.60);
    const baseTotal = maxSlotsInRow * BASE_SLOT_WIDTH + (maxSlotsInRow - 1) * BASE_GAP_X; // ~4.26

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

    const r1Width = row1Hours.length * w + (row1Hours.length - 1) * g;
    const r2Width = row2Hours.length * w + (row2Hours.length - 1) * g;
    const maxRowWidth = Math.max(r1Width, r2Width);

    const r1StartX = -r1Width / 2 + w / 2;
    const r2StartX = -r2Width / 2 + w / 2;

    // Panel-safe center: centers the timeline within the usable screen area
    const rawSafeCenter = layoutMetrics.safeCenterX;

    // Strictly enforce that timeline right edge (effectiveCenterX + maxRowWidth / 2) does NOT cross (rightSafeX - clearance3D)
    const maxAllowedCenter = layoutMetrics.rightSafeX - maxRowWidth / 2 - layoutMetrics.clearance3D;
    const minAllowedCenter = layoutMetrics.leftSafeX + maxRowWidth / 2 + layoutMetrics.clearance3D;

    const clampedCenter = Math.max(minAllowedCenter, Math.min(rawSafeCenter, maxAllowedCenter));

    return {
      slotWidth: w,
      slotHeight: h,
      gapX: g,
      row1TotalWidth: r1Width,
      row2TotalWidth: r2Width,
      row1StartX: r1StartX,
      row2StartX: r2StartX,
      effectiveCenterX: clampedCenter,
    };
  }, [layoutMetrics, row1Hours.length, row2Hours.length, maxSlotsInRow]);

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
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

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

      const xOffset = startX + colIndex * (slotWidth + gapX);

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
  }, [dateKey, selectedDate, bookings, startHour, endHour, row1Hours, row2Hours, row1StartX, row2StartX, slotWidth, gapX]);

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

  const timelineGroupPosition: [number, number, number] = [
    effectiveCenterX,
    position[1] ?? 2.45,
    position[2] ?? 2.4,
  ];

  return (
    <group position={timelineGroupPosition}>
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
