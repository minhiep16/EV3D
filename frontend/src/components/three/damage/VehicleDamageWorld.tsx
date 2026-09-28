import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Html } from '@react-three/drei';
import { VehicleResponse } from '../../../types/vehicle';
import { DamageRecordResponse, DamageSeverity, DamageType } from '../../../types/damage';
import { fetchVehicleDamages, recordVehicleDamage } from '../../../services/damageApi';
import { PART_INSPECTION_CAMERA_CONFIGS, PART_INSPECTION_CAMERA_CONFIGS_EV02 } from '../../../config/vehicleCameraPresets';
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { DamageMarker3D } from './DamageMarker3D';
import { DamageRecordPanel3D } from './DamageRecordPanel3D';

interface VehicleDamageWorldProps {
  vehicle: VehicleResponse;
}

export const VehicleDamageWorld: React.FC<VehicleDamageWorldProps> = ({ vehicle }) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === 'STAFF';
  const isOperationsRole = user?.role === 'STAFF' || user?.role === 'ADMIN';

  const draftDamage = useWorldStore((state) => state.draftDamage);
  const setDraftDamage = useWorldStore((state) => state.setDraftDamage);
  const selectedDamageId = useWorldStore((state) => state.selectedDamageId);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);
  const selectedVehiclePartCode = useWorldStore((state) => state.selectedVehiclePartCode);
  const selectVehiclePartCode = useWorldStore((state) => state.selectVehiclePartCode);
  const selectVehiclePartWithPoint = useWorldStore((state) => state.selectVehiclePartWithPoint);
  const exitPartInspection = useWorldStore((state) => state.exitPartInspection);
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

        {/* 2. Active Temporary Draft 3D Inspection Marker */}
        {draftDamage && (
          <DamageMarker3D
            isDraft={true}
            position={draftDamage.localPosition}
            partCode={draftDamage.partCode}
            isSelected={true}
          />
        )}
      </group>

      {/* 3. Panel Safe Area: Rendered only for CO_OWNER (STAFF/ADMIN use fixed screen-space right panel) */}
      {!isOperationsRole && (
        <Html fullscreen style={{ pointerEvents: 'none', userSelect: 'none', zIndex: 20 }}>
          <div
            style={{
              position: 'absolute',
              right: '24px',
              top: '20px',
              bottom: '20px',
              width: '370px',
              maxWidth: 'min(370px, calc(35vw - 24px))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'stretch',
              pointerEvents: 'none',
            }}
          >
            <DamageRecordPanel3D
              selectedPartCode={selectedVehiclePartCode}
              draftDamage={draftDamage}
              selectedRecord={selectedRecord}
              savedDamages={damages}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
              onSelectDamage={(id) => {
                selectDamageRecord(id);
                setDraftDamage(null);
              }}
              onSelectPart={(code) => {
                if (code) {
                  const isEv02 = resolveVehicleCode(vehicle) === 'EV02';
                  const configMap = isEv02 ? PART_INSPECTION_CAMERA_CONFIGS_EV02 : PART_INSPECTION_CAMERA_CONFIGS;
                  const defaultCenter =
                    configMap[code]?.targetOffset || [0, 0.5, 0];
                  selectVehiclePartWithPoint(code, defaultCenter);
                } else {
                  exitPartInspection();
                }
              }}
              onExitPartInspection={exitPartInspection}
              onDiscardDraft={handleDiscardDraft}
              onSaveDamage={handleSaveDamage}
              onClose={returnToVehicleOverview}
            />
          </div>
        </Html>
      )}
    </group>
  );
};
