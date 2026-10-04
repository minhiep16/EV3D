import React from 'react';
import { useWorldStore, GarageZone } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { FinanceZonePanel } from './FinanceZonePanel';
import { AiZonePanel } from './AiZonePanel';

interface ZoneInfoPanelProps {
  overrideZone?: GarageZone | null;
  onClose?: () => void;
}

/**
 * ZoneInfoPanel: Authoritative Screen-Space Right Glass Info Panel for Garage Zones.
 * Mounts right electronic glass cards when interacting with zones.
 * Extensible for Finance, AI, Analytics, and Charging.
 */
export const ZoneInfoPanel: React.FC<ZoneInfoPanelProps> = ({ overrideZone, onClose }) => {
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const user = useAuthStore((state) => state.user);
  const isCoOwner = !user?.role || user?.role === 'CO_OWNER';

  const activeZone = overrideZone !== undefined ? overrideZone : selectedZone;

  if (!isCoOwner || !activeZone || activeZone === 'VEHICLE') {
    return null;
  }

  switch (activeZone) {
    case 'FINANCE':
    case 'AI':
    case 'ANALYTICS':
    case 'CHARGING':
      // All major CO_OWNER feature panels are standardized as true 3D spatial world-space holograms in ZoneHologramDisplay
      return null;
    default:
      return null;
  }
};
