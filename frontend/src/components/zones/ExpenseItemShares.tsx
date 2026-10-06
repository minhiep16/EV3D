import React from 'react';
import { useExpenseShares } from '../../hooks/useExpenses';
import { Users, Loader2, CheckCircle2 } from 'lucide-react';

interface ExpenseItemSharesProps {
  expenseId: string;
  expenseAmount: number;
}

export const ExpenseItemShares: React.FC<ExpenseItemSharesProps> = ({
  expenseId,
  expenseAmount,
}) => {
  const { data: shares = [], isLoading, error } = useExpenseShares(expenseId);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          background: 'rgba(0, 242, 254, 0.06)',
          borderRadius: '10px',
          color: '#38bdf8',
          fontSize: '11px',
          marginTop: '6px',
        }}
      >
        <Loader2 size={13} className="animate-spin" />
        <span>Đang tải phân bổ chi phí...</span>
      </div>
    );
  }

  if (error || !shares || shares.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: '8px',
        padding: '10px 12px',
        background: 'rgba(6, 18, 36, 0.85)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: 700,
          color: '#38bdf8',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          borderBottom: '1px solid rgba(0, 242, 254, 0.15)',
          paddingBottom: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Users size={12} color="#00f2fe" />
          <span>Phân bổ theo tỷ lệ ({shares.length} đồng sở hữu)</span>
        </div>
        <span style={{ color: '#94a3b8', fontSize: '10px' }}>
          {Number(expenseAmount).toLocaleString('vi-VN')}đ
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {shares.map((s) => (
          <div
            key={s.id || s.userId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              padding: '3px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{s.userName}</span>
              <span
                style={{
                  background: 'rgba(0, 242, 254, 0.15)',
                  color: '#00f2fe',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                }}
              >
                {s.ownershipPercentage}%
              </span>
              {s.isPayer && (
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.18)',
                    color: '#10b981',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  Người trả
                </span>
              )}
            </div>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>
              {Number(s.shareAmount).toLocaleString('vi-VN')}đ
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
