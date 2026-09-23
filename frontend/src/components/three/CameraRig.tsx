import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraRigProps {
  mode?: 'login' | 'register';
  isEnteringPortal: boolean;
  onTransitionComplete: () => void;
}

export const CameraRig: React.FC<CameraRigProps> = ({
  mode = 'login',
  isEnteringPortal,
  onTransitionComplete,
}) => {
  const { camera, pointer } = useThree();
  const transitionProgress = useRef(0);
  const transitionStarted = useRef(false);
  const initialZ = useRef<number | null>(null);

  useFrame((state, delta) => {
    if (isEnteringPortal) {
      if (!transitionStarted.current) {
        transitionStarted.current = true;
        initialZ.current = camera.position.z;
      }

      transitionProgress.current += delta * 0.8;
      const t = Math.min(transitionProgress.current, 1);
      // Ease in-out cubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Move camera forward right through the portal center
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.1);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.5, 0.1);
      camera.position.z = THREE.MathUtils.lerp(initialZ.current ?? 7.8, -8, ease);

      camera.lookAt(0, 1.5, -15);

      if (t >= 1) {
        onTransitionComplete();
      }
    } else {
      // Gentle floating and subtle mouse parallax
      const targetX = pointer.x * 0.5;
      const targetY = 1.6 + pointer.y * 0.3;
      const targetZ = mode === 'register' ? 8.1 : 7.8;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 3);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 3);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 3);

      // Subtle look-at point around the center panel
      camera.lookAt(pointer.x * 0.15, 1.6 + pointer.y * 0.1, 0);
    }
  });

  return null;
};
