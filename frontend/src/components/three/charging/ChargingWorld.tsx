import React, { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as THREE from 'three';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { fetchChargingStations, fetchActiveChargingSession } from '../../../services/chargingApi';
import { fetchVehicles } from '../../../services/vehicleApi';
import { ChargingStationResponse, ChargingSessionResponse } from '../../../types/charging';
import { VehicleResponse } from '../../../types/vehicle';
import { ChargingStation3D } from './ChargingStation3D';
import { ChargingCable3D } from './ChargingCable3D';
import {
  CHARGING_STATION_VISUALS,
  VEHICLE_CHARGE_PORT_ANCHORS,
} from '../../../config/chargingVisualConfig';
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import { STAFF_GARAGE_LAYOUT } from '../../../config/staffGarageLayout';

export const ChargingWorld: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isOperationsRole = user?.role === 'STAFF' || user?.role === 'ADMIN';

  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const selectedChargingStationId = useWorldStore((state) => state.selectedChargingStationId);
  const setSelectedChargingStation = useWorldStore((state) => state.setSelectedChargingStation);
  const vehicleChargingMode = useWorldStore((state) => state.vehicleChargingMode);
  const vehicleYaw = useWorldStore((state) => state.vehicleYaw);

  // Authoritative TanStack Query: Charging Stations
  const { data: stations = [] } = useQuery<ChargingStationResponse[]>({
    queryKey: ['chargingStations'],
    queryFn: fetchChargingStations,
    staleTime: 6000,
    refetchInterval: 6000,
  });

  // Query vehicles to resolve active vehicle
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    staleTime: 6000,
  });

  // Derive target vehicle
  const activeVehicle = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return null;
    if (selectedVehicleId) {
      const match = vehicles.find((v) => {
        const code = resolveVehicleCode(v);
        return v.id === selectedVehicleId || code === selectedVehicleId;
      });
      if (match) return match;
    }
    return vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Query active charging session for active vehicle
  const { data: activeSession = null } = useQuery<ChargingSessionResponse | null>({
    queryKey: ['activeChargingSession', activeVehicle?.id],
    queryFn: () => (activeVehicle?.id ? fetchActiveChargingSession(activeVehicle.id) : Promise.resolve(null)),
    enabled: Boolean(activeVehicle?.id),
    refetchInterval: 3000,
  });

  // Synchronize 3D world state when session finishes
  React.useEffect(() => {
    if (activeSession && activeSession.status === 'COMPLETED') {
      queryClient.invalidateQueries({ queryKey: ['chargingStations'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      if (activeVehicle?.id) {
        queryClient.invalidateQueries({ queryKey: ['vehicle', activeVehicle.id] });
      }
    }
  }, [activeSession?.status, queryClient, activeVehicle?.id]);

  // Determine fallback stations if database has not returned yet
  const effectiveStations = useMemo(() => {
    if (stations && stations.length > 0) return stations;
    // Fallback seed definitions matching showroom layout
    return [
      {
        id: 'station-cs01-uuid',
        code: 'CS01',
        name: 'Trụ sạc Siêu tốc 01',
        status: 'AVAILABLE' as const,
        maxPowerKw: 150,
        connectorType: 'CCS2' as const,
        locationLabel: 'Khu vực Sạc Nhanh - Bay CS-01',
        posX: 3.5,
        posY: 0.14,
        posZ: 3.2,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'station-cs02-uuid',
        code: 'CS02',
        name: 'Trụ sạc Tiêu chuẩn 02',
        status: 'AVAILABLE' as const,
        maxPowerKw: 60,
        connectorType: 'CCS2' as const,
        locationLabel: 'Khu vực Sạc Nhanh - Bay CS-02',
        posX: 4.5,
        posY: 0.14,
        posZ: 3.2,
        createdAt: '',
        updatedAt: '',
      },
    ];
  }, [stations]);

  // Determine if cable should be rendered
  const isVehicleCharging = activeVehicle?.status === 'CHARGING' || activeSession?.status === 'ACTIVE';

  // Resolve connected charging station
  const connectedStation = useMemo(() => {
    if (!activeSession && !vehicleChargingMode) return null;
    if (activeSession?.chargingStationId) {
      return (
        effectiveStations.find((s) => s.id === activeSession.chargingStationId) ||
        effectiveStations[0]
      );
    }
    if (selectedChargingStationId) {
      return (
        effectiveStations.find((s) => s.id === selectedChargingStationId) ||
        effectiveStations[0]
      );
    }
    return effectiveStations[0];
  }, [activeSession, vehicleChargingMode, selectedChargingStationId, effectiveStations]);

  // Compute World-Space Anchors for Charging Cable
  const cableAnchors = useMemo(() => {
    if (!connectedStation || !activeVehicle) return null;

    const visual = CHARGING_STATION_VISUALS[connectedStation.code] || {
      stationPosition: [connectedStation.posX ?? 3.5, connectedStation.posY ?? 0.14, connectedStation.posZ ?? 3.2] as [number, number, number],
      socketOffset: [0.42, 0.95, 0.05] as [number, number, number],
    };

    const startWorld: [number, number, number] = [
      visual.stationPosition[0] + visual.socketOffset[0],
      visual.stationPosition[1] + visual.socketOffset[1],
      visual.stationPosition[2] + visual.socketOffset[2],
    ];

    // Vehicle position in garage space
    const vCode = resolveVehicleCode(activeVehicle);
    const vehicleBasePos: [number, number, number] = isOperationsRole
      ? STAFF_GARAGE_LAYOUT.heroAnchor
      : [0.0, 0.14, 1.8];

    const localPort = VEHICLE_CHARGE_PORT_ANCHORS[vCode] || VEHICLE_CHARGE_PORT_ANCHORS.EV01;
    const yaw = vehicleYaw ?? (isOperationsRole ? 0 : 0);

    // Rotate port anchor around Y axis
    const rotatedX = localPort[0] * Math.cos(yaw) + localPort[2] * Math.sin(yaw);
    const rotatedZ = -localPort[0] * Math.sin(yaw) + localPort[2] * Math.cos(yaw);

    const endWorld: [number, number, number] = [
      vehicleBasePos[0] + rotatedX,
      vehicleBasePos[1] + localPort[1],
      vehicleBasePos[2] + rotatedZ,
    ];

    return { startWorld, endWorld };
  }, [connectedStation, activeVehicle, isOperationsRole, vehicleYaw]);

  return (
    <group name="ChargingWorldContainer">
      {/* 1. Interactive 3D Charging Kiosks */}
      {effectiveStations.map((station) => {
        const isSelected = selectedChargingStationId === station.id;
        const isActive = activeSession?.chargingStationId === station.id;

        return (
          <ChargingStation3D
            key={station.id}
            station={station}
            isSelected={isSelected}
            isActiveSession={isActive}
            onSelectStation={(id) => setSelectedChargingStation(id)}
          />
        );
      })}

      {/* 2. Visual Charging Cable Link (Station Socket -> Vehicle Charge Port) */}
      {(isVehicleCharging || (vehicleChargingMode && connectedStation)) && cableAnchors && (
        <ChargingCable3D
          startWorld={cableAnchors.startWorld}
          endWorld={cableAnchors.endWorld}
          isActive={isVehicleCharging}
        />
      )}
    </group>
  );
};
