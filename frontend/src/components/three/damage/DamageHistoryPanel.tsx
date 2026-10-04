import React, { useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Layers,
  MapPin,
  RefreshCw,
  Shield,
  Tag,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { VehicleResponse } from '../../../types/vehicle';
import {
  DamageRecordResponse,
  DamageSeverity,
  DamageStatus,
  DAMAGE_SEVERITY_CONFIG,
  DAMAGE_STATUS_CONFIG,
  DAMAGE_TYPE_LABELS,
} from '../../../types/damage';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { hasCapability } from '../../../utils/roleCapabilities';
import { getPartById } from '../../../data/vehicleParts';

interface DamageHistoryPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '--/--/---- --:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--/--/---- --:--';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '--/--/---- --:--';
  }
}

export const DamageHistoryPanel: React.FC<DamageHistoryPanelProps> = ({
  vehicle,
  onClose,
}) => {
  // Store subscriptions (unconditional hooks)
  const selectedDamageId = useWorldStore((state) => state.selectedDamageId);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);
  const severityFilter = useWorldStore((state) => state.damageHistorySeverityFilter);
  const setSeverityFilter = useWorldStore((state) => state.setDamageHistorySeverityFilter);
  const statusFilter = useWorldStore((state) => state.damageHistoryStatusFilter);
  const setStatusFilter = useWorldStore((state) => state.setDamageHistoryStatusFilter);
  const partFilter = useWorldStore((state) => state.damageHistoryPartFilter);
  const setPartFilter = useWorldStore((state) => state.setDamageHistoryPartFilter);
  const returnToGarageOverview = useWorldStore((state) => state.returnToGarageOverview);
  const enterVehicleMaintenanceMode = useWorldStore((state) => state.enterVehicleMaintenanceMode);
  const user = useAuthStore((state) => state.user);
  const canCreateMaintenance = hasCapability(user?.role, 'canCreateMaintenance');

  // TanStack Query: Fetch authoritative damage records for this isolated vehicle (unconditional hook)
  const vehicleId = vehicle?.id || 'EV01';
  const {
    data: damages = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<DamageRecordResponse[]>({
    queryKey: ['vehicleDamages', vehicleId],
    queryFn: () => (vehicle?.id ? fetchVehicleDamages(vehicle.id) : Promise.resolve([])),
    enabled: !!vehicle?.id,
    staleTime: 5000,
  });

  // Extract distinct part codes from fetched damages for part filter dropdown
  const distinctPartCodes = useMemo(() => {
    const set = new Set<string>();
    damages.forEach((d) => {
      if (d.vehiclePartCode) set.add(d.vehiclePartCode);
    });
    return Array.from(set);
  }, [damages]);

  // Derived filtered damage list (sorted chronologically descending)
  const filteredDamages = useMemo(() => {
    return damages
      .filter((item) => {
        const itemStatus = item.status || 'OPEN';
        if (statusFilter !== 'ALL' && itemStatus !== statusFilter) {
          return false;
        }
        if (severityFilter !== 'ALL' && item.severity !== severityFilter) {
          return false;
        }
        if (partFilter !== 'ALL' && item.vehiclePartCode !== partFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [damages, statusFilter, severityFilter, partFilter]);

  // Selected damage record
  const selectedRecord = useMemo(() => {
    if (!selectedDamageId) return null;
    return damages.find((d) => d.id === selectedDamageId) || null;
  }, [damages, selectedDamageId]);

  // Auto-scroll to selected record item in list
  const selectedItemRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedRecord && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedDamageId, selectedRecord]);

  // Summary statistics
  const totalCount = damages.length;
  const openCount = useMemo(
    () => damages.filter((d) => (d.status || 'OPEN') === 'OPEN').length,
    [damages]
  );
  const underMaintenanceCount = useMemo(
    () => damages.filter((d) => d.status === 'UNDER_MAINTENANCE').length,
    [damages]
  );
  const resolvedCount = useMemo(
    () => damages.filter((d) => d.status === 'RESOLVED').length,
    [damages]
  );
  const severeCount = useMemo(
    () => damages.filter((d) => d.severity === 'SEVERE').length,
    [damages]
  );
  const moderateCount = useMemo(
    () => damages.filter((d) => d.severity === 'MODERATE').length,
    [damages]
  );
  const minorCount = useMemo(
    () => damages.filter((d) => d.severity === 'MINOR').length,
    [damages]
  );
  const latestDate = useMemo(() => {
    if (damages.length === 0) return null;
    const sorted = [...damages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0].createdAt;
  }, [damages]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '88px',
        right: '20px',
        bottom: '20px',
        width: 'clamp(350px, 28vw, 430px)',
        zIndex: 40,
        background: 'linear-gradient(180deg, rgba(11, 18, 33, 0.96) 0%, rgba(6, 11, 22, 0.98) 100%)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(0, 242, 254, 0.22)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 35px rgba(0, 242, 254, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        color: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Quay lại xe"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={15} color="#fbbf24" />
              <span>LỊCH SỬ HƯ HỎNG</span>
            </div>
            <div style={{ fontSize: '11px', color: '#00f2fe', fontWeight: 600 }}>
              {vehicle?.plateNumber || vehicle?.modelName || 'Xe EV'} — Digital Twin
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(0, 242, 254, 0.12)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#00f2fe',
            letterSpacing: '0.04em',
          }}
        >
          READ-ONLY
        </div>
      </div>

      {/* 2. Summary Statistics Card */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          {/* Total */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>
              Tổng ghi nhận
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
              {totalCount}
            </div>
          </div>

          {/* Severe */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9px', color: '#fca5a5', textTransform: 'uppercase' }}>
              Nghiêm trọng
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171' }}>
              {severeCount}
            </div>
          </div>

          {/* Moderate + Minor */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9px', color: '#fde68a', textTransform: 'uppercase' }}>
              Trung bình / Nhẹ
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>
              {moderateCount + minorCount}
            </div>
          </div>
        </div>

        {/* Latest record date */}
        <div
          style={{
            fontSize: '10.5px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} color="#64748b" /> Ghi nhận gần nhất:
          </span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
            {latestDate ? formatDateTime(latestDate) : 'Chưa có dữ liệu'}
          </span>
        </div>
      </div>

      {/* 3. Filters Section (Status, Severity & Part Filter) */}
      <div
        style={{
          padding: '10px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Status Filter Pills (Requirement 20) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, minWidth: '46px' }}>
            TRẠNG THÁI:
          </span>
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            {(
              [
                { id: 'ALL', label: 'Tất cả', count: totalCount },
                { id: 'OPEN', label: 'Tồn tại', count: openCount },
                { id: 'UNDER_MAINTENANCE', label: 'Bảo dưỡng', count: underMaintenanceCount },
                { id: 'RESOLVED', label: 'Khắc phục', count: resolvedCount },
              ] as const
            ).map((st) => {
              const isActive = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id as DamageStatus | 'ALL')}
                  style={{
                    flex: 1,
                    padding: '4px 3px',
                    fontSize: '9.5px',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: '6px',
                    border: isActive
                      ? st.id === 'RESOLVED'
                        ? '1px solid #10b981'
                        : st.id === 'UNDER_MAINTENANCE'
                        ? '1px solid #f59e0b'
                        : '1px solid #00f2fe'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isActive
                      ? st.id === 'RESOLVED'
                        ? 'rgba(16, 185, 129, 0.18)'
                        : st.id === 'UNDER_MAINTENANCE'
                        ? 'rgba(245, 158, 11, 0.18)'
                        : 'rgba(0, 242, 254, 0.18)'
                      : 'rgba(255, 255, 255, 0.03)',
                    color: isActive
                      ? st.id === 'RESOLVED'
                        ? '#34d399'
                        : st.id === 'UNDER_MAINTENANCE'
                        ? '#fbbf24'
                        : '#00f2fe'
                      : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title={st.label}
                >
                  {st.label} ({st.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, minWidth: '46px' }}>
            MỨC ĐỘ:
          </span>
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            {(
              [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'MINOR', label: 'Nhẹ' },
                { id: 'MODERATE', label: 'TB' },
                { id: 'SEVERE', label: 'N.trọng' },
              ] as const
            ).map((sev) => {
              const isActive = severityFilter === sev.id;
              return (
                <button
                  key={sev.id}
                  type="button"
                  onClick={() => setSeverityFilter(sev.id as DamageSeverity | 'ALL')}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    fontSize: '10.5px',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: '6px',
                    border: isActive
                      ? '1px solid #00f2fe'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isActive
                      ? 'rgba(0, 242, 254, 0.18)'
                      : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? '#00f2fe' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sev.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Part Filter Dropdown */}
        {distinctPartCodes.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, minWidth: '46px' }}>
              BỘ PHẬN:
            </span>
            <select
              value={partFilter}
              onChange={(e) => setPartFilter(e.target.value)}
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: '11px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#e2e8f0',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="ALL">Tất cả bộ phận ({totalCount})</option>
              {distinctPartCodes.map((code) => {
                const partMeta = getPartById(code);
                const count = damages.filter((d) => d.vehiclePartCode === code).length;
                return (
                  <option key={code} value={code}>
                    {partMeta?.nameVi || code} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* 4. Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Loading State */}
        {isLoading && (
          <div
            style={{
              padding: '30px 10px',
              textAlign: 'center',
              color: '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <RefreshCw size={22} className="animate-spin" color="#00f2fe" />
            <div style={{ fontSize: '12px' }}>Đang tải lịch sử hư hỏng phương tiện...</div>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div
            style={{
              padding: '24px 12px',
              textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={24} color="#f87171" />
            <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 600 }}>
              Không thể tải lịch sử hư hỏng.
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                marginTop: '6px',
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#ffffff',
                background: 'rgba(239, 68, 68, 0.3)',
                border: '1px solid #f87171',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State (Zero records from backend) (Requirement 20) */}
        {!isLoading && !isError && damages.length === 0 && (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <CheckCircle2 size={32} color="#10b981" />
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              Xe chưa có ghi nhận hư hỏng.
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
              Phương tiện đang ở trạng thái chuẩn Digital Twin. Chưa có tổn hại nào được ghi nhận.
            </div>
          </div>
        )}

        {/* Filter Empty State (Records exist, but filter yields 0) */}
        {!isLoading && !isError && damages.length > 0 && filteredDamages.length === 0 && (
          <div
            style={{
              padding: '24px 12px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '11.5px',
            }}
          >
            <div>Không có ghi nhận nào khớp với bộ lọc hiện tại.</div>
            <button
              type="button"
              onClick={() => {
                setSeverityFilter('ALL');
                setPartFilter('ALL');
              }}
              style={{
                marginTop: '8px',
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: '#00f2fe',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* 5. Selected Record Detailed Audit Card (Requirement 14) */}
        {selectedRecord && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(14, 165, 233, 0.08) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.45)',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 4px 20px rgba(0, 242, 254, 0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.04em' }}>
                CHI TIẾT ĐIỂM HƯ HỎNG ĐÃ CHỌN
              </div>
              <button
                type="button"
                onClick={() => selectDamageRecord(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                title="Bỏ chọn"
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Bộ phận:</span>
                <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                  {getPartById(selectedRecord.vehiclePartCode)?.nameVi || selectedRecord.vehiclePartCode}
                  {' '}({selectedRecord.vehiclePartCode})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Loại tổn hại:</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                  {DAMAGE_TYPE_LABELS[selectedRecord.damageType] || selectedRecord.damageType}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Mức độ:</span>
                {(() => {
                  const cfg = DAMAGE_SEVERITY_CONFIG[selectedRecord.severity];
                  return (
                    <span
                      style={{
                        background: cfg?.bg || 'rgba(255,255,255,0.1)',
                        border: `1px solid ${cfg?.borderColor || '#666'}`,
                        color: cfg?.color || '#fff',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {cfg?.labelVi || selectedRecord.severity}
                    </span>
                  );
                })()}
              </div>

              {/* Lifecycle Status (Requirement 20) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Trạng thái:</span>
                {(() => {
                  const st = selectedRecord.status || 'OPEN';
                  const stCfg = DAMAGE_STATUS_CONFIG[st];
                  return (
                    <span
                      style={{
                        background: stCfg?.bg || 'rgba(255,255,255,0.1)',
                        border: `1px solid ${stCfg?.borderColor || '#666'}`,
                        color: stCfg?.color || '#fff',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {stCfg?.labelVi || st}
                    </span>
                  );
                })()}
              </div>

              {selectedRecord.status === 'RESOLVED' && selectedRecord.resolvedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Khắc phục ngày:</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>
                    {formatDateTime(selectedRecord.resolvedAt)}
                  </span>
                </div>
              )}

              {selectedRecord.status === 'RESOLVED' && selectedRecord.resolvedByMaintenanceRequestId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Yêu cầu bảo dưỡng:</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '10px' }}>
                    {selectedRecord.resolvedByMaintenanceRequestId.substring(0, 13)}...
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Thời gian:</span>
                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                  {formatDateTime(selectedRecord.createdAt)}
                </span>
              </div>

              {selectedRecord.createdByName && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Người ghi nhận:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {selectedRecord.createdByName}
                  </span>
                </div>
              )}

              {selectedRecord.tripId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Mã chuyến đi:</span>
                  <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '10px' }}>
                    {selectedRecord.tripId.substring(0, 13)}...
                  </span>
                </div>
              )}

              {/* Ghi chú */}
              <div style={{ marginTop: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Ghi chú:</span>
                <div
                  style={{
                    marginTop: '2px',
                    padding: '6px 8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                    color: selectedRecord.note ? '#e2e8f0' : '#64748b',
                    fontStyle: selectedRecord.note ? 'normal' : 'italic',
                    lineHeight: 1.4,
                  }}
                >
                  {selectedRecord.note || 'Không có ghi chú thêm'}
                </div>
              </div>

              {/* Exact Stored Local 3D Coordinates (Audit View) (Requirement 14) */}
              <div
                style={{
                  marginTop: '4px',
                  padding: '4px 6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '6px',
                  fontSize: '9.5px',
                  color: '#64748b',
                  fontFamily: 'monospace',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>3D LOCAL:</span>
                <span>
                  X:{selectedRecord.localPositionX.toFixed(3)} Y:{selectedRecord.localPositionY.toFixed(3)} Z:{selectedRecord.localPositionZ.toFixed(3)}
                </span>
              </div>

              {/* Requirement 14: Action to prefill and open maintenance request from damage */}
              {canCreateMaintenance && (
                <button
                  type="button"
                  onClick={() => {
                    enterVehicleMaintenanceMode({
                      preselectedDamageId: selectedRecord.id,
                      preselectedPartCode: selectedRecord.vehiclePartCode,
                    });
                  }}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Wrench size={13} />
                  <span>TẠO YÊU CẦU BẢO DƯỠNG</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 6. Chronological List of Records */}
        {filteredDamages.map((item) => {
          const isSelected = selectedDamageId === item.id;
          const partMeta = getPartById(item.vehiclePartCode);
          const sevConfig = DAMAGE_SEVERITY_CONFIG[item.severity];

          return (
            <div
              key={item.id}
              ref={isSelected ? selectedItemRef : undefined}
              onClick={() => {
                // List ↔ marker synchronization (Requirements 11 & 12)
                selectDamageRecord(isSelected ? null : item.id);
              }}
              style={{
                background: isSelected
                  ? 'rgba(0, 242, 254, 0.14)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: isSelected
                  ? '1px solid #00f2fe'
                  : '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '10px',
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {/* Top row: Part Name & Severity */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isSelected ? '#00f2fe' : '#f8fafc',
                  }}
                >
                  {partMeta?.nameVi || item.vehiclePartCode}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {item.status === 'RESOLVED' && (
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.18)',
                        border: '1px solid rgba(16, 185, 129, 0.5)',
                        color: '#34d399',
                        fontSize: '8.5px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}
                    >
                      ĐÃ KHẮC PHỤC
                    </span>
                  )}
                  {item.status === 'UNDER_MAINTENANCE' && (
                    <span
                      style={{
                        background: 'rgba(245, 158, 11, 0.18)',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        color: '#fbbf24',
                        fontSize: '8.5px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}
                    >
                      ĐANG XỬ LÝ
                    </span>
                  )}
                  <span
                    style={{
                      background: sevConfig?.bg || 'rgba(255,255,255,0.1)',
                      border: `1px solid ${sevConfig?.borderColor || '#666'}`,
                      color: sevConfig?.color || '#fff',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {sevConfig?.labelVi || item.severity}
                  </span>
                </div>
              </div>

              {/* Middle row: Damage type & Time */}
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#94a3b8',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#cbd5e1' }}>
                  {DAMAGE_TYPE_LABELS[item.damageType] || item.damageType}
                </span>
                <span>{formatDateTime(item.createdAt)}</span>
              </div>

              {/* Note snippet if available */}
              {item.note && (
                <div
                  style={{
                    fontSize: '10.5px',
                    color: '#94a3b8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  "{item.note}"
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 7. Footer Actions */}
      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(14, 165, 233, 0.25) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            borderRadius: '8px',
            padding: '9px 12px',
            color: '#00f2fe',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.03em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <ArrowLeft size={13} />
          QUAY LẠI XE
        </button>

        <button
          type="button"
          onClick={returnToGarageOverview}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '9px 12px',
            color: '#94a3b8',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          TOÀN CẢNH
        </button>
      </div>
    </div>
  );
};
