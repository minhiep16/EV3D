import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  Car,
  Zap,
  DollarSign,
  X,
  ChevronDown,
  Layers,
  BarChart2,
  Info,
} from 'lucide-react';
import { VehicleResponse } from '../../types/vehicle';
import { fetchVehicleAnalytics } from '../../services/analyticsApi';
import { fetchVehicles } from '../../services/vehicleApi';
import { EVCarLoader } from '../common/EVCarLoader';

interface AdminVehicleAnalyticsPanelProps {
  vehicle: VehicleResponse | null;
  onClose: () => void;
}

type PeriodFilter = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'THIS_YEAR';

export const AdminVehicleAnalyticsPanel: React.FC<AdminVehicleAnalyticsPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicle?.id || '');
  const [period, setPeriod] = useState<PeriodFilter>('LAST_30_DAYS');

  // Query fleet vehicles for dropdown
  const { data: fleetVehicles = [] } = useQuery({
    queryKey: ['vehicles', 'ADMIN'],
    queryFn: fetchVehicles,
    staleTime: 60000,
  });

  const activeVehicleId = selectedVehicleId || vehicle?.id || (fleetVehicles[0]?.id ?? '');

  // Calculate ISO date strings based on selected period
  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    let from = new Date();

    switch (period) {
      case 'TODAY':
        from = now;
        break;
      case 'LAST_7_DAYS':
        from.setDate(now.getDate() - 7);
        break;
      case 'LAST_30_DAYS':
        from.setDate(now.getDate() - 30);
        break;
      case 'THIS_MONTH':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'THIS_YEAR':
        from = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return {
      fromDate: from.toISOString().split('T')[0],
      toDate: to,
    };
  }, [period]);

  // Query vehicle analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['vehicleAnalytics', activeVehicleId, fromDate, toDate],
    queryFn: () => (activeVehicleId ? fetchVehicleAnalytics(activeVehicleId, fromDate, toDate) : null),
    enabled: !!activeVehicleId,
    staleTime: 15000,
  });

  const dailySeries = analytics?.dailySeries || [];
  const memberUsage = analytics?.memberUsage || [];

  // Max distance for daily bar normalization
  const maxDailyDistance = useMemo(() => {
    return Math.max(1, ...dailySeries.map((d) => d.distanceKm || 0));
  }, [dailySeries]);

  return (
    <aside
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: 'clamp(460px, 34vw, 580px)',
        height: 'min(820px, calc(100dvh - 100px))',
        background: 'rgba(8, 28, 48, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(16, 230, 163, 0.45)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 230, 163, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        color: '#f8fafc',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1.2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)',
            }}
          >
            <BarChart2 size={18} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              PHÂN TÍCH VẬN HÀNH & HIỆU SUẤT
            </div>
            <div style={{ fontSize: '11px', color: '#34d399' }}>
              Trung tâm giám sát khai thác phương tiện • Dữ liệu kiểm chứng
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            color: '#94a3b8',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Selectors Bar: Vehicle & Period */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Vehicle Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Car size={14} color="#34d399" />
          <select
            value={activeVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '11.5px',
              fontWeight: 700,
              outline: 'none',
            }}
          >
            {fleetVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.licensePlate || v.model || 'EV'})
              </option>
            ))}
          </select>
        </div>

        {/* Period Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'TODAY', label: 'Hôm nay' },
            { id: 'LAST_7_DAYS', label: '7 ngày' },
            { id: 'LAST_30_DAYS', label: '30 ngày' },
            { id: 'THIS_MONTH', label: 'Tháng này' },
            { id: 'THIS_YEAR', label: 'Năm nay' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id as PeriodFilter)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: period === item.id ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: period === item.id ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                color: period === item.id ? '#34d399' : '#94a3b8',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isLoading ? (
          <EVCarLoader variant="inline" message="Đang phân tích dữ liệu vận hành từ hệ thống..." />
        ) : (
          <>
            {/* Core Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Chuyến hoàn thành</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc' }}>
                  {analytics?.completedTripsCount ?? 0}
                </div>
                <div style={{ fontSize: '9.5px', color: '#34d399' }}>
                  {analytics?.activeDrivingDays ?? 0} ngày có hoạt động
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Tổng quãng đường</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc' }}>
                  {analytics?.totalDistanceKm ? Math.round(analytics.totalDistanceKm) : 0} km
                </div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                  {analytics?.totalDrivingHours ? Math.round(analytics.totalDrivingHours * 10) / 10 : 0} giờ lái
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#6ee7b7' }}>Tỷ lệ hiệu suất</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>
                  {analytics?.utilizationRatePercent ? analytics.utilizationRatePercent.toFixed(1) : 0}%
                </div>
                <div style={{ fontSize: '9.5px', color: '#6ee7b7' }}>Thời gian vận hành</div>
              </div>
            </div>

            {/* Energy & Consumption Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={11} color="#f59e0b" />
                  <span>Điện năng tiêu thụ</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc' }}>
                  {analytics?.totalEnergyKwh ? Math.round(analytics.totalEnergyKwh * 10) / 10 : 0} kWh
                </div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                  Suất hao: {analytics?.energyConsumptionKwhPer100Km ? analytics.energyConsumptionKwhPer100Km.toFixed(1) : 'N/A'} kWh/100km
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={11} color="#34d399" />
                  <span>Chi phí vận hành kỳ</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc' }}>
                  {analytics?.totalOperatingExpenses ? analytics.totalOperatingExpenses.toLocaleString('vi-VN') : 0} ₫
                </div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                  Đơn giá: {analytics?.costPerKm ? Math.round(analytics.costPerKm).toLocaleString('vi-VN') : 0} ₫/km
                </div>
              </div>
            </div>

            {/* Utilization Rate Definition Alert */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '10.5px',
                color: '#6ee7b7',
              }}
            >
              <Info size={14} style={{ flexShrink: 0 }} />
              <div>
                <strong>Công thức hiệu suất:</strong> [Tổng số giờ vận hành thực tế / ({analytics?.periodDays || 1} ngày × 24h)] × 100%. Dựa trên giờ khởi hành và kết thúc chuyến được xác thực.
              </div>
            </div>

            {/* Daily Distance Trend Chart */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase' }}>
                  XU HƯỚNG QUÃNG ĐƯỜNG THEO NGÀY (KM)
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {dailySeries.length} ngày ghi nhận
                </span>
              </div>

              {dailySeries.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                  Chưa có chuyến đi nào phát sinh trong khoảng thời gian này.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px', paddingTop: '10px' }}>
                  {dailySeries.map((d, idx) => {
                    const barHeightPct = Math.max(8, ((d.distanceKm || 0) / maxDailyDistance) * 100);

                    return (
                      <div
                        key={idx}
                        title={`${d.date} (${d.dayOfWeek}): ${d.distanceKm || 0} km, ${d.tripsCount || 0} chuyến`}
                        style={{
                          flex: 1,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: `${barHeightPct}%`,
                            background: d.distanceKm > 0 ? 'linear-gradient(180deg, #34d399, #059669)' : 'rgba(255,255,255,0.05)',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                        />
                        <span style={{ fontSize: '8px', color: '#64748b', marginTop: '4px' }}>
                          {d.date.split('-').slice(1).join('/')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Member Usage Comparison */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase' }}>
                ĐỐI SOÁT TỶ LỆ SỞ HỮU & MỨC ĐỘ KHAI THÁC
              </div>

              {memberUsage.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                  Chưa có dữ liệu phân bổ thành viên trong nhóm này.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {memberUsage.map((m, idx) => (
                    <div
                      key={m.userId || idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ fontWeight: 700, color: '#f8fafc' }}>{m.userName}</span>
                        <span style={{ color: '#94a3b8' }}>
                          {m.distanceKm ? Math.round(m.distanceKm) : 0} km • {m.tripsCount || 0} chuyến
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, m.usagePercentage || 0)}%`,
                              height: '100%',
                              background: '#10b981',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', minWidth: '40px', textAlign: 'right' }}>
                          {m.usagePercentage ? m.usagePercentage.toFixed(1) : 0}% sử dụng
                        </span>
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                        Cổ phần đăng ký: {m.ownershipPercentage ? m.ownershipPercentage.toFixed(1) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
