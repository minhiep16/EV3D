import React from 'react';

/**
 * WorldLighting - High-Fidelity Luxury EV Showroom Daylight Lighting
 * Modeled strictly after the EVShare 3D Reference Design:
 * - Natural, luminous high-key architectural illumination
 * - Crisp, elegant automotive specular highlights on hood, windshield, roof, and shoulder lines
 * - Overhead studio key light integrated with circular ceiling halo
 * - Soft hemisphere sky-to-ground bounce for luminous interior feeling
 * - Controlled cyan accent lighting on turntable platform & ceiling accent
 */
export const WorldLighting: React.FC = () => {
  return (
    <>
      {/* 1. Global Hemisphere Skylight: Luminous daylight sky to soft neutral floor bounce */}
      <hemisphereLight
        args={['#f8fafc', '#94a3b8', 1.30]}
      />

      {/* 2. Soft Ambient Fill for airy, high-key showroom brightness without flat wash */}
      <ambientLight intensity={0.52} color="#f1f5f9" />

      {/* 3. Primary Key Sunlight streaming through the panoramic glass wall */}
      <directionalLight
        position={[9, 16, -17]}
        intensity={1.30}
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
        shadow-bias={-0.00008}
      />

      {/* 4. Secondary Front-Left Fill Daylight: Soft ambient contour illumination */}
      <directionalLight
        position={[-14, 11, 15]}
        intensity={0.20}
        color="#f0f9ff"
      />

      {/* 5. Rim / Edge Sunlight from Rear Windows: Accentuates EV01's aerodynamic roofline & shoulder contour */}
      <directionalLight
        position={[0, 8.5, -12]}
        intensity={0.70}
        color="#ffffff"
      />

      {/* 6. Studio Ceiling Downlight: Silenced on vehicle hood to eliminate direct downward scorching */}
      <spotLight
        position={[0, 7.3, 2.2]}
        intensity={0.0}
        angle={0.85}
        penumbra={0.95}
        distance={22}
        color="#ffffff"
      />

      {/* 7. Soft Overhead Ceiling Dome Halo Wash */}
      <pointLight
        position={[0, 7.2, 2.2]}
        intensity={0.45}
        distance={20}
        decay={2}
        color="#ffffff"
      />

      {/* 8. Controlled, Luminous Cyan Accent Floor Bounce on EV01 Hero Turntable */}
      <pointLight
        position={[0, 0.12, 1.8]}
        intensity={0.95}
        distance={4.8}
        decay={2}
        color="#00f2fe"
      />

      {/* 9. Soft Daylight Fill for Right Column & Window Perimeter */}
      <pointLight
        position={[8.5, 4.0, -2.5]}
        intensity={0.45}
        distance={12}
        decay={2}
        color="#dbeafe"
      />
    </>
  );
};

