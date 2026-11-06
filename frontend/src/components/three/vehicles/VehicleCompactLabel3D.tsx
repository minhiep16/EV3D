import React from 'react';
import { Html } from '@react-three/drei';

interface VehicleCompactLabel3DProps {
  displayName: string;
  code: string;
  licensePlate?: string | null;
  position?: [number, number, number];
  distanceFactor?: number;
}

/**
 * Compact World-Space 3D Vehicle Name & Identity Label
 * Section 1: Vehicle Label Visibility Optimization
 * - 200–240px width bounded layout (220px fixed)
 * - Two-line layout:
 *     Line 1: Persisted vehicle name
 *     Line 2: `${code} · ${licensePlate}`
 * - Shown only for explicitly clicked/selected vehicle
 * - Dismissed on empty stage click
 */
export const VehicleCompactLabel3D: React.FC<VehicleCompactLabel3DProps> = ({
  displayName,
  code,
  licensePlate,
  position = [0, 1.85, 0],
  distanceFactor = 12,
}) => {
  return (
    <Html position={position} center distanceFactor={distanceFactor} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          width: '220px',
          maxWidth: '240px',
          background: 'rgba(7, 20, 38, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.2px solid rgba(0, 242, 254, 0.65)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(0, 242, 254, 0.3)',
          borderRadius: '12px',
          padding: '8px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          textAlign: 'center',
          pointerEvents: 'auto',
          userSelect: 'none',
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Line 1: Persisted vehicle name */}
        <div
          style={{
            color: '#ffffff',
            fontSize: '12.5px',
            fontWeight: 800,
            letterSpacing: '0.02em',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
          title={displayName}
        >
          {displayName}
        </div>

        {/* Line 2: ${code} · ${licensePlate} */}
        <div
          style={{
            color: '#00f2fe',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
        >
          {code} · {licensePlate || 'Chưa đăng ký'}
        </div>
      </div>
    </Html>
  );
};

