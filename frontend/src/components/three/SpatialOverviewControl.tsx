import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore, ZONE_CAMERA_PRESETS } from '../../store/worldStore';
import { Eye, RotateCcw } from 'lucide-react';

export const SpatialOverviewControl: React.FC = () => {
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const clearSelection = useWorldStore((state) => state.clearSelection);

  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);

  // Active only when camera is focused on a specific vehicle or zone
  const isFocused = !!selectedZone || !!selectedVehicleId;

  // Determine anchor position based on current focus target
  const targetPos = React.useMemo<[number, number, number] | null>(() => {
    if (!isFocused) return null;

    if (selectedVehicleId) {
      if (vehicleBookingMode || vehicleHandoverMode) {
        // In booking or handover mode, position low and slightly to the left under EV01 front
        // so it stays clearly visible at the bottom without competing with spatial panels
        return [-6.8, 0.22, 7.8];
      }
      // Near EV01 focus point, floating low and centered
      return [-7.1, 0.35, 7.2];
    }
    if (selectedZone) {
      const preset = ZONE_CAMERA_PRESETS[selectedZone];
      if (preset) {
        // Offset slightly in front and lower than the zone target
        const [tx, ty, tz] = preset.target;
        return [tx, Math.max(ty - 0.5, 0.35), tz + 1.8];
      }
    }
    return [0, 0.35, 6];
  }, [isFocused, selectedZone, selectedVehicleId, vehicleBookingMode, vehicleHandoverMode]);

  useFrame((_, delta) => {
    if (!isFocused || !groupRef.current) return;

    // Smooth hover scale
    const targetScale = hovered ? 1.08 : 1.0;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 8
    );

    // Idle rotation of the holographic ring and core
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (hovered ? 2.5 : 1.2);
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 1.5;
    }
  });

  if (!isFocused || !targetPos) return null;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    clearSelection();
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group
      ref={groupRef}
      position={targetPos}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 1. Ground Projector Base Ring */}
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.38, 32]} />
        <meshBasicMaterial
          color={hovered ? '#00f2fe' : '#38bdf8'}
          transparent
          opacity={hovered ? 0.9 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Vertical Light Beacon Ray */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.015, 0.03, 0.3, 16]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={hovered ? 0.6 : 0.25}
        />
      </mesh>

      {/* 3. Orbiting Holographic Ring */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <torusGeometry args={[0.22, 0.016, 16, 32]} />
        <meshStandardMaterial
          color={hovered ? '#00f2fe' : '#38bdf8'}
          emissive={hovered ? '#00f2fe' : '#0284c7'}
          emissiveIntensity={hovered ? 2.5 : 1.2}
          roughness={0.2}
        />
      </mesh>

      {/* 4. Central Diamond Core */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <octahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={hovered ? '#00f2fe' : '#38bdf8'}
          emissiveIntensity={hovered ? 3.0 : 1.5}
        />
      </mesh>

      {/* 5. Spatial Label Floating Beside Holographic Core */}
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={8.5}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            background: hovered
              ? 'rgba(0, 242, 254, 0.22)'
              : 'rgba(8, 12, 22, 0.92)',
            backdropFilter: 'blur(16px)',
            border: `1.5px solid ${hovered ? '#00f2fe' : 'rgba(56, 189, 248, 0.5)'}`,
            boxShadow: hovered
              ? '0 0 28px rgba(0, 242, 254, 0.6), 0 8px 30px rgba(0, 0, 0, 0.85)'
              : '0 0 16px rgba(56, 189, 248, 0.25), 0 6px 20px rgba(0, 0, 0, 0.75)',
            borderRadius: '9999px',
            padding: '8px 18px',
            color: '#ffffff',
            fontFamily: 'var(--font-family)',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            transform: hovered ? 'scale(1.04)' : 'none',
          }}
        >
          <RotateCcw size={13} color="#00f2fe" />
          <span>QUAY LẠI TOÀN CẢNH GARAGE</span>
        </div>
      </Html>
    </group>
  );
};
