import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  User as UserIcon,
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ExpenseCategory, EXPENSE_CATEGORY_METADATA } from '../../types/expense';
import { useCreateExpense } from '../../hooks/useExpenses';
import { GroupMemberResponse } from '../../types/coOwnership';
import { User } from '../../types/auth';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  currentUser: User | null;
  coOwners?: GroupMemberResponse[];
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

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  currentUser,
  coOwners = [],
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('CHARGING');
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [occurredAtStr, setOccurredAtStr] = useState<string>(() => {
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  });
  const [paidByUserId, setPaidByUserId] = useState<string>(() => currentUser?.id || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const createExpenseMutation = useCreateExpense();

  if (!isOpen) return null;

  // Format VND input string
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amount = getNumericAmount();
    if (amount <= 0) {
      setErrorMsg('Vui lòng nhập số tiền chi phí hợp lệ lớn hơn 0đ.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Vui lòng nhập nội dung chi phí.');
      return;
    }

    if (description.length > 255) {
      setErrorMsg('Nội dung chi phí không được vượt quá 255 ký tự.');
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
      setErrorMsg('Thời gian phát sinh chi phí không hợp lệ.');
      return;
    }

    try {
      await createExpenseMutation.mutateAsync({
        vehicleId,
        category,
        amount,
        description: description.trim(),
        occurredAt: occurredAtIso,
        paidByUserId: paidByUserId || currentUser?.id,
        sourceType: 'MANUAL',
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      const message = err?.message || 'Không thể lưu chi phí. Vui lòng thử lại.';
      setErrorMsg(message);
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 8, 18, 0.70)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 11000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(180deg, rgba(8, 24, 46, 0.98) 0%, rgba(4, 14, 28, 0.99) 100%)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '2px solid #00f2fe',
          borderRadius: '24px',
          padding: '24px 26px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 242, 254, 0.35)',
          color: '#ffffff',
          fontFamily: "var(--font-family, 'Outfit', sans-serif)",
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          animation: 'panelSlideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(0, 242, 254, 0.15)',
                border: '1.5px solid #00f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)',
              }}
            >
              <PlusCircle size={22} color="#00f2fe" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Ghi nhận chi phí xe
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Chi phí thực tế phát sinh cho xe đồng sở hữu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} color="#fca5a5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#6ee7b7',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} color="#6ee7b7" />
            <span>Chi phí đã được lưu thành công vào sổ chi!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 1. Category Selection */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Loại chi phí
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
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCategory(opt.id)}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(10, 30, 56, 0.9) 100%)'
                        : 'rgba(10, 26, 48, 0.50)',
                      border: isSelected ? '1.5px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.10)',
                      borderRadius: '12px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(0, 242, 254, 0.25)' : 'none',
                    }}
                  >
                    <IconComponent size={16} color={isSelected ? '#00f2fe' : meta.accentColor} />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Amount Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: '6px',
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
                required
                style={{
                  width: '100%',
                  background: 'rgba(6, 18, 34, 0.75)',
                  border: '1.2px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 42px 12px 14px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 700,
                  outline: 'none',
                  letterSpacing: '0.02em',
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
                  right: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#00f2fe',
                }}
              >
                ₫
              </span>
            </div>
          </div>

          {/* 3. Description Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Nội dung chi tiết *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Trạm sạc VinFast Landmark 81 — Sạc nhanh DC"
              required
              maxLength={255}
              style={{
                width: '100%',
                background: 'rgba(6, 18, 34, 0.75)',
                border: '1.2px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '12px',
                padding: '12px 14px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none',
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

          {/* 4. Row: Date & Payer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Occurred At */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Thời gian phát sinh
              </label>
              <input
                type="datetime-local"
                value={occurredAtStr}
                onChange={(e) => setOccurredAtStr(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(6, 18, 34, 0.75)',
                  border: '1.2px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '12px',
                  padding: '10px 10px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 500,
                  outline: 'none',
                }}
              />
            </div>

            {/* Paid By */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Người thanh toán
              </label>
              <select
                value={paidByUserId}
                onChange={(e) => setPaidByUserId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(6, 18, 34, 0.90)',
                  border: '1.2px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '12px',
                  padding: '10px 10px',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {coOwners.length > 0 ? (
                  coOwners.map((m) => (
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '14px',
                padding: '12px',
                color: '#cbd5e1',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={createExpenseMutation.isPending || isSuccess}
              style={{
                flex: 2,
                background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                color: '#041628',
                fontSize: '14px',
                fontWeight: 800,
                cursor: createExpenseMutation.isPending ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(0, 242, 254, 0.4)',
                opacity: createExpenseMutation.isPending ? 0.7 : 1,
                transition: 'all 0.2s',
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
                <span>Ghi nhận chi phí</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modalContent;
  return createPortal(modalContent, document.body);
};
