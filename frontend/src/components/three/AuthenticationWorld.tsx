import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Grid } from '@react-three/drei';
import { CameraRig } from './CameraRig';
import { LoginPortal } from './LoginPortal';
import { SpatialLoginPanel } from '../spatial-ui/SpatialLoginPanel';
import { SpatialRegisterPanel } from '../spatial-ui/SpatialRegisterPanel';

interface AuthenticationWorldProps {
  mode: 'login' | 'register';
  isEnteringPortal: boolean;
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
  onTransitionComplete: () => void;
}

export const AuthenticationWorld: React.FC<AuthenticationWorldProps> = ({
  mode,
  isEnteringPortal,
  onLoginSuccess,
  onSwitchToRegister,
  onSwitchToLogin,
  onRegisterSuccess,
  onTransitionComplete,
}) => {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#050811' }}>
      <Canvas
        camera={{ position: [0, 1.6, mode === 'register' ? 8.1 : 7.8], fov: 48 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#050811']} />
        <fog attach="fog" args={['#050811', 8, 25]} />

        {/* Dynamic Camera Controller */}
        <CameraRig
          mode={mode}
          isEnteringPortal={isEnteringPortal}
          onTransitionComplete={onTransitionComplete}
        />

        {/* World Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} color="#e0f2fe" />
        <pointLight position={[0, 4, 2]} intensity={2} color="#38bdf8" distance={12} />
        <pointLight position={[-4, 1, -2]} intensity={1.5} color="#00f2fe" distance={10} />
        <pointLight position={[4, 1, -2]} intensity={1.5} color="#0284c7" distance={10} />

        {/* Cybernetic Starfield Background */}
        <Stars
          radius={50}
          depth={40}
          count={2500}
          factor={4}
          saturation={0.5}
          fade
          speed={0.8}
        />

        {/* Digital Ground Grid */}
        <Grid
          position={[0, -1.8, 0]}
          args={[30, 30]}
          cellSize={0.8}
          cellThickness={1}
          cellColor="#0284c7"
          sectionSize={2.4}
          sectionThickness={1.5}
          sectionColor="#38bdf8"
          fadeDistance={22}
          fadeStrength={1.5}
        />

        {/* 3D Holographic Login Portal Ring */}
        <LoginPortal activated={isEnteringPortal} />

        {/* World-space Spatial Panels */}
        {!isEnteringPortal && (
          <>
            {mode === 'login' ? (
              <SpatialLoginPanel
                onLoginSuccess={onLoginSuccess}
                onSwitchToRegister={onSwitchToRegister}
              />
            ) : (
              <SpatialRegisterPanel
                onSwitchToLogin={onSwitchToLogin}
                onRegisterSuccess={onRegisterSuccess}
              />
            )}
          </>
        )}
      </Canvas>
    </div>
  );
};
