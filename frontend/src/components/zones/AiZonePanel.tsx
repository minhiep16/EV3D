import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { VehicleResponse } from '../../types/vehicle';
import {
  fetchAiStatus,
  fetchAiSuggestions,
  sendAiMessage,
  AiChatMessage,
  AiSuggestedQuestion,
  AiStatusResponse,
} from '../../services/aiApi';
import { EVCarLoader } from '../common/EVCarLoader';

interface AiZonePanelProps {
  vehicle?: VehicleResponse | null;
  onClose?: () => void;
}

export const AiZonePanel: React.FC<AiZonePanelProps> = ({ vehicle, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const closeGaragePanel = useWorldStore((state) => state.closeGaragePanel);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);

  const activeVehicleId = vehicle?.id || selectedVehicleId || 'EV01';
  const activeVehicleName = vehicle?.name || vehicle?.model || 'EV01';

  // State: Conversation Messages (isolated per user session)
  const initialWelcomeMessage = useMemo<AiChatMessage>(
    () => ({
      id: 'welcome-init',
      sender: 'ai',
      text: `Xin chào ${user?.fullName || 'bạn'}! Tôi là Trợ lý Vận hành Garage EVShare. Tôi có thể hỗ trợ tra cứu thông số pin thực tế của xe ${activeVehicleName}, đối soát chi phí cá nhân, kiểm tra lịch đặt xe và hồ sơ tranh chấp.`,
      timestamp: 'Vừa xong',
      sourceMode: 'GROUNDED_DATA',
      verifiedFacts: [`Phương tiện: ${activeVehicleName}`, 'Nguồn dữ liệu: EVShare Business Services'],
    }),
    [user?.fullName, activeVehicleName]
  );

  const [messages, setMessages] = useState<AiChatMessage[]>([initialWelcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Status & Suggestions
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestedQuestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Scroll references
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Viewport responsive dimensions
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;

  const panelTop = isMobile ? '72px' : '88px';
  const panelRight = isMobile ? '16px' : '24px';
  const panelWidth = isMobile
    ? 'calc(100vw - 32px)'
    : isTablet
    ? '380px'
    : '440px';
  const panelHeight = isMobile
    ? 'calc(100dvh - 88px)'
    : 'min(680px, calc(100dvh - 112px))';
  const panelMaxHeight = isMobile
    ? 'calc(100dvh - 88px)'
    : 'calc(100dvh - 112px)';

  // Load AI status & suggestions
  useEffect(() => {
    let mounted = true;
    fetchAiStatus()
      .then((status) => {
        if (mounted) setAiStatus(status);
      })
      .catch(() => {
        if (mounted) {
          setAiStatus({
            llmConfigured: false,
            groundedDataAvailable: true,
            provider: 'Grounded Engine',
            model: 'Direct Service Layer',
            statusMessage: 'Chế độ Trợ lý Đồng sở hữu Grounded trực tuyến.',
          });
        }
      });

    setLoadingSuggestions(true);
    fetchAiSuggestions(activeVehicleId)
      .then((suggs) => {
        if (mounted) setSuggestions(suggs);
      })
      .catch(() => {
        if (mounted) setSuggestions([]);
      })
      .finally(() => {
        if (mounted) setLoadingSuggestions(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeVehicleId]);

  // Reset conversation if authenticated user changes
  useEffect(() => {
    setMessages([initialWelcomeMessage]);
  }, [user?.id, initialWelcomeMessage]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeGaragePanel('AI_ASSISTANT');
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

  // Track user scroll position: do not auto-scroll down if user scrolled up to read earlier messages
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 90;
  };

  // Scroll appropriately when messages update or sending changes
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isSending) return;

    setErrorBanner(null);
    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsSending(true);

    // Build compact history for backend context
    const historyPayload = messages.slice(-4).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    try {
      const response = await sendAiMessage(query, activeVehicleId, historyPayload);
      const aiReply: AiChatMessage = {
        id: response.id || `ai-${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        asOf: response.asOf,
        sourceMode: response.sourceMode,
        verifiedFacts: response.verifiedFacts,
        actionNotice: response.actionNotice,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const errText = err?.message || 'Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại kết nối mạng.';
      setErrorBanner(errText);
      // Preserve user query in input if sending failed and was manually typed
      if (!textToSend) {
        setInputText(query);
      }
    } finally {
      setIsSending(false);
      // Keep input focused
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: `Hội thoại đã được làm mới. Tôi sẵn sàng hỗ trợ bạn về bất kỳ câu hỏi nào liên quan đến xe ${activeVehicleName} và vận hành Garage!`,
        timestamp: 'Vừa xong',
        sourceMode: 'GROUNDED_DATA',
        verifiedFacts: [`Phương tiện: ${activeVehicleName}`],
      },
    ]);
    setErrorBanner(null);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderSuggestionIcon = (type: string) => {
    switch (type) {
      case 'car':
        return <Car size={13} color="#00f2fe" />;
      case 'battery':
        return <Zap size={13} color="#38bdf8" />;
      case 'calendar':
        return <Calendar size={13} color="#34d399" />;
      case 'finance':
        return <DollarSign size={13} color="#fbbf24" />;
      case 'dispute':
        return <Scale size={13} color="#f87171" />;
      case 'maintenance':
        return <Wrench size={13} color="#a78bfa" />;
      default:
        return <Sparkles size={13} color="#00f2fe" />;
    }
  };

  return (
    <aside
      role="complementary"
      aria-label="EVShare AI Assistant"
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: panelTop,
        right: panelRight,
        width: panelWidth,
        maxWidth: 'calc(100vw - 32px)',
        height: panelHeight,
        maxHeight: panelMaxHeight,
        bottom: 'auto',
        background: 'linear-gradient(180deg, rgba(8, 22, 42, 0.96) 0%, rgba(4, 12, 24, 0.98) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1.5px solid rgba(0, 242, 254, 0.45)',
        borderRadius: '24px',
        boxShadow:
          '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 32px rgba(0, 242, 254, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        color: '#ffffff',
        fontFamily: "var(--font-family, 'Outfit', sans-serif)",
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        pointerEvents: 'auto',
        animation: 'panelSlideInFromRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* 1. FIXED HEADER */}
      <header
        style={{
          padding: '18px 20px 14px 20px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.18)',
          background: 'rgba(6, 18, 36, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '13px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(3, 105, 161, 0.3) 100%)',
              border: '1.5px solid #00f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.35)',
              flexShrink: 0,
            }}
          >
            <Bot size={22} color="#00f2fe" />
          </div>

          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '0.02em',
                lineHeight: '1.2',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>EVShare AI Assistant</span>
            </div>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 500,
                color: '#7dd3fc',
                lineHeight: '1.3',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '2px',
              }}
            >
              <span>Trợ lý vận hành Garage</span>
              <span style={{ color: 'rgba(125, 211, 252, 0.4)' }}>•</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: aiStatus?.llmConfigured ? '#34d399' : '#38bdf8',
                  fontWeight: 600,
                  fontSize: '10.5px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: aiStatus?.llmConfigured ? '#34d399' : '#38bdf8',
                    boxShadow: aiStatus?.llmConfigured
                      ? '0 0 8px #34d399'
                      : '0 0 8px #38bdf8',
                  }}
                />
                {aiStatus?.llmConfigured ? 'AI Trực tuyến' : 'Grounded Copilot'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleResetConversation}
            title="Làm mới cuộc trò chuyện"
            aria-label="Làm mới cuộc trò chuyện"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
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
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            onClick={handleClose}
            title="Đóng trợ lý"
            aria-label="Đóng trợ lý"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <X size={17} />
          </button>
        </div>
      </header>

      {/* 2. SUGGESTED QUESTIONS CHIPS SECTION */}
      {suggestions.length > 0 && (
        <section
          aria-label="Gợi ý câu hỏi"
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid rgba(56, 189, 248, 0.10)',
            background: 'rgba(4, 14, 28, 0.65)',
            display: 'flex',
            flexWrap: 'nowrap',
            gap: '8px',
            overflowX: 'auto',
            flexShrink: 0,
            scrollbarWidth: 'none',
          }}
        >
          {suggestions.map((sug) => (
            <button
              key={sug.id}
              type="button"
              onClick={() => handleSendMessage(sug.query)}
              disabled={isSending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '12px',
                background: 'rgba(15, 34, 60, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#e0f2fe',
                fontSize: '11.5px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: isSending ? 'not-allowed' : 'pointer',
                opacity: isSending ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSending) {
                  e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)';
                  e.currentTarget.style.borderColor = '#00f2fe';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 34, 60, 0.75)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {renderSuggestionIcon(sug.iconType)}
              <span>{sug.label}</span>
            </button>
          ))}
        </section>
      )}

      {/* 3. SCROLLABLE CONVERSATION AREA */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          scrollBehavior: 'smooth',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              width: '100%',
            }}
          >
            {/* Sender Label & Timestamp */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10.5px',
                fontWeight: 600,
                color: msg.sender === 'user' ? '#7dd3fc' : '#94a3b8',
                marginBottom: '4px',
                paddingLeft: msg.sender === 'ai' ? '4px' : '0',
                paddingRight: msg.sender === 'user' ? '4px' : '0',
              }}
            >
              {msg.sender === 'ai' ? (
                <>
                  <Bot size={12} color="#00f2fe" />
                  <span>Trợ lý AI</span>
                  {msg.asOf && (
                    <span style={{ color: 'rgba(148, 163, 184, 0.6)' }}>
                      • Dữ liệu lúc {msg.asOf}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>Bạn</span>
                  <span style={{ color: 'rgba(125, 211, 252, 0.6)' }}>• {msg.timestamp}</span>
                </>
              )}
            </div>

            {/* Bubble Card */}
            <div
              style={{
                maxWidth: '92%',
                borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '12px 16px',
                fontSize: '13px',
                lineHeight: '1.5',
                letterSpacing: '0.01em',
                background:
                  msg.sender === 'user'
                    ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.85) 0%, rgba(3, 105, 161, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(10, 28, 52, 0.85) 0%, rgba(6, 18, 36, 0.92) 100%)',
                border:
                  msg.sender === 'user'
                    ? '1px solid rgba(56, 189, 248, 0.5)'
                    : '1px solid rgba(56, 189, 248, 0.22)',
                color: '#ffffff',
                boxShadow:
                  msg.sender === 'user'
                    ? '0 4px 16px rgba(2, 132, 199, 0.25)'
                    : '0 4px 16px rgba(0, 0, 0, 0.35)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.text}

              {/* Action Safety Warning Notice */}
              {msg.actionNotice && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(234, 179, 8, 0.12)',
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: '#fef08a',
                  }}
                >
                  <AlertTriangle size={14} color="#facc15" flexShrink={0} />
                  <span>{msg.actionNotice}</span>
                </div>
              )}

              {/* Verified Facts Badges */}
              {msg.verifiedFacts && msg.verifiedFacts.length > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  {msg.verifiedFacts.map((fact, fIdx) => (
                    <span
                      key={fIdx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(0, 242, 254, 0.10)',
                        border: '1px solid rgba(0, 242, 254, 0.22)',
                        color: '#7dd3fc',
                      }}
                    >
                      <CheckCircle2 size={11} color="#38bdf8" />
                      <span>{fact}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Compact EV Loading Indicator */}
        {isSending && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              paddingLeft: '4px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#7dd3fc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Bot size={12} color="#00f2fe" />
              <span>Trợ lý AI đang truy vấn cơ sở dữ liệu...</span>
            </div>

            <div
              style={{
                padding: '10px 16px',
                borderRadius: '16px',
                background: 'rgba(10, 28, 52, 0.85)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
              }}
            >
              <EVCarLoader
                variant="inline"
                message="Đang tra cứu dữ liệu vận hành..."
                style={{ padding: '0px' }}
              />
            </div>
          </div>
        )}

        {/* Error Banner with Retry */}
        {errorBanner && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              color: '#fca5a5',
              fontSize: '12px',
            }}
          >
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => handleSendMessage()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. FIXED MESSAGE COMPOSER */}
      <footer
        style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(56, 189, 248, 0.16)',
          background: 'rgba(6, 18, 36, 0.90)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div
          id="ai-composer-wrap"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            background: 'rgba(10, 24, 46, 0.85)',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '16px',
            padding: '8px 12px',
            transition: 'border-color 0.2s',
          }}
          onFocus={() => {
            // High contrast focus border
            const el = document.getElementById('ai-composer-wrap');
            if (el) el.style.borderColor = '#00f2fe';
          }}
          onBlur={() => {
            const el = document.getElementById('ai-composer-wrap');
            if (el) el.style.borderColor = 'rgba(56, 189, 248, 0.35)';
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={`Hỏi về pin, lịch đặt, nợ chi phí xe ${activeVehicleName}...`}
            disabled={isSending}
            aria-label="Nhập câu hỏi cho trợ lý AI"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontFamily: "var(--font-family, 'Outfit', sans-serif)",
              lineHeight: '1.45',
              resize: 'none',
              maxHeight: '110px',
              overflowY: 'auto',
              opacity: isSending ? 0.6 : 1,
            }}
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isSending}
            title="Gửi câu hỏi"
            aria-label="Gửi câu hỏi"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background:
                inputText.trim() && !isSending
                  ? 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: inputText.trim() && !isSending ? '#031024' : '#64748b',
              cursor: inputText.trim() && !isSending ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow:
                inputText.trim() && !isSending
                  ? '0 0 14px rgba(0, 242, 254, 0.45)'
                  : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Accessibility & Hotkey Hint */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10.5px',
            color: '#64748b',
            padding: '0 4px',
          }}
        >
          <span>Nhấn Enter để gửi, Shift+Enter để xuống dòng</span>
          <span>EVShare Verified Guard</span>
        </div>
      </footer>
    </aside>
  );
};
