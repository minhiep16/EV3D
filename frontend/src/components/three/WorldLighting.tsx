import React from 'react';

/**
 * WorldLighting - Bright Premium EV Showroom Daylight Lighting
 * Modeled after the EVShare 3D Reference Design:
 * - Natural, bright high-key architectural illumination
 * - Crisp directional daylight casting soft shadows
 * - Soft hemisphere sky-to-ground bounce
 * - Subtle cyan accent lighting highlighting EV01 and platforms
 */
export const WorldLighting: React.FC = () => {
  return (
    <>
      {/* 1. Global Hemisphere Skylight: Natural daylight sky bounce */}
      <hemisphereLight
        args={['#ffffff', '#e2e8f0', 1.5]}
      />

      {/* 2. Soft Ambient Fill for pristine high-key showroom tones */}
      <ambientLight intensity={0.75} color="#ffffff" />

      {/* 3. Primary Key Showroom Light casting soft, realistic automotive shadows */}
      <directionalLight
        position={[8, 18, 10]}
        intensity={2.0}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0001}
      />

      {/* 4. Secondary Front-Left Fill Daylight: Illuminates front bumper, badges, and driver profile */}
      <directionalLight
        position={[-10, 14, 12]}
        intensity={1.1}
        color="#f0f9ff"
      />

      {/* 5. Rim / Edge Sunlight from Rear Windows: Accentuates EV01's aerodynamic silhouette */}
      <directionalLight
        position={[0, 12, -10]}
        intensity={1.2}
        color="#ffffff"
      />

      {/* 6. Showroom Ceiling Troffer Soft Downlights */}
      <pointLight
        position={[0, 7.5, -2]}
        intensity={1.0}
        distance={28}
        decay={2}
        color="#ffffff"
      />
      <pointLight
        position={[0, 7.5, 3.5]}
        intensity={1.0}
        distance={28}
        decay={2}
        color="#ffffff"
      />

      {/* 7. Subtle Cyan Stage Accent on EV01 Hero Turntable */}
      <pointLight
        position={[0, 2.2, 1.8]}
        intensity={0.45}
        distance={7}
        color="#00f2fe"
      />
    </>
  );
};
