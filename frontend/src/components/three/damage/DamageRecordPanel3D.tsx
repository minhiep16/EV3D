import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  User,
  Shield,
  Layers,
  FileText,
  X,
} from 'lucide-react';
import {
  DamageRecordResponse,
  DamageSeverity,
  DamageType,
  DAMAGE_SEVERITY_CONFIG,
  DAMAGE_TYPE_LABELS,
} from '../../../types/damage';
import { useAuthStore } from '../../../store/authStore';

const PART_NAMES_VI: Record<string, string> = {
  BODY: 'Thân xe & Khung gầm',
  WHEEL_FL: 'Bánh trước trái',
  WHEEL_FR: 'Bánh trước phải',
  WHEEL_RL: 'Bánh sau trái',
  WHEEL_RR: 'Bánh sau phải',
  WINDSHIELD: 'Kính chắn gió & Cabin',
  BATTERY: 'Khối pin điện cao áp',
  CHARGING_PORT: 'Cổng sạc điện thông minh',
  HOOD: 'Nắp capo trước',
  ROOF: 'Nóc xe panorama',
  HEADLIGHTS: 'Dải đèn pha LED trước',
  TAILLIGHTS: 'Dải đèn hậu LED sau',
  DIFFUSER: 'Cản sau & Khuếch tán gió',
};

interface DraftDamageInfo {
  partCode: string;
  localPosition: [number, number, number];
}

