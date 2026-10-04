import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Bot,
  Sparkles,
  Send,
  RotateCcw,
  Car,
  Calendar,
  DollarSign,
  Zap,
  X,
} from 'lucide-react';
import { useWorldStore } from '../../../store/worldStore';
import { HologramProjectionBase3D } from './common/HologramProjectionBase3D';

interface AiMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface AiControlHologram3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClose?: () => void;
  visible?: boolean;
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

/**
 * AiControlHologram3D:
 * Canonical 3D World-Space Holographic Interactive Control Console for CO_OWNER AI Assistant.
 * Built with clean R3F / Drei HTML boundary:
 * - Three.js Backing Layers: enlarged multi-tiered glass backing, emissive brackets, technical grids
 * - Three.js Floor Anchor: HologramProjectionBase3D floor plinth beneath console
 * - Drei HTML Interaction Surface: strictly encapsulates all DOM buttons, chips, and chat form
 * - Dedicated mouse-wheel isolation preventing 3D scene / camera zoom during conversation scroll
 */
export const AiControlHologram3D: React.FC<AiControlHologram3DProps> = ({
  position = [6.5, 1.5, 2.80],
  rotation = [0, -0.1745, 0],
  onClose,
  visible = true,
}) => {
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const consoleFloatRef = useRef<THREE.Group>(null);
  const frameGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);

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
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Enlarged 3D dimensions (+25% width, +30% height for expanded chat viewport)
  const panelW = 3.70;
  const panelH = 5.65;
  const hw = panelW / 2;
  const hh = panelH / 2;
  const bracketLen = 0.38;
  const bracketThick = 0.022;

  // Hovering float & emissive glow animation synchronized with showroom tempo
  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.getElapsedTime();
    if (consoleFloatRef.current) {
      consoleFloatRef.current.position.y = Math.sin(t * 1.5) * 0.025;
    }
    if (frameGlowMatRef.current) {
      frameGlowMatRef.current.emissiveIntensity = 1.6 + Math.sin(t * 2.2) * 0.35;
    }
  });

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

  // Strict native wheel isolation: Prevent mouse-wheel inside chat from controlling camera/scene
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Smart auto-scroll: Strictly scroll internal container only — never call scrollIntoView()
  // which can displace parent Drei <Html> 3D transform layers and cause layout clipping
  useEffect(() => {
    if (chatScrollRef.current && isNearBottomRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const threshold = 60; // px tolerance
    isNearBottomRef.current =
      target.scrollHeight - target.scrollTop - target.clientHeight <= threshold;
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Vừa xong',
    };

    // User interaction: force follow new message
    isNearBottomRef.current = true;
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Immediate container scroll for user message
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 50);

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
    }, 550);
  };

  const handleResetConversation = () => {
    isNearBottomRef.current = true;
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'ai',
        text: 'Cuộc trò chuyện đã được làm mới. Tôi sẵn sàng hỗ trợ bạn về bất kỳ câu hỏi nào liên quan đến xe điện đồng sở hữu EVShare!',
        timestamp: 'Vừa xong',
      },
    ]);
  };

  if (!visible) return null;

  return (
    <group position={position} rotation={rotation} visible={visible} name="AiControlHologramRoot">
      {/* =========================================================================
          1. TRUE THREE.JS PROJECTION BASE (FLOOR ANCHOR)
          Centered on showroom floor directly beneath the enlarged AI hologram console
          ========================================================================= */}
      <HologramProjectionBase3D
        position={[0, -position[1] + 0.005, 0]}
        color="#00f2fe"
        visible={visible}
      />

      {/* =========================================================================
          2. FLOATING CONSOLE GROUP WITH THREE.JS GLASS BACKING & DREI HTML SURFACE
          ========================================================================= */}
      <group ref={consoleFloatRef}>
        {/* -------------------------------------------------------------
            LAYER 1: REAR DARK NAVY TINTED GLASS BACKING
            ------------------------------------------------------------- */}
        <mesh position={[0, 0, -0.045]} raycast={() => null}>
          <planeGeometry args={[panelW, panelH]} />
          <meshStandardMaterial
            color="#040c1c"
            roughness={0.12}
            metalness={0.88}
            transparent
            opacity={0.72}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* -------------------------------------------------------------
            LAYER 2: LOW-OPACITY TECHNICAL WIREFRAME & VIOLET HIGHLIGHT
            ------------------------------------------------------------- */}
        <mesh position={[0, 0, -0.04]} raycast={() => null}>
          <planeGeometry args={[panelW - 0.08, panelH - 0.08]} />
          <meshBasicMaterial
            color="#00f2fe"
            wireframe
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh position={[0, 0, -0.042]} raycast={() => null}>
          <ringGeometry args={[1.35, 1.39, 32]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* -------------------------------------------------------------
            LAYER 3: EMISSIVE PERIMETER FRAME & 4 CORNER BRACKETS
            ------------------------------------------------------------- */}
        <group position={[0, 0, -0.02]}>
          {/* Top-Left Bracket */}
          <group position={[-hw, hh, 0.005]}>
            <mesh position={[bracketLen / 2, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
              <meshStandardMaterial
                ref={frameGlowMatRef}
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, -bracketLen / 2, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Top-Right Bracket */}
          <group position={[hw, hh, 0.005]}>
            <mesh position={[-bracketLen / 2, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, -bracketLen / 2, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Bottom-Left Bracket */}
          <group position={[-hw, -hh, 0.005]}>
            <mesh position={[bracketLen / 2, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, bracketLen / 2, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Bottom-Right Bracket */}
          <group position={[hw, -hh, 0.005]}>
            <mesh position={[-bracketLen / 2, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, bracketLen / 2, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Top Center Sensor / Telemetry Bead */}
          <mesh position={[0, hh + 0.045, 0.005]} raycast={() => null}>
            <cylinderGeometry args={[0.02, 0.02, 0.065, 12]} />
            <meshStandardMaterial
              color="#00f2fe"
              emissive="#00f2fe"
              emissiveIntensity={2.2}
            />
          </mesh>

          {/* Bottom Projection Connector Node Lens */}
          <group position={[0, -hh - 0.045, 0.005]}>
            <mesh raycast={() => null}>
              <cylinderGeometry args={[0.09, 0.05, 0.08, 16]} />
              <meshStandardMaterial
                color="#091628"
                metalness={0.8}
                roughness={0.2}
                emissive="#00f2fe"
                emissiveIntensity={0.5}
              />
            </mesh>
            <mesh position={[0, 0.025, 0]} raycast={() => null}>
              <torusGeometry args={[0.065, 0.012, 8, 16]} />
              <meshBasicMaterial color="#00f2fe" />
            </mesh>
          </group>
        </group>

        {/* -------------------------------------------------------------
            LAYER 4: MAIN FRONT INTERACTIVE GLASS CONSOLE (DREI HTML TRANSFORM)
            All DOM buttons, inputs, chips, and chat elements live strictly here!
            ------------------------------------------------------------- */}
        <Html
          transform
          distanceFactor={3.25}
          position={[0, 0, 0.03]}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Scoped Custom Scrollbar Style */}
          <style>{`
            .ai-chat-scroll::-webkit-scrollbar {
              width: 5px;
            }
            .ai-chat-scroll::-webkit-scrollbar-track {
              background: transparent;
              border-radius: 9999px;
              margin: 4px 0;
            }
            .ai-chat-scroll::-webkit-scrollbar-thumb {
              background: rgba(0, 242, 254, 0.32);
              border-radius: 9999px;
              border: 1px solid rgba(0, 242, 254, 0.15);
              transition: background 0.2s ease;
            }
            .ai-chat-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(0, 242, 254, 0.65);
              box-shadow: 0 0 8px rgba(0, 242, 254, 0.5);
            }
            .ai-chat-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(0, 242, 254, 0.35) transparent;
            }
          `}</style>

          <div
            data-testid="ai-3d-control-panel"
            data-ui-interactive="true"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            style={{
              width: '430px',
              height: '560px',
              background:
                'linear-gradient(180deg, rgba(8, 22, 42, 0.92) 0%, rgba(4, 12, 26, 0.98) 100%)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '2px solid rgba(0, 242, 254, 0.75)',
              borderRadius: '28px',
              boxShadow:
                '0 28px 70px rgba(0, 0, 0, 0.88), 0 0 42px rgba(0, 242, 254, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 0 24px rgba(0, 242, 254, 0.14)',
              padding: '24px 26px',
              color: '#ffffff',
              fontFamily: "var(--font-family, 'Outfit', sans-serif)",
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* ======================================================== */}
            {/* 1. FIXED HEADER: Identity, Title, Controls               */}
            {/* ======================================================== */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '16px',
                    background: 'rgba(0, 242, 254, 0.16)',
                    border: '2px solid #00f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(0, 242, 254, 0.45)',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={26} color="#00f2fe" />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: '23px',
                      fontWeight: 850,
                      letterSpacing: '-0.01em',
                      color: '#ffffff',
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    TRỢ LÝ AI
                  </h2>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      margin: '2px 0 0 0',
                      fontWeight: 500,
                    }}
                  >
                    EVShare Intelligence
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleResetConversation}
                  title="Làm mới cuộc trò chuyện"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00f2fe';
                    e.currentTarget.style.color = '#00f2fe';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 242, 254, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  title="Đóng bảng điều khiển"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.50)';
                    e.currentTarget.style.color = '#ff6b6b';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 2. FIXED STATUS BAR: Online State & Readiness Pill       */}
            {/* ======================================================== */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(16, 185, 129, 0.10)',
                border: '1px solid rgba(16, 185, 129, 0.30)',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 650,
                color: '#10b981',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  flexShrink: 0,
                }}
              />
              <span>Trực tuyến</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>•</span>
              <span style={{ color: '#94a3b8', fontWeight: 500 }}>Sẵn sàng hỗ trợ đồng sở hữu</span>
            </div>

            {/* ======================================================== */}
            {/* 3. FIXED QUICK PROMPT SUGGESTION CHIPS                   */}
            {/* ======================================================== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                Gợi ý câu hỏi nhanh:
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendMessage(prompt.query);
                      }}
                      style={{
                        background: 'rgba(10, 30, 56, 0.75)',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                        borderRadius: '12px',
                        padding: '7px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#e2e8f0',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        lineHeight: 1.25,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#00f2fe';
                        e.currentTarget.style.background = 'rgba(14, 38, 70, 0.92)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 242, 254, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.25)';
                        e.currentTarget.style.background = 'rgba(10, 30, 56, 0.75)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Icon size={14} color="#00f2fe" style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {prompt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ======================================================== */}
            {/* 4. EXPANDED SCROLLABLE CHAT MESSAGES AREA (FLEX: 1)     */}
            {/* Wheel scrolling is strictly isolated to prevent camera zoom */}
            {/* ======================================================== */}
            <div
              ref={chatScrollRef}
              className="ai-chat-scroll"
              onScroll={handleScroll}
              onWheel={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                minHeight: 0,
                background: 'rgba(6, 18, 36, 0.25)',
                border: '1px solid rgba(0, 242, 254, 0.16)',
                borderRadius: '18px',
                padding: '14px',
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {messages.map((msg) => {
                const isAi = msg.sender === 'ai';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignSelf: isAi ? 'flex-start' : 'flex-end',
                      maxWidth: isAi ? '92%' : '84%',
                      flexDirection: isAi ? 'row' : 'row-reverse',
                    }}
                  >
                    {isAi && (
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '8px',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '1px solid #00f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <Sparkles size={13} color="#00f2fe" />
                      </div>
                    )}
                    <div
                      style={{
                        background: isAi
                          ? 'rgba(10, 30, 56, 0.70)'
                          : 'linear-gradient(135deg, rgba(0, 242, 254, 0.26) 0%, rgba(14, 165, 233, 0.38) 100%)',
                        border: isAi ? '1px solid rgba(0, 242, 254, 0.22)' : '1px solid rgba(0, 242, 254, 0.55)',
                        borderRadius: isAi ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                        padding: '10px 14px',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        lineHeight: '1.50',
                        wordBreak: 'break-word',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.20)',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '7px 14px',
                    background: 'rgba(10, 30, 56, 0.60)',
                    border: '1px solid rgba(0, 242, 254, 0.22)',
                    borderRadius: '12px',
                    width: 'fit-content',
                    color: '#38bdf8',
                    fontSize: '11.5px',
                  }}
                >
                  <Sparkles size={13} className="animate-spin" color="#00f2fe" />
                  <span>AI đang trả lời...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ======================================================== */}
            {/* 5. FIXED INPUT QUERY COMPOSER AT BOTTOM                  */}
            {/* ======================================================== */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                background: 'rgba(8, 24, 46, 0.85)',
                border: '1.4px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '18px',
                padding: '4px 6px 4px 14px',
                flexShrink: 0,
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Hỏi trợ lý AI về EV01..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  outline: 'none',
                  fontFamily: "var(--font-family, 'Outfit', sans-serif)",
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '14px',
                  background: inputText.trim()
                    ? 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputText.trim() ? 'pointer' : 'default',
                  color: inputText.trim() ? '#041628' : '#64748b',
                  transition: 'all 0.2s',
                  boxShadow: inputText.trim() ? '0 0 16px rgba(0, 242, 254, 0.5)' : 'none',
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </Html>
      </group>
    </group>
  );
};
