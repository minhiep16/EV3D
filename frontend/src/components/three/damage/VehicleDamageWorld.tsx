import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { DamageRecordResponse } from '../../../types/damage';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import { resolveDamagePosition } from '../../../data/vehicleParts';
import { useWorldStore } from '../../../store/worldStore';
import { DamageMarker3D } from './DamageMarker3D';

interface VehicleDamageWorldProps {
  vehicle: VehicleResponse;
}

export const VehicleDamageWorld: React.FC<VehicleDamageWorldProps> = ({ vehicle }) => {
  const draftDamage = useWorldStore((state) => state.draftDamage);
  const setDraftDamage = useWorldStore((state) => state.setDraftDamage);
  const selectedDamageId = useWorldStore((state) => state.selectedDamageId);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);
  const openDamageDetailModal = useWorldStore((state) => state.openDamageDetailModal);
  const vehicleYaw = useWorldStore((state) => state.vehicleYaw);

  // TanStack Query: Fetch all authoritative damage records for this vehicle
  const { data: damages = [] } = useQuery<DamageRecordResponse[]>({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => fetchVehicleDamages(vehicle.id),
    staleTime: 5000,
  });

  // Default active damage view shows only OPEN and UNDER_MAINTENANCE.
  // Repaired/RESOLVED markers disappear from active vehicle view without deleting history.
  const activeDamages = React.useMemo(() => {
    return damages.filter((item) => item.status !== 'RESOLVED');
  }, [damages]);

  return (
    <group name="VehicleDamageWorld">
      {/* 1. Persisted 3D Damage Markers locked to vehicle turntable */}
      <group rotation={[0, vehicleYaw, 0]}>
        {activeDamages.map((item) => {
          const vehicleCode = resolveVehicleCode(vehicle) === 'EV02' ? 'EV02' : 'EV01';
          const pos = resolveDamagePosition(item, vehicleCode);
          return (
            <DamageMarker3D
              key={item.id}
              id={item.id}
              position={pos}
              partCode={item.vehiclePartCode}
              damageType={item.damageType}
              severity={item.severity}
              status={item.status}
              note={item.note}
              isSelected={selectedDamageId === item.id}
              onClick={() => {
                selectDamageRecord(item.id, item.vehiclePartCode);
                openDamageDetailModal(item.id, item.vehiclePartCode);
                setDraftDamage(null);
              }}
            />
          );
        })}

        {/* 2. Active Temporary Draft 3D Inspection Marker (Staff only) */}
        {draftDamage && (
          <DamageMarker3D
            isDraft={true}
            position={draftDamage.localPosition}
            partCode={draftDamage.partCode}
            isSelected={true}
          />
        )}
      </group>
    </group>
  );
};
