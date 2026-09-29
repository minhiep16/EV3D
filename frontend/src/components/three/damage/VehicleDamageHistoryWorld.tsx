import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { DamageRecordResponse } from '../../../types/damage';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { useWorldStore } from '../../../store/worldStore';
import { DamageMarker3D } from './DamageMarker3D';

interface VehicleDamageHistoryWorldProps {
  vehicle: VehicleResponse;
}

export const VehicleDamageHistoryWorld: React.FC<VehicleDamageHistoryWorldProps> = ({ vehicle }) => {
  const selectedDamageId = useWorldStore((state) => state.selectedDamageId);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);
  const vehicleYaw = useWorldStore((state) => state.vehicleYaw);
  const severityFilter = useWorldStore((state) => state.damageHistorySeverityFilter);
  const statusFilter = useWorldStore((state) => state.damageHistoryStatusFilter);
  const partFilter = useWorldStore((state) => state.damageHistoryPartFilter);

  // TanStack Query: Fetch authoritative damage records for this isolated vehicle
  const { data: damages = [] } = useQuery<DamageRecordResponse[]>({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => fetchVehicleDamages(vehicle.id),
    staleTime: 5000,
  });

  // Local derived filtering with useMemo (Requirement 20)
  // Resolved markers do not render by default unless explicitly selected or filtered by RESOLVED
  const visibleDamages = useMemo(() => {
    return damages.filter((item) => {
      const isResolved = item.status === 'RESOLVED';
      if (isResolved && statusFilter !== 'RESOLVED' && selectedDamageId !== item.id) {
        return false;
      }
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (severityFilter !== 'ALL' && item.severity !== severityFilter) {
        return false;
      }
      if (partFilter !== 'ALL' && item.vehiclePartCode !== partFilter) {
        return false;
      }
      return true;
    });
  }, [damages, statusFilter, severityFilter, partFilter, selectedDamageId]);

  return (
    <group name="VehicleDamageHistoryWorld">
      {/* Persisted 3D Damage Markers locked to vehicle turntable transform (Requirement 9 & 20) */}
      <group rotation={[0, vehicleYaw, 0]}>
        {visibleDamages.map((item) => (
          <DamageMarker3D
            key={item.id}
            id={item.id}
            position={[item.localPositionX, item.localPositionY, item.localPositionZ]}
            partCode={item.vehiclePartCode}
            damageType={item.damageType}
            severity={item.severity}
            status={item.status}
            note={item.note}
            isSelected={selectedDamageId === item.id}
            onClick={() => {
              selectDamageRecord(item.id);
            }}
          />
        ))}
      </group>
    </group>
  );
};
