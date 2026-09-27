import React from 'react';

export const WorldEnvironment: React.FC = () => {
  return (
    <>
      {/* Bright, modern architectural showroom daylight atmosphere */}
      <color attach="background" args={['#eaf1f8']} />
      {/* Soft depth fog tuned for crystal-clear showroom and panoramic window sightlines */}
      <fog attach="fog" args={['#eaf1f8', 45, 95]} />
    </>
  );
};
