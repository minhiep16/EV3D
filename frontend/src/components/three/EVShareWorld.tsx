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
import { VehicleDigitalTwin } from './vehicles/VehicleDigitalTwin';
import { SpatialOverviewControl } from './SpatialOverviewControl';
import { GarageZone } from '../../store/worldStore';
import {
  GlobalInteractionManager,
  handleNeutralSceneClick,
} from './GlobalInteractionManager';

const ALL_ZONES: GarageZone[] = [
  'VEHICLE',
  'CHARGING',
  'MAINTENANCE',
  'FINANCE',
  'GOVERNANCE',
  'ANALYTICS',
  'AI',
];

export const EVShareWorld: React.FC = () => {
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

            {/* All 7 Functional Garage Zones */}
            {ALL_ZONES.map((zoneId) => (
              <GarageZoneObject key={zoneId} zone={ZONE_CONFIGS[zoneId]} />
            ))}

            {/* EV01 Digital Twin positioned in VEHICLE ZONE */}
            <VehicleDigitalTwin />

            {/* Real-time World-Space Spatial Overview Camera Reset Control */}
            <SpatialOverviewControl />
          </Suspense>
        </Canvas>
      </div>
    </WorldErrorBoundary>
  );
};
