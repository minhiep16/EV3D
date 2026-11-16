import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { VehicleResponse } from '../../types/vehicle';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  CO_OWNER_OPERATIONAL_MODULES,
  CoOwnerOperationalModuleDef,
} from '../../config/coOwnerOperationalConfig';
import { VolumetricHologramSymbol } from '../common/VolumetricHologramSymbol';
import { safelyReleasePointerCapture } from '../../utils/carouselInteraction';

export interface CoOwnerOperationItem {
  id: string;
  title: string;
  subtitle: string;
  accentColor: string;
  glowColor: string;
  shapeType:
    | 'calendar'
    | 'magnifier'
    | 'wrench'
    | 'battery'
    | 'ballot_box'
    | 'scale'
    | 'network'
    | 'contract';
  action: () => void;
  disabled?: boolean;
}

interface CoOwnerOperationalCarouselProps {
  vehicle: VehicleResponse;
}

/**
 * CoOwnerOperationalCarousel
 * Volumetric 3D Holographic Operation Carousel for CO_OWNER
 * - Reuses the stable STAFF holographic carousel architecture & drag/snap physics engine
 * - 8 Co-Owner operational functions
 * - 4 items visible simultaneously
 * - Drag with right mouse button (or left drag) across 600px viewport
 * - Pure floating 3D holographic icons with ground auras (NO rectangular outer background)
 * - Contextual visibility: hides when a business modal/panel is open; restores upon closing
 */
