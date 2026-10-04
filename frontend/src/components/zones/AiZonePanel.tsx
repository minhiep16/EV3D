import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Calendar,
  Zap,
  Car,
  DollarSign,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useWorldStore } from '../../store/worldStore';

interface AiMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface AiZonePanelProps {
  onClose?: () => void;
}

const PRESET_PROMPTS = [
  {
    icon: Car,
    label: 'Tình trạng xe EV01',
    query: 'Kiểm tra tình trạng pin, lốp và mức độ sẵn sàng của xe EV01?',
    response:
      'Xe EV01 đang ở trạng thái Hoàn hảo: Pin hiện tại đạt 82% (tầm vận hành ~345 km), áp suất lốp 2.3 bar đều 4 bánh, không phát hiện lỗi kỹ thuật. Xe đang đỗ tại vị trí trung tâm showroom và sẵn sàng cho ca sử dụng tiếp theo.',
  },
  {
    icon: Calendar,
    label: 'Lịch đặt xe tuần này',
    query: 'Xem lịch biểu đặt xe tuần này của các thành viên?',
    response:
      'Lịch tuần này: Bạn có ca đặt xe vào Thứ Sáu (08:00 - 18:00). Cổ đông B đã đặt Thứ Bảy (09:00 - 21:00). Các khung giờ từ Thứ Hai đến Thứ Năm hiện đang trống và có thể đặt ngay không cần chờ phê duyệt.',
  },
  {
    icon: DollarSign,
    label: 'Quỹ chung & chi phí',
    query: 'Báo cáo số dư quỹ chung và chi phí bảo dưỡng gần nhất?',
    response:
      'Số dư Quỹ chung đang duy trì ở mức 25.000.000 ₫. Chi phí vận hành tháng này đã giải ngân 3.450.000 ₫ (gồm sạc điện và rửa xe định kỳ). Phần phân bổ theo tỷ lệ 40% của bạn là 1.380.000 ₫, tất cả hoá đơn điện tử đã được đối soát minh bạch.',
  },
  {
    icon: Zap,
    label: 'Trạm sạc khả dụng',
    query: 'Khu vực sạc xe trong garage có trụ nào đang trống?',
    response:
      'Trạm sạc thông minh Station A1 (DC 120kW) và Station A2 (AC 22kW) tại phía Đông garage đều đang sẵn sàng kết nối. Tốc độ sạc nhanh DC có thể nạp từ 20% đến 80% chỉ trong 28 phút.',
  },
];

