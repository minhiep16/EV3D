import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  HANDOVER_CHECKPOINTS,
  VehicleInspectionItem,
} from '../../../types/handover';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HandoverProgressVisualizer3DProps {
  inspections: VehicleInspectionItem[];
  position?: [number, number, number];
}

export const HandoverProgressVisualizer3D: React.FC<HandoverProgressVisualizer3DProps> = ({
  inspections,
  position = [0, 1.85, 0.2],
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringGroupRef = useRef<THREE.Group>(null);

  const totalCount = HANDOVER_CHECKPOINTS.length;
  const inspectedCount = inspections.length;
  const isComplete = inspectedCount >= totalCount;

  // Animate ring slow rotation
  useFrame((_, delta) => {
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.z += delta * 0.4;
    }
  });

  // Segments geometry calculation: 8 segments arranged radially
  const segments = React.useMemo(() => {
    const radius = 0.48;
    const gapAngle = (Math.PI * 2) / totalCount;
    const arcLength = gapAngle * 0.78; // Leave small gap between segments

    return HANDOVER_CHECKPOINTS.map((checkpoint, index) => {
      const startAngle = index * gapAngle - Math.PI / 2;
      const endAngle = startAngle + arcLength;

      const inspection = inspections.find(
        (i) => i.vehiclePartCode === checkpoint.code
      );
      const isInspected = !!inspection;

      let segColor = '#334155'; // Uninspected dim slate
      let emissiveIntensity = 0.2;
      if (inspection) {
        if (inspection.conditionStatus === 'GOOD') segColor = '#10b981';
        else if (inspection.conditionStatus === 'WARNING') segColor = '#f59e0b';
        else if (inspection.conditionStatus === 'DAMAGED') segColor = '#ef4444';
        emissiveIntensity = 2.0;
      }

      // Generate arc shape
      const shape = new THREE.Shape();
      const innerR = radius - 0.04;
      const outerR = radius + 0.04;

      const steps = 16;
      for (let s = 0; s <= steps; s++) {
        const theta = startAngle + (arcLength * s) / steps;
        const x = Math.cos(theta) * outerR;
        const y = Math.sin(theta) * outerR;
        if (s === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      for (let s = steps; s >= 0; s--) {
        const theta = startAngle + (arcLength * s) / steps;
        const x = Math.cos(theta) * innerR;
        const y = Math.sin(theta) * innerR;
        shape.lineTo(x, y);
      }
      shape.closePath();

      const geometry = new THREE.ShapeGeometry(shape);

      return {
        code: checkpoint.code,
        geometry,
        color: segColor,
        isInspected,
        emissiveIntensity,
      };
    });
  }, [inspections, totalCount]);

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Rotating Segmented 3D Ring (Decorative: raycast disabled) */}
      <group ref={ringGroupRef}>
        {segments.map((seg) => (
          <mesh key={seg.code} geometry={seg.geometry} raycast={() => null}>
            <meshStandardMaterial
              color={seg.color}
              emissive={seg.color}
              emissiveIntensity={seg.emissiveIntensity}
              transparent
              opacity={seg.isInspected ? 0.95 : 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* 2. Inner Glowing Core Disk (Decorative: raycast disabled) */}
      <mesh raycast={() => null}>
        <circleGeometry args={[0.38, 32]} />
        <meshBasicMaterial
          color={isComplete ? '#052e16' : '#080c16'}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Center Spatial Counter & Status Label */}
      <Html center distanceFactor={8.0} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div
          style={{
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            width: '130px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: isComplete ? '#34d399' : '#38bdf8',
              fontSize: '8.5px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '2px',
            }}
          >
            {isComplete ? <CheckCircle2 size={11} /> : <ShieldCheck size={11} />}
            <span>KIỂM TRA BÀN GIAO</span>
          </div>

          <div
            style={{
              fontSize: '20px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              textShadow: isComplete
                ? '0 0 12px rgba(16, 185, 129, 0.8)'
                : '0 0 10px rgba(56, 189, 248, 0.6)',
            }}
          >
            <span style={{ color: isComplete ? '#34d399' : '#38bdf8' }}>
              {inspectedCount}
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8', margin: '0 2px' }}>/</span>
            <span style={{ fontSize: '14px', color: '#cbd5e1' }}>{totalCount}</span>
          </div>

          <div
            style={{
              fontSize: '8px',
              fontWeight: 700,
              color: isComplete ? '#34d399' : '#94a3b8',
              letterSpacing: '0.04em',
              marginTop: '1px',
            }}
          >
            {isComplete ? 'HOÀN TẤT ĐIỂM KIỂM TRA' : 'ĐIỂM ĐÃ HOÀN THÀNH'}
          </div>
        </div>
      </Html>
    </group>
  );
};
