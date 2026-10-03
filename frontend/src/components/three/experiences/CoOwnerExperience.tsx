import React from 'react';
import { VehicleDigitalTwin } from '../vehicles/VehicleDigitalTwin';
import { ZoneHologramDisplay } from '../zones/ZoneHologramDisplay';

export const CoOwnerExperience: React.FC = () => {
  return (
    <group name="CoOwnerExperienceContainer">
      <VehicleDigitalTwin />
      <ZoneHologramDisplay />
    </group>
  );
};

