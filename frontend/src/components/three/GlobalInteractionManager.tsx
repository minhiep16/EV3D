import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import {
  globalInteractionState,
  DRAG_THRESHOLD_PX,
} from './globalInteractionState';

/**
 * GlobalInteractionManager component mounted within the R3F Canvas.
 * Manages canvas-level pointer lifecycle, tracks drag distances, and prevents context menus during right-click orbit.
 */
export const GlobalInteractionManager: React.FC = () => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest?.('[data-ui-interactive="true"]') ||
          target.closest?.('button, a, input, select, textarea'))
      ) {
        return;
      }
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
