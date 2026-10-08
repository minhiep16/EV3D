import React from 'react';
import { AddExpenseForm, AddExpenseFormProps } from './AddExpenseForm';
import { GroupMemberResponse } from '../../types/coOwnership';
import type { User } from '../../store/authStore';

export { AddExpenseForm } from './AddExpenseForm';
export type { AddExpenseFormProps } from './AddExpenseForm';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName?: string;
  currentUser: User | null;
  coOwners?: GroupMemberResponse[];
}

/**
 * @deprecated Legacy modal wrapper kept for backward compatibility.
 * The authoritative path is rendering AddExpenseForm directly inside the
 * single-slot Finance Hologram Console (ADD_EXPENSE view).
 */
export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  currentUser,
  coOwners = [],
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(2, 8, 18, 0.70)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '450px',
          height: '650px',
          background: 'linear-gradient(180deg, rgba(8, 22, 42, 0.96) 0%, rgba(4, 12, 26, 0.98) 100%)',
          border: '2px solid rgba(0, 242, 254, 0.75)',
          borderRadius: '24px',
          padding: '24px 26px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 242, 254, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <AddExpenseForm
          vehicleId={vehicleId}
          vehicleName={vehicleName}
          currentUser={currentUser}
          coOwners={coOwners}
          onCancel={onClose}
          onSuccess={onClose}
        />
      </div>
    </div>
  );
};
