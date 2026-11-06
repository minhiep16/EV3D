import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Disc,
  Sun,
  Shield,
  Layers,
  Eye,
  KeyRound,
  BatteryCharging,
  Zap,
  Sparkles,
  Compass,
  X,
  Pause,
  Play,
} from 'lucide-react';
import { VehicleResponse } from '../../../types/vehicle';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import {
  resolveVehicleHotspots,
  VehicleHotspotItem,
  HotspotIconKey,
  DEFAULT_ROTATION_INTERVAL_MS,
  DEFAULT_TYPEWRITER_CHAR_MS,
} from '../../../data/vehicleHotspotConfig';

interface VehicleHotspotLayerProps {
  vehicle: VehicleResponse;
  vehicleCode: 'EV01' | 'EV02';
}

export function renderHotspotIcon(
  iconKey: HotspotIconKey,
  size = 14,
  color = '#00f2fe'
): React.ReactNode {
  switch (iconKey) {
    case 'disc':
      return <Disc size={size} color={color} />;
    case 'sun':
      return <Sun size={size} color={color} />;
    case 'shield':
      return <Shield size={size} color={color} />;
    case 'layers':
      return <Layers size={size} color={color} />;
    case 'eye':
      return <Eye size={size} color={color} />;
    case 'key':
      return <KeyRound size={size} color={color} />;
    case 'battery':
      return <BatteryCharging size={size} color={color} />;
    case 'zap':
      return <Zap size={size} color={color} />;
    case 'sparkles':
      return <Sparkles size={size} color={color} />;
    case 'compass':
    default:
      return <Compass size={size} color={color} />;
  }
}

export interface HolographicHotspotInfoCardProps {
  hotspot: VehicleHotspotItem;
  hotspotIndex: number;
  totalHotspots: number;
  onClose: () => void;
  onStepHotspot?: (delta: number) => void;
  rotationIntervalMs?: number;
  charIntervalMs?: number;
  widthStyle?: string;
}

/**
 * Compact Holographic Info Card Component (Phase 26 Direct Hotspot UX).
 * Keeps all 2000ms rotation and 18ms typewriter state strictly inside this HTML leaf component
 * so character updates NEVER re-render the 3D scene, meshes, or WebGL canvas.
 */
export const HolographicHotspotInfoCard: React.FC<
  HolographicHotspotInfoCardProps
