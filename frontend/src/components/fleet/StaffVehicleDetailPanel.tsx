import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse, VehicleStatus } from '../../types/vehicle';
import { resolveVehicleCode } from '../three/vehicles/vehicleModelConfig';
import { resolveVehicleSlot } from '../../config/garageSlotConfig';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { fetchHandoverEligibility } from '../../services/handoverApi';
import { fetchVehicleDamages, recordVehicleDamage } from '../../services/damageApi';
import { getPartById, SEMANTIC_HITBOX_DEFINITIONS, PART_STATUS_CONFIG } from '../../data/vehicleParts';
import { DamageType, DamageSeverity } from '../../types/damage';
import { VehiclePartId } from '../../types/vehiclePart';
import {
  Battery,
  BatteryCharging,
  MapPin,
  Gauge,
  Calendar,
  Key,
  Wrench,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Shield,
  Thermometer,
  Disc,
  X,
  Layers,
  Save,
  Plus,
} from 'lucide-react';

interface StaffVehicleDetailPanelProps {
  vehicle: VehicleResponse;
  onClose?: () => void;
}

type DetailTab = 'STATUS' | 'HANDOVER' | 'MAINTENANCE';

type PartOption = {
  id: VehiclePartId;
  label: string;
};

const QUICK_INSPECTION_PARTS: PartOption[] = [
  { id: 'DOOR_FL', label: 'Cửa trước trái' },
  { id: 'DOOR_FR', label: 'Cửa trước phải' },
  { id: 'DOOR_RL', label: 'Cửa sau trái' },
  { id: 'DOOR_RR', label: 'Cửa sau phải' },
  { id: 'BODY', label: 'Thân vỏ xe' },
  { id: 'BATTERY', label: 'Pin cao áp' },
  { id: 'WHEEL_FL', label: 'Bánh trước' },
  { id: 'HOOD', label: 'Nắp ca-pô' },
  { id: 'CHARGING_PORT', label: 'Cổng sạc' },
];

function getStatusMeta(status?: VehicleStatus) {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'AVAILABLE':
      return { labelVi: 'Sẵn sàng', dotColor: '#10b981', color: '#34d399' };
    case 'CHARGING':
      return { labelVi: 'Đang sạc', dotColor: '#00f2fe', color: '#00f2fe' };
    case 'MAINTENANCE':
    case 'IN_SERVICE':
      return { labelVi: 'Bảo dưỡng', dotColor: '#f87171', color: '#f87171' };
    case 'RESERVED':
      return { labelVi: 'Bàn giao', dotColor: '#f59e0b', color: '#fbbf24' };
    case 'IN_USE':
      return { labelVi: 'Đang sử dụng', dotColor: '#a855f7', color: '#c084fc' };
    default:
      return { labelVi: status || 'Sẵn sàng', dotColor: '#94a3b8', color: '#cbd5e1' };
  }
}

