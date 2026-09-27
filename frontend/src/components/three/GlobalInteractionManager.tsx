import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useWorldStore } from '../../store/worldStore';
import { INTERACTION_CONFIG } from '../../config/interactionConfig';

const DRAG_THRESHOLD_PX = INTERACTION_CONFIG.clickDragThresholdPx;
const DRAG_COOLDOWN_MS = INTERACTION_CONFIG.dragCooldownMs;

/**
 * Transient interaction state tracking pointer gestures and camera manipulation.
 * Kept outside React renders to guarantee zero-latency synchronous checks.
 */
export const globalInteractionState = {
  pointerDownPosition: null as { x: number; y: number } | null,
  pointerDownButton: null as number | null,
  isPointerDragging: false,
  isCameraOrbiting: false,
  isVehicleDragging: false,
  isVehicleInteracting: false,
  orbitControls: null as any | null,
  lastDragEndTime: 0,
  lastOrbitEndTime: 0,
  lastVehicleDragEndTime: 0,
};

/**
 * Notify interaction manager that camera orbit/pan has started.
 */
export const notifyCameraOrbitStart = (): void => {
  globalInteractionState.isCameraOrbiting = true;
};

/**
 * Notify interaction manager that camera orbit/pan has ended.
 */
export const notifyCameraOrbitEnd = (): void => {
  globalInteractionState.isCameraOrbiting = false;
  globalInteractionState.lastOrbitEndTime = Date.now();
};

/**
 * Notify interaction manager that pointer went down on vehicle EV01.
 * Immediately pauses OrbitControls to prevent camera orbit during vehicle drag.
 */
export const notifyVehiclePointerDown = (): void => {
  globalInteractionState.isVehicleInteracting = true;
  if (globalInteractionState.orbitControls) {
    globalInteractionState.orbitControls.enabled = false;
  }
};

/**
 * Notify interaction manager that pointer went up from vehicle EV01.
 * Re-enables camera OrbitControls when not dragging.
 */
export const notifyVehiclePointerUp = (): void => {
  globalInteractionState.isVehicleInteracting = false;
  if (globalInteractionState.orbitControls && !globalInteractionState.isVehicleDragging) {
    globalInteractionState.orbitControls.enabled = true;
  }
};

/**
 * Notify interaction manager that direct vehicle 360 rotation drag has started.
 */
export const notifyVehicleDragStart = (): void => {
  globalInteractionState.isVehicleDragging = true;
  globalInteractionState.isPointerDragging = true;
  if (globalInteractionState.orbitControls) {
    globalInteractionState.orbitControls.enabled = false;
  }
};

/**
 * Notify interaction manager that direct vehicle 360 rotation drag has ended.
 */
export const notifyVehicleDragEnd = (): void => {
  globalInteractionState.isVehicleDragging = false;
  globalInteractionState.lastVehicleDragEndTime = Date.now();
  globalInteractionState.lastDragEndTime = Date.now();
  if (globalInteractionState.orbitControls) {
    globalInteractionState.orbitControls.enabled = true;
  }
};

/**
 * Helper to determine if a recent drag or ongoing orbit occurred,
 * preventing accidental click selections on mouse release.
 */
export const isRecentDragInteraction = (delta?: number): boolean => {
  if (delta !== undefined && delta > DRAG_THRESHOLD_PX) {
    return true;
  }
  const now = Date.now();
  return (
    globalInteractionState.isPointerDragging ||
    globalInteractionState.isVehicleDragging ||
    globalInteractionState.isCameraOrbiting ||
    now - globalInteractionState.lastOrbitEndTime < DRAG_COOLDOWN_MS ||
    now - globalInteractionState.lastDragEndTime < DRAG_COOLDOWN_MS ||
    now - globalInteractionState.lastVehicleDragEndTime < DRAG_COOLDOWN_MS
  );
};

/**
 * Centralized background deselection evaluator.
 * Evaluates whether a neutral canvas/scene click is an intentional stationary LEFT click.
 * Strictly ignores right-click, middle-click, wheel, and any drag/orbit interactions.
 */
export const handleNeutralSceneClick = (e: MouseEvent): void => {
  // 1. RULE: Only the primary LEFT button (button === 0) can trigger deselection.
  // Right button (2), Middle button (1) must NEVER deselect.
  if (e.button !== 0) {
    return;
  }

  // 2. RULE: If pointer dragged beyond threshold, it was a camera or vehicle manipulation, NOT a click.
  if (globalInteractionState.isPointerDragging || globalInteractionState.isVehicleDragging) {
    return;
  }

  // 3. RULE: If camera was orbiting or recently ended orbit or vehicle drag, do NOT deselect.
  const now = Date.now();
  if (
    globalInteractionState.isCameraOrbiting ||
    globalInteractionState.isVehicleDragging ||
    now - globalInteractionState.lastOrbitEndTime < DRAG_COOLDOWN_MS ||
    now - globalInteractionState.lastDragEndTime < DRAG_COOLDOWN_MS ||
    now - globalInteractionState.lastVehicleDragEndTime < DRAG_COOLDOWN_MS
  ) {
    return;
  }

  // 4. Intentional stationary neutral left-click detected: contextually clear active spatial selection.
  useWorldStore.getState().clearActiveSpatialSelection();
};

/**
 * GlobalInteractionManager component mounted within the R3F Canvas.
 * Manages canvas-level pointer lifecycle, tracks drag distances, and prevents context menus during right-click orbit.
 */
export const GlobalInteractionManager: React.FC = () => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      globalInteractionState.pointerDownPosition = { x: e.clientX, y: e.clientY };
      globalInteractionState.pointerDownButton = e.button;
      globalInteractionState.isPointerDragging = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!globalInteractionState.pointerDownPosition) return;

      const dx = e.clientX - globalInteractionState.pointerDownPosition.x;
      const dy = e.clientY - globalInteractionState.pointerDownPosition.y;
      const dist = Math.hypot(dx, dy);

      if (dist > DRAG_THRESHOLD_PX) {
        globalInteractionState.isPointerDragging = true;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (globalInteractionState.pointerDownPosition) {
        const dx = e.clientX - globalInteractionState.pointerDownPosition.x;
        const dy = e.clientY - globalInteractionState.pointerDownPosition.y;
        const dist = Math.hypot(dx, dy);

        if (dist > DRAG_THRESHOLD_PX) {
          globalInteractionState.isPointerDragging = true;
          globalInteractionState.lastDragEndTime = Date.now();
        }
      }

      // Reset pointer down tracking
      globalInteractionState.pointerDownPosition = null;
      globalInteractionState.pointerDownButton = null;
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Prevent browser context menu popup during right-mouse camera orbit
      e.preventDefault();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl]);

  return null;
};
