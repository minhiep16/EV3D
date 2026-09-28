import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  Wrench,
  Check,
} from 'lucide-react';
import {
  DamageRecordResponse,
  DamageSeverity,
  DamageType,
  DAMAGE_SEVERITY_CONFIG,
  DAMAGE_TYPE_LABELS,
} from '../../../types/damage';
import { SEMANTIC_PART_LABELS_VI } from '../../../data/vehicleParts';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';

interface DraftDamageInfo {
  partCode: string;
  localPosition: [number, number, number];
}

interface DamageRecordPanel3DProps {
  selectedPartCode: string | null;
  draftDamage: DraftDamageInfo | null;
  selectedRecord: DamageRecordResponse | null;
  savedDamages: DamageRecordResponse[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onSelectDamage: (id: string | null) => void;
  onSelectPart?: (code: string | null) => void;
  onExitPartInspection: () => void;
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

export type DamageInspectionStage =
  | 'IDLE'
  | 'EVALUATING'
  | 'READY_TO_COMPLETE'
  | 'PART_SELECTION'
  | 'LOCATION_SELECTION'
  | 'CONDITION_EVALUATION';

type InspectionCondition = 'NORMAL' | 'SCRATCH' | 'DENT' | 'CRACK' | 'OTHER';

const CONDITION_OPTIONS: { id: InspectionCondition; label: string; damageType?: DamageType }[] = [
  { id: 'NORMAL', label: 'BÌNH THƯỜNG' },
  { id: 'SCRATCH', label: 'TRẦY XƯỚC', damageType: 'SCRATCH' },
  { id: 'DENT', label: 'MÓP', damageType: 'DENT' },
  { id: 'CRACK', label: 'NỨT', damageType: 'CRACK' },
  { id: 'OTHER', label: 'HỎNG KHÁC', damageType: 'OTHER' },
];

export const DamageRecordPanel3D: React.FC<DamageRecordPanel3DProps> = ({
  selectedPartCode,
  draftDamage,
  selectedRecord,
  savedDamages,
  isSubmitting,
  errorMessage,
  onSelectDamage,
  onExitPartInspection,
  onDiscardDraft,
  onSaveDamage,
  onClose,
}) => {
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === 'STAFF';
  const inspectionError = useWorldStore((state) => state.inspectionError);

  // Condition selector for active part inspection (enabled immediately on first click)
  const [selectedCondition, setSelectedCondition] = useState<InspectionCondition | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<DamageSeverity>('MINOR');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Authoritative Validation Rules (Sections 7, 8, 9)
  const hasValidCoordinate = Boolean(draftDamage && draftDamage.localPosition);
  const matchedOpt = CONDITION_OPTIONS.find((c) => c.id === selectedCondition);
  const resolvedDamageType: DamageType | undefined = matchedOpt?.damageType;

  const canCompleteNormal = Boolean(
    selectedPartCode &&
    hasValidCoordinate &&
    selectedCondition === 'NORMAL'
  );

  const canSaveDamage = Boolean(
    !isSubmitting &&
    selectedPartCode &&
    hasValidCoordinate &&
    selectedCondition &&
    selectedCondition !== 'NORMAL' &&
    resolvedDamageType &&
    selectedSeverity
  );

  // Simplified Single-Click State Machine:
  // IDLE -> EVALUATING -> READY_TO_COMPLETE
  const damageInspectionStage: DamageInspectionStage = !selectedPartCode
    ? 'IDLE'
    : !selectedCondition
    ? 'EVALUATING'
    : 'READY_TO_COMPLETE';

  // When switching parts or entering inspection, reset condition & note
  useEffect(() => {
    setSelectedCondition(null);
    setNote('');
    setLocalError(null);
  }, [selectedPartCode]);

  const handleDiscardPoint = () => {
    onDiscardDraft();
    setSelectedCondition(null);
    setLocalError(null);
  };

  const handleSave = async () => {
    if (!selectedPartCode) return;
    if (!draftDamage || !hasValidCoordinate) {
      setLocalError('Vui lòng nhấp vào vị trí cần kiểm tra trên mô hình xe 3D.');
      return;
    }
    if (!selectedCondition || selectedCondition === 'NORMAL') {
      setLocalError('Vui lòng chọn loại hư hỏng cần ghi nhận.');
      return;
    }
    if (!resolvedDamageType || !selectedSeverity) {
      setLocalError('Vui lòng chọn đầy đủ loại và mức độ hư hỏng.');
      return;
    }
    setLocalError(null);

    const damageType: DamageType = resolvedDamageType;

    try {
      await onSaveDamage({
        partCode: selectedPartCode,
        damageType,
        severity: selectedSeverity,
        note: note.trim() || undefined,
        localPosition: draftDamage.localPosition,
      });
      setNote('');
      setSelectedCondition(null);
      // Exit part inspection after successful record
      onExitPartInspection();
    } catch (err: any) {
      setLocalError(err.message || 'Không thể lưu hư hỏng');
    }
  };

  const severities: DamageSeverity[] = ['MINOR', 'MODERATE', 'SEVERE'];

  const partNameVi = selectedPartCode
    ? SEMANTIC_PART_LABELS_VI[selectedPartCode] || selectedPartCode
    : '';

  return (
    <div
      style={{
        width: '100%',
        maxHeight: 'min(82vh, calc(100vh - 44px))',
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
        pointerEvents: 'auto', // CRITICAL: only this visible panel captures pointer events
      }}
    >
      {/* ========================================================================= */}
      {/* 1. HEADER (Fixed at top) */}
      {/* ========================================================================= */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.92)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedPartCode ? (
            <button
              type="button"
              onClick={onExitPartInspection}
              title="Quay lại kiểm tra xe"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: selectedRecord
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'rgba(6, 182, 212, 0.2)',
                border: `1px solid ${selectedRecord ? '#f59e0b' : '#06b6d4'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle
                size={18}
                color={selectedRecord ? '#f59e0b' : '#06b6d4'}
              />
            </div>
          )}

          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: '#ffffff',
              }}
            >
              {selectedPartCode
                ? 'KIỂM TRA BỘ PHẬN'
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
              {selectedPartCode
                ? partNameVi
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

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT (Scrollable internally) */}
      {/* ========================================================================= */}
      <div
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          padding: '14px 16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Error & Warning Banners */}
        {(errorMessage || localError || inspectionError) && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: inspectionError && !errorMessage && !localError
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
              border: inspectionError && !errorMessage && !localError
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid rgba(239, 68, 68, 0.4)',
              color: inspectionError && !errorMessage && !localError ? '#fcd34d' : '#fca5a5',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {inspectionError && !errorMessage && !localError ? (
              <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
            ) : (
              <XCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
            )}
            <span>{inspectionError || errorMessage || localError}</span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW A: PART INSPECTION MODE (A semantic part is selected) */}
        {/* ===================================================================== */}
        {selectedPartCode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. VỊ TRÍ KIỂM TRA (Part Name & Code Banner) */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Vị trí kiểm tra
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedPartCode}
                </span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                {partNameVi}
              </div>
            </div>

            {/* 2. VỊ TRÍ 3D (Authoritative Coordinates Captured on Click - Section 10) */}
            {hasValidCoordinate && draftDamage ? (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#10b981',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '2px',
                    }}
                  >
                    VỊ TRÍ 3D
                  </div>
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: '#94a3b8',
                      fontFamily: 'monospace',
                    }}
                  >
                    X: {draftDamage.localPosition[0].toFixed(3)} | Y:{' '}
                    {draftDamage.localPosition[1].toFixed(3)} | Z:{' '}
                    {draftDamage.localPosition[2].toFixed(3)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✓ ĐÃ XÁC ĐỊNH VỊ TRÍ
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px dashed rgba(245, 158, 11, 0.45)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#fbbf24',
                  fontSize: '11px',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                Chưa xác định tọa độ 3D
              </div>
            )}

            {/* 3. TÌNH TRẠNG (Condition Evaluation - Enabled when coordinate exists) */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  TÌNH TRẠNG
                </label>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                }}
              >
                {CONDITION_OPTIONS.map((opt) => {
                  const isSelected = selectedCondition === opt.id;
                  const isNormal = opt.id === 'NORMAL';
                  const activeColor = isNormal ? '#10b981' : '#06b6d4';
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!hasValidCoordinate}
                      onClick={() => {
                        setSelectedCondition(opt.id);
                      }}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '8px',
                        background: isSelected
                          ? `${activeColor}2b`
                          : 'rgba(30, 41, 59, 0.5)',
                        border: isSelected
                          ? `1px solid ${activeColor}`
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#ffffff' : '#94a3b8',
                        fontSize: '10.5px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: !hasValidCoordinate ? 'not-allowed' : 'pointer',
                        opacity: !hasValidCoordinate ? 0.45 : 1,
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. NORMAL CONDITION (Section 6: ✓ Tình trạng tốt – Bình thường) */}
            {selectedCondition === 'NORMAL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#10b981' }}>
                      ✓ Tình trạng tốt – Bình thường
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.45 }}>
                    Bộ phận {partNameVi} đạt tiêu chuẩn, không có hư hỏng. Không cần tạo biên bản ghi nhận hư hỏng.
                  </div>
                </div>

                {/* Optional Note for Normal Inspection (Section 8) */}
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#cbd5e1',
                      display: 'block',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Ghi chú (Tùy chọn)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú thêm về tình trạng bộ phận (nếu có)..."
                    rows={2}
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
              </div>
            )}

            {/* 5. DAMAGE CONDITION (Sections 7-8: Severity & Note directly available) */}
            {selectedCondition && selectedCondition !== 'NORMAL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Severity Selector: NHẸ / TRUNG BÌNH / NGHIÊM TRỌNG */}
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#cbd5e1',
                      display: 'block',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Mức độ
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

                {/* Note Textarea (Section 8) */}
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#cbd5e1',
                      display: 'block',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Ghi chú
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Mô tả vết hư hỏng, kích thước, đặc điểm..."
                    rows={2}
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
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW B: INSPECTING A SAVED PERSISTED RECORD */}
        {/* ===================================================================== */}
        {!selectedPartCode && selectedRecord && (
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
                {SEMANTIC_PART_LABELS_VI[selectedRecord.vehiclePartCode] ||
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
                <span>Người ghi: {selectedRecord.createdByName || 'Nhân viên bảo trì'}</span>
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

        {/* ===================================================================== */}
        {/* VIEW C: DAMAGE LIST OVERVIEW (No part selected, no record selected) */}
        {/* ===================================================================== */}
        {!selectedPartCode && !selectedRecord && (
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
                ? 'Nhấn chuột trái vào bộ phận xe trên mô hình 3D (Cửa, Bánh xe, Ca-pô, Kính...) để kiểm tra tình trạng chi tiết.'
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
                  maxHeight: '280px',
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
                          {SEMANTIC_PART_LABELS_VI[item.vehiclePartCode] ||
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

      {/* 3. FOOTER (FOR PART INSPECTION MODE - STICKY/FIXED AT BOTTOM) */}
      {selectedPartCode && (
        <div
          style={{
            flexShrink: 0,
            padding: '10px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {/* Primary Action Button (Sections 6, 7 & 18) */}
          {!selectedCondition ? (
            <div
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#94a3b8',
                fontSize: '11.5px',
                fontWeight: 600,
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              Vui lòng chọn tình trạng bộ phận
            </div>
          ) : selectedCondition === 'NORMAL' ? (
            <button
              type="button"
              onClick={onExitPartInspection}
              disabled={!canCompleteNormal}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: !canCompleteNormal
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                border: !canCompleteNormal ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #10b981',
                color: !canCompleteNormal ? '#94a3b8' : '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: !canCompleteNormal ? 'not-allowed' : 'pointer',
                boxShadow: !canCompleteNormal ? 'none' : '0 0 15px rgba(16, 185, 129, 0.4)',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              HOÀN TẤT KIỂM TRA
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSaveDamage}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: !canSaveDamage
                  ? 'rgba(6, 182, 212, 0.2)'
                  : 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                border: !canSaveDamage ? '1px solid rgba(6, 182, 212, 0.4)' : 'none',
                color: !canSaveDamage ? '#94a3b8' : '#081018',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: !canSaveDamage ? 'not-allowed' : isSubmitting ? 'wait' : 'pointer',
                boxShadow: !canSaveDamage ? 'none' : '0 0 16px rgba(0, 242, 254, 0.45)',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              {isSubmitting ? 'ĐANG LƯU HƯ HỎNG...' : 'HOÀN TẤT & GHI NHẬN'}
            </button>
          )}

          {/* Secondary Action: QUAY LẠI KIỂM TRA XE */}
          <button
            type="button"
            onClick={onExitPartInspection}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={13} />
            QUAY LẠI KIỂM TRA XE
          </button>
        </div>
      )}
    </div>
  );
};
