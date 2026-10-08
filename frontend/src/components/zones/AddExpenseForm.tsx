import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  PlusCircle,
  Zap,
  Wrench,
  Sparkles,
  Car,
  Receipt,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ExpenseCategory, EXPENSE_CATEGORY_METADATA } from '../../types/expense';
import { useCreateExpense } from '../../hooks/useExpenses';
import { GroupMemberResponse } from '../../types/coOwnership';
import type { User } from '../../store/authStore';

export interface AddExpenseFormProps {
  vehicleId?: string;
  vehicleName?: string;
  currentUser?: User | null;
  coOwners?: GroupMemberResponse[];
  onCancel: () => void;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS: { id: ExpenseCategory; label: string; icon: React.FC<{ size?: number; color?: string }> }[] = [
  { id: 'CHARGING', label: 'Sạc xe', icon: Zap },
  { id: 'MAINTENANCE', label: 'Bảo dưỡng', icon: Wrench },
  { id: 'CLEANING', label: 'Vệ sinh xe', icon: Sparkles },
  { id: 'PARKING', label: 'Đỗ xe', icon: Car },
  { id: 'TOLL', label: 'Phí đường bộ', icon: Receipt },
  { id: 'REPAIR', label: 'Sửa chữa', icon: AlertTriangle },
  { id: 'INSURANCE', label: 'Bảo hiểm', icon: ShieldCheck },
  { id: 'OTHER', label: 'Khác', icon: FileText },
];

/**
 * AddExpenseForm:
 * Authoritative single-slot Finance Hologram Sub-View Form.
 * Fits directly into the Finance hologram glass shell (same slot as Expense History).
 * No viewport positioning, no fullscreen overlay, no duplicate background cards.
 */
export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  vehicleId = '',
  vehicleName = 'EV01',
  currentUser = null,
  coOwners = [],
  onCancel,
  onSuccess,
  }) => {
  const isCoOwner = currentUser?.role === 'CO_OWNER';
  const [category, setCategory] = useState<ExpenseCategory>(() => (currentUser?.role === 'CO_OWNER' ? 'PARKING' : 'CHARGING'));
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [occurredAtStr, setOccurredAtStr] = useState<string>(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [paidByUserId, setPaidByUserId] = useState<string>(() => {
    return currentUser?.id || (coOwners && coOwners[0]?.userId) || '';
  });
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [evidenceNote, setEvidenceNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const createExpenseMutation = useCreateExpense();

  // Synchronize default payer once currentUser or coOwners arrive
  useEffect(() => {
    if (!paidByUserId) {
      if (currentUser?.id) {
        setPaidByUserId(currentUser.id);
      } else if (coOwners && coOwners.length > 0) {
        setPaidByUserId(coOwners[0].userId);
      }
    }
  }, [currentUser?.id, coOwners, paidByUserId]);

  // Strict native wheel isolation to prevent Three.js camera zoom
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const activeCoOwners = (coOwners || []).filter((m) => !m.status || m.status === 'ACTIVE');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (errorMsg) setErrorMsg(null);
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      setAmountStr('');
      return;
    }
    const num = parseInt(rawVal, 10);
    setAmountStr(num.toLocaleString('vi-VN'));
  };

  const getNumericAmount = (): number => {
    const raw = amountStr.replace(/\D/g, '');
    return raw ? parseInt(raw, 10) : 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!vehicleId) {
      setErrorMsg('Không tìm thấy thông tin xe. Vui lòng thử lại.');
      return;
    }

    if (!category) {
      setErrorMsg('Vui lòng chọn loại chi phí');
      return;
    }

    if (isCoOwner && category === 'CHARGING') {
      setErrorMsg('Chi phí sạc được hệ thống ghi nhận sau khi nhân viên xác nhận trả xe.');
      return;
    }

    if (!isCoOwner && category === 'CHARGING' && !evidenceNote.trim()) {
      setErrorMsg('Nhân viên/Quản trị viên cần ghi rõ lý do và ghi chú đối soát khi điều chỉnh chi phí sạc thủ công.');
      return;
    }

    const amount = getNumericAmount();
    if (amount <= 0) {
      setErrorMsg('Số tiền phải lớn hơn 0');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Vui lòng nhập nội dung chi tiết');
      return;
    }

    if (description.length > 255) {
      setErrorMsg('Nội dung chi phí không được vượt quá 255 ký tự');
      return;
    }

    let occurredAtIso: string;
    try {
      const parsedDate = new Date(occurredAtStr);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date');
      }
      occurredAtIso = parsedDate.toISOString();
    } catch {
      setErrorMsg('Thời gian phát sinh chi phí không hợp lệ');
      return;
    }

    const resolvedPayerId = paidByUserId || currentUser?.id;
    if (!resolvedPayerId) {
      setErrorMsg('Vui lòng chọn người thanh toán');
      return;
    }

    try {
      await createExpenseMutation.mutateAsync({
        vehicleId,
        category,
        amount,
        description: description.trim(),
        occurredAt: occurredAtIso,
        paidByUserId: resolvedPayerId,
        sourceType: 'MANUAL',
        evidenceUrl: evidenceUrl.trim() || undefined,
        evidenceNote: evidenceNote.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 1600);
    } catch (err: any) {
      const message = err?.message || 'Không thể lưu chi phí. Vui lòng thử lại.';
      setErrorMsg(message);
    }
  };

  return (
    <div
      key="finance-add-expense-view"
      className="finance-view-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        color: '#ffffff',
        pointerEvents: 'auto',
      }}
    >
      {/* ========================================================
          A. HEADER (FIXED IN SLOT)
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              background: 'rgba(0, 242, 254, 0.16)',
              border: '2px solid #00f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 18px rgba(0, 242, 254, 0.45)',
              flexShrink: 0,
            }}
          >
            <PlusCircle size={24} color="#00f2fe" />
          </div>
          <div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 850,
                margin: 0,
                letterSpacing: '-0.01em',
                color: '#ffffff',
                lineHeight: 1.2,
                textTransform: 'uppercase',
              }}
            >
              THÊM CHI PHÍ
            </h2>
            <p
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                margin: '2px 0 0 0',
                fontWeight: 500,
              }}
            >
              Khai báo chi phí cho {vehicleName} (Chờ đồng sở hữu xác minh)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          title="Quay lại lịch sử chi phí"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.20)',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.50)';
            e.currentTarget.style.color = '#ff6b6b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <X size={17} />
        </button>
      </div>

      {/* ========================================================
          B. FORM BODY (SCROLLABLE WITH NATIVE WHEEL ISOLATION)
          ======================================================== */}
      <div
        ref={scrollContainerRef}
        className="finance-detail-scroll"
        onWheel={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '11px',
          paddingRight: '4px',
        }}
      >
        {/* Transparency Verification Guard Info */}
        <div
          style={{
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '12px',
            padding: '8px 12px',
            fontSize: '11.5px',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={16} color="#00f2fe" style={{ flexShrink: 0 }} />
          <span>
            Khoản chi cần được các đồng sở hữu độc lập xác nhận đạt <strong style={{ color: '#00f2fe' }}>≥ 50%</strong> cổ phần trước khi chính thức tính vào quỹ chung.
          </span>
        </div>

        {/* Inline Vietnamese Validation Alert */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.2px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '12px',
              padding: '9px 13px',
              fontSize: '12px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={16} color="#fca5a5" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Inline Success Notice */}
        {isSuccess && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1.2px solid rgba(16, 185, 129, 0.45)',
              borderRadius: '12px',
              padding: '9px 13px',
              fontSize: '12px',
              color: '#6ee7b7',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={16} color="#6ee7b7" style={{ flexShrink: 0 }} />
            <span>Khoản chi đã được gửi và đang chờ các đồng sở hữu xác minh.</span>
          </div>
        )}

        {/* Field 1: Loại chi phí */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '5px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Loại chi phí *
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
            }}
          >
            {CATEGORY_OPTIONS.map((opt) => {
              const isSelected = category === opt.id;
              const meta = EXPENSE_CATEGORY_METADATA[opt.id];
              const IconComponent = opt.icon;
              const isChargingDisabledForCoOwner = isCoOwner && opt.id === 'CHARGING';

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isChargingDisabledForCoOwner}
                  title={isChargingDisabledForCoOwner ? 'Chi phí sạc được hệ thống ghi nhận sau khi nhân viên xác nhận trả xe.' : undefined}
                  onClick={() => {
                    if (isChargingDisabledForCoOwner) return;
                    setCategory(opt.id);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(10, 30, 56, 0.95) 100%)'
                      : 'rgba(10, 26, 48, 0.60)',
                    border: isSelected ? '1.5px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '7px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    cursor: isChargingDisabledForCoOwner ? 'not-allowed' : 'pointer',
                    opacity: isChargingDisabledForCoOwner ? 0.38 : 1,
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(0, 242, 254, 0.30)' : 'none',
                  }}
                >
                  <IconComponent size={16} color={isSelected ? '#00f2fe' : isChargingDisabledForCoOwner ? '#64748b' : meta.accentColor} />
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: isSelected ? 750 : 500,
                      color: isSelected ? '#ffffff' : isChargingDisabledForCoOwner ? '#64748b' : '#cbd5e1',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {opt.label}
                  </span>
                  {isChargingDisabledForCoOwner && (
                    <span style={{ fontSize: '8px', color: '#38bdf8', marginTop: '-2px' }}>
                      (Tự động)
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isCoOwner && (
            <div
              style={{
                marginTop: '6px',
                fontSize: '10px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                lineHeight: 1.3,
                background: 'rgba(56, 189, 248, 0.06)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.18)',
              }}
            >
              <Zap size={11} color="#38bdf8" style={{ flexShrink: 0 }} />
              <span>
                Chi phí sạc được hệ thống ghi nhận sau khi nhân viên xác nhận trả xe.
              </span>
            </div>
          )}
        </div>

        {/* Field 2: Số tiền (VNĐ) */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '5px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Số tiền (VNĐ) *
          </label>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={handleAmountChange}
              placeholder="VD: 185.000"
              style={{
                width: '100%',
                background: 'rgba(6, 18, 34, 0.75)',
                border: '1.2px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '12px',
                padding: '9px 38px 9px 13px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 750,
                outline: 'none',
                letterSpacing: '0.02em',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 242, 254, 0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '13px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#00f2fe',
                pointerEvents: 'none',
              }}
            >
              ₫
            </span>
          </div>
        </div>

        {/* Field 3: Nội dung chi tiết */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '5px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Nội dung chi tiết *
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="VD: Trạm sạc VinFast Landmark 81 — Sạc nhanh DC"
            maxLength={255}
            style={{
              width: '100%',
              background: 'rgba(6, 18, 34, 0.75)',
              border: '1.2px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '12px',
              padding: '9px 13px',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 500,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00f2fe';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 242, 254, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Fields 4 & 5: Thời gian & Người thanh toán */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#94a3b8',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Thời gian phát sinh
            </label>
            <input
              type="datetime-local"
              value={occurredAtStr}
              onChange={(e) => {
                setOccurredAtStr(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              style={{
                width: '100%',
                background: 'rgba(6, 18, 34, 0.75)',
                border: '1.2px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '12px',
                padding: '8px 9px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#94a3b8',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Người thanh toán
            </label>
            <select
              value={paidByUserId}
              onChange={(e) => {
                setPaidByUserId(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              style={{
                width: '100%',
                background: 'rgba(6, 18, 34, 0.90)',
                border: '1.2px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '12px',
                padding: '8px 9px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {activeCoOwners.length > 0 ? (
                activeCoOwners.map((m) => (
                  <option key={m.userId} value={m.userId} style={{ background: '#0a1e38', color: '#fff' }}>
                    {m.fullName} {m.userId === currentUser?.id ? '(Bạn)' : ''}
                  </option>
                ))
              ) : (
                <option value={currentUser?.id || ''} style={{ background: '#0a1e38', color: '#fff' }}>
                  {currentUser?.fullName || 'Tôi (Bạn)'}
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Fields 6 & 7: Chứng từ & Ghi chú chứng từ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#94a3b8',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Chứng từ / Link biên lai
            </label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="VD: HD-2026-10 hoặc link ảnh"
              style={{
                width: '100%',
                background: 'rgba(6, 18, 34, 0.75)',
                border: '1.2px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '12px',
                padding: '8px 9px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#94a3b8',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Ghi chú chứng từ
            </label>
            <input
              type="text"
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="VD: Hóa đơn VAT, có chữ ký"
              style={{
                width: '100%',
                background: 'rgba(6, 18, 34, 0.75)',
                border: '1.2px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '12px',
                padding: '8px 9px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          C. FOOTER ACTIONS (FIXED IN SLOT)
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.10)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '14px',
            padding: '10px',
            color: '#cbd5e1',
            fontSize: '13px',
            fontWeight: 650,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#cbd5e1';
          }}
        >
          HỦY
        </button>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={createExpenseMutation.isPending || isSuccess}
          style={{
            flex: 2,
            background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
            border: 'none',
            borderRadius: '14px',
            padding: '10px',
            color: '#041628',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.01em',
            cursor: createExpenseMutation.isPending || isSuccess ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 18px rgba(0, 242, 254, 0.40)',
            opacity: createExpenseMutation.isPending ? 0.75 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!createExpenseMutation.isPending && !isSuccess) {
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 242, 254, 0.65)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 242, 254, 0.40)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {createExpenseMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 size={16} />
              <span>Đã ghi nhận!</span>
            </>
          ) : (
            <span>GHI NHẬN CHI PHÍ</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddExpenseForm;
