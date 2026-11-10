import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Vote,
  DollarSign,
  Clock,
  Check,
  ChevronRight,
  ExternalLink,
  Info,
  Trash2,
  MoreVertical,
  CheckCheck,
  X,
  Calendar,
  ShieldCheck,
  Car,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  deleteAllNotifications,
} from '../../services/notificationApi';
import { NotificationResponse, NotificationSeverity, NotificationEntityType } from '../../types/notification';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';

function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    const days = Math.floor(diffSec / 86400);
    if (days < 7) return `${days} ngày trước`;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  } catch {
    return '';
  }
}

function getEntityIcon(entityType: NotificationEntityType, severity: NotificationSeverity) {
  if (severity === 'WARNING') {
    return <AlertTriangle size={14} color="#f87171" />;
  }
  if (severity === 'SUCCESS') {
    return <CheckCircle2 size={14} color="#34d399" />;
  }
  switch (entityType) {
    case 'DAMAGE':
      return <AlertTriangle size={14} color="#fbbf24" />;
    case 'VOTE':
    case 'PROPOSAL':
      return <Vote size={14} color="#00f2fe" />;
    case 'MAINTENANCE':
      return <Wrench size={14} color="#38bdf8" />;
    case 'FINANCE':
      return <DollarSign size={14} color="#a78bfa" />;
    case 'BOOKING':
      return <Calendar size={14} color="#38bdf8" />;
    case 'HANDOVER':
      return <ShieldCheck size={14} color="#10b981" />;
    case 'TRIP':
      return <Car size={14} color="#00f2fe" />;
    default:
      return <Info size={14} color="#94a3b8" />;
  }
}

