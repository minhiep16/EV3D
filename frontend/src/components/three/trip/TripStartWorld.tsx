import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../../services/queryClient';
import { VehicleResponse } from '../../../types/vehicle';
import { fetchActiveVehicleHandovers } from '../../../services/handoverApi';
import {
  fetchTripStartEligibility,
  fetchActiveTripForVehicle,
  startTripApi,
} from '../../../services/tripApi';
import { VehicleHandoverData } from '../../../types/handover';
import { TripStartPanel3D } from './TripStartPanel3D';
import { SpatialDataLink } from '../SpatialDataLink';
import { useWorldStore } from '../../../store/worldStore';
import { Html } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

interface TripStartWorldProps {
  vehicle: VehicleResponse;
}

export const TripStartWorld: React.FC<TripStartWorldProps> = ({ vehicle }) => {
  const qc = useQueryClient();
  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch active handovers for vehicle
  const { data: activeHandovers = [], isLoading: isHandoverLoading } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    refetchInterval: 3000,
  });

  // Resolve completed handover candidate
  const completedHandover = React.useMemo(() => {
    if (!activeHandovers || activeHandovers.length === 0) return null;
    return activeHandovers.find(
      (h) => h.status === 'COMPLETED' || h.status === 'OWNER_CONFIRMED'
    ) || activeHandovers[0];
  }, [activeHandovers]);

  // 2. Fetch active trip for vehicle (restoration on reload / ongoing trip)
  const { data: activeTrip = null, isLoading: isTripLoading } = useQuery({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    refetchInterval: 3000,
  });

  // 3. Fetch trip start eligibility for completed handover's booking
  const bookingId = completedHandover?.bookingId || activeTrip?.bookingId;
  const { data: eligibility = null, isLoading: isEligibilityLoading } = useQuery({
    queryKey: ['tripEligibility', bookingId],
    queryFn: () => (bookingId ? fetchTripStartEligibility(bookingId) : Promise.resolve(null)),
    enabled: !!bookingId,
    refetchInterval: 4000,
  });

  // 4. Start Trip Mutation
  const startTripMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) {
        throw new Error('Không tìm thấy lịch đặt xe hợp lệ.');
      }
      return await startTripApi(bookingId);
    },
    onSuccess: () => {
      setErrorMessage(null);
      qc.invalidateQueries({ queryKey: ['activeTrip', vehicle.id] });
      qc.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      qc.invalidateQueries({ queryKey: ['vehicle', vehicle.id] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      if (bookingId) {
        qc.invalidateQueries({ queryKey: ['tripEligibility', bookingId] });
      }
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Không thể bắt đầu chuyến đi lúc này.');
    },
  });

  const handleStartTrip = async () => {
    try {
      await startTripMutation.mutateAsync();
    } catch {
      // Error handled by mutation onError
    }
  };

  const isLoading = isHandoverLoading || isTripLoading;

  if (isLoading && !activeTrip) {
    return (
      <group position={[0, 1.4, 0]}>
        <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 242, 254, 0.5)',
              borderRadius: '9999px',
              padding: '10px 22px',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 0 25px rgba(0, 242, 254, 0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            <Loader2 size={16} className="animate-spin" color="#00f2fe" />
            <span>ĐANG KIỂM TRA ĐIỀU KIỆN CHUYẾN ĐI...</span>
          </div>
        </Html>
      </group>
    );
  }

  const panelPosition: [number, number, number] = [2.7, 1.45, 0];
  const vehicleAnchor: [number, number, number] = [-0.5, 0.7, 0];

  return (
    <group>
      {/* 1. Spatial 3D Data Link connecting EV01 to Trip Start Panel */}
      <SpatialDataLink
        start={vehicleAnchor}
        end={panelPosition}
        color={activeTrip?.status === 'ACTIVE' ? '#10b981' : '#00f2fe'}
        pulseSpeed={2.5}
      />

      {/* 2. Holographic 3D Panel */}
      <QueryClientProvider client={queryClient}>
        <TripStartPanel3D
          vehicle={vehicle}
          handover={completedHandover}
          activeTrip={activeTrip}
          eligibility={eligibility}
          isStarting={startTripMutation.isPending}
          onStartTrip={handleStartTrip}
          onBack={returnToVehicleOverview}
          panelPosition={panelPosition}
        />
      </QueryClientProvider>
    </group>
  );
};
