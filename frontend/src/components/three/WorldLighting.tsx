import React from 'react';

export const WorldLighting: React.FC = () => {
  return (
    <>
      {/* Base ambient illumination */}
      <ambientLight intensity={0.45} color="#f8fafc" />

      {/* Primary directional sun/ceiling lamp casting soft shadows */}
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0001}
      />

      {/* Cyber blue fill light from the opposite side */}
      <directionalLight
        position={[-10, 8, -10]}
        intensity={0.4}
        color="#38bdf8"
      />

      {/* Central overhead ambient garage lamp */}
      <pointLight
        position={[0, 6, 0]}
        intensity={0.8}
        distance={22}
        color="#00f2fe"
      />
    </>
  );
};
