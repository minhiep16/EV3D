/**
 * EVShare 3D — Shared Carousel Interaction Utilities
 * Phase 4.1: Unified Design System & Frontend Stability
 * Standardized horizontal drag gesture engine, bounds clamping, snapping physics,
 * and robust pointer capture cleanup.
 */

export interface CarouselLayoutConfig {
  itemWidth: number;
  gap: number;
  itemStride: number;
  visibleCount: number;
  viewportWidth: number;
}

export const OPERATIONAL_CAROUSEL_LAYOUT: CarouselLayoutConfig = {
  itemWidth: 138,
  gap: 16,
  itemStride: 154, // 138 + 16
  visibleCount: 4,
  viewportWidth: 600, // 138 * 4 + 16 * 3
};

export const VEHICLE_GALLERY_LAYOUT: CarouselLayoutConfig = {
  itemWidth: 208,
  gap: 16,
  itemStride: 224, // 208 + 16
  visibleCount: 3,
  viewportWidth: 676,
};

/**
 * Safely releases pointer capture from a target element without throwing DOMExceptions
 */
export function safelyReleasePointerCapture(
  target: HTMLElement | null | undefined,
  pointerId: number | null | undefined
): void {
  if (!target || pointerId == null) return;
  try {
    if (typeof target.hasPointerCapture === 'function' && target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  } catch {
    // Ignore invalid pointer ID errors gracefully
  }
}

/**
 * Calculates snapped index after a horizontal drag gesture completes
 * @param dragOffset Pixels dragged horizontally (positive = drag right, negative = drag left)
 * @param currentIndex Current focused slot index
 * @param maxIndex Maximum allowed index
 * @param snapThreshold Minimum drag distance in px to trigger a slot change (default: 35px)
 */
export function calculateSnappedIndex(
  dragOffset: number,
  currentIndex: number,
  maxIndex: number,
  snapThreshold = 35
): number {
  const safeCurrent = typeof currentIndex === 'number' && !Number.isNaN(currentIndex) ? currentIndex : 0;
  if (Math.abs(dragOffset) > snapThreshold) {
    if (dragOffset > 0) {
      return Math.max(0, safeCurrent - 1);
    } else {
      return Math.min(maxIndex, safeCurrent + 1);
    }
  }
  return safeCurrent;
}

/**
 * Calculates dynamic styling parameters (scale, opacity, lift) for 3D carousel items based on distance from center
 */
export function calculateSlotItemDynamics(
  distanceFromCenter: number,
  stride: number
): {
  ratio: number;
  scale: number;
  opacity: number;
  translateY: number;
  zIndex: number;
  isFocused: boolean;
} {
  const safeDist = Math.max(0, Math.abs(distanceFromCenter));
  const safeStride = Math.max(1, stride);
  const ratio = Math.max(0, Math.min(1, 1 - safeDist / safeStride));

  return {
    ratio,
    scale: 0.84 + ratio * 0.30,
    opacity: Math.max(0, Math.min(1, 0.55 + ratio * 0.45 - Math.max(0, safeDist - safeStride) / 120)),
    translateY: -ratio * 8,
    zIndex: Math.round(ratio * 10) + 1,
    isFocused: ratio > 0.60,
  };
}
