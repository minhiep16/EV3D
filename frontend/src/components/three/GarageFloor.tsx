import React from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';

/**
 * GarageFloor - High-Fidelity Polished Luxury EV Showroom Floor
 * Modeled strictly after the EVShare 3D Reference Design:
 * - High-gloss, pristine pearl-white polished epoxy showroom finish
 * - Clear, soft reflections of the circular ceiling light rings, podium, cyan LED halo, and panoramic windows
 * - Refined circular floor expansion joints centered on the hero turntable
 * - Smooth, high-performance PBR reflection response
 */
export const GarageFloor: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* 1. Primary High-Gloss Luxury Showroom Epoxy Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.005, 0]}
        receiveShadow
      >
        <planeGeometry args={[120, 120]} />
        <MeshReflectorMaterial
          blur={[200, 50]}
          resolution={1024}
          mirror={0.74}
          mixBlur={0.65}
          mixStrength={3.4}
          roughness={0.05}
          depthScale={1.2}
          minDepthThreshold={0.2}
          maxDepthThreshold={1.5}
          color="#f8fafc"
          metalness={0.10}
        />
      </mesh>

      {/* 2. Hero Turntable Floor Expansion Rings & Concentric Floor Reflection Accents */}
      <group position={[0, 0.001, 1.8]}>
        {/* Inner perimeter reveal joint around podium */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.08, 3.10, 96]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.30} />
        </mesh>

        {/* First architectural floor expansion joint */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.85, 3.868, 96]} />
          <meshBasicMaterial color="#cbd5e1" transparent opacity={0.26} />
        </mesh>

        {/* Second broad floor expansion ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.95, 4.968, 96]} />
          <meshBasicMaterial color="#cbd5e1" transparent opacity={0.20} />
        </mesh>

        {/* Crisp Cyan Concentric Accent Ring embedded in showroom floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.48, 3.52, 96]} />
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.45} />
        </mesh>

        {/* Soft, diffuse cyan floor bounce spreading gently outward from hero podium LED strip */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.95, 4.60, 96]} />
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.22} />
        </mesh>
      </group>

      {/* 3. Perimeter Architecture Guide Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[16.5, 16.53, 96]} />
        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.18} />
      </mesh>
    </group>
  );
};

