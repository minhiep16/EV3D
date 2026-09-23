import React from 'react';
import { Stars } from '@react-three/drei';

export const WorldEnvironment: React.FC = () => {
  return (
    <>
      <color attach="background" args={['#070b14']} />
      <fog attach="fog" args={['#070b14', 16, 42]} />

      {/* Atmospheric distant stars */}
      <Stars
        radius={60}
        depth={30}
        count={2000}
        factor={3}
        saturation={0.4}
        fade
        speed={0.6}
      />
    </>
  );
};
