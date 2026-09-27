import React from 'react';

/**
 * GarageFloor - Polished Luxury EV Showroom Floor
 * Modeled after the EVShare 3D Reference Design:
 * - High-gloss, pristine white / light-pearl epoxy floor
 * - Smooth reflections of EV01 and platforms
 * - Clean concentric expansion seams and architectural inlays
 */
export const GarageFloor: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* 1. Primary Polished Showroom Floor (High-Gloss Pearl-White Epoxy) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial
          color="#f1f5f9"
          roughness={0.14}
          metalness={0.22}
        />
      </mesh>

      {/* 2. Central High-End Showroom Polished Inner Area */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.005, 0]}
        receiveShadow
      >
        <planeGeometry args={[36, 28]} />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.12}
          metalness={0.18}
        />
      </mesh>

      {/* 3. Subtle Showroom Radial Tile Joint Lines */}
      {[-8, -4, 0, 4, 8].map((lx, idx) => (
        <mesh key={`x-${idx}`} position={[lx, 0.001, 0]}>
          <boxGeometry args={[0.02, 0.002, 28]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.6} />
        </mesh>
      ))}

      {[-6, -2, 2, 6].map((lz, idx) => (
        <mesh key={`z-${idx}`} position={[0, 0.001, lz]}>
          <boxGeometry args={[36, 0.002, 0.02]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* 4. Perimeter Expansion Border Inset */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[17.8, 17.9, 96]} />
        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};
