import React from 'react';
import { Grid } from '@react-three/drei';
import { useWorldStore } from '../../store/worldStore';
import { ThreeEvent } from '@react-three/fiber';

export const GarageFloor: React.FC = () => {
  const clearSelection = useWorldStore((state) => state.clearSelection);

  const handleFloorClick = (e: ThreeEvent<MouseEvent>) => {
    // Clear zone selection on background click
    e.stopPropagation();
    clearSelection();
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Primary shadow receiving physical floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
        onClick={handleFloorClick}
      >
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color="#080c16"
          roughness={0.65}
          metalness={0.35}
        />
      </mesh>

      {/* Cybernetic floor grid */}
      <Grid
        position={[0, 0.005, 0]}
        args={[48, 48]}
        cellSize={1}
        cellThickness={1}
        cellColor="#0369a1"
        sectionSize={4}
        sectionThickness={1.5}
        sectionColor="#38bdf8"
        fadeDistance={28}
        fadeStrength={1.5}
      />
    </group>
  );
};
