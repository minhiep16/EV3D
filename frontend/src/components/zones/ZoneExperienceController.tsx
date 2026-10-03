import React from 'react';
import { useWorldStore, GarageZone } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';

export interface ZoneItemConfig {
  id: GarageZone;
  label: string;
  iconName: string;
}

export const SHOWROOM_ZONES: ZoneItemConfig[] = [
  { id: 'FINANCE', label: 'Tài chính', iconName: 'DollarSign' },
  { id: 'AI', label: 'Trợ lý AI', iconName: 'Bot' },
  { id: 'ANALYTICS', label: 'Phân tích', iconName: 'TrendingUp' },
  { id: 'CHARGING', label: 'Khu vực sạc', iconName: 'Zap' },
];

/**
 * Hook to manage zone interaction experience state and transitions
 */
export function useZoneExperience() {
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectZone = useWorldStore((state) => state.selectZone);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const user = useAuthStore((state) => state.user);
  const isCoOwner = !user?.role || user?.role === 'CO_OWNER';

  const isZoneActive = (zoneId: GarageZone) => selectedZone === zoneId;

  const toggleZone = (zoneId: GarageZone) => {
    if (selectedZone === zoneId) {
      clearSelection();
    } else {
      selectZone(zoneId);
    }
  };

  const closeZone = () => {
    clearSelection();
  };

  return {
    selectedZone,
    isCoOwner,
    isZoneActive,
    toggleZone,
    closeZone,
  };
}
