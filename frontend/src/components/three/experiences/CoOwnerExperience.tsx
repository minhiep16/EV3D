import React from 'react';
import { useWorldStore } from '../../../store/worldStore';
import { VehicleDigitalTwin } from '../vehicles/VehicleDigitalTwin';
import { CoOwnerVehiclePanel } from '../vehicles/CoOwnerVehiclePanel';
import { CoOwnerVehicleInfoPanel } from '../vehicles/CoOwnerVehicleInfoPanel';
import { MyBookingsPanel } from '../vehicles/MyBookingsPanel';

export const CoOwnerExperience: React.FC = () => {
  const vehicleFeatureMode = useWorldStore((state) => state.vehicleFeatureMode);

  return (
    <group name="CoOwnerExperienceContainer">
      <VehicleDigitalTwin
        renderPanel={(vehicle, onClose) => {
          if (vehicleFeatureMode === 'CO_OWNER_VEHICLE_INFO') {
            return <CoOwnerVehicleInfoPanel vehicle={vehicle} onClose={onClose} />;
          }
          if (vehicleFeatureMode === 'CO_OWNER_MY_BOOKINGS') {
            return <MyBookingsPanel vehicle={vehicle} onClose={onClose} />;
          }
          return <CoOwnerVehiclePanel vehicle={vehicle} onClose={onClose} />;
        }}
      />
    </group>
  );
};
