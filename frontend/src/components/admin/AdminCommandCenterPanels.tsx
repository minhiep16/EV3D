import React from 'react';
import { useWorldStore } from '../../store/worldStore';
import { VehicleResponse } from '../../types/vehicle';
import { AdminUserManagementPanel } from './AdminUserManagementPanel';
import { AdminCoOwnershipPanel } from './AdminCoOwnershipPanel';
import { AdminVehicleAnalyticsPanel } from './AdminVehicleAnalyticsPanel';
import { AdminSecurityAuditPanel } from './AdminSecurityAuditPanel';
import { AdminAiSystemHealthPanel } from './AdminAiSystemHealthPanel';
import { AdminApplicationReviewPanel } from './AdminApplicationReviewPanel';

interface AdminCommandCenterPanelsProps {
  selectedVehicle: VehicleResponse | null;
}

export const AdminCommandCenterPanels: React.FC<AdminCommandCenterPanelsProps> = ({ selectedVehicle }) => {
  const adminActiveModule = useWorldStore((state) => state.adminActiveModule);
  const setAdminActiveModule = useWorldStore((state) => state.setAdminActiveModule);

  if (!adminActiveModule || adminActiveModule === 'NONE') {
    return null;
  }

  const handleClose = () => {
    setAdminActiveModule('NONE');
  };

  const renderPanel = () => {
    switch (adminActiveModule) {
      case 'USER_MANAGEMENT':
        return <AdminUserManagementPanel onClose={handleClose} />;
      case 'CO_OWNERSHIP':
        return <AdminCoOwnershipPanel vehicle={selectedVehicle} onClose={handleClose} />;
      case 'APPLICATION_REVIEW':
        return <AdminApplicationReviewPanel onClose={handleClose} />;
      case 'VEHICLE_ANALYTICS':
        return <AdminVehicleAnalyticsPanel vehicle={selectedVehicle} onClose={handleClose} />;
      case 'SECURITY_AUDIT':
        return <AdminSecurityAuditPanel onClose={handleClose} />;
      case 'AI_SYSTEM_HEALTH':
        return <AdminAiSystemHealthPanel selectedVehicleId={selectedVehicle?.id} onClose={handleClose} />;
      default:
        return null;
    }
  };

  return (
    <div
      data-name="AdminCommandCenterPanelWrapper"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        pointerEvents: 'auto',
      }}
    >
      {renderPanel()}
    </div>
  );
};
