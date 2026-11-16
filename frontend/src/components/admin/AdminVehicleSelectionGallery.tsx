import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { VehicleResponse, VehicleStatus } from '../../types/vehicle';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
  resolveAuthoritativeVehicleColor,
  isMatchingVehicle,
} from '../three/vehicles/vehicleModelConfig';
import { resolveVehicleColorHex } from '../../config/vehicleColors';
import {
  ChevronLeft,
  ChevronRight,
  X,
  BatteryCharging,
  BatteryMedium,
  Battery,
  CreditCard,
} from 'lucide-react';
import { safelyReleasePointerCapture } from '../../utils/carouselInteraction';

interface AdminVehicleSelectionGalleryProps {
  vehicles: VehicleResponse[];
  selectedVehicle: VehicleResponse | null;
}

function getStatusMeta(status?: VehicleStatus) {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'AVAILABLE':
      return { labelVi: 'Sẵn sàng', dotColor: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' };
    case 'CHARGING':
      return { labelVi: 'Đang sạc', dotColor: '#00D9FF', bg: 'rgba(0, 217, 255, 0.16)' };
    case 'MAINTENANCE':
    case 'IN_SERVICE':
      return { labelVi: 'Bảo dưỡng', dotColor: '#F87171', bg: 'rgba(248, 113, 113, 0.16)' };
    case 'RESERVED':
      return { labelVi: 'Bàn giao', dotColor: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' };
    case 'IN_USE':
      return { labelVi: 'Đang dùng', dotColor: '#C084FC', bg: 'rgba(192, 132, 252, 0.16)' };
    default:
      return { labelVi: 'Hoạt động', dotColor: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' };
  }
}

/**
 * High-Fidelity Front-Facing Vehicle Vector Illustration
 * Renders the vehicle facing FORWARD directly towards the camera.
 * Features authentic model geometry, paint color gradient, windshield reflections,
 * headlights, and front license plate.
 */
const FrontFacingVehiclePreview: React.FC<{
  vehicle: VehicleResponse;
  colorHex: string;
  isFocused: boolean;
}> = React.memo(({ vehicle, colorHex, isFocused }) => {
  const code = resolveVehicleCode(vehicle);
  const isEV02 = code === 'EV02' || (vehicle.model || '').toLowerCase().includes('stylized');
  const uid = vehicle.id || code;

  // Front-Facing Concept / Stylized EV (EV02)
  if (isEV02) {
    return (
      <svg
        viewBox="0 0 160 92"
        width="100%"
        height={isFocused ? '76' : '60'}
        fill="none"
        style={{
          filter: isFocused
            ? 'drop-shadow(0 6px 14px rgba(0, 217, 255, 0.38)) drop-shadow(0 2px 4px rgba(0,0,0,0.7))'
            : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
          transition: 'all 0.25s ease',
        }}
      >
        <defs>
          <linearGradient id={`ev02-front-paint-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="35%" stopColor={colorHex} />
            <stop offset="85%" stopColor={colorHex} />
            <stop offset="100%" stopColor="#050B14" />
          </linearGradient>
          <linearGradient id={`ev02-front-glass-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#082F49" stopOpacity="0.92" />
          </linearGradient>
        </defs>

        {/* Ground Contact Shadow */}
        <ellipse cx="80" cy="84" rx={isFocused ? 64 : 54} ry="6" fill="#000000" fillOpacity={isFocused ? 0.65 : 0.45} />

        {/* Front Tires */}
        <rect x="18" y="58" width="16" height="24" rx="4" fill="#0B1320" stroke="#38BDF8" strokeWidth="1" />
        <rect x="126" y="58" width="16" height="24" rx="4" fill="#0B1320" stroke="#38BDF8" strokeWidth="1" />

        {/* Aerodynamic Body Contour */}
        <path
          d="M26 68 C 24 58, 30 50, 36 46 L 48 30 C 52 24, 60 22, 68 22 L 92 22 C 100 22, 108 24, 112 30 L 124 46 C 130 50, 136 58, 134 68 L 128 78 C 124 81, 118 82, 110 82 L 50 82 C 42 82, 36 81, 32 78 Z"
          fill={`url(#ev02-front-paint-${uid})`}
        />

        {/* Curved Glass Canopy */}
        <path
          d="M50 44 L 62 25 C 64 24, 68 23, 72 23 L 88 23 C 92 23, 96 24, 98 25 L 110 44 Z"
          fill={`url(#ev02-front-glass-${uid})`}
        />

        {/* Cyber Neon Horizontal Lightbar */}
        <path d="M34 52 L 126 52" stroke="#00D9FF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="80" cy="52" r="3.5" fill="#FFFFFF" stroke="#00D9FF" strokeWidth="1" />

        {/* Aerodynamic Side Mirror Wings */}
        <path d="M22 46 L 30 46" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <path d="M130 46 L 138 46" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />

        {/* Front Lower Diffuser */}
        <rect x="56" y="72" width="48" height="6" rx="2" fill="#0A1828" stroke="#00D9FF" strokeWidth="0.8" />
      </svg>
    );
  }

  // Front-Facing Realistic Electric SUV (VinFast VF8 Plus)
  return (
    <svg
      viewBox="0 0 160 92"
      width="100%"
      height={isFocused ? '76' : '60'}
      fill="none"
      style={{
        filter: isFocused
          ? 'drop-shadow(0 6px 14px rgba(0, 217, 255, 0.40)) drop-shadow(0 2px 5px rgba(0,0,0,0.75))'
          : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
        transition: 'all 0.25s ease',
      }}
    >
      <defs>
        <linearGradient id={`suv-front-paint-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="30%" stopColor={colorHex} />
          <stop offset="85%" stopColor={colorHex} />
          <stop offset="100%" stopColor="#060C16" />
        </linearGradient>
        <linearGradient id={`suv-front-glass-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#082F49" stopOpacity="0.94" />
        </linearGradient>
        <linearGradient id={`headlight-glow-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#00D9FF" />
        </linearGradient>
      </defs>

      {/* Ground Contact Shadow */}
      <ellipse cx="80" cy="85" rx={isFocused ? 66 : 56} ry="6" fill="#000000" fillOpacity={isFocused ? 0.65 : 0.45} />

      {/* Front Wide Tires */}
      <rect x="15" y="60" width="16" height="24" rx="4" fill="#090E17" stroke="#334155" strokeWidth="0.8" />
      <rect x="129" y="60" width="16" height="24" rx="4" fill="#090E17" stroke="#334155" strokeWidth="0.8" />

      {/* Main Front Body Shell */}
      <path
        d="M23 68 C 21 60, 26 52, 32 48 L 44 32 C 48 26, 56 23, 64 23 L 96 23 C 104 23, 112 26, 116 32 L 128 48 C 134 52, 139 60, 137 68 L 131 79 C 127 83, 120 84, 112 84 L 48 84 C 40 84, 33 83, 29 79 Z"
        fill={`url(#suv-front-paint-${uid})`}
      />

      {/* Front Windshield with Sky Tint */}
      <path
        d="M48 44 L 58 26 C 60 25, 64 24, 68 24 L 92 24 C 96 24, 100 25, 102 26 L 112 44 Z"
        fill={`url(#suv-front-glass-${uid})`}
      />

      {/* Side View Mirrors */}
      <rect x="16" y="44" width="12" height="7" rx="3" fill={colorHex} stroke="#1E293B" strokeWidth="1" />
      <rect x="132" y="44" width="12" height="7" rx="3" fill={colorHex} stroke="#1E293B" strokeWidth="1" />

      {/* Sculpted Hood Creases */}
      <path d="M56 26 L 52 46" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.4" />
      <path d="M104 26 L 108 46" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.4" />

      {/* VinFast V-Wing LED Light Signature */}
      <path
        d="M32 50 L 68 55 L 80 62 L 92 55 L 128 50"
        stroke={`url(#headlight-glow-${uid})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Chrome Center V-Badge */}
      <path d="M76 60 L 80 66 L 84 60" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

      {/* Projector LED Headlights */}
      <polygon points="28,49 42,48 40,54 27,53" fill="#FFFFFF" fillOpacity="0.95" />
      <polygon points="132,49 118,48 120,54 133,53" fill="#FFFFFF" fillOpacity="0.95" />

      {/* Lower Grille & Bumper Splitter */}
      <rect x="46" y="68" width="68" height="11" rx="3" fill="#081422" stroke="#334155" strokeWidth="0.8" />

      {/* Front License Plate */}
      <rect x="62" y="71" width="36" height="8.5" rx="1.8" fill="#F8FAFC" stroke="#64748B" strokeWidth="0.7" />
      <text
        x="80"
        y="77.5"
        textAnchor="middle"
        fontSize="5.8"
        fontWeight="900"
        fill="#0F172A"
        letterSpacing="0.05em"
      >
        {vehicle.licensePlate || '51E-123.45'}
      </text>
    </svg>
  );
});

// Slot spacing constants for smooth horizontal carousel sliding
const SLOT_WIDTH = 224; // Distance between vehicle slots in px

export const AdminVehicleSelectionGallery: React.FC<AdminVehicleSelectionGalleryProps> = ({
  vehicles,
  selectedVehicle,
}) => {
  const isAdminVehicleGalleryOpen = useWorldStore((state) => state.isAdminVehicleGalleryOpen);
  const setAdminVehicleGalleryOpen = useWorldStore((state) => state.setAdminVehicleGalleryOpen);
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const user = useAuthStore((state) => state.user);

  // Index of currently focused vehicle
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Horizontal drag interaction state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const didDragOccurRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const isConfirmingRef = useRef(false);
  const lastCenterClickTimeRef = useRef<{ id: string | number; time: number }>({ id: '', time: 0 });

  // Sync initial focusedIndex to currently selected vehicle when gallery opens
  useEffect(() => {
    if (isAdminVehicleGalleryOpen && selectedVehicle && vehicles.length > 0) {
      const idx = vehicles.findIndex((v) => isMatchingVehicle(v, selectedVehicle.id));
      setFocusedIndex(idx >= 0 ? idx : 0);
      setDragOffset(0);
    }
  }, [isAdminVehicleGalleryOpen, selectedVehicle, vehicles]);

  // Keyboard navigation: Left/Right to step, Enter to select, Escape to close
  useEffect(() => {
    if (!isAdminVehicleGalleryOpen || vehicles.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setAdminVehicleGalleryOpen(false);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleStepPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleStepNext();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const centerVeh = vehicles[focusedIndex];
        if (centerVeh) {
          handleConfirmVehicle(centerVeh);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminVehicleGalleryOpen, vehicles, focusedIndex]);

  if (!isAdminVehicleGalleryOpen || !vehicles || vehicles.length === 0) {
    return null;
  }

  const total = vehicles.length;

  const handleStepPrev = () => {
    setFocusedIndex((prev) => (prev - 1 + total) % total);
    setDragOffset(0);
  };

  const handleStepNext = () => {
    setFocusedIndex((prev) => (prev + 1) % total);
    setDragOffset(0);
  };

  const handleConfirmVehicle = (vehicle: VehicleResponse) => {
    if (isConfirmingRef.current || !vehicle?.id) return;
    isConfirmingRef.current = true;
    selectVehicle(vehicle.id, user?.role, false);
    setAdminVehicleGalleryOpen(false);
    useWorldStore.getState().triggerCameraReset();
    setTimeout(() => {
      isConfirmingRef.current = false;
    }, 400);
  };

  /* ======================================================== */
  /* HORIZONTAL DRAG INTERACTION (Only Vehicles Slide!)      */
  /* The container remains 100% FIXED in place.              */
  /* ======================================================== */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary (left = 0) or secondary (right = 2) button
    if (e.button !== 0 && e.button !== 2) return;
    // Stop event propagation so 3D Garage camera does not orbit
    e.stopPropagation();

    startXRef.current = e.clientX;
    pointerIdRef.current = e.pointerId;
    isDraggingRef.current = false;
    didDragOccurRef.current = false;
    setDragOffset(0);

    // If right-mouse button drag is initiated, immediately begin drag
    if (e.button === 2) {
      isDraggingRef.current = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch (_) { }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current === null) return;
    e.stopPropagation();

    const dx = e.clientX - startXRef.current;

    // Threshold of 12px prevents click/double-click pointer jitter from initiating drag
    if (!isDraggingRef.current && Math.abs(dx) > 12) {
      isDraggingRef.current = true;
      didDragOccurRef.current = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch (_) { }
    }

    if (isDraggingRef.current) {
      didDragOccurRef.current = true;
      // Subtract initial deadzone and apply slight rubber-banding resistance
      const effectiveDx = dx > 0 ? dx - 12 : dx + 12;
      setDragOffset(effectiveDx * 0.95);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current === null) return;
    e.stopPropagation();

    const wasDragging = isDraggingRef.current;
    const finalOffset = dragOffset;

    isDraggingRef.current = false;
    pointerIdRef.current = null;

    safelyReleasePointerCapture(e.currentTarget as HTMLElement, e.pointerId);

    if (wasDragging) {
      // Snap Threshold: if dragged more than 45px, shift to prev/next vehicle
      if (finalOffset > 45) {
        handleStepPrev();
      } else if (finalOffset < -45) {
        handleStepNext();
      } else {
        setDragOffset(0);
      }

      // Suppress subsequent click events for 100ms
      setTimeout(() => {
        didDragOccurRef.current = false;
      }, 100);
    } else {
      setDragOffset(0);
      didDragOccurRef.current = false;
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    pointerIdRef.current = null;
    setDragOffset(0);
    safelyReleasePointerCapture(e.currentTarget as HTMLElement, e.pointerId);
    setTimeout(() => {
      didDragOccurRef.current = false;
    }, 100);
  };

  // We render relative virtual slots: [-2, -1, 0, 1, 2]
  // Slot 0 is center, slot -1 is left neighbor, slot 1 is right neighbor.
  // Slots -2 and 2 enter smoothly during drag and are clipped outside.
  const relativeSlots = total === 1 ? [0] : [-2, -1, 0, 1, 2];

  return (
    <div
      data-component="AdminVehicleSelectorFixedRoot"
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 42,
        pointerEvents: 'auto',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }}
    >
      {/* 1. FIXED TOP CONTROLS: Stepper Badge & Floating Close Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 'min(680px, calc(100vw - 20px))',
          marginBottom: '8px',
          padding: '0 10px',
        }}
      >
        {/* Subtle Counter Badge */}
        <div
          style={{
            background: 'rgba(8, 24, 44, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 217, 255, 0.35)',
            borderRadius: '9999px',
            padding: '3px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D9FF' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '0.04em' }}>
            XE {focusedIndex + 1} / {total}
          </span>
        </div>

        {/* Minimal Floating Close Button */}
        <button
          type="button"
          onClick={() => setAdminVehicleGalleryOpen(false)}
          title="Đóng (Esc)"
          aria-label="Đóng bảng chọn xe"
          style={{
            background: 'rgba(8, 24, 44, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '9999px',
            padding: '3px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: '#94A3B8',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#EF4444';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94A3B8';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          <X size={13} />
          <span>Đóng</span>
        </button>
      </div>

      {/* 2. FIXED CAROUSEL VIEWPORT: Container stays 100% FIXED, only vehicle cards slide! */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'min(780px, calc(100vw - 16px))',
          height: '196px',
        }}
      >
        {/* Left Fixed Navigation Chevron */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleStepPrev();
          }}
          title="Xe trước"
          style={{
            position: 'absolute',
            left: '4px',
            zIndex: 25,
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'rgba(8, 28, 48, 0.90)',
            backdropFilter: 'blur(16px)',
            border: '1.2px solid rgba(0, 217, 255, 0.5)',
            color: '#00D9FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 14px rgba(0, 217, 255, 0.3)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00D9FF';
            e.currentTarget.style.color = '#081C30';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(8, 28, 48, 0.90)';
            e.currentTarget.style.color = '#00D9FF';
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* FIXED VIEWPORT TRACK (Clipping window for 3 visible cards) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            position: 'relative',
            width: 'min(676px, calc(100vw - 88px))',
            height: '196px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          }}
        >
          {relativeSlots.map((k) => {
            const vehicleIndex = (focusedIndex + k + total * 10) % total;
            const vehicle = vehicles[vehicleIndex];
            if (!vehicle) return null;

            // Physical slot position calculation
            const baseX = k * SLOT_WIDTH;
            const currentX = baseX + dragOffset;
            const distFromCenter = Math.abs(currentX);

            // Normalized ratio: 1 when directly centered, 0 when 1 slot away (224px)
            const ratio = Math.max(0, Math.min(1, 1 - distFromCenter / SLOT_WIDTH));

            // Dynamic scale: 0.84 on side, smoothly grows to 1.14 at center
            const scale = 0.84 + ratio * 0.30;

            // Dynamic opacity: 0.55 on side, smoothly brightens to 1.0 at center
            // Falls to 0 beyond 1 slot distance so offscreen cards fade out
            const opacity = Math.max(
              0,
              Math.min(1, 0.55 + ratio * 0.45 - Math.max(0, distFromCenter - SLOT_WIDTH) / 120)
            );

            // Dynamic vertical lift: center vehicle floats 8px higher
            const translateY = -ratio * 8;

            // Dynamic z-index: center car always renders above side neighbors
            const zIndex = Math.round(ratio * 10) + 1;

            const isFocused = ratio > 0.60;
            const code = resolveVehicleCode(vehicle, vehicleIndex);
            const displayName = resolveVehicleDisplayName(vehicle, code);
            const rawColor = resolveAuthoritativeVehicleColor(vehicle);
            const colorHex = resolveVehicleColorHex(rawColor);
            const statusMeta = getStatusMeta(vehicle.status);
            const batteryLevel = vehicle.currentBatteryLevel ?? 85;

            return (
              <div
                key={`${vehicle.id || code}-${k}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (didDragOccurRef.current) return;
                  if (k < 0) {
                    handleStepPrev();
                  } else if (k > 0) {
                    handleStepNext();
                  } else if (k === 0) {
                    // Dual-layer double click detector via timestamp
                    const now = Date.now();
                    const last = lastCenterClickTimeRef.current;
                    if (last.id === vehicle.id && now - last.time < 380 && now - last.time > 40) {
                      handleConfirmVehicle(vehicle);
                      lastCenterClickTimeRef.current = { id: '', time: 0 };
                    } else {
                      lastCenterClickTimeRef.current = { id: vehicle.id, time: now };
                    }
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (didDragOccurRef.current) return;
                  if (k === 0) {
                    handleConfirmVehicle(vehicle);
                  }
                }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '208px',
                  height: '154px',
                  boxSizing: 'border-box',
                  transform: `translate(-50%, -50%) translateX(${currentX}px) translateY(${translateY}px) scale(${scale})`,
                  opacity: opacity,
                  zIndex: zIndex,
                  background: isFocused
                    ? 'linear-gradient(180deg, rgba(14, 40, 68, 0.94) 0%, rgba(8, 24, 42, 0.92) 100%)'
                    : 'rgba(10, 26, 44, 0.70)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: isFocused ? '2px solid #00D9FF' : '1px solid rgba(56, 189, 248, 0.22)',
                  borderRadius: isFocused ? '18px' : '14px',
                  padding: isFocused ? '9px 11px' : '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: isFocused
                    ? '0 0 32px rgba(0, 217, 255, 0.48), 0 16px 36px rgba(0, 0, 0, 0.75), inset 0 0 14px rgba(0, 217, 255, 0.2)'
                    : '0 8px 24px rgba(0, 0, 0, 0.55)',
                  transition: isDraggingRef.current
                    ? 'none'
                    : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, border-color 0.28s ease',
                  cursor: isFocused ? 'pointer' : 'pointer',
                }}
              >
                {/* A. Top Row: Code Badge + Battery SOC */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        background: isFocused ? '#00D9FF' : 'rgba(0, 217, 255, 0.16)',
                        color: isFocused ? '#081C30' : '#00D9FF',
                        fontSize: isFocused ? '10.5px' : '9.5px',
                        fontWeight: 900,
                        padding: '1.5px 6px',
                        borderRadius: '5px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {code}
                    </span>
                    {isFocused && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: statusMeta.dotColor,
                          background: statusMeta.bg,
                          padding: '1px 5px',
                          borderRadius: '9999px',
                        }}
                      >
                        {statusMeta.labelVi}
                      </span>
                    )}
                  </div>

                  {/* Battery SOC */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: isFocused ? '10.5px' : '9.5px',
                      fontWeight: 800,
                      color: batteryLevel >= 60 ? '#10E6A3' : '#F59E0B',
                    }}
                  >
                    {vehicle.status === 'CHARGING' ? (
                      <BatteryCharging size={12} color="#00D9FF" />
                    ) : (
                      <BatteryMedium size={12} />
                    )}
                    <span>{batteryLevel}%</span>
                  </div>
                </div>

                {/* B. Center Graphic: Model Facing Directly Forward */}
                <FrontFacingVehiclePreview
                  vehicle={vehicle}
                  colorHex={colorHex}
                  isFocused={isFocused}
                />

                {/* C. Bottom Row: Vehicle Name, Plate & Select Prompt */}
                <div style={{ textAlign: 'center', width: '100%', overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: isFocused ? '12px' : '10.5px',
                      fontWeight: isFocused ? 900 : 700,
                      color: isFocused ? '#FFFFFF' : '#CBD5E1',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={displayName}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      fontSize: isFocused ? '10px' : '9px',
                      fontWeight: 700,
                      color: isFocused ? '#00D9FF' : '#64748B',
                      marginTop: '1px',
                    }}
                  >
                    <CreditCard size={10} color={isFocused ? '#00D9FF' : '#64748B'} />
                    <span>{vehicle.licensePlate || '51E-123.45'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Fixed Navigation Chevron */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleStepNext();
          }}
          title="Xe tiếp theo"
          style={{
            position: 'absolute',
            right: '4px',
            zIndex: 25,
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'rgba(8, 28, 48, 0.90)',
            backdropFilter: 'blur(16px)',
            border: '1.2px solid rgba(0, 217, 255, 0.5)',
            color: '#00D9FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 14px rgba(0, 217, 255, 0.3)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00D9FF';
            e.currentTarget.style.color = '#081C30';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(8, 28, 48, 0.90)';
            e.currentTarget.style.color = '#00D9FF';
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
