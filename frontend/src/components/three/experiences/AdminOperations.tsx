import React, { useMemo } from 'react';
import { VehicleDigitalTwin } from '../vehicles/VehicleDigitalTwin';
import { AdminVehicleMonitorPanel } from '../vehicles/AdminVehicleMonitorPanel';
import { AdminCommandCenter3D } from '../admin/AdminCommandCenter3D';
import { useQuery } from '@tanstack/react-query';
import { fetchVehicles } from '../../../services/vehicleApi';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { resolveAuthoritativeHeroVehicle } from '../vehicles/vehicleModelConfig';

export const AdminOperations: React.FC = () => {
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const adminActiveModule = useWorldStore((state) => state.adminActiveModule);
  const adminApplicationPreviewVehicle = useWorldStore((state) => state.adminApplicationPreviewVehicle);
  const user = useAuthStore((state) => state.user);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    staleTime: 30000,
  });

  const heroVehicle = useMemo(() => {
    if (adminActiveModule === 'APPLICATION_REVIEW' && adminApplicationPreviewVehicle) {
      return adminApplicationPreviewVehicle;
    }
    if (!vehicles || vehicles.length === 0) return null;
    return resolveAuthoritativeHeroVehicle(vehicles, selectedVehicleId);
  }, [vehicles, selectedVehicleId, adminActiveModule, adminApplicationPreviewVehicle]);

  return (
    <group name="AdminOperationsContainer">
      {/* 1. Dedicated Immersive 3D Volumetric Modules */}
      <AdminCommandCenter3D selectedVehicle={heroVehicle} />

      {/* 2. Central Vehicle Digital Twin (Platform & Model) */}
      <VehicleDigitalTwin
        renderPanel={(vehicle, onClose) =>
          adminActiveModule === 'NONE' ? (
            <AdminVehicleMonitorPanel vehicle={vehicle} onClose={onClose} />
          ) : null
        }
      />
    </group>
  );
};
