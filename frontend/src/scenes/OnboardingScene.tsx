import React, { useState } from 'react';
import { OnboardingWorld, ThreeCanvasErrorBoundary } from '../components/three/onboarding/OnboardingWorld';
import { OnboardingOverlay } from '../components/onboarding/OnboardingOverlay';

export type OnboardingWorkspaceMode =
  | 'LANDING'
  | 'WIZARD'
  | 'JOIN_GROUP'
  | 'INVITE_CODE'
  | 'MY_INVITATIONS';

export const OnboardingScene: React.FC = () => {
  const [workspaceMode, setWorkspaceMode] = useState<OnboardingWorkspaceMode>('LANDING');
  const [previewColor, setPreviewColor] = useState<string>('#F8F9FA');
  const [previewModel, setPreviewModel] = useState<string>('VinFast VF8 Plus');

  const isWorkspace = workspaceMode === 'WIZARD' || workspaceMode === 'JOIN_GROUP';

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#EAF7FF',
      }}
    >
      {/* 3D WebGL Showroom Canvas (Adapts between full-screen landing and left 42% workspace preview) */}
      <ThreeCanvasErrorBoundary isWorkspace={isWorkspace}>
        <OnboardingWorld
          isWorkspace={isWorkspace}
          exteriorColor={previewColor}
          selectedModel={previewModel}
        />
      </ThreeCanvasErrorBoundary>

      {/* UI Overlay coordinating Landing Mode and Workspace Mode */}
      <OnboardingOverlay
        workspaceMode={workspaceMode}
        setWorkspaceMode={setWorkspaceMode}
        previewColor={previewColor}
        onColorChange={setPreviewColor}
        selectedModel={previewModel}
        onModelChange={setPreviewModel}
      />
    </div>
  );
};

export default OnboardingScene;
