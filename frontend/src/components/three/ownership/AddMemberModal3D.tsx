import React, { useState } from 'react';
import { Html, Billboard } from '@react-three/drei';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import { searchAvailableUsers, addMemberToGroup } from '../../../services/coOwnershipApi';
import { AvailableUserResponse } from '../../../types/coOwnership';
import {
  UserPlus,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
  Mail,
  User as UserIcon,
} from 'lucide-react';

interface AddMemberModal3DProps {
  groupId: string;
  vehicleId: string;
  position?: [number, number, number];
  onClose: () => void;
}

export const AddMemberModal3D: React.FC<AddMemberModal3DProps> = ({
  groupId,
  vehicleId,
  position = [0.0, 1.45, 0.8],
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AvailableUserResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Query available registered CO_OWNER users matching the search term
  const { data: users = [], isLoading: isSearching } = useQuery<AvailableUserResponse[]>({
    queryKey: ['availableUsers', groupId, searchTerm],
    queryFn: () => searchAvailableUsers(groupId, searchTerm),
    enabled: true,
  });

  // Mutation to add target user to group
  const addMutation = useMutation({
    mutationFn: (userId: string) => addMemberToGroup(groupId, { userId }),
    onSuccess: () => {
      // Invalidate co-ownership queries to dynamically refetch without full page reload
      queryClient.invalidateQueries({ queryKey: ['coOwnership', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['coOwnershipGroup', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.message || 'Không thể thêm thành viên vào nhóm. Vui lòng thử lại.';
      setErrorMessage(msg);
    },
  });

  const handleSelectUser = (user: AvailableUserResponse) => {
    setSelectedUser(user);
    setErrorMessage(null);
  };

  const handleConfirmAdd = () => {
    if (!selectedUser) return;
    setErrorMessage(null);
    addMutation.mutate(selectedUser.id);
  };

  return (
    <group position={position}>
      <Billboard follow={true}>
        <HolographicPanelFrame3D width={2.7} height={3.3} color="#00f2fe" depth={-0.05} />
        <Html
          center
          distanceFactor={8.5}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '320px',
              background: 'rgba(8, 14, 26, 0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid #00f2fe',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 242, 254, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              color: '#ffffff',
              fontFamily: 'var(--font-family, system-ui, sans-serif)',
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Huỷ và đóng"
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
            >
              <X size={14} />
            </button>

            {/* Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10px',
                fontWeight: 800,
                color: '#00f2fe',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              <UserPlus size={13} color="#00f2fe" />
              QUẢN LÝ THÀNH VIÊN
            </div>

            <h3
              style={{
                fontSize: '17px',
                fontWeight: 800,
                margin: '0 0 14px 0',
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              THÊM THÀNH VIÊN
            </h3>

            {/* Search Input Box */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '6px',
                }}
              >
                Tìm người dùng:
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  transition: 'border-color 0.2s',
                }}
              >
                <Search size={14} color="#00f2fe" />
                <input
                  type="text"
                  placeholder="email hoặc tên"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                />
                {isSearching && <Loader2 size={13} color="#00f2fe" className="animate-spin" />}
              </div>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  marginBottom: '12px',
                  color: '#fca5a5',
                  fontSize: '11px',
                  lineHeight: 1.35,
                }}
              >
                <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Results Title */}
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              Kết quả:
            </div>

            {/* Users List Container */}
            <div
              style={{
                maxHeight: '140px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '16px',
                paddingRight: '2px',
              }}
            >
              {users.length === 0 && !isSearching ? (
                <div
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textAlign: 'center',
                    padding: '16px 8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                  }}
                >
                  {searchTerm.trim()
                    ? 'Không tìm thấy người dùng phù hợp'
                    : 'Không còn người dùng khả dụng'}
                </div>
              ) : (
                users.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: isSelected
                          ? 'rgba(0, 242, 254, 0.18)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '1px solid #00f2fe'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: isSelected ? '#00f2fe' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <UserIcon size={12} color={isSelected ? '#00f2fe' : '#94a3b8'} />
                          {u.displayName}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Mail size={10} color="#64748b" />
                          {u.email}
                        </span>
                      </div>

                      {isSelected && (
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#00f2fe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#080e1a',
                          }}
                        >
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={addMutation.isPending}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                HUỶ
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={!selectedUser || addMutation.isPending}
                style={{
                  flex: 1.5,
                  padding: '9px 12px',
                  background: selectedUser
                    ? 'linear-gradient(135deg, #00f2fe, #0ea5e9)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  color: selectedUser ? '#080e1a' : '#64748b',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: selectedUser && !addMutation.isPending ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: selectedUser ? '0 0 16px rgba(0, 242, 254, 0.4)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {addMutation.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    ĐANG THÊM...
                  </>
                ) : (
                  <>
                    <UserPlus size={13} />
                    THÊM VÀO NHÓM
                  </>
                )}
              </button>
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
};
