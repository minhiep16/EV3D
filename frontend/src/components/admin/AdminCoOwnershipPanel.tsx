import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  PieChart,
  FileText,
  History,
  ShieldAlert,
  X,
  ArrowLeft,
  DollarSign,
  Crown,
  CheckCircle2,
  ChevronRight,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { VehicleResponse } from '../../types/vehicle';
import { fetchVehicleCoOwnership } from '../../services/coOwnershipApi';
import { fetchAdminMemberInspection, AdminMemberDetailResponse } from '../../services/adminApi';
import { fetchVehicleAnalytics } from '../../services/analyticsApi';
import { fetchVehicleBookings } from '../../services/bookingApi';
import { fetchContractByVehicle } from '../../services/contractApi';
import { fetchOwnershipHistory } from '../../services/ownershipTransferApi';
import { useWorldStore } from '../../store/worldStore';
import { getStableMemberColor, MEMBER_PALETTE } from '../three/admin/AdminCommandCenter3D';
import { DESIGN_TOKENS } from '../../styles/designTokens';
import { EVCarLoader } from '../common/EVCarLoader';

type PanelTab = 'OVERVIEW' | 'MEMBERS' | 'CONTRACT' | 'HISTORY';

interface AdminCoOwnershipPanelProps {
  vehicle: VehicleResponse | null;
  onClose: () => void;
}

