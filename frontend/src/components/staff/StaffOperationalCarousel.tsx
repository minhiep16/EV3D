import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { STAFF_OPERATIONAL_MODULES, StaffOperationalModuleDef } from '../../config/staffOperationalConfig';
import { VolumetricHologramSymbol } from '../common/VolumetricHologramSymbol';
import { safelyReleasePointerCapture } from '../../utils/carouselInteraction';

export { STAFF_OPERATIONAL_MODULES };

export interface StaffOperationItem {
  id: string;
  title: string;
  subtitle: string;
  accentColor: string;
  glowColor: string;
  shapeType: 'battery' | 'wrench' | 'key' | 'arrow' | 'magnifier' | 'clock' | 'wallet' | 'scale';
  action: () => void;
}

/**
 * StaffOperationalCarousel
 * Volumetric Hologram Carousel for STAFF Operational Functions
 * - Four visible functions at once
 * - Header completely removed
 * - Single-click activation opens the specific operational module
 * - Fixed carousel position with horizontal dragging for hologram items
 */
export const StaffOperationalCarousel: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === 'STAFF';

  const openVehicleDetail = useWorldStore((state) => state.openVehicleDetail);
  const activeStaffOperationModule = useWorldStore((state) => state.activeStaffOperationModule);
  const setActiveStaffOperationModule = useWorldStore((state) => state.setActiveStaffOperationModule);
  const setVehicleInspectionMode = useWorldStore((state) => state.setVehicleInspectionMode);
  const clearVehiclePartSelection = useWorldStore((state) => state.clearVehiclePartSelection);
  const closeStaffOperations = useWorldStore((state) => state.closeStaffOperations);

  // 7 Operational Functions with Distinct 3D Holographic Geometry (Centralized from STAFF_OPERATIONAL_MODULES)
  const operationItems: StaffOperationItem[] = useMemo(() => {
    const actionMap: Record<string, () => void> = {
      MAINTENANCE: () => {
        openVehicleDetail();
        setActiveStaffOperationModule('MAINTENANCE');
        setVehicleInspectionMode(false);
      },
      HANDOVER: () => {
        openVehicleDetail();
        setActiveStaffOperationModule('HANDOVER');
        setVehicleInspectionMode(false);
      },
      RETURN: () => {
        openVehicleDetail();
        setActiveStaffOperationModule('RETURN');
        setVehicleInspectionMode(false);
      },
      INSPECTION_3D: () => {
        openVehicleDetail();
        clearVehiclePartSelection();
        setActiveStaffOperationModule('INSPECTION_3D');
        setVehicleInspectionMode(true);
      },
      HISTORY: () => {
        openVehicleDetail();
        setActiveStaffOperationModule('HISTORY');
        setVehicleInspectionMode(false);
      },
      PAYMENT: () => {
        openVehicleDetail();
        setActiveStaffOperationModule('PAYMENT');
        setVehicleInspectionMode(false);
      },
      DISPUTE: () => {
        openVehicleDetail();
        setActiveStaffOperationModule('DISPUTE');
        setVehicleInspectionMode(false);
      },
    };

    return STAFF_OPERATIONAL_MODULES.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      accentColor: item.accentColor,
      glowColor: item.glowColor,
      shapeType: item.shapeType,
      action: actionMap[item.id] || (() => {}),
    }));
  }, [
    openVehicleDetail,
    setActiveStaffOperationModule,
    setVehicleInspectionMode,
    clearVehiclePartSelection,
  ]);

  const focusedIndex = useWorldStore((state) => state.staffCarouselFocusedIndex);
  const setFocusedIndex = useWorldStore((state) => state.setStaffCarouselFocusedIndex);
  const isVehicleDetailOpen = useWorldStore((state) => state.isVehicleDetailOpen);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);

  const isModuleActive = Boolean(
    activeStaffOperationModule ||
    (isStaff ? false : isVehicleDetailOpen) ||
    vehicleInspectionMode ||
    vehicleDamageMappingMode ||
    vehicleHandoverMode
  );
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const activePointerTargetRef = useRef<HTMLElement | null>(null);
  const didDragOccurRef = useRef(false);

  // Layout Constants for 4 visible items
  const ITEM_WIDTH = 138;
  const GAP = 16;
  const ITEM_STRIDE = ITEM_WIDTH + GAP; // 154px
  const VISIBLE_COUNT = 4;
  const VIEWPORT_WIDTH = ITEM_WIDTH * VISIBLE_COUNT + GAP * (VISIBLE_COUNT - 1); // 138*4 + 16*3 = 600px
  const maxIndex = Math.max(0, operationItems.length - VISIBLE_COUNT);

  const safeFocusedIndex = typeof focusedIndex === 'number' && !Number.isNaN(focusedIndex) ? focusedIndex : 0;

  const handlePrev = useCallback(() => {
    setFocusedIndex((prev) => Math.max(0, (typeof prev === 'number' ? prev : 0) - 1));
    setDragOffset(0);
  }, [setFocusedIndex]);

  const handleNext = useCallback(() => {
    setFocusedIndex((prev) => Math.min(maxIndex, (typeof prev === 'number' ? prev : 0) + 1));
    setDragOffset(0);
  }, [maxIndex, setFocusedIndex]);

  // Window blur listener to safely cancel any ongoing drag if focus leaves window
  useEffect(() => {
    const handleWindowBlur = () => {
      if (isDraggingRef.current || pointerIdRef.current !== null) {
        safelyReleasePointerCapture(activePointerTargetRef.current, pointerIdRef.current);
        isDraggingRef.current = false;
        setIsDraggingState(false);
        pointerIdRef.current = null;
        activePointerTargetRef.current = null;
        currentOffsetRef.current = 0;
        setDragOffset(0);
        setTimeout(() => {
          didDragOccurRef.current = false;
        }, 120);
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  /* ======================================================== */
  /* HORIZONTAL DRAG INTERACTION (Only Hologram Items Move!) */
  /* Supports unlimited consecutive drag gestures horizontally */
  /* ======================================================== */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary (left = 0) or secondary (right = 2) button
    if (e.button !== 0 && e.button !== 2) return;
    e.stopPropagation();

    startXRef.current = e.clientX;
    pointerIdRef.current = e.pointerId;
    activePointerTargetRef.current = e.currentTarget;
    currentOffsetRef.current = 0;
    isDraggingRef.current = false;
    setIsDraggingState(false);
    didDragOccurRef.current = false;
    setDragOffset(0);

    // If right-mouse button drag is initiated, immediately begin drag & capture pointer
    if (e.button === 2) {
      isDraggingRef.current = true;
      setIsDraggingState(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current === null || e.pointerId !== pointerIdRef.current) return;
    e.stopPropagation();

    const dx = e.clientX - startXRef.current;

    // Threshold of 10px prevents click jitter from initiating drag
    if (!isDraggingRef.current && Math.abs(dx) > 10) {
      isDraggingRef.current = true;
      setIsDraggingState(true);
      didDragOccurRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (isDraggingRef.current) {
      didDragOccurRef.current = true;
      const effectiveDx = dx > 0 ? dx - 10 : dx + 10;

      // Rubber-banding damping at edges
      let dampedOffset = effectiveDx;
      if (
        (safeFocusedIndex <= 0 && effectiveDx > 0) ||
        (safeFocusedIndex >= maxIndex && effectiveDx < 0)
      ) {
        dampedOffset = effectiveDx * 0.28;
      } else {
        dampedOffset = effectiveDx * 0.95;
      }

      currentOffsetRef.current = dampedOffset;
      setDragOffset(dampedOffset);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current === null) return;
    e.stopPropagation();

    const wasDragging = isDraggingRef.current;
    const finalOffset = currentOffsetRef.current;
    const pid = pointerIdRef.current;
    const targetEl = activePointerTargetRef.current || (e.currentTarget as HTMLElement);

    isDraggingRef.current = false;
    setIsDraggingState(false);
    pointerIdRef.current = null;
    activePointerTargetRef.current = null;
    currentOffsetRef.current = 0;

    safelyReleasePointerCapture(targetEl, pid);

    if (wasDragging) {
      // Snap threshold: if dragged at least 36px, snap to next/prev index
      let shift = 0;
      if (Math.abs(finalOffset) >= 36) {
        if (finalOffset > 0) {
          // Dragged right -> show earlier items
          shift = -Math.max(1, Math.round((finalOffset - 25) / ITEM_STRIDE));
        } else {
          // Dragged left -> show later items
          shift = Math.max(1, Math.round((-finalOffset - 25) / ITEM_STRIDE));
        }
      }

      const nextIndex = Math.max(0, Math.min(maxIndex, safeFocusedIndex + shift));
      setFocusedIndex(nextIndex);
      setDragOffset(0);

      setTimeout(() => {
        didDragOccurRef.current = false;
      }, 120);
    } else {
      setDragOffset(0);
      didDragOccurRef.current = false;
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const pid = pointerIdRef.current;
    const targetEl = activePointerTargetRef.current || (e.currentTarget as HTMLElement);

    isDraggingRef.current = false;
    setIsDraggingState(false);
    pointerIdRef.current = null;
    activePointerTargetRef.current = null;
    currentOffsetRef.current = 0;
    setDragOffset(0);

    safelyReleasePointerCapture(targetEl, pid);

    setTimeout(() => {
      didDragOccurRef.current = false;
    }, 120);
  };

  if (!isStaff) return null;

  return (
    <div
      data-name="StaffOperationalCarouselFixedRoot"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: '22px',
        left: '50%',
        transform: isModuleActive
          ? 'translateX(-50%) translateY(24px) scale(0.97)'
          : 'translateX(-50%) translateY(0) scale(1)',
        opacity: isModuleActive ? 0 : 1,
        visibility: isModuleActive ? 'hidden' : 'visible',
        pointerEvents: isModuleActive ? 'none' : 'auto',
        transition:
          'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s',
        zIndex: 42,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: 'calc(100vw - 20px)',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes staffCarouselEntrance {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(28px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
      `}</style>
      {/* Left Arrow Button */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={safeFocusedIndex === 0}
        title="Trượt sang trái"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: safeFocusedIndex === 0 ? 'rgba(15, 23, 42, 0.4)' : 'rgba(8, 24, 44, 0.92)',
          border: `1.2px solid ${safeFocusedIndex === 0 ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0, 217, 255, 0.5)'}`,
          color: safeFocusedIndex === 0 ? '#475569' : '#00D9FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: safeFocusedIndex === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: safeFocusedIndex === 0 ? 'none' : '0 0 12px rgba(0, 217, 255, 0.3)',
          flexShrink: 0,
        }}
      >
        <ChevronLeft size={16} />
      </button>

      {/* FIXED VIEWPORT TRACK (Window clipping visible volumetric holograms) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          width: `${VIEWPORT_WIDTH}px`,
          maxWidth: 'calc(100vw - 110px)',
          overflow: 'hidden',
          padding: '6px 2px',
          touchAction: 'none',
          display: 'flex',
          alignItems: 'center',
          cursor: isDraggingState ? 'grabbing' : 'grab',
        }}
      >
        {/* SLIDING STRIP (Pure floating 3D hologram items without rectangular boxes) */}
        <div
          style={{
            display: 'flex',
            gap: `${GAP}px`,
            transform: `translateX(${-safeFocusedIndex * ITEM_STRIDE + dragOffset}px)`,
            transition: isDraggingState
              ? 'none'
              : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
        >
          {operationItems.map((item, idx) => {
            const isModuleActive = activeStaffOperationModule === item.id;
            const isCenterFocus = idx === safeFocusedIndex + 1 || idx === safeFocusedIndex + 2;

            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!didDragOccurRef.current && !isDraggingRef.current) {
                    item.action();
                  }
                }}
                style={{
                  width: `${ITEM_WIDTH}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isCenterFocus ? 'scale(1.05)' : 'scale(0.95)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isCenterFocus ? 'scale(1.05)' : 'scale(0.95)';
                }}
              >
                {/* Top: 3D Holographic Volumetric Symbol with Orbiting Rings */}
                <VolumetricHologramSymbol
                  shapeType={item.shapeType}
                  accentColor={item.accentColor}
                  glowColor={item.glowColor}
                  isFocused={isModuleActive || isCenterFocus}
                />

                {/* Bottom: Compact Floating Label Badge */}
                <div
                  style={{
                    background: isModuleActive
                      ? 'rgba(8, 28, 54, 0.95)'
                      : 'rgba(7, 20, 38, 0.90)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isModuleActive
                      ? `1.5px solid ${item.accentColor}`
                      : `1px solid ${item.accentColor}55`,
                    boxShadow: isModuleActive
                      ? `0 0 20px ${item.accentColor}66, 0 6px 16px rgba(0, 0, 0, 0.6)`
                      : `0 4px 12px rgba(0, 0, 0, 0.5)`,
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '1px',
                    maxWidth: '128px',
                    width: '100%',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: isModuleActive ? '#FFFFFF' : '#F1F5F9',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                    }}
                    title={item.title}
                  >
                    {item.title}
                  </span>
                  <span
                    style={{
                      fontSize: '8.5px',
                      color: item.accentColor,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      opacity: 0.95,
                    }}
                  >
                    {item.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Arrow Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={safeFocusedIndex >= maxIndex}
        title="Trượt sang phải"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: safeFocusedIndex >= maxIndex ? 'rgba(15, 23, 42, 0.4)' : 'rgba(8, 24, 44, 0.92)',
          border: `1.2px solid ${safeFocusedIndex >= maxIndex ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0, 217, 255, 0.5)'}`,
          color: safeFocusedIndex >= maxIndex ? '#475569' : '#00D9FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: safeFocusedIndex >= maxIndex ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: safeFocusedIndex >= maxIndex ? 'none' : '0 0 12px rgba(0, 217, 255, 0.3)',
          flexShrink: 0,
        }}
      >
        <ChevronRight size={16} />
      </button>

      {/* Close Operation Mode Action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          closeStaffOperations();
        }}
        title="Đóng chế độ tác vụ vận hành"
        aria-label="Đóng chế độ tác vụ vận hành"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(8, 24, 44, 0.92)',
          border: '1.2px solid rgba(239, 68, 68, 0.55)',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 0 12px rgba(239, 68, 68, 0.25)',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(8, 24, 44, 0.92)';
          e.currentTarget.style.color = '#f87171';
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
};