export const AiZonePanel: React.FC<AiZonePanelProps> = ({ onClose }) => {
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI của EVShare. Tôi có thể hỗ trợ bạn kiểm tra tình trạng xe EV01, lịch biểu đặt trước, phân bổ chi phí minh bạch hoặc quy trình vận hành đồng sở hữu. Bạn muốn tìm hiểu thông tin gì?',
      timestamp: 'Vừa xong',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      clearSelection();
    }
  };

  // Keyboard accessibility: ESC cleanly closes the panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Vừa xong',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Contextual matching or intelligent fallback response
    setTimeout(() => {
      let replyText =
        'Hệ thống AI đã ghi nhận yêu cầu của bạn. Tôi đang đồng bộ dữ liệu thời gian thực từ mạng lưới xe và hợp đồng đồng sở hữu EVShare để phản hồi chính xác nhất.';

      const matchedPreset = PRESET_PROMPTS.find(
        (p) =>
          p.query.toLowerCase() === query.toLowerCase() ||
          query.toLowerCase().includes(p.label.toLowerCase())
      );

      if (matchedPreset) {
        replyText = matchedPreset.response;
      } else if (query.toLowerCase().includes('pin') || query.toLowerCase().includes('sạc')) {
        replyText =
          'Pin của xe EV01 hiện đạt 82%, dung lượng khả dụng 64 kWh. Trụ sạc tự động Station A1 đang trống và có thể bắt đầu phiên sạc ngay lập tức.';
      } else if (query.toLowerCase().includes('đặt') || query.toLowerCase().includes('lịch')) {
        replyText =
          'Bạn có thể vào tính năng "Đặt lịch xe" ở thanh điều hướng để chọn khung giờ sử dụng. Hệ thống đảm bảo thuật toán phân bổ công bằng tuyệt đối giữa các đồng sở hữu.';
      } else if (query.toLowerCase().includes('tiền') || query.toLowerCase().includes('chi phí')) {
        replyText =
          'Quỹ chung hiện có 25.000.000 ₫. Bạn có thể mở khu vực "Tài chính" để tra cứu bảng tổng hợp chi phí và tải hoá đơn chi tiết theo tháng.';
      }

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: 'Vừa xong',
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'ai',
        text: 'Cuộc trò chuyện đã được làm mới. Tôi sẵn sàng hỗ trợ bạn về bất kỳ câu hỏi nào liên quan đến xe điện đồng sở hữu EVShare!',
        timestamp: 'Vừa xong',
      },
    ]);
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: '32px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '380px',
        maxHeight: 'calc(100vh - 100px)',
        background: 'linear-gradient(180deg, rgba(8, 24, 46, 0.94) 0%, rgba(4, 14, 28, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '2px solid #00f2fe',
        borderRadius: '28px',
        boxShadow:
          '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(0, 242, 254, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        padding: '24px',
        color: '#ffffff',
        fontFamily: "var(--font-family, 'Outfit', sans-serif)",
        zIndex: 35,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        animation: 'panelSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* 1. Header with Glowing Icon, Title, and Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(0, 242, 254, 0.16)',
              border: '1.8px solid #00f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 18px rgba(0, 242, 254, 0.4)',
              flexShrink: 0,
            }}
          >
            <Bot size={22} color="#00f2fe" />
          </div>
          <div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 900,
                letterSpacing: '-0.01em',
                lineHeight: '1.2',
                color: '#ffffff',
              }}
            >
              TRỢ LÝ AI
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#00f2fe',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={11} color="#00f2fe" />
              <span>EVShare Intelligence</span>
            </div>
          </div>
        </div>

        {/* Top Actions: Reset & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleResetConversation}
            title="Làm mới cuộc trò chuyện"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#00f2fe';
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
            }}
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            onClick={handleClose}
            title="Đóng bảng Trợ lý AI"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#cbd5e1';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. System Status Bar */}
      <div
        style={{
          background: 'rgba(0, 242, 254, 0.08)',
          border: '1px solid rgba(0, 242, 254, 0.22)',
          borderRadius: '12px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>Trực tuyến • Sẵn sàng hỗ trợ</span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={11} color="#00f2fe" />
          <span>Bảo mật nhóm xe</span>
        </div>
      </div>

      {/* 3. Quick Suggestions Carousel / Chips */}
      <div>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            marginBottom: '6px',
          }}
        >
          Hỏi tôi về xe, lịch đặt, chi phí hoặc vận hành:
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
          }}
        >
          {PRESET_PROMPTS.map((prompt, idx) => {
            const Icon = prompt.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt.query)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(0, 242, 254, 0.2)',
                  borderRadius: '10px',
                  padding: '7px 10px',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)';
                  e.currentTarget.style.borderColor = '#00f2fe';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.2)';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              >
                <Icon size={12} color="#00f2fe" style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {prompt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Scrollable Chat Message Feed */}
      <div
        style={{
          flex: 1,
          minHeight: '220px',
          maxHeight: '340px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingRight: '4px',
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  background: isUser
                    ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.35) 0%, rgba(2, 132, 199, 0.6) 100%)'
                    : 'rgba(255, 255, 255, 0.06)',
                  border: isUser
                    ? '1.2px solid rgba(0, 242, 254, 0.7)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '10px 14px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: isUser ? '#ffffff' : '#e2e8f0',
                  boxShadow: isUser
                    ? '0 4px 14px rgba(0, 242, 254, 0.2)'
                    : '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
              >
                {msg.text}
              </div>
              <span
                style={{
                  fontSize: '9px',
                  color: '#64748b',
                  marginTop: '3px',
                  marginRight: isUser ? '4px' : '0',
                  marginLeft: isUser ? '0' : '4px',
                }}
              >
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {isTyping && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              width: 'fit-content',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#00f2fe',
                animation: 'pulse 1s infinite',
              }}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>AI đang phản hồi...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 5. Input Bar at Bottom */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1.5px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '16px',
          padding: '4px 6px 4px 14px',
          transition: 'border-color 0.2s',
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Hỏi tôi về xe, lịch đặt, chi phí..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '12px',
            fontFamily: "var(--font-family, 'Outfit', sans-serif)",
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          title="Gửi câu hỏi"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '12px',
            background: inputText.trim()
              ? 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: inputText.trim() ? '#051326' : '#64748b',
            cursor: inputText.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: inputText.trim() ? '0 0 14px rgba(0, 242, 254, 0.5)' : 'none',
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
