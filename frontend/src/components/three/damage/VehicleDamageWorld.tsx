import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Billboard, Html } from '@react-three/drei';
import { VehicleResponse } from '../../../types/vehicle';
import { DamageRecordResponse, DamageSeverity, DamageType } from '../../../types/damage';
import { fetchVehicleDamages, recordVehicleDamage } from '../../../services/damageApi';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { DamageMarker3D } from './DamageMarker3D';
import { DamageRecordPanel3D } from './DamageRecordPanel3D';
import { SpatialDataLink } from '../SpatialDataLink';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';

interface VehicleDamageWorldProps {
  vehicle: VehicleResponse;
}

export const VehicleDamageWorld: React.FC<VehicleDamageWorldProps> = ({ vehicle }) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === 'STAFF';

  const draftDamage = useWorldStore((state) => state.draftDamage);
  const setDraftDamage = useWorldStore((state) => state.setDraftDamage);
  const selectedDamageId = useWorldStore((state) => state.selectedDamageId);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);
  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);
  const vehicleYaw = useWorldStore((state) => state.vehicleYaw);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // TanStack Query: Fetch all authoritative damage records for this vehicle
  const { data: damages = [], refetch } = useQuery<DamageRecordResponse[]>({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => fetchVehicleDamages(vehicle.id),
    staleTime: 5000,
  });

  const selectedRecord = React.useMemo(() => {
    if (!selectedDamageId) return null;
    return damages.find((d) => d.id === selectedDamageId) || null;
  }, [damages, selectedDamageId]);

  // Handle saving new damage record
  const handleSaveDamage = async (data: {
    partCode: string;
    damageType: DamageType;
    severity: DamageSeverity;
    note?: string;
    localPosition: [number, number, number];
  }) => {
    if (!isStaff) {
      setErrorMessage('Bạn không có quyền ghi nhận hư hỏng');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await recordVehicleDamage(vehicle.id, {
        vehiclePartCode: data.partCode,
        damageType: data.damageType,
        severity: data.severity,
        note: data.note,
        localPositionX: data.localPosition[0],
        localPositionY: data.localPosition[1],
        localPositionZ: data.localPosition[2],
      });

      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] });
      await refetch();

      // Transition from draft to persisted
      setDraftDamage(null);
      selectDamageRecord(created.id);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể lưu hư hỏng. Vui lòng kiểm tra lại.';
      setErrorMessage(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscardDraft = () => {
    setDraftDamage(null);
    setErrorMessage(null);
  };

  const panelPosition: [number, number, number] = [2.7, 1.45, 0];

  return (
    <group name="VehicleDamageWorld">
      {/* 1. Persisted 3D Damage Markers locked to vehicle turntable */}
      <group rotation={[0, vehicleYaw, 0]}>
        {damages.map((item) => (
          <DamageMarker3D
            key={item.id}
            id={item.id}
            position={[item.localPositionX, item.localPositionY, item.localPositionZ]}
            partCode={item.vehiclePartCode}
            damageType={item.damageType}
            severity={item.severity}
            note={item.note}
            isSelected={selectedDamageId === item.id}
            onClick={() => {
              selectDamageRecord(item.id);
              setDraftDamage(null);
            }}
          />
        ))}

        {/* 3. Active Draft 3D Marker (Before saving) */}
        {draftDamage && (
          <DamageMarker3D
            isDraft={true}
            position={draftDamage.localPosition}
            partCode={draftDamage.partCode}
            isSelected={true}
          />
        )}
      </group>

      {/* 4. Spatial Laser Data Link connecting vehicle center/marker to right panel */}
      <SpatialDataLink
        start={
          draftDamage
            ? draftDamage.localPosition
            : selectedRecord
            ? [
                selectedRecord.localPositionX,
                selectedRecord.localPositionY,
                selectedRecord.localPositionZ,
              ]
            : [0, 0.7, 0]
        }
        end={[panelPosition[0] - 0.45, panelPosition[1], panelPosition[2]]}
        color={draftDamage ? '#00f2fe' : selectedRecord ? '#f59e0b' : '#38bdf8'}
        pulseSpeed={draftDamage ? 3.5 : 2.5}
      />

      {/* 5. Right-side World Space Spatial Damage Panel */}
      <group position={panelPosition}>
        <Billboard follow={true}>
          <HolographicPanelFrame3D
            width={2.7}
            height={3.6}
            color={draftDamage ? '#00f2fe' : selectedRecord ? '#f59e0b' : '#38bdf8'}
          />
          <Html center distanceFactor={8.8} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
            <DamageRecordPanel3D
              draftDamage={draftDamage}
              selectedRecord={selectedRecord}
              savedDamages={damages}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
              onSelectDamage={(id) => {
                selectDamageRecord(id);
                setDraftDamage(null);
              }}
              onDiscardDraft={handleDiscardDraft}
              onSaveDamage={handleSaveDamage}
              onClose={returnToVehicleOverview}
            />
          </Html>
        </Billboard>
      </group>
    </group>
  );
};