interface DamageRecordPanel3DProps {
  draftDamage: DraftDamageInfo | null;
  selectedRecord: DamageRecordResponse | null;
  savedDamages: DamageRecordResponse[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onSelectDamage: (id: string | null) => void;
  onDiscardDraft: () => void;
  onSaveDamage: (data: {
    partCode: string;
    damageType: DamageType;
    severity: DamageSeverity;
    note?: string;
    localPosition: [number, number, number];
  }) => Promise<void>;
  onClose: () => void;
}

export const DamageRecordPanel3D: React.FC<DamageRecordPanel3DProps> = ({
  draftDamage,
  selectedRecord,
  savedDamages,
  isSubmitting,
  errorMessage,
  onSelectDamage,
  onDiscardDraft,
  onSaveDamage,
  onClose,
}) => {
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === 'STAFF';

  // Form State for draft recording
  const [selectedType, setSelectedType] = useState<DamageType>('SCRATCH');
  const [selectedSeverity, setSelectedSeverity] = useState<DamageSeverity>('MINOR');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!draftDamage) return;
    setLocalError(null);
    try {
      await onSaveDamage({
        partCode: draftDamage.partCode,
        damageType: selectedType,
        severity: selectedSeverity,
        note: note.trim() || undefined,
        localPosition: draftDamage.localPosition,
      });
      setNote('');
    } catch (err: any) {
      setLocalError(err.message || 'Không thể lưu hư hỏng');
    }
  };

  const damageTypes: DamageType[] = [
    'SCRATCH',
    'DENT',
    'CRACK',
    'BROKEN',
    'PAINT_DAMAGE',
    'GLASS_DAMAGE',
    'TIRE_DAMAGE',
    'OTHER',
  ];

  const severities: DamageSeverity[] = ['MINOR', 'MODERATE', 'SEVERE'];

  return (
    <div
      style={{
        width: '380px',
        maxHeight: '520px',
        background: 'rgba(8, 14, 26, 0.94)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '16px',
        color: '#f8fafc',
        fontFamily: 'var(--font-family)',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: draftDamage
                ? 'rgba(6, 182, 212, 0.2)'
                : 'rgba(245, 158, 11, 0.2)',
              border: `1px solid ${draftDamage ? '#06b6d4' : '#f59e0b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle
              size={18}
              color={draftDamage ? '#06b6d4' : '#f59e0b'}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: '#ffffff',
              }}
            >
              {draftDamage
                ? 'GHI NHẬN HƯ HỎNG 3D'
                : selectedRecord
                ? 'CHI TIẾT HƯ HỎNG'
                : 'DANH SÁCH HƯ HỎNG'}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#94a3b8',
              }}
            >
              {draftDamage
                ? 'Đã gắn điểm trên mô hình xe EV01'
                : selectedRecord
                ? `Mã ghi nhận: ${selectedRecord.id.substring(0, 8)}...`
                : `${savedDamages.length} vị trí đã ghi nhận`}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Đóng bảng"
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Scrollable Body Content */}
      <div
        style={{
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Error Banners */}
        {(errorMessage || localError) && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <XCircle size={15} color="#ef4444" />
            <span>{errorMessage || localError}</span>
          </div>
        )}

        {/* CASE A: DRAFT DAMAGE FORM (STAFF RECORDING) */}
        {draftDamage && isStaff && (
          <>
            {/* Part Name & 3D Coordinates */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Bộ phận phát hiện
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  {draftDamage.partCode}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                {PART_NAMES_VI[draftDamage.partCode] || draftDamage.partCode}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#64748b',
                  marginTop: '6px',
                  fontFamily: 'monospace',
                }}
              >
                Tọa độ cục bộ: X: {draftDamage.localPosition[0].toFixed(3)} | Y:{' '}
                {draftDamage.localPosition[1].toFixed(3)} | Z:{' '}
                {draftDamage.localPosition[2].toFixed(3)}
              </div>
            </div>

            {/* Damage Type Selector */}
            <div>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  display: 'block',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Loại hư hỏng
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '6px',
                }}
              >
                {damageTypes.map((type) => {
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: isSelected
                          ? 'rgba(6, 182, 212, 0.25)'
                          : 'rgba(30, 41, 59, 0.5)',
                        border: isSelected
                          ? '1px solid #06b6d4'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#ffffff' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {DAMAGE_TYPE_LABELS[type]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity Selector */}
            <div>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  display: 'block',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Mức độ nghiêm trọng
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                }}
              >
                {severities.map((sev) => {
                  const isSelected = selectedSeverity === sev;
                  const cfg = DAMAGE_SEVERITY_CONFIG[sev];
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSelectedSeverity(sev)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '8px',
                        background: isSelected
                          ? `${cfg.color}26`
                          : 'rgba(30, 41, 59, 0.5)',
                        border: isSelected
                          ? `1px solid ${cfg.color}`
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#ffffff' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {cfg.labelVi}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Textarea */}
            <div>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  display: 'block',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Ghi chú mô tả (Tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập mô tả cụ thể về vết trầy xước, nứt hoặc biến dạng..."
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: '#ffffff',
                  fontSize: '11px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '6px',
              }}
            >
              <button
                type="button"
                onClick={onDiscardDraft}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: isSubmitting
                    ? 'rgba(6, 182, 212, 0.4)'
                    : 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                  border: 'none',
                  color: '#081018',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  boxShadow: '0 0 15px rgba(0, 242, 254, 0.35)',
                }}
              >
                {isSubmitting ? 'ĐANG LƯU...' : 'LƯU HƯ HỎNG'}
              </button>
            </div>
          </>
        )}

        {/* CASE B: INSPECTING A SAVED RECORD (OR READ-ONLY) */}
        {!draftDamage && selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Part Name & Code */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Bộ phận
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  {selectedRecord.vehiclePartCode}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                {PART_NAMES_VI[selectedRecord.vehiclePartCode] ||
                  selectedRecord.vehiclePartCode}
              </div>
            </div>

            {/* Badges: Type & Severity */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div
                style={{
                  flex: 1,
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                  LOẠI HƯ HỎNG
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                  {DAMAGE_TYPE_LABELS[selectedRecord.damageType as DamageType] ||
                    selectedRecord.damageType}
                </div>
              </div>

              {(() => {
                const sevCfg =
                  DAMAGE_SEVERITY_CONFIG[selectedRecord.severity as DamageSeverity] ||
                  DAMAGE_SEVERITY_CONFIG.MINOR;
                return (
                  <div
                    style={{
                      flex: 1,
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${sevCfg.color}40`,
                      borderRadius: '10px',
                      padding: '10px',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      MỨC ĐỘ
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: sevCfg.color,
                      }}
                    >
                      {sevCfg.labelVi}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Note */}
            {selectedRecord.note && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                  MÔ TẢ GHI NHẬN
                </div>
                <div style={{ fontSize: '12px', color: '#f1f5f9', lineHeight: 1.4 }}>
                  {selectedRecord.note}
                </div>
              </div>
            )}

            {/* Metadata: Author & Time */}
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '0 4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} />
                <span>Người ghi: {selectedRecord.createdByName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} />
                <span>
                  Thời gian: {new Date(selectedRecord.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} />
                <span>
                  Tọa độ 3D: X: {selectedRecord.localPositionX.toFixed(3)} | Y:{' '}
                  {selectedRecord.localPositionY.toFixed(3)} | Z:{' '}
                  {selectedRecord.localPositionZ.toFixed(3)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectDamage(null)}
              style={{
                marginTop: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              QUAY LẠI DANH SÁCH
            </button>
          </div>
        )}

        {/* CASE C: NO ACTIVE DRAFT AND NO SPECIFIC DAMAGE SELECTED */}
        {!draftDamage && !selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                color: '#93c5fd',
                fontSize: '11px',
                lineHeight: 1.4,
              }}
            >
              {isStaff
                ? 'Nhấn chuột trái trực tiếp vào bề mặt hoặc bộ phận trên xe EV01 để định vị điểm hư hỏng mới.'
                : 'Chế độ xem thông tin hư hỏng sau chuyến đi. Nhấp vào các điểm đánh dấu trên xe để xem chi tiết.'}
            </div>

            {savedDamages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  CHƯA GHI NHẬN HƯ HỎNG
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    lineHeight: 1.5,
                  }}
                >
                  Xe hiện chưa có điểm hư hỏng nào được ghi nhận sau chuyến đi.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {savedDamages.map((item) => {
                  const cfg =
                    DAMAGE_SEVERITY_CONFIG[item.severity as DamageSeverity] ||
                    DAMAGE_SEVERITY_CONFIG.MINOR;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectDamage(item.id)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#f8fafc',
                          }}
                        >
                          {PART_NAMES_VI[item.vehiclePartCode] ||
                            item.vehiclePartCode}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#94a3b8',
                            marginTop: '2px',
                          }}
                        >
                          {DAMAGE_TYPE_LABELS[item.damageType as DamageType] || item.damageType}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: cfg.color,
                          background: `${cfg.color}20`,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: `1px solid ${cfg.color}50`,
                        }}
                      >
                        {cfg.labelVi}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
