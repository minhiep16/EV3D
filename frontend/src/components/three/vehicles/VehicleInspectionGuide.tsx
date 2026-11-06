import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useWorldStore } from '../../../store/worldStore';
import { VehicleResponse } from '../../../types/vehicle';
import { resolveVehicleHotspots } from '../../../data/vehicleHotspotConfig';

interface VehicleInspectionGuideProps {
  vehicle?: VehicleResponse | null;
  vehicleCode?: 'EV01' | 'EV02';
}

/**
 * Phase 26 Direct Hotspot Exploration UX:
 * The bulky floating "CHẾ ĐỘ KHÁM PHÁ XE" toolbar and part-button strip have been removed
 * so users interact directly with glowing 3D hotspots on the vehicle.
 * Preserves a screen-reader-only (sr-only) semantic navigation list for assistive technology.
 * Wrapped inside <Html style={{ display: 'none' }}> to safely isolate DOM elements from the R3F Canvas tree.
 */
export const VehicleInspectionGuide: React.FC<VehicleInspectionGuideProps> = ({
  vehicle,
  vehicleCode = 'EV01',
}) => {
  const selectedVehiclePartId = useWorldStore(
    (state) => state.selectedVehiclePartId
  );
  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);
  const clearVehiclePartSelection = useWorldStore(
    (state) => state.clearVehiclePartSelection
  );

  const hotspots = useMemo(
    () => resolveVehicleHotspots(vehicle, vehicleCode),
    [vehicle, vehicleCode]
  );

  return (
    <Html style={{ display: 'none' }}>
      <nav
        aria-label="Điểm tương tác 3D trên xe"
        style={{
          position: 'fixed',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
          pointerEvents: 'none',
        }}
      >
        {hotspots.map((item) => {
          const isSelected = selectedVehiclePartId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              tabIndex={-1}
              aria-pressed={isSelected}
              onClick={() =>
                isSelected
                  ? clearVehiclePartSelection()
                  : selectVehiclePart(item.id)
              }
            >
              {item.title}
            </button>
          );
        })}
      </nav>
    </Html>
  );
};
