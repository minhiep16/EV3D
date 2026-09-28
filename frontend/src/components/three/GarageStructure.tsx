import React from 'react';
import * as THREE from 'three';

/**
 * GarageStructure - High-End Futuristic EV Showroom Architecture
 * Modeled strictly after the EVShare 3D Reference Design:
 * - Sweeping panoramic floor-to-ceiling daylight windows overlooking city skyline
 * - White/light-gray curved architectural header with illuminated EVShare logo
 * - Architectural columns with embedded vertical cyan LED neon strips
 * - Curved glass balustrade railing
 * - Showroom ceramic planters with lush green foliage
 * - Foreground luxury lounge chairs framing the showroom
 * - Concentric glowing cyan floor ring tracks
 */
export const GarageStructure: React.FC = () => {
  // Columns framing the showroom perimeter
  const columnConfigs: { pos: [number, number, number]; facing: number }[] = [
    { pos: [-8.8, 5.0, -3.2], facing: 1 },
    { pos: [8.8, 5.0, -3.2], facing: -1 },
    { pos: [-12.2, 5.0, 2.5], facing: 1 },
    { pos: [12.2, 5.0, 2.5], facing: -1 },
    { pos: [-13.5, 5.0, -8.0], facing: 1 },
    { pos: [13.5, 5.0, -8.0], facing: -1 },
  ];

  // Planter positions flanking the showroom
  const planterPositions: [number, number, number][] = [
    [-8.6, 0, -2.2],
    [8.6, 0, -2.2],
    [-11.8, 0, 3.5],
    [11.8, 0, 3.5],
    [-6.2, 0, -7.5],
    [6.2, 0, -7.5],
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* =========================================================================
          1. PANORAMIC DAYLIGHT SKYLINE BACKDROP & HIGH-RISE WINDOW (Z = -9.5)
          ========================================================================= */}
      <group position={[0, 5.2, -9.5]}>
        {/* Distant Sunny Sky & Mountain Gradient Backdrop */}
        <mesh position={[0, 0, -0.2]}>
          <planeGeometry args={[36, 12]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>

        {/* Distant Mountain Ridges & City Silhouette (Native Geometries) */}
        {/* Soft Blue Mountain Ridge */}
        <mesh position={[0, -2.2, -0.15]}>
          <planeGeometry args={[36, 4.5]} />
          <meshBasicMaterial color="#bae6fd" transparent opacity={0.6} />
        </mesh>
        {/* Skyline High-Rise Silhouettes */}
        {[-14, -11, -8, -5, -2, 1, 4, 7, 10, 13].map((bx, bidx) => {
          const bh = 1.8 + (Math.sin(bidx * 1.7) * 0.5 + 0.5) * 1.8;
          return (
            <mesh key={bidx} position={[bx, -4.5 + bh / 2, -0.1]}>
              <planeGeometry args={[1.6, bh]} />
              <meshBasicMaterial color="#93c5fd" transparent opacity={0.45} />
            </mesh>
          );
        })}

        {/* Floor-to-Ceiling Showroom Glass Window Panes */}
        <mesh receiveShadow position={[0, 0, 0]}>
          <planeGeometry args={[32, 10.5]} />
          <meshStandardMaterial
            color="#f0f9ff"
            roughness={0.08}
            metalness={0.9}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Slender Vertical Window Mullions */}
        {[-12, -8, -4, 0, 4, 8, 12].map((wx, widx) => (
          <mesh key={widx} position={[wx, 0, 0.04]} castShadow>
            <boxGeometry args={[0.09, 10.5, 0.08]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.3} />
          </mesh>
        ))}

        {/* Horizontal Window Transom Beams */}
        {[-3.0, 1.5, 5.2].map((wy, widx) => (
          <mesh key={widx} position={[0, wy, 0.04]}>
            <boxGeometry args={[32, 0.09, 0.08]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.3} />
          </mesh>
        ))}
      </group>

      {/* =========================================================================
          2. SWEEPING CURVED SHOWROOM ARCHWAY & ILLUMINATED BRAND LOGO
          ========================================================================= */}
      <group position={[0, 7.8, -8.2]}>
        {/* Curved Ceiling Bulkhead Canopy */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[16, 16.2, 2.2, 64, 1, true, Math.PI * 0.72, Math.PI * 0.56]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.2}
            metalness={0.15}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Sweeping Cyan Under-Glow Neon Strip on Arch */}
        <mesh position={[0, -0.45, 0.1]}>
          <cylinderGeometry args={[15.9, 15.9, 0.06, 64, 1, true, Math.PI * 0.72, Math.PI * 0.56]} />
          <meshBasicMaterial color="#00f2fe" side={THREE.BackSide} />
        </mesh>
      </group>

      {/* =========================================================================
          3. ARCHITECTURAL SHOWROOM COLUMNS WITH VERTICAL CYAN LED STRIPS
          ========================================================================= */}
      {columnConfigs.map((col, idx) => (
        <group key={idx} position={col.pos}>
          {/* Main Tapered White Architectural Column */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.55, 0.65, 10.0, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.2} />
          </mesh>

          {/* Lower Collar */}
          <mesh position={[0, -4.75, 0]}>
            <cylinderGeometry args={[0.72, 0.78, 0.45, 24]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.25} metalness={0.8} />
          </mesh>

          {/* Upper Capital Collar */}
          <mesh position={[0, 4.8, 0]}>
            <cylinderGeometry args={[0.78, 0.72, 0.35, 24]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.25} metalness={0.8} />
          </mesh>

          {/* Recessed Vertical Cyan LED Neon Strip */}
          <mesh position={[0, 0, 0.58]}>
            <boxGeometry args={[0.04, 7.8, 0.03]} />
            <meshBasicMaterial color="#00f2fe" />
          </mesh>
        </group>
      ))}

      {/* =========================================================================
          4. CURVED SHOWROOM GLASS BALUSTRADES / RAILINGS (REAR PERIMETER)
          ========================================================================= */}
      <group position={[0, 0, -6.5]}>
        {/* Curved Balustrade Glass Panel */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[11.5, 11.5, 1.0, 48, 1, true, Math.PI * 0.75, Math.PI * 0.5]} />
          <meshStandardMaterial
            color="#e0f2fe"
            roughness={0.1}
            metalness={0.85}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Polished Chrome Top Handrail */}
        <mesh position={[0, 1.05, 0]}>
          <cylinderGeometry args={[11.5, 11.5, 0.04, 48, 1, true, Math.PI * 0.75, Math.PI * 0.5]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* =========================================================================
          5. SHOWROOM POTTED PLANTS (NATIVE THREE.JS GEOMETRY - ZERO EXTERNAL ASSETS)
          ========================================================================= */}
      {planterPositions.map((pPos, pIdx) => (
        <group key={pIdx} position={pPos}>
          {/* Tapered White Ceramic Planter Pot */}
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.34, 0.24, 0.9, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.15} />
          </mesh>
          {/* Soil Base */}
          <mesh position={[0, 0.88, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.04, 24]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
          {/* Elegant Showroom Foliage Leaves Cluster */}
          <group position={[0, 1.25, 0]}>
            {[
              { pos: [0, 0.2, 0], scale: [0.38, 0.55, 0.38] },
              { pos: [-0.15, 0.45, 0.1], scale: [0.32, 0.48, 0.32] },
              { pos: [0.15, 0.42, -0.08], scale: [0.34, 0.46, 0.34] },
              { pos: [0.08, 0.7, 0.05], scale: [0.26, 0.38, 0.26] },
            ].map((leaf, lIdx) => (
              <mesh key={lIdx} position={leaf.pos as [number, number, number]} castShadow>
                <sphereGeometry args={[1, 16, 16]} />
                <meshStandardMaterial
                  color={lIdx % 2 === 0 ? '#166534' : '#15803d'}
                  roughness={0.4}
                  metalness={0.1}
                />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* =========================================================================
          6. FOREGROUND LUXURY LOUNGE ARMCHAIRS (FRAMING THE ARCHITECTURAL SHOT)
          ========================================================================= */}
      {/* Left Modern Lounge Chair */}
      <group position={[-5.8, 0, 5.8]} rotation={[0, 0.65, 0]}>
        {/* Base Cushion */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.42, 1.0]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.65, -0.4]} castShadow>
          <boxGeometry args={[1.1, 0.55, 0.22]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Left Armrest */}
        <mesh position={[-0.52, 0.48, 0]}>
          <boxGeometry args={[0.18, 0.42, 1.0]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.25} metalness={0.15} />
        </mesh>
        {/* Right Armrest */}
        <mesh position={[0.52, 0.48, 0]}>
          <boxGeometry args={[0.18, 0.42, 1.0]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.25} metalness={0.15} />
        </mesh>
      </group>

      {/* Right Modern Lounge Chair */}
      <group position={[5.8, 0, 5.8]} rotation={[0, -0.65, 0]}>
        {/* Base Cushion */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.42, 1.0]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.65, -0.4]} castShadow>
          <boxGeometry args={[1.1, 0.55, 0.22]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Left Armrest */}
        <mesh position={[-0.52, 0.48, 0]}>
          <boxGeometry args={[0.18, 0.42, 1.0]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.25} metalness={0.15} />
        </mesh>
        {/* Right Armrest */}
        <mesh position={[0.52, 0.48, 0]}>
          <boxGeometry args={[0.18, 0.42, 1.0]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.25} metalness={0.15} />
        </mesh>
      </group>

      {/* =========================================================================
          7. GLOWING CONCENTRIC SHOWROOM FLOOR TRACK RINGS (CONNECTING THE ZONES)
          ========================================================================= */}
      <group position={[0, 0.005, 0]}>
        {/* Giant Main Showroom Floor Ring (Cyan Illuminated Inlay Ring) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[7.25, 7.33, 96]} />
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.7} />
        </mesh>

        {/* Secondary Outer Concentric Floor Guide Seam */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[9.4, 9.44, 96]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
        </mesh>

        {/* Inner Concentric Seam Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.8, 4.83, 96]} />
          <meshBasicMaterial color="#cbd5e1" transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  );
};