> = ({
  hotspot,
  onClose,
  rotationIntervalMs = DEFAULT_ROTATION_INTERVAL_MS,
  charIntervalMs = DEFAULT_TYPEWRITER_CHAR_MS,
  widthStyle = '320px',
}) => {
  const frames = useMemo(
    () =>
      hotspot.infoFrames && hotspot.infoFrames.length > 0
        ? hotspot.infoFrames
        : [
            {
              label: 'Chất liệu',
              value: hotspot.material,
              text: `Chất liệu: ${hotspot.material}`,
            },
            {
              label: 'Chức năng',
              value: hotspot.function,
              text: `Chức năng: ${hotspot.function}`,
            },
            {
              label: 'Đặc điểm',
              value: hotspot.highlight,
              text: `Đặc điểm: ${hotspot.highlight}`,
            },
          ],
    [hotspot]
  );

  // Detect prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [isManualPaused, setIsManualPaused] = useState<boolean>(false);
  const [isHoverPaused, setIsHoverPaused] = useState<boolean>(false);
  const [isFocusPaused, setIsFocusPaused] = useState<boolean>(false);
  const [skipTypewriter, setSkipTypewriter] = useState<boolean>(false);

  const rotationTimerRef = useRef<number | null>(null);
  const typewriterTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const clearRotationTimer = () => {
    if (rotationTimerRef.current !== null) {
      window.clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
    }
  };

  const clearTypewriterTimer = () => {
    if (typewriterTimerRef.current !== null) {
      window.clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
  };

  // Lifecycle cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearRotationTimer();
      clearTypewriterTimer();
    };
  }, []);

  // Reset sequence immediately when switching to a different hotspot
  useEffect(() => {
    clearRotationTimer();
    clearTypewriterTimer();
    setFrameIndex(0);
    setIsManualPaused(prefersReducedMotion);
    setIsHoverPaused(false);
    setIsFocusPaused(false);
    setSkipTypewriter(prefersReducedMotion);
    const initialText = frames[0]?.text || '';
    setCharCount(prefersReducedMotion ? initialText.length : 1);
  }, [hotspot.id, prefersReducedMotion, frames]);

  const currentFrame = frames[frameIndex] || frames[0];
  const fullText = currentFrame?.text || '';

  // Typewriter character reveal effect
  useEffect(() => {
    clearTypewriterTimer();

    if (prefersReducedMotion || skipTypewriter) {
      setCharCount(fullText.length);
      return;
    }

    setCharCount(1);
    typewriterTimerRef.current = window.setInterval(() => {
      if (!isMountedRef.current) return;
      setCharCount((prev) => {
        if (prev >= fullText.length) {
          clearTypewriterTimer();
          return fullText.length;
        }
        return prev + 1;
      });
    }, charIntervalMs);

    return () => {
      clearTypewriterTimer();
    };
  }, [
    hotspot.id,
    frameIndex,
    fullText,
    prefersReducedMotion,
    skipTypewriter,
    charIntervalMs,
  ]);

  // Automatic 2000ms rotation interval measured strictly between content transitions
  const isEffectivePaused = isManualPaused || isHoverPaused || isFocusPaused;

  useEffect(() => {
    clearRotationTimer();

    if (isEffectivePaused || frames.length <= 1) {
      return;
    }

    rotationTimerRef.current = window.setInterval(() => {
      if (!isMountedRef.current) return;
      setSkipTypewriter(prefersReducedMotion);
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, rotationIntervalMs);

    return () => {
      clearRotationTimer();
    };
  }, [
    hotspot.id,
    isEffectivePaused,
    frames.length,
    rotationIntervalMs,
    prefersReducedMotion,
  ]);

  // Manual progress dot click: show full text immediately and pause auto-rotation
  const handleSelectFrameDot = (idx: number) => {
    clearRotationTimer();
    clearTypewriterTimer();
    setIsManualPaused(true);
    setSkipTypewriter(true);
    setFrameIndex(idx);
    const targetText = frames[idx]?.text || '';
    setCharCount(targetText.length);
  };

  // Toggle Pause / Play
  const handleTogglePausePlay = () => {
    if (isManualPaused) {
      setIsManualPaused(false);
      setSkipTypewriter(prefersReducedMotion);
    } else {
      clearRotationTimer();
      clearTypewriterTimer();
      setIsManualPaused(true);
      setSkipTypewriter(true);
      setCharCount(fullText.length);
    }
  };

  const revealedText = fullText.slice(0, charCount);
  const colonIdx = revealedText.indexOf(':');
  const isTyping = !prefersReducedMotion && charCount < fullText.length;

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setIsHoverPaused(true)}
      onMouseLeave={() => setIsHoverPaused(false)}
      onFocusCapture={() => setIsFocusPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsFocusPaused(false);
        }
      }}
      style={{
        width: widthStyle,
        maxWidth: '340px',
        background:
          'linear-gradient(145deg, rgba(6, 16, 32, 0.92) 0%, rgba(10, 24, 46, 0.88) 100%)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(0, 242, 254, 0.48)',
        borderRadius: '14px',
        padding: '11px 13px',
        boxShadow:
          '0 14px 32px rgba(0, 0, 0, 0.68), 0 0 18px rgba(0, 242, 254, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        color: '#f8fafc',
        fontFamily: 'var(--font-family)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        animation: prefersReducedMotion ? 'none' : 'fadeIn 0.18s ease-out',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      {/* 1. Compact Header: [ICON] COMPONENT NAME [X] + Subtitle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background:
                'linear-gradient(135deg, rgba(0, 242, 254, 0.18) 0%, rgba(2, 132, 199, 0.14) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.42)',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {renderHotspotIcon(hotspot.icon, 14, '#00f2fe')}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 900,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                lineHeight: 1.2,
              }}
            >
              {hotspot.title}
            </div>
            {hotspot.subtitle && (
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#38bdf8',
                  marginTop: '1px',
                  lineHeight: 1.25,
                }}
              >
                {hotspot.subtitle}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label="Đóng thông tin bộ phận"
          onClick={() => {
            clearRotationTimer();
            clearTypewriterTimer();
            onClose();
          }}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* 2. Compact Holographic Animated Information Text Stage (2000ms cycle + typewriter) */}
      <div
        aria-hidden="true"
        key={`${hotspot.id}-frame-${frameIndex}`}
        style={{
          minHeight: '42px',
          background:
            'linear-gradient(135deg, rgba(8, 20, 38, 0.82) 0%, rgba(4, 12, 24, 0.90) 100%)',
          border: '1px solid rgba(0, 242, 254, 0.26)',
          borderRadius: '10px',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          transition: prefersReducedMotion ? 'none' : 'opacity 0.16s ease-out',
        }}
      >
        <div
          style={{
            fontSize: '11.5px',
            lineHeight: 1.4,
            color: '#f1f5f9',
            fontWeight: 600,
            letterSpacing: '0.01em',
            wordBreak: 'break-word',
          }}
        >
          {colonIdx >= 0 ? (
            <>
              <span
                style={{
                  color: '#00f2fe',
                  fontWeight: 800,
                }}
              >
                {revealedText.slice(0, colonIdx + 1)}
              </span>
              <span style={{ color: '#f8fafc' }}>
                {revealedText.slice(colonIdx + 1)}
              </span>
            </>
          ) : (
            <span style={{ color: '#00f2fe', fontWeight: 800 }}>
              {revealedText}
            </span>
          )}

          {/* Small Cyan Blinking Holographic Cursor */}
          {!prefersReducedMotion && (
            <span
              style={{
                display: 'inline-block',
                width: '5px',
                height: '11px',
                marginLeft: '3px',
                verticalAlign: 'middle',
                background: '#00f2fe',
                boxShadow: '0 0 6px #00f2fe',
                opacity: isTyping ? 1 : 0.55,
              }}
            />
          )}
        </div>
      </div>

      {/* 3. Progress Indicator Dots [● ○ ○ ○] + Compact [Pause/Play] */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div
          role="tablist"
          aria-label="Chọn mục thông tin bộ phận"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {frames.map((frame, idx) => {
            const isCurrent = idx === frameIndex;
            return (
              <button
                key={frame.label}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`${frame.label}: ${frame.value}`}
                title={`${frame.label}: ${frame.value}`}
                onClick={() => handleSelectFrameDot(idx)}
                style={{
                  width: isCurrent ? '16px' : '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  background: isCurrent
                    ? '#00f2fe'
                    : 'rgba(148, 163, 184, 0.35)',
                  border: 'none',
                  boxShadow: isCurrent
                    ? '0 0 8px rgba(0, 242, 254, 0.75)'
                    : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: prefersReducedMotion
                    ? 'none'
                    : 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleTogglePausePlay}
          aria-label={
            isManualPaused
              ? 'Tiếp tục tự động chuyển thông tin'
              : 'Tạm dừng tự động chuyển thông tin'
          }
          style={{
            background: isManualPaused
              ? 'rgba(0, 242, 254, 0.15)'
              : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${
              isManualPaused
                ? 'rgba(0, 242, 254, 0.42)'
                : 'rgba(255, 255, 255, 0.14)'
            }`,
            borderRadius: '9999px',
            padding: '2px 8px',
            color: isManualPaused ? '#00f2fe' : '#cbd5e1',
            fontSize: '9.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3.5px',
          }}
        >
          {isManualPaused ? <Play size={9} /> : <Pause size={9} />}
          <span>{isManualPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
        </button>
      </div>

      {/* 4. Screen-Reader Accessible Static List of All Component Details */}
      <ul
        aria-label={`Thông tin chi tiết ${hotspot.title}`}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {frames.map((frame) => (
          <li key={frame.label}>
            {frame.label}: {frame.value}
          </li>
        ))}
      </ul>
    </div>
  );
};

interface SingleHotspotNodeProps {
  hotspot: VehicleHotspotItem;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (hotspot: VehicleHotspotItem) => void;
  onHover: (id: VehicleHotspotItem['id'] | null) => void;
}

/**
 * Refined, subtle 3D Hotspot Marker (Section 6):
 * - Visible marker diameter: 14px default, 16px hover, 18px active
 * - Small cyan glowing core dot (5-6px) + thin luminous ring
 * - Comfortable invisible click target: 30px x 30px
 * - Only the active hotspot has stronger illumination
 */
const SingleHotspotNode: React.FC<SingleHotspotNodeProps> = ({
  hotspot,
  index,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}) => {
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const floatGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + index * 0.55;
    if (floatGroupRef.current) {
      floatGroupRef.current.position.y = Math.sin(t * 2.0) * 0.008;
    }
    if (pulseRingRef.current) {
      const pulse = 1 + Math.sin(t * 2.8) * 0.16;
      const scale = isSelected ? pulse * 1.28 : isHovered ? pulse * 1.12 : pulse;
      pulseRingRef.current.scale.set(scale, scale, scale);
    }
  });

  const accentColor = isSelected
    ? '#00f2fe'
    : isHovered
    ? '#38bdf8'
    : '#00e5ff';

  const visibleRingSize = isSelected ? '18px' : isHovered ? '16px' : '14px';
  const coreDotSize = isSelected ? '7px' : isHovered ? '6px' : '5px';

  return (
    <group position={hotspot.position}>
      <group ref={floatGroupRef}>
        {/* Subtle 3D Glowing Core Sphere attached to vehicle surface */}
        <mesh raycast={() => null}>
          <sphereGeometry args={[isSelected ? 0.026 : 0.018, 14, 14]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={isSelected ? 2.6 : isHovered ? 1.8 : 1.1}
          />
        </mesh>

        {/* Subtle 3D Pulsing Halo Sphere */}
        <mesh ref={pulseRingRef} raycast={() => null}>
          <sphereGeometry args={[0.038, 14, 14]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={isSelected ? 0.32 : isHovered ? 0.2 : 0.1}
            depthWrite={false}
          />
        </mesh>

        {/* Interactive 3D HTML Marker with 30x30px hit area and 14-18px visible ring */}
        <Html
          center
          zIndexRange={isSelected ? [85, 0] : isHovered ? [75, 0] : [45, 0]}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Subtle Hover / Active Mini Tooltip Pill */}
            {(isHovered || isSelected) && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '28px',
                  background: isSelected
                    ? 'rgba(0, 242, 254, 0.94)'
                    : 'rgba(6, 16, 32, 0.92)',
                  color: isSelected ? '#041325' : '#e0f2fe',
                  border: `1px solid ${
                    isSelected ? '#ffffff' : 'rgba(0, 242, 254, 0.7)'
                  }`,
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  boxShadow:
                    '0 4px 12px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 242, 254, 0.35)',
                  pointerEvents: 'none',
                }}
              >
                {hotspot.title}
              </div>
            )}

            {/* 30x30px Invisible Hit Area Button containing 14-18px Visible Luminous Ring */}
            <button
              type="button"
              data-ui-interactive="true"
              aria-label={`Khám phá bộ phận: ${hotspot.title} - ${
                hotspot.subtitle || hotspot.shortDescription
              }`}
              aria-pressed={isSelected}
              tabIndex={0}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(hotspot);
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                onHover(hotspot.id);
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                onHover(null);
              }}
              onFocus={() => onHover(hotspot.id)}
              onBlur={() => onHover(null)}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
              }}
            >
              <span
                style={{
                  width: visibleRingSize,
                  height: visibleRingSize,
                  borderRadius: '50%',
                  background: isSelected
                    ? 'radial-gradient(circle, rgba(0, 242, 254, 0.38) 0%, rgba(6, 18, 36, 0.88) 78%)'
                    : isHovered
                    ? 'radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(6, 18, 36, 0.82) 78%)'
                    : 'radial-gradient(circle, rgba(0, 242, 254, 0.16) 0%, rgba(6, 18, 36, 0.72) 80%)',
                  border: isSelected
                    ? '1.75px solid #00f2fe'
                    : isHovered
                    ? '1.5px solid #38bdf8'
                    : '1.25px solid rgba(0, 242, 254, 0.65)',
                  boxShadow: isSelected
                    ? '0 0 0 4px rgba(0, 242, 254, 0.22), 0 0 16px rgba(0, 242, 254, 0.85)'
                    : isHovered
                    ? '0 0 0 3px rgba(56, 189, 248, 0.16), 0 0 12px rgba(56, 189, 248, 0.6)'
                    : '0 0 8px rgba(0, 242, 254, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <span
                  style={{
                    width: coreDotSize,
                    height: coreDotSize,
                    borderRadius: '50%',
                    background: isSelected ? '#ffffff' : '#00f2fe',
                    boxShadow: isSelected
                      ? '0 0 8px #ffffff, 0 0 12px #00f2fe'
                      : '0 0 6px #00f2fe',
                  }}
                />
              </span>
            </button>
          </div>
        </Html>
      </group>
    </group>
  );
};

export const VehicleHotspotLayer: React.FC<VehicleHotspotLayerProps> = ({
  vehicle,
  vehicleCode,
}) => {
  const user = useAuthStore((state) => state.user);
  const isCoOwner = !user?.role || user?.role === 'CO_OWNER';

  // Strict Role Isolation: Educational exploration is strictly for CO_OWNER
  if (!isCoOwner) {
    return null;
  }

  const exploreHotspotsVisible = useWorldStore(
    (state) => state.exploreHotspotsVisible
  );
  const selectedVehiclePartId = useWorldStore(
    (state) => state.selectedVehiclePartId
  );
  const hoveredVehiclePartId = useWorldStore(
    (state) => state.hoveredVehiclePartId
  );
  const activePrimaryPanel = useWorldStore((state) => state.activePrimaryPanel);
  const isDamageDetailModalOpen = useWorldStore(
    (state) => state.isDamageDetailModalOpen
  );
  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);
  const hoverVehiclePart = useWorldStore((state) => state.hoverVehiclePart);
  const clearVehiclePartSelection = useWorldStore(
    (state) => state.clearVehiclePartSelection
  );

  const layerGroupRef = useRef<THREE.Group>(null);
  const connectorLineRef = useRef<SVGLineElement>(null);
  const connectorDotStartRef = useRef<SVGCircleElement>(null);
  const connectorDotEndRef = useRef<SVGCircleElement>(null);
  const cardWrapperRef = useRef<HTMLDivElement>(null);
  const projectedVecRef = useRef(new THREE.Vector3());

  // Track viewport size for responsive safe positioning
  const [viewport, setViewport] = useState<{ width: number; height: number }>(
    () => ({
      width: typeof window !== 'undefined' ? window.innerWidth : 1280,
      height: typeof window !== 'undefined' ? window.innerHeight : 800,
    })
  );

  useEffect(() => {
    const handleResize = () =>
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileViewport = viewport.width < 768;
  const isTabletViewport = viewport.width >= 768 && viewport.width < 1100;

  // Resolve model-aware 10-hotspot list
  const hotspots = useMemo(
    () => resolveVehicleHotspots(vehicle, vehicleCode),
    [vehicle, vehicleCode]
  );

  // Active selected hotspot item
  const activeHotspotIndex = useMemo(
    () => hotspots.findIndex((h) => h.id === selectedVehiclePartId),
    [hotspots, selectedVehiclePartId]
  );
  const activeHotspot =
    activeHotspotIndex >= 0 ? hotspots[activeHotspotIndex] : null;

  // Hide info card if a full-screen / conflicting business panel is open
  const canShowFloatingCard =
    Boolean(activeHotspot) &&
    !isDamageDetailModalOpen &&
    (activePrimaryPanel === 'NONE' || activePrimaryPanel === 'VEHICLE_DETAIL');

  const cardWidthPx = isTabletViewport ? 292 : 320;
  const safeCardLeft = 24;
  const safeCardTop = 92;

  // Project active 3D hotspot position to 2D screen space for subtle connector line & safe clamping
  useFrame(({ camera, size }) => {
    if (
      !canShowFloatingCard ||
      !activeHotspot ||
      isMobileViewport ||
      !layerGroupRef.current
    ) {
      return;
    }

    const vec = projectedVecRef.current.set(
      activeHotspot.position[0],
      activeHotspot.position[1],
      activeHotspot.position[2]
    );
    layerGroupRef.current.localToWorld(vec);
    vec.project(camera);

    const isBehindCamera = vec.z > 1;
    const hotspotX = (vec.x * 0.5 + 0.5) * size.width;
    const hotspotY = (-(vec.y * 0.5) + 0.5) * size.height;

    // Clamp card vertical position gently within safe upper-left / left-side viewport zone
    // so it NEVER overlaps top navigation bar (>= 88px) or bottom dock (<= height - 220px)
    // and NEVER covers the vehicle's main visible center body.
    const minTop = 88;
    const maxTop = Math.max(minTop, size.height - 230);
    const targetTop = Math.min(maxTop, Math.max(minTop, hotspotY - 68));

    if (cardWrapperRef.current) {
      cardWrapperRef.current.style.top = `${Math.round(targetTop)}px`;
    }

    const cardAnchorX = safeCardLeft + cardWidthPx;
    const cardAnchorY = Math.round(targetTop) + 52;

    if (
      connectorLineRef.current &&
      connectorDotStartRef.current &&
      connectorDotEndRef.current
    ) {
      if (isBehindCamera) {
        connectorLineRef.current.style.opacity = '0';
        connectorDotStartRef.current.style.opacity = '0';
        connectorDotEndRef.current.style.opacity = '0';
      } else {
        connectorLineRef.current.style.opacity = '1';
        connectorDotStartRef.current.style.opacity = '1';
        connectorDotEndRef.current.style.opacity = '1';

        connectorLineRef.current.setAttribute('x1', `${cardAnchorX}`);
        connectorLineRef.current.setAttribute('y1', `${cardAnchorY}`);
        connectorLineRef.current.setAttribute('x2', `${hotspotX}`);
        connectorLineRef.current.setAttribute('y2', `${hotspotY}`);

        connectorDotStartRef.current.setAttribute('cx', `${cardAnchorX}`);
        connectorDotStartRef.current.setAttribute('cy', `${cardAnchorY}`);
        connectorDotEndRef.current.setAttribute('cx', `${hotspotX}`);
        connectorDotEndRef.current.setAttribute('cy', `${hotspotY}`);
      }
    }
  });

  const handleSelectHotspot = (hotspot: VehicleHotspotItem) => {
    if (selectedVehiclePartId === hotspot.id) {
      clearVehiclePartSelection();
    } else {
      selectVehiclePart(hotspot.id);
    }
  };

  const handleStepHotspot = (delta: number) => {
    if (hotspots.length === 0) return;
    const currentIndex = activeHotspotIndex >= 0 ? activeHotspotIndex : 0;
    const nextIndex =
      (currentIndex + delta + hotspots.length) % hotspots.length;
    selectVehiclePart(hotspots[nextIndex].id);
  };

  return (
    <group ref={layerGroupRef} name="VehicleHotspotLayer3D">
      {/* 1. Render all 3D Glowing Hotspot Markers directly on the Vehicle */}
      {exploreHotspotsVisible &&
        hotspots.map((hotspot, idx) => (
          <SingleHotspotNode
            key={hotspot.id}
            hotspot={hotspot}
            index={idx}
            isSelected={selectedVehiclePartId === hotspot.id}
            isHovered={hoveredVehiclePartId === hotspot.id}
            onSelect={handleSelectHotspot}
            onHover={(id) => hoverVehiclePart(id)}
          />
        ))}

      {/* 2. Render Compact Floating Holographic Info Card in Safe Screen Space via Portal */}
      {canShowFloatingCard &&
        activeHotspot &&
        typeof document !== 'undefined' && (
          <Html style={{ display: 'none' }}>
            {createPortal(
              isMobileViewport ? (
                <div
                  data-ui-interactive="true"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    position: 'fixed',
                    bottom: '86px',
                    left: '12px',
                    right: '12px',
                    zIndex: 35,
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <HolographicHotspotInfoCard
                    key={activeHotspot.id}
                    hotspot={activeHotspot}
                    hotspotIndex={activeHotspotIndex}
                    totalHotspots={hotspots.length}
                    onClose={() => clearVehiclePartSelection()}
                    onStepHotspot={handleStepHotspot}
                    widthStyle="100%"
                  />
                </div>
              ) : (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 32,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle Holographic Connector Line from Side-Safe Card to Selected 3D Hotspot */}
                  <svg
                    width={viewport.width}
                    height={viewport.height}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      pointerEvents: 'none',
                      overflow: 'visible',
                    }}
                  >
                    <line
                      ref={connectorLineRef}
                      x1={safeCardLeft + cardWidthPx}
                      y1={safeCardTop + 52}
                      x2={viewport.width * 0.45}
                      y2={viewport.height * 0.5}
                      stroke="rgba(0, 242, 254, 0.48)"
                      strokeWidth="1.25"
                      strokeDasharray="4 4"
                    />
                    <circle
                      ref={connectorDotStartRef}
                      cx={safeCardLeft + cardWidthPx}
                      cy={safeCardTop + 52}
                      r="3"
                      fill="#00f2fe"
                    />
                    <circle
                      ref={connectorDotEndRef}
                      cx={viewport.width * 0.45}
                      cy={viewport.height * 0.5}
                      r="3.5"
                      fill="#00f2fe"
                    />
                  </svg>

                  {/* Side-Safe Compact Floating Holographic Info Card */}
                  <div
                    ref={cardWrapperRef}
                    style={{
                      position: 'fixed',
                      left: `${safeCardLeft}px`,
                      top: `${safeCardTop}px`,
                      pointerEvents: 'auto',
                    }}
                  >
                    <HolographicHotspotInfoCard
                      key={activeHotspot.id}
                      hotspot={activeHotspot}
                      hotspotIndex={activeHotspotIndex}
                      totalHotspots={hotspots.length}
                      onClose={() => clearVehiclePartSelection()}
                      onStepHotspot={handleStepHotspot}
                      widthStyle={`${cardWidthPx}px`}
                    />
                  </div>
                </div>
              ),
              document.body
            )}
          </Html>
        )}
    </group>
  );
};

export const CoOwnerVehicleExploration3D = VehicleHotspotLayer;
