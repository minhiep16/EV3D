import React from 'react';
import { useWorldStore, GarageZone } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { FinanceHeroHologram } from './FinanceHeroHologram';

interface ZoneHologramDisplayProps {
  overrideZone?: GarageZone | null;
}

/**
 * ZoneHologramDisplay: Authoritative 3D Spatial Hologram Controller for Showroom Zones.
 * Renders high-fidelity holographic HUD clusters hovering above the showroom podium.
 * Extensible for Finance, AI, Analytics, and Charging zones.
 */
export const ZoneHologramDisplay: React.FC<ZoneHologramDisplayProps> = ({ overrideZone }) => {
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const isFinanceDetailModalOpen = useWorldStore((state) => state.isFinanceDetailModalOpen);
  const user = useAuthStore((state) => state.user);
  const isCoOwner = !user?.role || user?.role === 'CO_OWNER';

  const activeZone = overrideZone !== undefined ? overrideZone : selectedZone;

  // Render dedicated zone hologram for CO_OWNER showroom view
  // Temporarily unmount hologram while finance detail modal is active to prevent visual overlap
  if (!isCoOwner || !activeZone || activeZone === 'VEHICLE' || isFinanceDetailModalOpen) {
    return null;
  }

  switch (activeZone) {
    case 'FINANCE':
      return (
        <FinanceHeroHologram
          position={[0.0, 2.70, 1.8]}
          fundTotal="25.000.000đ"
          userPercentage={40}
        />
      );
    // Extensible slots for subsequent phases
    case 'AI':
    case 'ANALYTICS':
    case 'CHARGING':
    default:
      return null;
  }
};
