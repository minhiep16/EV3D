import React from 'react';
import { useWorldStore, GarageZone } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { FinanceHeroHologram } from './FinanceHeroHologram';
import { FinanceControlHologram3D } from './FinanceControlHologram3D';
import { AiControlHologram3D } from './AiControlHologram3D';
import { AnalyticsControlHologram3D } from './AnalyticsControlHologram3D';
import { ChargingControlHologram3D } from './ChargingControlHologram3D';

interface ZoneHologramDisplayProps {
  overrideZone?: GarageZone | null;
}

/**
 * ZoneHologramDisplay: Authoritative 3D Spatial Hologram Controller for Showroom Zones.
 * Renders high-fidelity holographic HUD clusters and world-space 3D consoles in the showroom.
 * Standardized across Finance, AI Assistant, Analytics, and Charging zones.
 */
export const ZoneHologramDisplay: React.FC<ZoneHologramDisplayProps> = ({ overrideZone }) => {
  const activeFeature = useWorldStore((state) => state.activeFeature);
  const user = useAuthStore((state) => state.user);
  const isCoOwner = !user?.role || user?.role === 'CO_OWNER';

  // If overrideZone is explicitly passed, resolve its corresponding ActiveGarageFeature
  const effectiveFeature = overrideZone
    ? overrideZone === 'FINANCE'
      ? 'FINANCE'
      : overrideZone === 'AI'
      ? 'AI_ASSISTANT'
      : overrideZone === 'ANALYTICS'
      ? 'ANALYTICS'
      : overrideZone === 'CHARGING'
      ? 'CHARGING'
      : 'NONE'
    : activeFeature;

  // Render dedicated zone hologram for CO_OWNER showroom view
  if (!isCoOwner || effectiveFeature === 'NONE') {
    return null;
  }

  // SINGLE PRIMARY PANEL RULE: Only one major right-side hologram panel active at a time
  switch (effectiveFeature) {
    case 'FINANCE':
      return (
        <group name="FinanceSpatialHologramCluster">
          {/* Top Holographic Visor Canopy above Vehicle: ONLY RENDERS IN FINANCE MODE */}
          <FinanceHeroHologram
            position={[0.0, 2.70, 1.8]}
            fundTotal="25.000.000đ"
            userPercentage={40}
          />

          {/* Right-Side 3D World-Space Holographic Control Console */}
          <FinanceControlHologram3D
            position={[6.5, 1.5, 2.80]}
            rotation={[0, -0.1745, 0]}
          />
        </group>
      );

    case 'AI_ASSISTANT':
      return (
        <group name="AiSpatialHologramCluster">
          {/* Right-Side 3D World-Space Holographic AI Assistant Console */}
          <AiControlHologram3D
            position={[6.5, 1.5, 2.80]}
            rotation={[0, -0.1745, 0]}
          />
        </group>
      );

    case 'ANALYTICS':
      return (
        <group name="AnalyticsSpatialHologramCluster">
          {/* Right-Side 3D World-Space Holographic Analytics Console */}
          <AnalyticsControlHologram3D
            position={[6.5, 1.5, 2.80]}
            rotation={[0, -0.1745, 0]}
          />
        </group>
      );

    case 'CHARGING':
      return (
        <group name="ChargingSpatialHologramCluster">
          {/* Right-Side 3D World-Space Holographic Charging Console */}
          <ChargingControlHologram3D
            position={[6.0, 1.5, 3.2]}
            rotation={[0, -0.20, 0]}
          />
        </group>
      );

    default:
      return null;
  }
};