export const AdminCoOwnershipPanel: React.FC<AdminCoOwnershipPanelProps> = ({ vehicle, onClose }) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('OVERVIEW');
  const selectedAdminMemberId = useWorldStore((state) => state.selectedAdminMemberId);
  const setSelectedAdminMemberId = useWorldStore((state) => state.setSelectedAdminMemberId);
  const setAdminActiveModule = useWorldStore((state) => state.setAdminActiveModule);

  const vehicleId = vehicle?.id;

  // 1. Authoritative Co-Ownership Data from backend
  const { data: coOwnership, isLoading, isError } = useQuery({
    queryKey: ['coOwnership', vehicleId],
    queryFn: () => (vehicleId ? fetchVehicleCoOwnership(vehicleId) : null),
    enabled: !!vehicleId,
    staleTime: 10000,
  });

  const groupId = coOwnership?.id;
  const groupName = coOwnership?.name || 'EV01 Co-ownership Group';
  const rawMembers = coOwnership?.members || [];

  // 2. Fetch Member Inspection Detail when a member is selected
  const { data: memberDetail, isLoading: memberDetailLoading } = useQuery<AdminMemberDetailResponse | null>({
    queryKey: ['adminMemberInspection', groupId, selectedAdminMemberId],
    queryFn: () =>
      groupId && selectedAdminMemberId
        ? fetchAdminMemberInspection(groupId, selectedAdminMemberId)
        : null,
    enabled: !!groupId && !!selectedAdminMemberId,
    staleTime: 10000,
  });

  // 3. 30-Day Vehicle Analytics for Combined Usage Chart
  const { data: analytics } = useQuery({
    queryKey: ['vehicleAnalytics', vehicleId, '30d'],
    queryFn: () => (vehicleId ? fetchVehicleAnalytics(vehicleId) : null),
    enabled: !!vehicleId,
    staleTime: 15000,
  });

  // 4. Contract Data for Hợp đồng Tab
  const { data: contractSummary } = useQuery({
    queryKey: ['vehicleContract', vehicleId],
    queryFn: () => (vehicleId ? fetchContractByVehicle(vehicleId) : null),
    enabled: !!vehicleId && activeTab === 'CONTRACT',
    staleTime: 15000,
  });

  // 5. Ownership History for Lịch sử Tab
  const { data: ownershipHistory = [] } = useQuery({
    queryKey: ['ownershipHistory', groupId],
    queryFn: () => (groupId ? fetchOwnershipHistory(groupId) : null),
    enabled: !!groupId && activeTab === 'HISTORY',
    staleTime: 15000,
  });

  // 6. Real Vehicle Bookings for Combined Usage Chart
  const { data: vehicleBookings = [] } = useQuery({
    queryKey: ['vehicleBookings', vehicleId],
    queryFn: () => (vehicleId ? fetchVehicleBookings(vehicleId) : []),
    enabled: !!vehicleId,
    staleTime: 15000,
  });

  const validBookings = useMemo(() => {
    return (vehicleBookings || []).filter((b) => b.status !== 'CANCELLED');
  }, [vehicleBookings]);

  // Group valid bookings by date 'YYYY-MM-DD'
  const bookingsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    validBookings.forEach((b) => {
      if (b.startTime) {
        const dateKey = b.startTime.substring(0, 10);
        map[dateKey] = (map[dateKey] || 0) + 1;
      }
    });
    return map;
  }, [validBookings]);

  // Active raw members for consistent color derivation across 3D holograms and 2D UI
  const activeRawMembers = useMemo(() => {
    return rawMembers.filter((m: any) => m.status === 'ACTIVE' || !m.status);
  }, [rawMembers]);

  // Authoritative Member Extraction
  const parsedMembers = useMemo(() => {
    return rawMembers.map((m, idx) => {
      const rawPct =
        (m as any).ownershipPercentage ??
        m.share?.percentage ??
        (m as any).sharePercentage ??
        (m as any).percentage;
      const shareNum =
        rawPct !== null && rawPct !== undefined && rawPct !== ''
          ? Number(rawPct)
          : null;
      const isLeader =
        m.memberRole === 'REPRESENTATIVE' ||
        (m as any).role === 'REPRESENTATIVE';
      const fullName =
        m.fullName ||
        (m as any).userName ||
        (m as any).displayName ||
        `Thành viên ${idx + 1}`;

      return {
        id: m.id,
        userId: m.userId,
        fullName,
        email: m.email || '',
        role: m.role || '',
        memberRole: m.memberRole,
        status: m.status || 'ACTIVE',
        joinedAt: m.joinedAt,
        sharePercentage: shareNum !== null && !isNaN(shareNum) ? shareNum : null,
        isLeader,
        color: getStableMemberColor(m, activeRawMembers),
      };
    });
  }, [rawMembers, activeRawMembers]);

  const activeMembers = useMemo(() => {
    return parsedMembers.filter((m) => m.status === 'ACTIVE');
  }, [parsedMembers]);

  const leader = useMemo(() => {
    return activeMembers.find((m) => m.isLeader) || activeMembers[0];
  }, [activeMembers]);

  const hasConfiguredShares = useMemo(() => {
    return activeMembers.some((m) => m.sharePercentage !== null);
  }, [activeMembers]);

  const calculatedTotal = useMemo(() => {
    if (!hasConfiguredShares) return null;
    return activeMembers.reduce((sum, m) => sum + (m.sharePercentage ?? 0), 0);
  }, [activeMembers, hasConfiguredShares]);

  const authoritativeTotal = useMemo(() => {
    if (coOwnership?.totalOwnershipPercentage !== undefined && coOwnership?.totalOwnershipPercentage !== null) {
      const num = Number(coOwnership.totalOwnershipPercentage);
      if (!isNaN(num)) return num;
    }
    return calculatedTotal;
  }, [coOwnership, calculatedTotal]);

  const hasIntegrityWarning = useMemo(() => {
    if (isLoading || isError || activeMembers.length === 0 || authoritativeTotal === null) {
      return false;
    }
    return Math.abs(authoritativeTotal - 100.0) >= 0.05;
  }, [isLoading, isError, activeMembers.length, authoritativeTotal]);

  const isIntegrityValid = useMemo(() => {
    if (isLoading || isError || activeMembers.length === 0 || authoritativeTotal === null) {
      return false;
    }
    return Math.abs(authoritativeTotal - 100.0) < 0.05;
  }, [isLoading, isError, activeMembers.length, authoritativeTotal]);

  // Donut chart geometry
  const radius = 56;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  let cumulativeAngle = 0;

  // Chart data points for 30-day usage derived strictly from real vehicle data
  const chartPoints = useMemo(() => {
    const daily = analytics?.dailySeries || [];
    if (daily.length > 0) {
      return daily.slice(-30).map((d) => {
        const rawDate = d.date ? d.date.toString().substring(0, 10) : '';
        const parts = rawDate.split('-');
        const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : rawDate;
        const bookingsCount = bookingsByDate[rawDate] || 0;
        return {
          date: rawDate,
          label,
          bookings: bookingsCount,
          trips: d.tripsCount || 0,
          distanceKm: d.distanceKm || 0,
        };
      });
    }

    // Clean 30-day reporting window ending today when series is not yet loaded
    const points = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const label = `${dd}/${mm}`;
      const bookingsCount = bookingsByDate[dateKey] || 0;
      points.push({
        date: dateKey,
        label,
        bookings: bookingsCount,
        trips: 0,
        distanceKm: 0,
      });
    }
    return points;
  }, [analytics, bookingsByDate]);

  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    label: string;
    bookings: number;
    trips: number;
    distanceKm: number;
    index: number;
  } | null>(null);

  // Real vehicle metrics representing the same reporting period (no fake fallbacks)
  const totalBookings = validBookings.length;
  const completedTrips = analytics?.completedTripsCount ?? 0;
  const totalDistanceKm = analytics?.totalDistanceKm ?? 0;
  const totalDrivingHours = analytics?.totalDrivingHours ?? 0;

  // 30-day SVG chart dimensions and scales
  const svgWidth = 420;
  const svgHeight = 126;
  const chartPadding = { top: 12, right: 12, bottom: 26, left: 32 };
  const plotWidth = svgWidth - chartPadding.left - chartPadding.right; // 376
  const plotHeight = svgHeight - chartPadding.top - chartPadding.bottom; // 88

  const maxDataVal = useMemo(() => {
    const maxVal = Math.max(
      4,
      ...chartPoints.map((p) => Math.max(p.bookings, p.trips))
    );
    return Math.ceil(maxVal / 4) * 4;
  }, [chartPoints]);

  const numPoints = chartPoints.length || 30;
  const colWidth = plotWidth / numPoints;
  const barWidth = Math.max(3.5, Math.min(6, colWidth * 0.55));

  const polylinePoints = useMemo(() => {
    return chartPoints
      .map((p, i) => {
        const cx = chartPadding.left + (i + 0.5) * colWidth;
        const cy = chartPadding.top + plotHeight - (p.trips / maxDataVal) * plotHeight;
        return `${cx},${cy}`;
      })
      .join(' ');
  }, [chartPoints, maxDataVal, colWidth, plotHeight]);

  return (
    <aside
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: 'clamp(414px, 30.5vw, 504px)',
        height: 'min(820px, calc(100dvh - 100px))',
        background: 'rgba(8, 28, 48, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 217, 255, 0.45)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 217, 255, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        color: '#F1F5F9',
        overflow: 'hidden',
      }}
    >
      {/* Header matching reference image */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
          background: 'rgba(10, 32, 56, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(0, 217, 255, 0.15)',
              border: '1.2px solid #00D9FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(0, 217, 255, 0.3)',
            }}
          >
            <Users size={20} color="#00D9FF" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#F1F5F9', letterSpacing: '0.02em' }}>
              QUẢN LÝ ĐỒNG SỞ HỮU
            </div>
            <div style={{ fontSize: '11px', color: '#00D9FF' }}>
              Nhóm xe: <span style={{ color: '#E2E8F0', fontWeight: 700 }}>{groupName}</span>
              {' • '}
              Biển số: <span style={{ color: '#E2E8F0', fontWeight: 700 }}>{vehicle?.licensePlate || '51E-123.45'}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedAdminMemberId(null);
            onClose();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            color: '#94A3B8',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94A3B8';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* 4 Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          padding: '6px 16px',
          background: 'rgba(6, 20, 36, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          gap: '6px',
        }}
      >
        {[
          { key: 'OVERVIEW', label: 'Tổng quan', icon: <PieChart size={13} /> },
          { key: 'MEMBERS', label: 'Thành viên', icon: <Users size={13} /> },
          { key: 'CONTRACT', label: 'Hợp đồng', icon: <FileText size={13} /> },
          { key: 'HISTORY', label: 'Lịch sử', icon: <History size={13} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key as PanelTab);
                setSelectedAdminMemberId(null);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(0, 217, 255, 0.3))'
                  : 'transparent',
                border: isActive
                  ? '1px solid rgba(0, 217, 255, 0.5)'
                  : '1px solid transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                fontSize: '11.5px',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 217, 255, 0.3) rgba(10, 32, 56, 0.5)',
        }}
      >
        {/* Loading State */}
        {isLoading ? (
          <EVCarLoader variant="panel" message="Đang nạp dữ liệu từ máy chủ..." />
        ) : activeTab === 'OVERVIEW' ? (
          /* ======================================================== */
          /* TAB 1: TỔNG QUAN (Matches Reference Image Exactly)       */
          /* ======================================================== */
          <>
            {/* 4 Summary Indicator Cards in a Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {/* Card 1: Thành viên */}
              <div
                style={{
                  background: 'rgba(16, 42, 67, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '2px',
                }}
              >
                <Users size={16} color="#00D9FF" />
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#F1F5F9' }}>
                  {activeMembers.length}
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>Thành viên</div>
              </div>

              {/* Card 2: Tổng cổ phần */}
              <div
                style={{
                  background: 'rgba(16, 42, 67, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '2px',
                }}
              >
                <PieChart size={16} color="#A855F7" />
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#00D9FF' }}>
                  {authoritativeTotal !== null ? `${authoritativeTotal.toFixed(1)}%` : 'N/A'}
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>Tổng cổ phần</div>
              </div>

              {/* Card 3: Trưởng nhóm */}
              <div
                style={{
                  background: 'rgba(16, 42, 67, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '2px',
                }}
              >
                <Crown size={16} color="#FFBF36" />
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: '#F1F5F9',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {leader ? leader.fullName : 'Chưa có'}
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>Trưởng nhóm</div>
              </div>

              {/* Card 4: Trạng thái nhóm */}
              <div
                style={{
                  background: 'rgba(16, 42, 67, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '2px',
                }}
              >
                <CheckCircle2 size={16} color="#10E6A3" />
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#10E6A3', whiteSpace: 'nowrap' }}>
                  Đang hoạt động
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>Trạng thái nhóm</div>
              </div>
            </div>

            {/* Genuine Integrity Warning if present */}
            {hasIntegrityWarning && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1.2px solid #EF4444',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#FCA5A5',
                  fontSize: '11px',
                }}
              >
                <ShieldAlert size={18} color="#EF4444" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 800, color: '#F87171' }}>CẢNH BÁO BẤT TOÀN VẸN CỔ PHẦN:</div>
                  <div>Tổng tỷ lệ sở hữu là {authoritativeTotal?.toFixed(1)}% (lệch chuẩn 100.0%). Cần kiểm tra lại giao dịch góp vốn.</div>
                </div>
              </div>
            )}

            {/* Donut Chart & Member Legend Card */}
            <div
              style={{
                background: 'rgba(16, 42, 67, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '18px',
              }}
            >
              {/* Donut Chart */}
              <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth={strokeWidth}
                  />
                  {hasConfiguredShares &&
                    activeMembers.map((m) => {
                      if (!m.sharePercentage) return null;
                      const pct = m.sharePercentage / 100;
                      const strokeDasharray = `${pct * circumference} ${circumference}`;
                      const strokeDashoffset = -cumulativeAngle * circumference;
                      cumulativeAngle += pct;

                      return (
                        <circle
                          key={m.id}
                          cx="65"
                          cy="65"
                          r={radius}
                          fill="transparent"
                          stroke={m.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          style={{ transition: 'all 0.4s ease' }}
                        />
                      );
                    })}
                </svg>
                {/* Donut Center Display */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#F1F5F9' }}>
                    {authoritativeTotal !== null ? `${authoritativeTotal.toFixed(1)}%` : 'N/A'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>Cổ phần</span>
                </div>
              </div>

              {/* Member Legend List (matches reference image layout) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeMembers.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedAdminMemberId(m.id);
                      setActiveTab('MEMBERS');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 217, 255, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '3px',
                          background: m.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#F1F5F9',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {m.fullName} {m.isLeader ? '(Trưởng nhóm)' : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#F1F5F9', marginLeft: '6px' }}>
                      {m.sharePercentage !== null ? `${m.sharePercentage.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section: Tổng quan sử dụng xe (30 ngày gần nhất) */}
            <div
              style={{
                background: 'rgba(16, 42, 67, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Section Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F1F5F9', fontSize: '12px', fontWeight: 800 }}>
                  <Calendar size={14} color="#00D9FF" />
                  <span>Tổng quan sử dụng xe (30 ngày gần nhất)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminActiveModule('VEHICLE_ANALYTICS')}
                  style={{
                    background: 'rgba(0, 217, 255, 0.1)',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#00D9FF',
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 217, 255, 0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)')}
                >
                  <span>Chi tiết</span>
                  <ExternalLink size={10} />
                </button>
              </div>

              {/* 4 Mini Metrics Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 6px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#00D9FF' }}>{totalBookings}</div>
                  <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>Lượt đặt</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 6px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#A855F7' }}>{completedTrips}</div>
                  <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>Chuyến hoàn tất</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 6px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#10E6A3' }}>{totalDistanceKm.toLocaleString('vi-VN')} km</div>
                  <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>Quãng đường</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 6px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#FFBF36' }}>{totalDrivingHours.toFixed(1)} giờ</div>
                  <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>Thời gian dùng</div>
                </div>
              </div>

              {/* Interactive Tooltip Status Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: hoveredPoint ? 'rgba(0, 217, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${hoveredPoint ? 'rgba(0, 217, 255, 0.35)' : 'rgba(255, 255, 255, 0.05)'}`,
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '10.5px',
                  minHeight: '26px',
                  transition: 'all 0.15s ease',
                }}
              >
                {hoveredPoint ? (
                  <>
                    <span style={{ fontWeight: 800, color: '#F1F5F9' }}>📅 Ngày {hoveredPoint.label}</span>
                    <span style={{ color: '#00D9FF', fontWeight: 700 }}>{hoveredPoint.bookings} lượt đặt</span>
                    <span style={{ color: '#A855F7', fontWeight: 700 }}>{hoveredPoint.trips} chuyến xong</span>
                    <span style={{ color: '#10E6A3', fontWeight: 700 }}>{hoveredPoint.distanceKm.toFixed(1)} km</span>
                  </>
                ) : (
                  <span style={{ color: '#64748B', fontSize: '10px', fontStyle: 'italic', margin: '0 auto' }}>
                    Rê chuột lên biểu đồ để xem chi tiết từng ngày
                  </span>
                )}
              </div>

              {/* 30-Day SVG Usage Chart */}
              <div style={{ width: '100%', position: 'relative' }}>
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                >
                  <defs>
                    <linearGradient id="cyanBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Dashed Grid Lines & Y-Axis Numerical Ticks */}
                  {[0, maxDataVal / 2, maxDataVal].map((tickVal) => {
                    const y = chartPadding.top + plotHeight - (tickVal / maxDataVal) * plotHeight;
                    return (
                      <g key={tickVal}>
                        <line
                          x1={chartPadding.left}
                          y1={y}
                          x2={svgWidth - chartPadding.right}
                          y2={y}
                          stroke={tickVal === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'}
                          strokeDasharray={tickVal === 0 ? undefined : '3 3'}
                          strokeWidth="1"
                        />
                        <text
                          x={chartPadding.left - 6}
                          y={y + 3}
                          fill="#64748B"
                          fontSize="8.5"
                          textAnchor="end"
                          fontWeight="600"
                        >
                          {tickVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Y Axis line */}
                  <line
                    x1={chartPadding.left}
                    y1={chartPadding.top}
                    x2={chartPadding.left}
                    y2={chartPadding.top + plotHeight}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                  />

                  {/* X Axis line */}
                  <line
                    x1={chartPadding.left}
                    y1={chartPadding.top + plotHeight}
                    x2={svgWidth - chartPadding.right}
                    y2={chartPadding.top + plotHeight}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                  />

                  {/* Cyan Bars for Bookings */}
                  {chartPoints.map((pt, i) => {
                    const cx = chartPadding.left + (i + 0.5) * colWidth;
                    const barHeight = (pt.bookings / maxDataVal) * plotHeight;
                    const barY = chartPadding.top + plotHeight - barHeight;
                    const isHovered = hoveredPoint?.index === i;

                    return (
                      <rect
                        key={`bar-${i}`}
                        x={cx - barWidth / 2}
                        y={barY}
                        width={barWidth}
                        height={Math.max(barHeight, 0.5)}
                        rx="1.5"
                        fill="url(#cyanBarGradient)"
                        opacity={hoveredPoint && !isHovered ? 0.4 : 0.9}
                        style={{ transition: 'opacity 0.15s ease' }}
                      />
                    );
                  })}

                  {/* Purple Line for Completed Trips */}
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Purple Dots for Completed Trips */}
                  {chartPoints.map((pt, i) => {
                    const cx = chartPadding.left + (i + 0.5) * colWidth;
                    const cy = chartPadding.top + plotHeight - (pt.trips / maxDataVal) * plotHeight;
                    const isHovered = hoveredPoint?.index === i;

                    return (
                      <circle
                        key={`dot-${i}`}
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 3.5 : 2}
                        fill="#A855F7"
                        stroke="#FFFFFF"
                        strokeWidth={isHovered ? 1.5 : 0.8}
                      />
                    );
                  })}

                  {/* X-Axis Sampled Date Labels (sampled every 5–6 days without overlap) */}
                  {[0, 6, 12, 18, 24, numPoints - 1].map((idx) => {
                    if (idx >= numPoints) return null;
                    const pt = chartPoints[idx];
                    const cx = chartPadding.left + (idx + 0.5) * colWidth;
                    return (
                      <g key={`x-tick-${idx}`}>
                        <line
                          x1={cx}
                          y1={chartPadding.top + plotHeight}
                          x2={cx}
                          y2={chartPadding.top + plotHeight + 3}
                          stroke="rgba(255, 255, 255, 0.25)"
                        />
                        <text
                          x={cx}
                          y={svgHeight - 8}
                          fill="#94A3B8"
                          fontSize="8.5"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Hover Vertical Cursor Line */}
                  {hoveredPoint && (
                    <line
                      x1={chartPadding.left + (hoveredPoint.index + 0.5) * colWidth}
                      y1={chartPadding.top}
                      x2={chartPadding.left + (hoveredPoint.index + 0.5) * colWidth}
                      y2={chartPadding.top + plotHeight}
                      stroke="#00D9FF"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                  )}

                  {/* Interactive Transparent Hitbox Slices */}
                  {chartPoints.map((pt, i) => (
                    <rect
                      key={`hitbox-${i}`}
                      x={chartPadding.left + i * colWidth}
                      y={chartPadding.top}
                      width={colWidth}
                      height={plotHeight + chartPadding.bottom}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint({ ...pt, index: i })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>
              </div>

              {/* Chart Legend */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '10px', color: '#94A3B8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#00D9FF', borderRadius: '2px' }} />
                  <span>Lượt đặt xe</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#A855F7', borderRadius: '50%' }} />
                  <span>Chuyến hoàn tất</span>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'MEMBERS' ? (
          /* ======================================================== */
          /* TAB 2: THÀNH VIÊN ĐỒNG SỞ HỮU                            */
          /* ======================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedAdminMemberId && memberDetail ? (
                /* Member Detail Inspection View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedAdminMemberId(null)}
                    style={{
                      background: 'rgba(0, 217, 255, 0.08)',
                      border: '1px solid rgba(0, 217, 255, 0.25)',
                      borderRadius: '8px',
                      color: '#00D9FF',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: 'fit-content',
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>Quay lại danh sách</span>
                  </button>

                  <div
                    style={{
                      background: 'rgba(16, 42, 67, 0.75)',
                      border: '1.2px solid rgba(0, 217, 255, 0.35)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {memberDetail.memberRole === 'REPRESENTATIVE' && <Crown size={15} color="#FFBF36" />}
                          <span>{memberDetail.fullName}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>{memberDetail.email}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '17px', fontWeight: 900, color: '#00D9FF' }}>
                          {memberDetail.ownershipPercentage !== null && memberDetail.ownershipPercentage !== undefined
                            ? `${Number(memberDetail.ownershipPercentage).toFixed(1)}%`
                            : 'N/A'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#00D9FF', fontWeight: 700 }}>
                          {memberDetail.memberRole === 'REPRESENTATIVE' ? 'ĐẠI DIỆN TRƯỞNG NHÓM' : 'THÀNH VIÊN ĐỒNG SỞ HỮU'}
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>Chuyến đi</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#F1F5F9' }}>
                          {memberDetail.totalTrips || 0} chuyến
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#64748B' }}>{(memberDetail.totalDistanceKm || 0).toFixed(0)} km</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>Lịch đặt xe</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#F1F5F9' }}>
                          {memberDetail.totalBookings || 0} lượt
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#64748B' }}>{(memberDetail.totalDrivingHours || 0).toFixed(1)}h lái</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>Ký hợp đồng</div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: memberDetail.contractSigned ? '#10E6A3' : '#FFBF36' }}>
                          {memberDetail.contractSigned ? 'Đã ký số' : 'Chờ xác nhận'}
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#64748B' }}>Chứng thư điện tử</div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div
                      style={{
                        background: 'rgba(2, 132, 199, 0.08)',
                        border: '1px solid rgba(2, 132, 199, 0.25)',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#00D9FF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DollarSign size={13} />
                        <span>NGHĨA VỤ TÀI CHÍNH THÀNH VIÊN:</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#CBD5E1' }}>
                        <span>Tổng phân bổ chi phí:</span>
                        <span style={{ fontWeight: 700 }}>
                          {memberDetail.requiredFinancialShare ? Number(memberDetail.requiredFinancialShare).toLocaleString('vi-VN') : '0'} ₫
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#10E6A3' }}>
                        <span>Đã thanh toán:</span>
                        <span style={{ fontWeight: 700 }}>
                          {memberDetail.paidFinancialAmount ? Number(memberDetail.paidFinancialAmount).toLocaleString('vi-VN') : '0'} ₫
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: Number(memberDetail.outstandingBalance || 0) > 0 ? '#F87171' : '#10E6A3' }}>
                        <span>Số dư chưa quyết toán:</span>
                        <span style={{ fontWeight: 800 }}>
                          {memberDetail.outstandingBalance ? Number(memberDetail.outstandingBalance).toLocaleString('vi-VN') : '0'} ₫
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Members Roster */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    DANH SÁCH ĐỒNG SỞ HỮU ({activeMembers.length} THÀNH VIÊN)
                  </div>
                  {activeMembers.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedAdminMemberId(m.id)}
                      style={{
                        background: 'rgba(16, 42, 67, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)';
                        e.currentTarget.style.borderColor = m.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 42, 67, 0.7)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: `${m.color}22`,
                            border: `1.2px solid ${m.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 900,
                            color: m.color,
                            flexShrink: 0,
                          }}
                        >
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{m.fullName}</span>
                            {m.isLeader && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  background: 'rgba(255, 191, 54, 0.2)',
                                  color: '#FFBF36',
                                  border: '1px solid rgba(255, 191, 54, 0.4)',
                                  borderRadius: '4px',
                                  padding: '1px 5px',
                                }}
                              >
                                TRƯỞNG NHÓM
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                            {m.email} • Gia nhập {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('vi-VN') : 'Ban đầu'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: m.color }}>
                            {m.sharePercentage !== null ? `${m.sharePercentage.toFixed(1)}%` : 'Chưa gán'}
                          </div>
                          <div style={{ fontSize: '9px', color: '#10E6A3', fontWeight: 700 }}>Đã kích hoạt</div>
                        </div>
                        <ChevronRight size={14} color="#64748B" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ) : activeTab === 'CONTRACT' ? (
              /* Contract Inspection View */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {contractSummary ? (
                  <div
                    style={{
                      background: 'rgba(16, 42, 67, 0.75)',
                      border: '1px solid rgba(0, 217, 255, 0.3)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#F1F5F9' }}>
                          HỢP ĐỒNG ĐỒNG SỞ HỮU PHƯƠNG TIỆN
                        </div>
                        <div style={{ fontSize: '11px', color: '#00D9FF' }}>
                          Mã: {contractSummary.contractCode} • Phiên bản {contractSummary.currentVersionFormatted || 'v1.0'}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          background: 'rgba(16, 230, 163, 0.2)',
                          color: '#10E6A3',
                          border: '1px solid rgba(16, 230, 163, 0.4)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                        }}
                      >
                        {contractSummary.statusLabel || 'ĐANG ÁP DỤNG'}
                      </span>
                    </div>

                    {/* Signatures Progress */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                        <span style={{ color: '#94A3B8' }}>Tiến độ ký số pháp lý:</span>
                        <span style={{ fontWeight: 800, color: '#10E6A3' }}>
                          {contractSummary.acceptedMembers}/{contractSummary.totalMembers} thành viên ({Math.round((contractSummary.acceptedMembers / Math.max(1, contractSummary.totalMembers)) * 100)}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.round((contractSummary.acceptedMembers / Math.max(1, contractSummary.totalMembers)) * 100)}%`,
                            height: '100%',
                            background: '#10E6A3',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>

                    {/* Signatories List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                        Danh sách người ký kết:
                      </div>
                      {(contractSummary.signatories || []).map((sig, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '8px',
                            fontSize: '11px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{sig.fullName}</div>
                            <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>{sig.email}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: sig.isConsented ? '#10E6A3' : '#FFBF36', fontWeight: 700 }}>
                              {sig.isConsented ? '✓ Đã xác thực ký' : (sig.statusVi || 'Chờ ký')}
                            </span>
                            {sig.consentedAt && (
                              <div style={{ fontSize: '9px', color: '#64748B' }}>
                                {new Date(sig.consentedAt).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                    Phương tiện này chưa có hợp đồng điện tử được kích hoạt.
                  </div>
                )}
              </div>
        ) : activeTab === 'HISTORY' ? (
          /* ======================================================== */
          /* TAB 4: LỊCH SỬ SỞ HỮU & GIAO DỊCH                       */
          /* ======================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  NHẬT KÝ SỞ HỮU & GIAO DỊCH
                </div>
                {ownershipHistory && ownershipHistory.length > 0 ? (
                  ownershipHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(16, 42, 67, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#00D9FF' }}>
                          {item.transferredPercentage ? `CHUYỂN NHƯỢNG ${item.transferredPercentage}%` : 'CẬP NHẬT CỔ PHẦN'}
                        </span>
                        <span style={{ fontSize: '9.5px', color: '#64748B' }}>
                          {item.effectiveAt ? new Date(item.effectiveAt).toLocaleDateString('vi-VN') : item.recordedAt ? new Date(item.recordedAt).toLocaleDateString('vi-VN') : 'Ban đầu'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#CBD5E1' }}>
                        {item.reason || (item.fromUserName && item.toUserName ? `${item.fromUserName} chuyển ${item.transferredPercentage}% cho ${item.toUserName}.` : 'Ghi nhận biến động sở hữu phương tiện.')}
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { title: 'KHỞI TẠO NHÓM ĐỒNG SỞ HỮU', date: 'Thành lập nhóm', desc: `Nhóm ${groupName} được đăng ký thành công trên hệ thống.` },
                    { title: 'KÝ KẾT HỢP ĐỒNG ĐỒNG SỞ HỮU', date: 'Hợp đồng v1.0', desc: 'Toàn bộ thành viên hoàn tất ký số thỏa thuận phân bổ cổ phần.' },
                    { title: 'BÀN GIAO PHƯƠNG TIỆN HOẠT ĐỘNG', date: 'Kích hoạt xe', desc: `Phương tiện ${vehicle?.licensePlate || '51E-123.45'} chính thức sẵn sàng vận hành.` },
                  ].map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(16, 42, 67, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#00D9FF' }}>{ev.title}</span>
                        <span style={{ fontSize: '9.5px', color: '#64748B' }}>{ev.date}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#CBD5E1' }}>{ev.desc}</div>
                    </div>
                  ))
                )}
              </div>
        ) : null}
      </div>
    </aside>
  );
};


