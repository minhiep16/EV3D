import React from 'react';
import { VehicleDigitalTwin } from '../vehicles/VehicleDigitalTwin';
import { AdminVehicleMonitorPanel } from '../vehicles/AdminVehicleMonitorPanel';

export const AdminOperations: React.FC = () => {
  return (
    <group name="AdminOperationsContainer">
      <VehicleDigitalTwin
        renderPanel={(vehicle, onClose) => (
          <AdminVehicleMonitorPanel vehicle={vehicle} onClose={onClose} />
        )}
      />
    </group>
  );
};
