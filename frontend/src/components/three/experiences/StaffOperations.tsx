import React from 'react';
import { VehicleDigitalTwin } from '../vehicles/VehicleDigitalTwin';
import { StaffOperationsPanel } from '../vehicles/StaffOperationsPanel';

export const StaffOperations: React.FC = () => {
  return (
    <group name="StaffOperationsContainer">
      <VehicleDigitalTwin
        renderPanel={(vehicle, onClose) => (
          <StaffOperationsPanel vehicle={vehicle} onClose={onClose} />
        )}
      />
    </group>
  );
};
