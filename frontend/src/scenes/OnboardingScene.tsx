import React from 'react';
import { OnboardingWorld } from '../components/three/onboarding/OnboardingWorld';
import { OnboardingOverlay } from '../components/onboarding/OnboardingOverlay';

export const OnboardingScene: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#050914',
      }}
    >
      {/* 3D WebGL Canvas */}
      <OnboardingWorld />

      {/* Futuristic Glassmorphic Overlay */}
      <OnboardingOverlay />
    </div>
  );
};

export default OnboardingScene;

