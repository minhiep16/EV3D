import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  Activity,
  Send,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle2,
  Shield,
  FileText,
  Car,
  DollarSign,
  Scale,
  Wrench,
  Bot,
  User,
} from 'lucide-react';
import { fetchAdminDashboardStats, AdminDashboardStatsResponse } from '../../services/adminApi';
import { sendAiMessage, AiChatBackendResponse } from '../../services/aiApi';

interface AdminAiSystemHealthPanelProps {
  onClose: () => void;
  selectedVehicleId?: string | null;
}

interface ChatMsg {
  sender: 'ai' | 'user';
  text: string;
  time: string;
  sourceMode?: string;
  actionNotice?: string;
}

const ADMIN_SUGGESTIONS = [
  'Xe nào có tần suất sử dụng hoặc tỷ lệ vận hành cao nhất?',
  'Các hợp đồng đồng sở hữu đang chờ ký số hoặc lời mời chờ phản hồi?',
  'Tổng hợp các nghĩa vụ tài chính và khoản thanh toán chưa quyết toán?',
  'Tổng quan an ninh hệ thống và các cảnh báo vi phạm tính toàn vẹn?',
];

export const AdminAiSystemHealthPanel: React.FC<AdminAiSystemHealthPanelProps> = ({
  onClose,
  selectedVehicleId,
}) => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      sender: 'ai',
      text: 'Xin chào Quản trị viên! Tôi là Trợ lý AI Quản trị EVShare 3D. Tôi có thể hỗ trợ phân tích hiệu suất đội xe, giám sát quy chế đồng sở hữu, nghĩa vụ tài chính và đối soát an ninh hệ thống.',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Query stats for system health indicators
  const { data: stats } = useQuery<AdminDashboardStatsResponse>({
    queryKey: ['adminDashboardStats'],
    queryFn: fetchAdminDashboardStats,
    staleTime: 10000,
    refetchInterval: 15000,
  });

  const totalPending =
    (stats?.pendingVehicleRegistrationsCount || 0) +
    (stats?.pendingMembershipRequestsCount || 0) +
    (stats?.pendingPaymentVerificationsCount || 0) +
    (stats?.activeDisputesCount || 0) +
    (stats?.activeMaintenanceCount || 0);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (msg: string) => sendAiMessage(msg, selectedVehicleId || undefined),
    onSuccess: (data: AiChatBackendResponse) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.reply || 'Đã ghi nhận yêu cầu tra cứu.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          sourceMode: data.sourceMode,
          actionNotice: data.actionNotice,
        },
      ]);
    },
    onError: (err: any) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Xin lỗi, không thể kết nối đến máy chủ Trợ lý AI lúc này. Vui lòng thử lại.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    },
  });

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || sendMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
    sendMutation.mutate(text);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  return (
    <aside
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: 'clamp(480px, 35vw, 620px)',
        height: 'min(820px, calc(100dvh - 100px))',
        background: 'rgba(8, 28, 48, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 217, 255, 0.5)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 217, 255, 0.2)',
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
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
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
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.25))',
              border: '1.2px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.35)',
            }}
          >
            <Sparkles size={18} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              TRỢ LÝ AI & TRẠNG THÁI HỆ THỐNG
            </div>
            <div style={{ fontSize: '11px', color: '#c084fc' }}>
              Giám sát sức khỏe Garage & Phân tích trực tuyến có kiểm chứng
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

      {/* Section 1: System Health Indicators Core */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(15, 23, 42, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            CHỈ SỐ SỨC KHỎE HỆ THỐNG (LIVE)
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              background: totalPending > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: totalPending > 0 ? '#fbbf24' : '#34d399',
              border: `1px solid ${totalPending > 0 ? '#f59e0b' : '#10b981'}`,
            }}
          >
            {totalPending > 0 ? `${totalPending} Mục cần chú ý` : 'Bình thường'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Duyệt xe</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: stats?.pendingVehicleRegistrationsCount ? '#f59e0b' : '#f8fafc' }}>
              {stats?.pendingVehicleRegistrationsCount || 0}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Lời mời</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: stats?.pendingMembershipRequestsCount ? '#38bdf8' : '#f8fafc' }}>
              {stats?.pendingMembershipRequestsCount || 0}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Thanh toán</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: stats?.pendingPaymentVerificationsCount ? '#f59e0b' : '#f8fafc' }}>
              {stats?.pendingPaymentVerificationsCount || 0}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Tranh chấp</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: stats?.activeDisputesCount ? '#ef4444' : '#10b981' }}>
              {stats?.activeDisputesCount || 0}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Bảo dưỡng</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: stats?.activeMaintenanceCount ? '#38bdf8' : '#f8fafc' }}>
              {stats?.activeMaintenanceCount || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: AI Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, idx) => {
          const isAi = m.sender === 'ai';

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isAi ? 'flex-start' : 'flex-end',
                gap: '4px',
              }}
            >
              <div
                style={{
                  maxWidth: '88%',
                  background: isAi ? 'rgba(15, 23, 42, 0.75)' : 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: isAi ? '1px solid rgba(56, 189, 248, 0.25)' : 'none',
                  borderRadius: isAi ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                  padding: '10px 14px',
                  fontSize: '11.5px',
                  lineHeight: '1.6',
                  color: '#f8fafc',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.actionNotice && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', borderRadius: '6px', padding: '4px 8px', marginBottom: '6px', color: '#fde68a', fontSize: '10.5px' }}>
                    {m.actionNotice}
                  </div>
                )}
                {m.text}
              </div>
              <span style={{ fontSize: '9px', color: '#64748b' }}>{m.time}</span>
            </div>
          );
        })}

        {sendMutation.isPending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '11px' }}>
            <Loader2 size={13} className="animate-spin" />
            <span>Trợ lý AI đang truy xuất dữ liệu Garage và phân tích...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions Chips */}
      <div
        style={{
          padding: '8px 16px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {ADMIN_SUGGESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontSize: '10.5px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(15, 23, 42, 0.7)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          placeholder="Nhập câu hỏi phân tích dữ liệu cho Trợ lý AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          disabled={sendMutation.isPending}
          style={{
            flex: 1,
            padding: '9px 12px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            color: '#f8fafc',
            fontSize: '12px',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || sendMutation.isPending}
          style={{
            padding: '0 16px',
            background: input.trim() && !sendMutation.isPending ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '10px',
            color: input.trim() && !sendMutation.isPending ? '#ffffff' : '#64748b',
            cursor: input.trim() && !sendMutation.isPending ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sendMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </aside>
  );
};