export const CoOwnerOperationalCarousel: React.FC<CoOwnerOperationalCarouselProps> = ({ vehicle }) => {
  const user = useAuthStore((state) => state.user);
  const isCoOwner = !user?.role || user?.role === 'CO_OWNER';

  // Store actions
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);
  const enterVehicleBookingMode = useWorldStore((state) => state.enterVehicleBookingMode);
  const enterCoOwnerExplorationMode = useWorldStore((state) => state.enterCoOwnerExplorationMode);
  const enterVehicleMaintenanceMode = useWorldStore((state) => state.enterVehicleMaintenanceMode);
  const enterBatteryXrayMode = useWorldStore((state) => state.enterBatteryXrayMode);
  const enterVehicleVotingMode = useWorldStore((state) => state.enterVehicleVotingMode);
  const openDisputePanel = useWorldStore((state) => state.openDisputePanel);
  const closeCoOwnerOperations = useWorldStore((state) => state.closeCoOwnerOperations);

  // Store states
  const isCoOwnerOperationsCarouselOpen = useWorldStore(
    (state) => state.isCoOwnerOperationsCarouselOpen
  );
  const focusedIndex = useWorldStore((state) => state.coOwnerCarouselFocusedIndex);
  const setFocusedIndex = useWorldStore((state) => state.setCoOwnerCarouselFocusedIndex);

  const activePrimaryPanel = useWorldStore((state) => state.activePrimaryPanel);
  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const isExplorationMode = useWorldStore((state) => state.isExplorationMode);
  const vehicleMaintenanceMode = useWorldStore((state) => state.vehicleMaintenanceMode);
  const vehicleBatteryXrayMode = useWorldStore((state) => state.vehicleBatteryXrayMode);
  const vehicleVotingMode = useWorldStore((state) => state.vehicleVotingMode);
  const vehicleChargingMode = useWorldStore((state) => state.vehicleChargingMode);
  const vehicleTripVisualizationMode = useWorldStore((state) => state.vehicleTripVisualizationMode);
  const vehicleReceiptReviewMode = useWorldStore((state) => state.vehicleReceiptReviewMode);
  const vehicleTripStartMode = useWorldStore((state) => state.vehicleTripStartMode);
  const selectedZone = useWorldStore((state) => state.selectedZone);

  const isMaintenance = vehicle.status === 'MAINTENANCE';

  // Determine if any modal/panel is active, which gracefully hides the carousel
  const isModuleActive = Boolean(
    vehicleBookingMode ||
    isExplorationMode ||
    vehicleMaintenanceMode ||
    vehicleBatteryXrayMode ||
    vehicleVotingMode ||
    activePrimaryPanel === 'BOOKING' ||
    activePrimaryPanel === 'MAINTENANCE' ||
    activePrimaryPanel === 'BATTERY_XRAY' ||
    activePrimaryPanel === 'VOTING' ||
    activePrimaryPanel === 'DISPUTE' ||
    activePrimaryPanel === 'CO_OWNERSHIP' ||
    activePrimaryPanel === 'CONTRACT' ||
    activePrimaryPanel === 'VEHICLE_INFO' ||
    activePrimaryPanel === 'MY_BOOKINGS' ||
    activePrimaryPanel === 'FINANCE' ||
    activePrimaryPanel === 'ANALYTICS' ||
    activePrimaryPanel === 'DAMAGE' ||
    activePrimaryPanel === 'NOTIFICATIONS' ||
    vehicleTripVisualizationMode ||
    vehicleReceiptReviewMode ||
    vehicleTripStartMode ||
    vehicleChargingMode ||
    (selectedZone && selectedZone !== 'VEHICLE')
  );

  // 8 Operational Functions for CO_OWNER
  const operationItems: CoOwnerOperationItem[] = useMemo(() => {
    const actionMap: Record<string, () => void> = {
      BOOKING: () => {
        if (!isMaintenance) {
          openGaragePanel('BOOKING', { vehicleId: vehicle.id });
          enterVehicleBookingMode(vehicle.id);
        }
      },
      EXPLORATION: () => {
        enterCoOwnerExplorationMode(vehicle.id);
      },
      MAINTENANCE: () => {
        openGaragePanel('MAINTENANCE', { vehicleId: vehicle.id });
        enterVehicleMaintenanceMode({ vehicleId: vehicle.id });
      },
      BATTERY_XRAY: () => {
        enterBatteryXrayMode(vehicle.id);
      },
      VOTING: () => {
        enterVehicleVotingMode({ vehicleId: vehicle.id });
      },
      DISPUTE: () => {
        openDisputePanel(vehicle.id);
      },
      CO_OWNERSHIP: () => {
        openGaragePanel('CO_OWNERSHIP', { vehicleId: vehicle.id });
      },
      CONTRACT: () => {
        openGaragePanel('CONTRACT', { vehicleId: vehicle.id });
      },
    };

    return CO_OWNER_OPERATIONAL_MODULES.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      accentColor: item.accentColor,
      glowColor: item.glowColor,
      shapeType: item.shapeType,
      action: actionMap[item.id] || (() => {}),
      disabled: item.id === 'BOOKING' && isMaintenance,
    }));
  }, [
    vehicle.id,
    isMaintenance,
    openGaragePanel,
    enterVehicleBookingMode,
    enterCoOwnerExplorationMode,
    enterVehicleMaintenanceMode,
    enterBatteryXrayMode,
    enterVehicleVotingMode,
    openDisputePanel,
  ]);

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
  const maxIndex = Math.max(0, operationItems.length - VISIBLE_COUNT); // 8 - 4 = 4

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

  // When a module opens or is active, release all pointer captures and interaction locks
  useEffect(() => {
    if (isModuleActive) {
      safelyReleasePointerCapture(activePointerTargetRef.current, pointerIdRef.current);
      isDraggingRef.current = false;
      setIsDraggingState(false);
      pointerIdRef.current = null;
      activePointerTargetRef.current = null;
      currentOffsetRef.current = 0;
      setDragOffset(0);
      didDragOccurRef.current = false;
    }
  }, [isModuleActive]);

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
          shift = -Math.max(1, Math.round((finalOffset - 25) / ITEM_STRIDE));
        } else {
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

  if (!isCoOwner) return null;
  if (!isCoOwnerOperationsCarouselOpen) return null;

  const isVisible = isCoOwnerOperationsCarouselOpen && !isModuleActive;

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: '22px',
        left: '50%',
        transform: isVisible
          ? 'translateX(-50%) translateY(0) scale(1)'
          : 'translateX(-50%) translateY(24px) scale(0.97)',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        pointerEvents: isVisible ? 'auto' : 'none',
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
        @keyframes coOwnerCarouselEntrance {
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
            alignItems: 'center',
            gap: `${GAP}px`,
            transform: `translateX(${-safeFocusedIndex * ITEM_STRIDE + dragOffset}px)`,
            transition: isDraggingState ? 'none' : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
        >
          {operationItems.map((item, idx) => {
            const isItemFocused = idx >= safeFocusedIndex && idx < safeFocusedIndex + VISIBLE_COUNT;
            const disabled = Boolean(item.disabled);

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  if (didDragOccurRef.current || isDraggingRef.current) return;
                  if (!disabled) {
                    item.action();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!disabled) {
                      item.action();
                    }
                  }
                }}
                title={disabled ? 'Xe đang trong quá trình bảo dưỡng kỹ thuật' : `${item.title}: ${item.subtitle}`}
                style={{
                  width: `${ITEM_WIDTH}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: disabled ? 'not-allowed' : isDraggingState ? 'grabbing' : 'pointer',
                  opacity: disabled ? 0.45 : isItemFocused ? 1 : 0.6,
                  transform: isItemFocused ? 'scale(1)' : 'scale(0.92)',
                  transition: 'transform 0.25s ease, opacity 0.25s ease',
                  flexShrink: 0,
                  outline: 'none',
                }}
              >
                {/* Volumetric 3D Holographic Object (Ground projection + SVG geometries) */}
                <VolumetricHologramSymbol
                  shapeType={item.shapeType}
                  accentColor={disabled ? '#64748b' : item.accentColor}
                  glowColor={disabled ? '#475569' : item.glowColor}
                  isFocused={isItemFocused && !disabled}
                />

                {/* Standardized Floating Label Badge matching STAFF design */}
                <div
                  style={{
                    background: isItemFocused
                      ? 'rgba(8, 28, 54, 0.95)'
                      : 'rgba(7, 20, 38, 0.90)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isItemFocused
                      ? `1.5px solid ${item.accentColor}`
                      : `1px solid ${item.accentColor}55`,
                    boxShadow: isItemFocused
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
                    height: '42px',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    marginTop: '6px',
                    pointerEvents: 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: isItemFocused ? '#FFFFFF' : '#F1F5F9',
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
                      fontSize: '9px',
                      fontWeight: 700,
                      color: disabled ? '#64748b' : item.accentColor,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
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
          closeCoOwnerOperations();
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
