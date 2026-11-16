import React from 'react';
import { VehicleDigitalTwin } from '../vehicles/VehicleDigitalTwin';
import { StaffOperationsPanel } from '../vehicles/StaffOperationsPanel';
import { StaffFleetHologram3D } from '../staff/StaffFleetHologram3D';

export const StaffOperations: React.FC = () => {
  return (
    <group name="StaffOperationsContainer">
      <VehicleDigitalTwin
        renderPanel={(vehicle, onClose) => (
          <StaffOperationsPanel vehicle={vehicle} onClose={onClose} />
        )}
      />
      {/* 3D Fleet Hologram on the Left Side of Central Vehicle */}
      <StaffFleetHologram3D />
    </group>
  );
};