export const NotificationBell: React.FC = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activePrimaryPanel = useWorldStore((state) => state.activePrimaryPanel);
  const isOpen = activePrimaryPanel === 'NOTIFICATIONS';
  const toggleNotifications = useWorldStore((state) => state.toggleNotifications);
  const closeGaragePanel = useWorldStore((state) => state.closeGaragePanel);
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);
  const openDamageDetailModal = useWorldStore((state) => state.openDamageDetailModal);
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const setPaymentVerificationModalOpen = useWorldStore((state) => state.setPaymentVerificationModalOpen);

  // Authoritative Query: Fetch notifications (full list needed when panel is open or on manual refresh)
  const {
    data: notifications = [],
    isLoading: isNotifsLoading,
    isError: isNotifsError,
    refetch: refetchNotifs,
  } = useQuery<NotificationResponse[]>({
    queryKey: ['notifications', user?.id],
    queryFn: fetchNotifications,
    enabled: isAuthenticated,
    staleTime: 5000,
    refetchInterval: isOpen ? 5000 : 15000,
    refetchOnWindowFocus: true,
  });

  // Authoritative Query: Fetch unread count for badge
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: fetchUnreadCount,
    enabled: isAuthenticated,
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete single notification mutation
  const deleteSingleMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete all read notifications mutation
  const deleteReadMutation = useMutation({
    mutationFn: deleteAllReadNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete all notifications mutation
  const deleteAllMutation = useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          closeGaragePanel('NOTIFICATIONS');
        }
        setShowActionsMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeGaragePanel('NOTIFICATIONS');
        setShowActionsMenu(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeGaragePanel]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'UNREAD') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  const handleNotificationClick = (item: NotificationResponse) => {
    // 1. Mark as read immediately
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }

    // 2. Close actions menu popover
    setShowActionsMenu(false);

    // 3. Authoritatively navigate to relevant 3D feature via openGaragePanel
    // Switching activePrimaryPanel immediately unmounts NOTIFICATIONS and opens target panel exclusively.
    const targetVehicleId = item.vehicleId || selectedVehicleId || 'EV01';

    if (item.entityType === 'DAMAGE') {
      if (selectedVehicleId !== targetVehicleId) {
        selectVehicle(targetVehicleId);
      }
      openGaragePanel('MAINTENANCE', {
        vehicleId: targetVehicleId,
      });
    } else if (item.entityType === 'VOTE' || item.entityType === 'PROPOSAL') {
      if (selectedVehicleId !== targetVehicleId) {
        selectVehicle(targetVehicleId);
      }
      openGaragePanel('VOTING', {
        vehicleId: targetVehicleId,
        proposalId: item.entityId || undefined,
      });
    } else if (item.entityType === 'MAINTENANCE') {
      if (selectedVehicleId !== targetVehicleId) {
        selectVehicle(targetVehicleId);
      }
      openGaragePanel('MAINTENANCE', {
        vehicleId: targetVehicleId,
        maintenanceId: item.entityId || undefined,
      });
    } else if (item.entityType === 'FINANCE') {
      if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
        if (targetVehicleId && selectedVehicleId !== targetVehicleId) {
          selectVehicle(targetVehicleId);
        }
        setPaymentVerificationModalOpen(true);
      } else {
        if (targetVehicleId && selectedVehicleId !== targetVehicleId) {
          selectVehicle(targetVehicleId);
        }
        openGaragePanel('FINANCE', { vehicleId: targetVehicleId });
      }
    } else if (item.entityType === 'BOOKING') {
      if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
        selectVehicle(targetVehicleId);
        useWorldStore.getState().setActiveStaffOperationModule('HANDOVER');
        openGaragePanel('VEHICLE_DETAIL', { vehicleId: targetVehicleId });
      } else {
        selectVehicle(targetVehicleId);
        openGaragePanel('BOOKING', { vehicleId: targetVehicleId });
      }
    } else if (item.entityType === 'HANDOVER') {
      if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
        selectVehicle(targetVehicleId);
        useWorldStore.getState().setActiveStaffOperationModule('HANDOVER');
        openGaragePanel('VEHICLE_DETAIL', { vehicleId: targetVehicleId });
      } else {
        selectVehicle(targetVehicleId);
        useWorldStore.getState().enterVehicleTripStartMode();
      }
    } else if (item.entityType === 'TRIP') {
      if (item.eventType === 'TRIP_RETURN_REQUESTED') {
        if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
          selectVehicle(targetVehicleId);
          useWorldStore.getState().setActiveStaffOperationModule('RETURN');
          openGaragePanel('VEHICLE_DETAIL', { vehicleId: targetVehicleId });
        } else {
          selectVehicle(targetVehicleId);
          useWorldStore.getState().enterVehicleTripVisualizationMode();
        }
      } else if (item.eventType === 'TRIP_START_WINDOW_OPENED') {
        selectVehicle(targetVehicleId);
        useWorldStore.getState().enterVehicleTripStartMode();
      } else if (item.eventType === 'TRIP_STARTED') {
        selectVehicle(targetVehicleId);
        useWorldStore.getState().enterVehicleTripVisualizationMode();
      } else {
        selectVehicle(targetVehicleId);
        openGaragePanel('VEHICLE_DETAIL', { vehicleId: targetVehicleId });
      }
    } else {
      if (selectedVehicleId !== targetVehicleId) {
        selectVehicle(targetVehicleId);
      }
      openGaragePanel('VEHICLE_DETAIL', { vehicleId: targetVehicleId });
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => toggleNotifications()}
        title="Trung tâm thông báo"
        aria-label="Thông báo"
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: isOpen ? 'rgba(0, 242, 254, 0.2)' : 'rgba(7, 20, 38, 0.85)',
          backdropFilter: 'blur(16px)',
          border: isOpen ? '1.5px solid #00f2fe' : '1px solid rgba(34, 230, 255, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? '#00f2fe' : '#cbd5e1',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        <Bell size={15} color={isOpen ? '#00f2fe' : unreadCount > 0 ? '#ffffff' : '#9bb3c9'} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              minWidth: '17px',
              height: '17px',
              padding: '0 4px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: '1.5px solid #071426',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.7)',
              color: '#ffffff',
              fontSize: '9.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Luxury Compact Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: '0',
            width: 'clamp(320px, 85vw, 380px)',
            maxHeight: '480px',
            background: 'linear-gradient(180deg, rgba(8, 18, 36, 0.98) 0%, rgba(4, 10, 22, 0.99) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.1)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: '#f8fafc',
            animation: 'fadeIn 0.15s ease-out',
            pointerEvents: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', color: '#f8fafc' }}>
                THÔNG BÁO
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'rgba(0, 242, 254, 0.18)',
                    color: '#00f2fe',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                  }}
                >
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  title="Đánh dấu tất cả đã đọc"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: 0.9,
                  }}
                >
                  <Check size={12} />
                  <span>Đã đọc</span>
                </button>
              )}

              {/* Actions Menu Trigger */}
              <button
                type="button"
                onClick={() => setShowActionsMenu((prev) => !prev)}
                title="Tùy chọn quản lý thông báo"
                aria-label="Tùy chọn quản lý thông báo"
                style={{
                  background: showActionsMenu ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: showActionsMenu ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: showActionsMenu ? '#00f2fe' : '#94a3b8',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MoreVertical size={14} />
              </button>

              {/* Actions Menu Popover */}
              {showActionsMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '6px',
                    width: '210px',
                    backgroundColor: 'rgba(15, 23, 42, 0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    borderRadius: '10px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
                    zIndex: 1100,
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      markAllReadMutation.mutate();
                    }}
                    disabled={unreadCount === 0}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      color: unreadCount === 0 ? '#64748b' : '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (unreadCount > 0) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <CheckCheck size={13} color="#38bdf8" />
                    <span>Đánh dấu tất cả đã đọc</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      deleteReadMutation.mutate();
                    }}
                    disabled={notifications.every((n) => !n.isRead)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      color: notifications.every((n) => !n.isRead) ? '#64748b' : '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: notifications.every((n) => !n.isRead) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!notifications.every((n) => !n.isRead)) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={13} color="#f59e0b" />
                    <span>Xóa thông báo đã đọc</span>
                  </button>

                  <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      if (window.confirm('Bạn có chắc muốn xóa tất cả thông báo của mình?')) {
                        deleteAllMutation.mutate();
                      }
                    }}
                    disabled={notifications.length === 0}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      color: notifications.length === 0 ? '#64748b' : '#f87171',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: notifications.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (notifications.length > 0) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={13} color="#f87171" />
                    <span>Xóa tất cả thông báo</span>
                  </button>
                </div>
              )}
              {/* Close Button */}
              <button
                type="button"
                onClick={() => closeGaragePanel('NOTIFICATIONS')}
                title="Đóng thông báo"
                aria-label="Đóng thông báo"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: filter === 'ALL' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                background: filter === 'ALL' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                color: filter === 'ALL' ? '#00f2fe' : '#94a3b8',
                fontSize: '10.5px',
                fontWeight: filter === 'ALL' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: filter === 'UNREAD' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                background: filter === 'UNREAD' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                color: filter === 'UNREAD' ? '#00f2fe' : '#94a3b8',
                fontSize: '10.5px',
                fontWeight: filter === 'UNREAD' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '360px',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {isNotifsLoading ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#38bdf8',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Loader2 size={22} className="animate-spin" color="#00f2fe" />
                <div>Đang tải thông báo...</div>
              </div>
            ) : isNotifsError ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: '#f87171',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={22} color="#f87171" />
                <div>Không thể tải thông báo</div>
                <button
                  type="button"
                  onClick={() => refetchNotifs()}
                  style={{
                    marginTop: '4px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Thử lại</span>
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={24} color="#10b981" />
                <div>Không có thông báo nào {filter === 'UNREAD' ? 'chưa đọc' : ''}</div>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: item.isRead
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'rgba(0, 242, 254, 0.08)',
                    border: item.isRead
                      ? '1px solid rgba(255, 255, 255, 0.05)'
                      : '1px solid rgba(0, 242, 254, 0.25)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = item.isRead
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 242, 254, 0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = item.isRead
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'rgba(0, 242, 254, 0.08)';
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {getEntityIcon(item.entityType, item.severity)}
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        marginBottom: '2px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: item.isRead ? 600 : 800,
                          color: item.isRead ? '#e2e8f0' : '#ffffff',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#00f2fe',
                            boxShadow: '0 0 6px #00f2fe',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        color: item.isRead ? '#94a3b8' : '#cbd5e1',
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.message}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                        fontSize: '9.5px',
                        color: '#64748b',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> {formatRelativeTime(item.createdAt)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSingleMutation.mutate(item.id);
                          }}
                          title="Xóa thông báo này"
                          aria-label="Xóa thông báo này"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '9.5px',
                            fontWeight: 600,
                            transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                        >
                          <Trash2 size={10} />
                          <span>Xóa</span>
                        </button>
                        <span
                          style={{
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontWeight: 600,
                          }}
                        >
                          Xem chi tiết <ChevronRight size={10} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

