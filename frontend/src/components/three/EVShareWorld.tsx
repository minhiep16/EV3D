import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { WorldErrorBoundary } from './WorldErrorBoundary';
import { WorldLoader } from './WorldLoader';
import { WorldLighting } from './WorldLighting';
import { WorldEnvironment } from './WorldEnvironment';
import { GarageFloor } from './GarageFloor';
import { GarageStructure } from './GarageStructure';
import { GarageCamera } from './GarageCamera';
import { GarageZoneObject, ZONE_CONFIGS } from './GarageZoneObject';
import { SpatialOverviewControl } from './SpatialOverviewControl';
import { GarageZone } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { getAccessibleZones } from '../../utils/roleCapabilities';
import { CoOwnerExperience } from './experiences/CoOwnerExperience';
import { OperationsExperience } from './experiences/OperationsExperience';
import {
  GlobalInteractionManager,
  handleNeutralSceneClick,
} from './GlobalInteractionManager';

export const EVShareWorld: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isOperationsRole = user?.role === 'STAFF' || user?.role === 'ADMIN';

  const accessibleZones = React.useMemo(
    () => getAccessibleZones(user?.role),
    [user?.role]
  );

  return (
    <WorldErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#070b14' }}>
        <Canvas
          shadows
          camera={{ position: [0, 16, 24], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: '100%', height: '100%' }}
          onPointerMissed={handleNeutralSceneClick}
        >
          {/* Centralized Global Pointer Interaction Manager */}
          <GlobalInteractionManager />

          <Suspense fallback={<WorldLoader />}>
            {/* Atmosphere & Fog */}
            <WorldEnvironment />

            {/* Directional & Ambient Lighting with Shadows */}
            <WorldLighting />

            {/* Orbit & Zone Focused Camera Rig */}
            <GarageCamera />

            {/* Garage Architecture: Floor, Support Pillars & Trusses */}
            <GarageFloor />
            <GarageStructure />

            {/* Functional Garage Zones: Filtered by Centralized Role-Zone Capabilities */}
            {accessibleZones.map((zoneId) => (
              <GarageZoneObject key={zoneId} zone={ZONE_CONFIGS[zoneId]} />
            ))}

            {/* Role-Specific Experience: CO_OWNER vs OPERATIONS (STAFF + ADMIN) */}
            {isOperationsRole ? <OperationsExperience /> : <CoOwnerExperience />}

            {/* Real-time World-Space Spatial Overview Camera Reset Control */}
            <SpatialOverviewControl />
          </Suspense>
        </Canvas>
      </div>
    </WorldErrorBoundary>
  );
};
export { EVShareWorld as GarageWorld };
