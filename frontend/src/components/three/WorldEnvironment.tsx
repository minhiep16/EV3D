import React from 'react';
import { Environment, Lightformer } from '@react-three/drei';

/**
 * WorldEnvironment - High-Fidelity Showroom Atmosphere & Offline IBL Reflection System
 * Generates an in-memory high-dynamic-range reflection cubemap (rendered once at startup, 0 network overhead)
 * so vehicle automotive paint, glass, metal columns, podium trim, and showroom floor receive authentic reflections.
 */
export const WorldEnvironment: React.FC = () => {
  return (
    <>
      {/* Bright, high-key architectural showroom daylight background */}
      <color attach="background" args={['#d6e6f5']} />
      {/* Soft depth fog tuned for crystal-clear showroom sightlines and subtle atmospheric horizon */}
      <fog attach="fog" args={['#d6e6f5', 55, 140]} />

      {/* High-resolution in-memory studio reflection map (frames={1} = 0 per-frame GPU re-render cost) */}
      <Environment resolution={512} frames={1}>
        {/* 1. Overhead Ceiling Dual Ring Reflections (Soft, elegant studio ceiling highlights) */}
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 7.4, 2.2]}>
          <Lightformer form="ring" intensity={2.0} color="#ffffff" scale={14.5} target={[0, 0, 0]} />
          <Lightformer form="ring" intensity={1.5} color="#00e5ff" scale={9.8} target={[0, 0, 0]} />
          <Lightformer form="circle" intensity={0.7} color="#ffffff" scale={1.8} target={[0, 0, 0]} />
        </group>

        {/* 2. Panoramic Window Exterior Daylight Bank & Sky Reflection */}
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#e0f2fe"
          scale={[55, 22, 1]}
          position={[0, 7, -25]}
          target={[0, 0, 0]}
        />
        {/* Horizon daylight strip for crisp water/sky specular gradient */}
        <Lightformer
          form="rect"
          intensity={1.8}
          color="#bae6fd"
          scale={[60, 4, 1]}
          position={[0, 1.5, -24]}
          target={[0, 0, 0]}
        />

        {/* 3. Front Showroom Daylight Softbox for Gentle Bumper & Hood Rolloff */}
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#ffffff"
          scale={[32, 14, 1]}
          position={[0, 5, 17]}
          target={[0, 0, 0]}
        />

        {/* 4. Left & Right Fill Lightformers for Vehicle Shoulder Lines & Cylindrical Columns */}
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#f8fafc"
          scale={[22, 16, 1]}
          position={[-18, 6, 2]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#f0f9ff"
          scale={[22, 16, 1]}
          position={[18, 6, 2]}
          target={[0, 0, 0]}
        />

        {/* 5. Floor Bounce Lightformer for Soft Underbody Illumination */}
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#f1f5f9"
          scale={[24, 24, 1]}
          position={[0, -2, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          target={[0, 0, 0]}
        />
      </Environment>
    </>
  );
};