export const StaffVehicleDetailPanel: React.FC<StaffVehicleDetailPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === 'STAFF';

  // WorldStore operational selectors & actions
  const enterVehicleHandoverMode = useWorldStore((state) => state.enterVehicleHandoverMode);
  const enterVehicleDamageMappingMode = useWorldStore((state) => state.enterVehicleDamageMappingMode);
  const enterVehicleDamageHistoryMode = useWorldStore((state) => state.enterVehicleDamageHistoryMode);
  const enterVehicleMaintenanceMode = useWorldStore((state) => state.enterVehicleMaintenanceMode);
  const enterVehicleInspectionMode = useWorldStore((state) => state.enterVehicleInspectionMode);
  const exitVehicleInspectionMode = useWorldStore((state) => state.exitVehicleInspectionMode);
  const clearVehiclePartSelection = useWorldStore((state) => state.clearVehiclePartSelection);
  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);
  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);

  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const draftDamage = useWorldStore((state) => state.draftDamage);
  const setDraftDamage = useWorldStore((state) => state.setDraftDamage);
  const selectedDamageId = useWorldStore((state) => state.selectedDamageId);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);

  // Local state for tabs and draft damage recording
  const [activeTab, setActiveTab] = useState<DetailTab>('STATUS');
  const [draftSeverity, setDraftSeverity] = useState<DamageSeverity>('MINOR');
  const [draftType, setDraftType] = useState<DamageType>('SCRATCH');
  const [draftNote, setDraftNote] = useState('');
  const [isSavingDamage, setIsSavingDamage] = useState(false);
  const [damageSaveError, setDamageSaveError] = useState<string | null>(null);

  const code = resolveVehicleCode(vehicle);
  const statusMeta = getStatusMeta(vehicle.status);
  const slot = resolveVehicleSlot(vehicle, user?.role);
  const battery = vehicle.currentBatteryLevel ?? 82;
  const isCharging = (vehicle.status || '').toUpperCase() === 'CHARGING';
  const estimatedRange = Math.round(battery * 4.3);
  const odoKm = vehicle.odometer ? vehicle.odometer.toLocaleString('vi-VN') : '12.560';

  // Selected part definition during inspection mode
  const selectedPart = useMemo(() => {
    return getPartById(selectedVehiclePartId);
  }, [selectedVehiclePartId]);

  // TanStack Query for Handover eligibility & damages
  const { data: eligibility } = useQuery({
    queryKey: ['handoverEligibility', vehicle.id],
    queryFn: () => fetchHandoverEligibility(vehicle.id),
    enabled: !!vehicle.id,
    staleTime: 5000,
  });

  const { data: damages = [], refetch: refetchDamages } = useQuery({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => fetchVehicleDamages(vehicle.id),
    enabled: !!vehicle.id,
    staleTime: 5000,
  });

  // Handler for saving draft damage from right panel
  const handleSaveDraftDamage = async () => {
    if (!draftDamage) return;
    setIsSavingDamage(true);
    setDamageSaveError(null);
    try {
      await recordVehicleDamage(vehicle.id, {
        vehiclePartCode: draftDamage.partCode,
        damageType: draftType,
        severity: draftSeverity,
        note: draftNote,
        localPositionX: draftDamage.localPosition[0],
        localPositionY: draftDamage.localPosition[1],
        localPositionZ: draftDamage.localPosition[2],
      });
      await queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] });
      await refetchDamages();
      setDraftDamage(null);
      setDraftNote('');
    } catch (err: any) {
      setDamageSaveError(err.message || 'Không thể lưu hư hỏng.');
    } finally {
      setIsSavingDamage(false);
    }
  };

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '88px',
        right: '20px',
        width: 'clamp(320px, 26vw, 390px)',
        height: 'auto',
        maxHeight: 'calc(100dvh - 112px)',
        zIndex: 20,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8, 16, 28, 0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.28)',
        borderRadius: '16px',
        padding: '16px 14px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55), 0 0 20px rgba(0, 242, 254, 0.12)',
        color: '#f8fafc',
        boxSizing: 'border-box',
        overflowY: 'auto',
        userSelect: 'none',
      }}
    >
      {vehicleInspectionMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* ========================================================================= */}
          {/* 1. VEHICLE INSPECTION MODE CONTENT                                        */}
          {/* ========================================================================= */}
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid #00f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00f2fe',
                }}
              >
                <Wrench size={13} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                KIỂM TRA BỘ PHẬN 3D
              </span>
            </div>

            <button
              type="button"
              onClick={() => exitVehicleInspectionMode()}
              title="Thoát kiểm tra"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {selectedPart ? (
            /* Selected Part Technical Details */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                  {selectedPart.categoryVi}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  {selectedPart.nameVi}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                  Mã bộ phận: {selectedPart.id}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: PART_STATUS_CONFIG[selectedPart.status]?.bg || 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${PART_STATUS_CONFIG[selectedPart.status]?.color || '#10b981'}44`,
                  color: PART_STATUS_CONFIG[selectedPart.status]?.color || '#34d399',
                  fontSize: '11px',
                  fontWeight: 700,
                  width: 'fit-content',
                }}
              >
                <CheckCircle2 size={12} />
                <span>{PART_STATUS_CONFIG[selectedPart.status]?.labelVi || 'Bình thường'}</span>
              </div>

              {/* Door Dynamic Articulation Status Note */}
              {selectedPart.id.startsWith('DOOR_') && (
                <div
                  style={{
                    background: 'rgba(0, 242, 254, 0.10)',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '11px',
                    color: '#e0f2fe',
                    lineHeight: '1.4',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#00f2fe' }}>Khớp bản lề tự động: </span>
                  Cửa xe đang mở 65° hướng ra ngoài theo trục vật lý. Camera đã chuyển sang quan sát mặt ngoài của cửa.
                </div>
              )}

              {/* Part Description */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '11px',
                  color: '#cbd5e1',
                  lineHeight: '1.45',
                }}
              >
                {selectedPart.descriptionVi}
              </div>

              {/* Specifications List */}
              {selectedPart.specs && selectedPart.specs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Thông số kỹ thuật:
                  </div>
                  {selectedPart.specs.map((sp, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>{sp.label}</span>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{sp.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => enterVehicleDamageMappingMode(selectedPart.id)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.6)',
                    color: '#fbbf24',
                    borderRadius: '8px',
                    padding: '9px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <AlertTriangle size={13} color="#f59e0b" />
                  <span>GHI NHẬN HƯ HỎNG BỘ PHẬN NÀY</span>
                </button>
                <button
                  type="button"
                  onClick={() => clearVehiclePartSelection()}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 242, 254, 0.2)',
                    border: '1px solid #00f2fe',
                    color: '#00f2fe',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Đóng bộ phận này
                </button>
                <button
                  type="button"
                  onClick={() => exitVehicleInspectionMode()}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Thoát kiểm tra xe
                </button>
              </div>
            </div>
          ) : (
            /* Inspection Guide & Quick-Select Parts */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  background: 'rgba(0, 242, 254, 0.1)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '11px',
                  color: '#e2e8f0',
                  lineHeight: '1.45',
                }}
              >
                <div style={{ fontWeight: 800, color: '#00f2fe', marginBottom: '4px' }}>
                  HƯỚNG DẪN KIỂM TRA
                </div>
                Nhấp chuột trực tiếp vào bất kỳ bộ phận nào trên mô hình 3D (cửa trước/sau, bánh xe, pin, nắp ca-pô...) để phóng to góc nhìn kỹ thuật.
              </div>

              {/* Quick Part Selection Chips */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Bộ phận thường kiểm tra:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {QUICK_INSPECTION_PARTS.map((p) => {
                    const isPartActive = selectedVehiclePartId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectVehiclePart(p.id)}
                        style={{
                          background: isPartActive ? 'rgba(0, 242, 254, 0.22)' : 'rgba(15, 23, 42, 0.8)',
                          border: isPartActive ? '1px solid #00f2fe' : '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: '6px',
                          padding: '6px',
                          color: isPartActive ? '#00f2fe' : '#f8fafc',
                          fontSize: '10.5px',
                          fontWeight: isPartActive ? 700 : 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isPartActive) {
                            e.currentTarget.style.borderColor = '#00f2fe';
                            e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isPartActive) {
                            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
                          }
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => exitVehicleInspectionMode()}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                Thoát chế độ kiểm tra
              </button>
            </div>
          )}
        </div>
      ) : vehicleDamageMappingMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* ========================================================================= */}
          {/* 2. MAINTENANCE & 3D DAMAGE MAPPING CONTENT                                */}
          {/* ========================================================================= */}
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f87171',
                }}
              >
                <AlertTriangle size={13} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                BẢO DƯỠNG & HƯ HỎNG 3D
              </span>
            </div>

            <button
              type="button"
              onClick={() => returnToVehicleOverview()}
              title="Thoát bảo dưỡng"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Draft Damage Recording Form */}
          {draftDamage ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171' }}>
                GHI NHẬN ĐIỂM HƯ HỎNG MỚI
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                Bộ phận: <span style={{ fontWeight: 700, color: '#ffffff' }}>{draftDamage.partCode}</span>
              </div>

              {/* Severity Buttons */}
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Mức độ:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                  {(['MINOR', 'MODERATE', 'SEVERE'] as DamageSeverity[]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setDraftSeverity(sev)}
                      style={{
                        padding: '4px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        border: draftSeverity === sev ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: draftSeverity === sev ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                        color: draftSeverity === sev ? '#fca5a5' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {sev === 'MINOR' ? 'Nhẹ' : sev === 'MODERATE' ? 'Vừa' : 'Nặng'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Damage Type Buttons */}
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Loại hư hỏng:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {[
                    { id: 'SCRATCH', label: 'Trầy xước' },
                    { id: 'DENT', label: 'Móp méo' },
                    { id: 'CRACK', label: 'Nứt vỡ' },
                    { id: 'OTHER', label: 'Khác' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDraftType(t.id as DamageType)}
                      style={{
                        padding: '4px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        border: draftType === t.id ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: draftType === t.id ? 'rgba(0, 242, 254, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        color: draftType === t.id ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note input */}
              <input
                type="text"
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Ghi chú chi tiết vị trí hư hỏng..."
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '11px',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />

              {damageSaveError && (
                <div style={{ fontSize: '10px', color: '#f87171' }}>{damageSaveError}</div>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  disabled={isSavingDamage}
                  onClick={handleSaveDraftDamage}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(90deg, #ef4444, #f87171)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: '7px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSavingDamage ? 'Đang lưu...' : 'Lưu điểm này'}
                </button>
                <button
                  type="button"
                  onClick={() => setDraftDamage(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '6px',
                    padding: '7px 12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11px',
                color: '#94a3b8',
                lineHeight: '1.4',
              }}
            >
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>Hướng dẫn: </span>
              Nhấp vào bất kỳ điểm nào trên bề mặt xe 3D để tạo cờ hư hỏng mới.
            </div>
          )}

          {/* Persisted Damages List */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Danh sách hư hỏng đã lưu ({damages.length}):
            </div>
            {damages.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
                Chưa có ghi nhận hư hỏng nào.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '160px', overflowY: 'auto' }}>
                {damages.map((dmg) => (
                  <div
                    key={dmg.id}
                    onClick={() => selectDamageRecord(selectedDamageId === dmg.id ? null : dmg.id)}
                    style={{
                      background: selectedDamageId === dmg.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                      border: selectedDamageId === dmg.id ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{dmg.vehiclePartCode}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{dmg.note || dmg.damageType}</div>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: dmg.severity === 'SEVERE' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                        color: dmg.severity === 'SEVERE' ? '#f87171' : '#fbbf24',
                      }}
                    >
                      {dmg.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => returnToVehicleOverview()}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            Thoát chế độ bảo dưỡng
          </button>
        </div>
      ) : vehicleHandoverMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* ========================================================================= */}
          {/* 3. VEHICLE HANDOVER MODE CONTENT                                          */}
          {/* ========================================================================= */}
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(0, 242, 254, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid #00f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00f2fe',
                }}
              >
                <Key size={13} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                QUY TRÌNH BÀN GIAO XE
              </span>
            </div>

            <button
              type="button"
              onClick={() => returnToVehicleOverview()}
              title="Thoát bàn giao"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Xe:</span>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>{code} — {vehicle.licensePlate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Trạng thái:</span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>{statusMeta.labelVi}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Đủ điều kiện:</span>
              <span style={{ fontWeight: 700, color: eligibility?.eligible ? '#34d399' : '#fbbf24' }}>
                {eligibility?.eligible ? 'Đã đủ điều kiện' : eligibility?.reason || 'Chưa sẵn sàng'}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
              8 Điểm kiểm tra tiêu chuẩn:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
              {[
                { name: 'Cụm đèn trước & Chiếu sáng', status: 'Tốt' },
                { name: 'Lốp trước & Vành đúc', status: 'Tốt' },
                { name: 'Khung cửa & Kính xe', status: 'Tốt' },
                { name: 'Gương chiếu hậu & Cảm biến', status: 'Tốt' },
                { name: 'Cổng sạc & Nắp che điện tử', status: 'Tốt' },
                { name: 'Cụm đèn hậu LED', status: 'Tốt' },
                { name: 'Nội thất & Bảng điều khiển', status: 'Tốt' },
                { name: 'Pin cao áp & Gầm xe', status: 'Tốt' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ color: '#e2e8f0' }}>{item.name}</span>
                  <span style={{ color: '#34d399', fontWeight: 700, fontSize: '10px' }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => returnToVehicleOverview()}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            Đóng quy trình bàn giao
          </button>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 4. DEFAULT VEHICLE DETAIL & OPERATIONAL TABS (REFERENCE DESIGN)          */}
          {/* ========================================================================= */}
          {/* Header: Title & Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', color: '#f8fafc' }}>
              CHI TIẾT XE
            </span>

            {/* Live Status Pill */}
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: statusMeta.color,
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: statusMeta.dotColor,
                  boxShadow: `0 0 8px ${statusMeta.dotColor}`,
                }}
              />
              {statusMeta.labelVi}
            </span>
          </div>

          {/* Vehicle Summary Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '14px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '42px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Disc size={24} color="#00f2fe" />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                {code}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {code === 'EV01' ? 'VinFast VF8 Plus' : 'Stylized EV Prototype'}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  marginTop: '2px',
                  letterSpacing: '0.04em',
                }}
              >
                {vehicle.licensePlate || (code === 'EV01' ? '51K - 123.45' : '51K - 678.90')}
              </div>
            </div>
          </div>

          {/* Battery Level Progress Bar */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isCharging ? (
                  <BatteryCharging size={16} color="#00f2fe" />
                ) : (
                  <Battery size={16} color="#10b981" />
                )}
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                  {battery}%
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                ~ {estimatedRange} km
              </span>
            </div>

            {/* Cyan glowing progress bar track */}
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${battery}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00f2fe 0%, #38bdf8 100%)',
                  borderRadius: '9999px',
                  boxShadow: '0 0 10px rgba(0, 242, 254, 0.6)',
                }}
              />
            </div>
          </div>

          {/* Telemetry Specs Rows */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              marginBottom: '12px',
              padding: '10px 12px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={12} color="#38bdf8" /> Vị trí hiện tại
              </span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                {slot?.name || 'Khu vực vận hành'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Gauge size={12} color="#38bdf8" /> Odo
              </span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>{odoKm} km</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={12} color="#38bdf8" /> Lần bảo dưỡng gần nhất
              </span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                10/08/2024 <span style={{ color: '#fbbf24', fontSize: '10px' }}>(Còn 1.440 km)</span>
              </span>
            </div>
          </div>

          {/* Segmented Tabs: TÌNH TRẠNG | BÀN GIAO | BẢO DƯỠNG */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '4px',
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '3px',
              borderRadius: '10px',
              marginBottom: '12px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
            }}
          >
            {(['STATUS', 'HANDOVER', 'MAINTENANCE'] as DetailTab[]).map((tab) => {
              const isActive = activeTab === tab;
              const label =
                tab === 'STATUS'
                  ? 'TÌNH TRẠNG'
                  : tab === 'HANDOVER'
                  ? 'BÀN GIAO'
                  : 'BẢO DƯỠNG';

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: isActive ? 'rgba(0, 242, 254, 0.22)' : 'transparent',
                    border: isActive ? '1px solid #00f2fe' : '1px solid transparent',
                    color: isActive ? '#00f2fe' : '#94a3b8',
                    borderRadius: '8px',
                    padding: '6px 4px',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'STATUS' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {/* Card 1: Pin */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                  <Battery size={12} color="#00f2fe" />
                  <span>Pin</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{battery}%</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>~ {estimatedRange} km</div>
              </div>

              {/* Card 2: Tình trạng xe */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                  <Shield size={12} color="#10b981" />
                  <span>Tình trạng</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>Tốt</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Không lỗi</div>
              </div>

              {/* Card 3: Lốp xe */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                  <Disc size={12} color="#38bdf8" />
                  <span>Lốp xe</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>Bình thường</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Áp suất ổn định</div>
              </div>

              {/* Card 4: Nhiệt độ pin */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                  <Thermometer size={12} color="#f59e0b" />
                  <span>Nhiệt độ</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>27°C</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Ngưỡng an toàn</div>
              </div>
            </div>
          )}

          {activeTab === 'HANDOVER' && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '11px',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>Quy trình bàn giao</div>
              <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
                {eligibility?.eligible
                  ? 'Xe đã sẵn sàng cho quy trình bàn giao cho đồng sở hữu.'
                  : eligibility?.reason || 'Chưa có lịch bàn giao ngay.'}
              </div>
              <button
                type="button"
                onClick={() => enterVehicleHandoverMode()}
                style={{
                  width: '100%',
                  background: 'rgba(0, 242, 254, 0.2)',
                  border: '1px solid #00f2fe',
                  color: '#00f2fe',
                  borderRadius: '8px',
                  padding: '7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tiến hành bàn giao xe
              </button>
            </div>
          )}

          {activeTab === 'MAINTENANCE' && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '11px',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>Hồ sơ hư hỏng & bảo dưỡng</div>
              <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
                Đã ghi nhận: <span style={{ color: '#00f2fe', fontWeight: 700 }}>{damages.length}</span> vị trí hư hỏng
              </div>

              {/* Phase 15: Open dedicated Maintenance Management Panel */}
              <button
                type="button"
                onClick={() => enterVehicleMaintenanceMode()}
                style={{
                  width: '100%',
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                }}
              >
                <Wrench size={13} />
                <span>QUẢN LÝ BẢO DƯỠNG XE</span>
              </button>

              <button
                type="button"
                onClick={() => enterVehicleDamageMappingMode()}
                style={{
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #f87171',
                  color: '#f87171',
                  borderRadius: '8px',
                  padding: '7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Ghi nhận hư hỏng 3D
              </button>

              {/* Phase 14: Dedicated 3D Damage History */}
              <button
                type="button"
                onClick={() => enterVehicleDamageHistoryMode()}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  color: '#00f2fe',
                  borderRadius: '8px',
                  padding: '7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Lịch sử hư hỏng 3D
              </button>
            </div>
          )}

          {/* Primary Action Button: BÀN GIAO XE */}
          <button
            type="button"
            onClick={() => enterVehicleHandoverMode()}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #00f2fe 0%, #38bdf8 100%)',
              color: '#08101c',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(0, 242, 254, 0.35)',
              transition: 'all 0.18s ease',
              marginBottom: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 242, 254, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 242, 254, 0.35)';
            }}
          >
            <Key size={16} />
            <span>BÀN GIAO XE</span>
            <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
          </button>

          {/* Secondary Actions Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => enterVehicleMaintenanceMode()}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '9px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
              }}
            >
              <Wrench size={13} color="#00f2fe" />
              <span>BẢO DƯỠNG</span>
            </button>

            <button
              type="button"
              onClick={() => enterVehicleInspectionMode(vehicle?.id)}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '9px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
              }}
            >
              <Shield size={13} color="#00f2fe" />
              <span>KIỂM TRA BỘ PHẬN</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
