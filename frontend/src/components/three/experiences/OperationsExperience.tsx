import React from 'react';
import { useAuthStore } from '../../../store/authStore';
import { StaffOperations } from './StaffOperations';
import { AdminOperations } from './AdminOperations';

export const OperationsExperience: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <group name="OperationsExperienceShell">
      {isAdmin ? <AdminOperations /> : <StaffOperations />}
    </group>
  );
};

export { StaffOperations as StaffPermissions, AdminOperations as AdminPermissions };
