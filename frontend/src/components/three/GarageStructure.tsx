import React from 'react';

export const GarageStructure: React.FC = () => {
  const pillarPositions: [number, number, number][] = [
    [-14, 3.5, -10],
    [14, 3.5, -10],
    [-14, 3.5, 10],
    [14, 3.5, 10],
    [-14, 3.5, 0],
    [14, 3.5, 0],
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Structural Support Pillars */}
      {pillarPositions.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Main Pillar Body */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.8, 7.0, 0.8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.8} />
          </mesh>
          {/* Vertical Blue LED Emissive Strip */}
          <mesh position={[pos[0] > 0 ? -0.41 : 0.41, 0, 0]}>
            <boxGeometry args={[0.02, 5.0, 0.1]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
        </group>
      ))}

      {/* 2. Overhead Structural Perimeter Beams */}
      <group position={[0, 7.0, 0]}>
        {/* Longitudinal Beams */}
        <mesh position={[-14, 0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.6, 20]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} />
        </mesh>
        <mesh position={[14, 0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.6, 20]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} />
        </mesh>
        {/* Cross Trusses */}
        <mesh position={[0, 0, -10]} castShadow>
          <boxGeometry args={[28, 0.5, 0.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[28, 0.5, 0.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, 10]} castShadow>
          <boxGeometry args={[28, 0.5, 0.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} />
        </mesh>
      </group>

      {/* 3. Central Staging Nexus Circle on Floor */}
      <group position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 3.0, 64]} />
        <meshBasicMaterial color="#0369a1" transparent opacity={0.6} />
      </group>
      <group position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.2, 4.3, 64]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.3} />
      </group>

      {/* 4. Floor Guidance Strip Lines Connecting Zones */}
      {/* Line West to East */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[22, 0.01, 0.08]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.4} />
      </mesh>
      {/* Line North to South */}
      <mesh position={[0, 0.01, 2]}>
        <boxGeometry args={[0.08, 0.01, 24]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};
