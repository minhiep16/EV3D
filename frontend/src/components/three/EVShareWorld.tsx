import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { WorldErrorBoundary } from './WorldErrorBoundary';
import { WorldLoader } from './WorldLoader';
import { WorldLighting } from './WorldLighting';
import { WorldEnvironment } from './WorldEnvironment';
import { GarageFloor } from './GarageFloor';
import { GarageStructure } from './GarageStructure';
import { GarageCamera } from './GarageCamera';
import { GarageZoneObject } from './GarageZoneObject';
import { getZoneConfig } from '../../config/garageZoneConfigs';
import { GarageZone } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { getAccessibleZones } from '../../utils/roleCapabilities';
import { CoOwnerExperience } from './experiences/CoOwnerExperience';
import { OperationsExperience } from './experiences/OperationsExperience';
import { GlobalInteractionManager } from './GlobalInteractionManager';
import { handleNeutralSceneClick } from './globalInteractionState';

export const EVShareWorld: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isOperationsRole = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const isCoOwner = !user?.role || user?.role === 'CO_OWNER';

  const accessibleZones = React.useMemo(
    () => getAccessibleZones(user?.role),
    [user?.role]
  );

  return (
    <WorldErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#eaf1f8' }}>
        <Canvas
          shadows
          camera={{ position: isCoOwner ? [0.0, 6.2, 13.8] : [0.2, 3.2, 9.6], fov: 40 }}
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

            {/* Functional Garage Zones: Rendered ONLY for CO_OWNER dedicated showroom exploration */}
            {!isOperationsRole &&
              accessibleZones.map((zoneId) => (
                <GarageZoneObject key={zoneId} zone={getZoneConfig(zoneId, user?.role)} />
              ))}

            {/* Role-Specific Experience: CO_OWNER vs OPERATIONS (STAFF + ADMIN) */}
            {isOperationsRole ? <OperationsExperience /> : <CoOwnerExperience />}
          </Suspense>
        </Canvas>
      </div>
    </WorldErrorBoundary>
  );
};
export { EVShareWorld as GarageWorld };
