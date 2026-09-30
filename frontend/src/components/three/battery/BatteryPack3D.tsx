import React, { useMemo, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { BatteryHealthResponse } from '../../../types/battery';
import {
  BATTERY_VISUAL_CONFIGS,
  BATTERY_STATUS_THEMES,
} from '../../../config/batteryVisualConfig';
import { useWorldStore } from '../../../store/worldStore';
import { Activity, Zap } from 'lucide-react';

export interface BatteryPack3DProps {
  vehicleCode?: 'EV01' | 'EV02';
  batteryHealth?: BatteryHealthResponse | null;
  selected?: boolean;
  xrayEnabled?: boolean;
  onSelectBattery?: () => void;
}

export const BatteryPack3D: React.FC<BatteryPack3DProps> = ({
  vehicleCode = 'EV01',
  batteryHealth,
  selected = false,
  xrayEnabled = false,
  onSelectBattery,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const pulseGroupRef = useRef<THREE.Group>(null);
  const glowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const moduleGlowMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);
  const selectVehiclePartCode = useWorldStore((state) => state.selectVehiclePartCode);

  const config = useMemo(() => {
    return BATTERY_VISUAL_CONFIGS[vehicleCode] || BATTERY_VISUAL_CONFIGS.EV01;
  }, [vehicleCode]);

  const statusTheme = useMemo(() => {
    const status = batteryHealth?.batteryStatus || 'NORMAL';
    return BATTERY_STATUS_THEMES[status] || BATTERY_STATUS_THEMES.NORMAL;
  }, [batteryHealth?.batteryStatus]);

  // Subtle continuous harmonic pulse in X-Ray mode
  useFrame((state) => {
    if (!xrayEnabled) return;
    const t = state.clock.getElapsedTime();
    const pulseFactor = 0.85 + Math.sin(t * 2.8) * 0.25;

    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity = Math.min(1.0, (isHovered ? 0.95 : 0.72) * pulseFactor);
    }
    if (moduleGlowMaterialRef.current) {
      moduleGlowMaterialRef.current.emissiveIntensity =
        (selected ? 1.4 : isHovered ? 1.2 : 0.85) * pulseFactor;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectVehiclePart('BATTERY');
    selectVehiclePartCode('BATTERY');
    if (onSelectBattery) {
      onSelectBattery();
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = 'auto';
  };

  // Generate visual module blocks within the pack
  const modulePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const { moduleRows, moduleCols, moduleSpacing, size } = config;
    const [packW, , packL] = size;

    const totalSpacingX = (moduleCols - 1) * moduleSpacing;
    const totalSpacingZ = (moduleRows - 1) * moduleSpacing;
    const availableW = packW * 0.88 - totalSpacingX;
    const availableZ = packL * 0.86 - totalSpacingZ;

    const modW = availableW / moduleCols;
    const modZ = availableZ / moduleRows;

    const startX = -((moduleCols - 1) * (modW + moduleSpacing)) / 2;
    const startZ = -((moduleRows - 1) * (modZ + moduleSpacing)) / 2;

    for (let r = 0; r < moduleRows; r++) {
      for (let c = 0; c < moduleCols; c++) {
        const x = startX + c * (modW + moduleSpacing);
        const z = startZ + r * (modZ + moduleSpacing);
        positions.push([x, 0.02, z]);
      }
    }
    return { positions, modW, modZ };
  }, [config]);

  if (!xrayEnabled) {
    return null;
  }

  const [packW, packH, packL] = config.size;

  return (
    <group
      position={config.position}
      name="BatteryPack3D_Root"
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 1. Structural Lower Protective Battery Tray (Sturdy aerospace aluminum composite) */}
      <mesh position={[0, -packH * 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[packW, packH * 0.7, packL]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.88}
          roughness={0.25}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* 2. Heavy-Duty Side Impact Protection Rails */}
      <mesh position={[-packW / 2 + 0.03, 0, 0]}>
        <boxGeometry args={[0.06, packH * 0.9, packL]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[packW / 2 - 0.03, 0, 0]}>
        <boxGeometry args={[0.06, packH * 0.9, packL]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 3. Perimeter Glowing Electric LED Ring (Status indicator) */}
      <group position={[0, packH * 0.28, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[packW * 0.96, packL * 0.96]} />
          <meshBasicMaterial
            ref={glowMaterialRef}
            color={statusTheme.glowColor}
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 4. Internal Cell Module Array (Visual segmentation) */}
      <group ref={pulseGroupRef}>
        {modulePositions.positions.map((pos, idx) => (
          <group key={`battery_module_${idx}`} position={pos}>
            {/* Cell Module Enclosure */}
            <mesh position={[0, config.moduleHeight / 2, 0]}>
              <boxGeometry
                args={[
                  modulePositions.modW,
                  config.moduleHeight,
                  modulePositions.modZ,
                ]}
              />
              <meshStandardMaterial
                ref={idx === 0 ? moduleGlowMaterialRef : undefined}
                color="#0f172a"
                emissive={new THREE.Color(statusTheme.glowColor)}
                emissiveIntensity={selected ? 0.9 : isHovered ? 0.75 : 0.55}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>

            {/* Top Cell Terminal Stripe */}
            <mesh position={[0, config.moduleHeight + 0.005, 0]}>
              <boxGeometry
                args={[
                  modulePositions.modW * 0.85,
                  0.006,
                  modulePositions.modZ * 0.25,
                ]}
              />
              <meshBasicMaterial
                color={statusTheme.glowColor}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5. High-Voltage Junction Box (Front Power Distribution Unit) */}
      <mesh
        position={[
          config.junctionBox.position[0],
          config.junctionBox.position[1] - config.position[1],
          config.junctionBox.position[2] - config.position[2],
        ]}
      >
        <boxGeometry args={config.junctionBox.size} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.8}
          roughness={0.2}
          emissive={new THREE.Color(statusTheme.glowColor)}
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* High-Voltage Signature Orange Heavy Cables */}
      <mesh
        position={[
          0.12,
          packH * 0.45,
          config.junctionBox.position[2] - config.position[2] - 0.14,
        ]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.016, 0.016, 0.35, 16]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh
        position={[
          -0.12,
          packH * 0.45,
          config.junctionBox.position[2] - config.position[2] - 0.14,
        ]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.016, 0.016, 0.35, 16]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* 6. Translucent Protective Top Polycarbonate Cover */}
      <mesh position={[0, packH * 0.38, 0]}>
        <boxGeometry args={[packW * 0.98, 0.02, packL * 0.98]} />
        <meshStandardMaterial
          color={statusTheme.glowColor}
          transparent
          opacity={isHovered ? 0.35 : 0.22}
          roughness={0.1}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* 7. Invisible Interaction Hitbox (Ensures reliable click anywhere on pack) */}
      <mesh position={[0, packH * 0.3, 0]}>
        <boxGeometry args={[packW * 1.15, packH * 2.2, packL * 1.15]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 8. Floating In-Scene 3D Micro-Indicator above Battery Pack */}
      <group position={[0, packH * 1.25, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={7.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(8, 16, 28, 0.90)',
                backdropFilter: 'blur(12px)',
                border: `1.5px solid ${statusTheme.glowColor}`,
                borderRadius: '20px',
                padding: '4px 12px',
                color: '#ffffff',
                fontFamily: 'var(--font-family, sans-serif)',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                boxShadow: `0 0 16px ${statusTheme.glowColor}44`,
                whiteSpace: 'nowrap',
              }}
            >
              <Zap size={12} color={statusTheme.glowColor} />
              <span>PIN CAO ÁP</span>
              <span
                style={{
                  background: statusTheme.badgeBg,
                  color: statusTheme.accentHex,
                  padding: '1px 6px',
                  borderRadius: '6px',
                  fontSize: '10px',
                }}
              >
                {batteryHealth?.stateOfChargePercent != null
                  ? `${batteryHealth.stateOfChargePercent}%`
                  : '82%'}
              </span>
              {batteryHealth?.stateOfHealthPercent != null && (
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>
                  | SOH: {batteryHealth.stateOfHealthPercent}%
                </span>
              )}
            </div>
          </Html>
        </Billboard>
      </group>
    </group>
  );
};
