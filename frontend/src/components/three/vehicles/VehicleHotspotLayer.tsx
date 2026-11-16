import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
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
  AlertTriangle,
} from 'lucide-react';
import { VehicleResponse } from '../../../types/vehicle';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { fetchActiveInspection } from '../../../services/inspectionApi';
import { DamageRecordData, DamageSeverity, DAMAGE_TYPE_LABELS } from '../../../types/damage';
import { VehicleInspectionResponse, InspectionItemCondition, resolveHotspotSemanticColor } from '../../../types/inspection';
import {
  resolveVehicleHotspots,
  VehicleHotspotItem,
  HotspotIconKey,
  DEFAULT_ROTATION_INTERVAL_MS,
  DEFAULT_TYPEWRITER_CHAR_MS,
} from '../../../data/vehicleHotspotConfig';
import {
  CANONICAL_VEHICLE_COMPONENTS,
  normalizeComponentId,
  resolveVehicleComponentAnchor,
  resolveVehicleCalloutOffset,
  resolveSeverityColor,
  resolveSeverityLabelVi,
  getSeverityRank,
  aggregateDamageHotspots,
  AggregatedDamageHotspot,
} from '../../../services/vehicleDamageMappingService';

export interface PreliminaryInspectionFinding {
  canonicalCode: string;
  componentNameVi: string;
  conditionStatus: InspectionItemCondition | string;
  conditionVi: string;
  note?: string;
  anchor: [number, number, number];
  inspectionId: string;
}

export function mapInspectionConditionToVi(condition?: string | null): string {
  switch (condition) {
    case 'SCRATCH':
      return 'Trầy xước';
    case 'DENT':
      return 'Móp méo';
    case 'CRACK':
      return 'Nứt vỡ';
    case 'OTHER_DAMAGE':
      return 'Hư hỏng khác';
    case 'GOOD':
      return 'Bình thường';
    default:
      return condition || 'Lưu ý kiểm tra';
  }
}

export function normalizeHotspotPartCode(raw?: string | null): string {
  const norm = normalizeComponentId(raw);
  return norm || (raw ? raw.trim().toUpperCase().replace(/[-\s]/g, '_') : '');
}

export function resolveDamageColor(severity?: DamageSeverity | string | null): string {
  return resolveSeverityColor(getSeverityRank(severity));
}

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
  const [isDocumentHidden, setIsDocumentHidden] = useState<boolean>(
    () => typeof document !== 'undefined' && document.hidden
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      setIsDocumentHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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
  const isEffectivePaused = isManualPaused || isHoverPaused || isFocusPaused || isDocumentHidden;

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
  aggregatedDamage?: AggregatedDamageHotspot | null;
  preliminaryFinding?: PreliminaryInspectionFinding | null;
  onSelect: (hotspot: VehicleHotspotItem) => void;
  onHover: (id: VehicleHotspotItem['id'] | null) => void;
}

/**
 * Refined, subtle 3D Hotspot Marker (Damage & Preliminary Finding Synchronized):
 * - Visible marker diameter: 14px default, 16px hover, 18px active
 * - Small glowing core dot (5-6px) + thin luminous ring
 * - When active confirmed damage is present: RED (#ef4444)
 * - When saved preliminary inspection finding awaiting confirmation: AMBER (#f59e0b)
 * - When clean or repaired: CYAN (#00f2fe)
 * - Comfortable invisible click target: 30px x 30px
 * - Only the active hotspot has stronger illumination
 */
const SingleHotspotNode: React.FC<SingleHotspotNodeProps> = ({
  hotspot,
  index,
  isSelected,
  isHovered,
  aggregatedDamage,
  preliminaryFinding,
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

  const hasDamage = Boolean(aggregatedDamage);
  const hasPreliminary = !hasDamage && Boolean(preliminaryFinding);

  // Authoritative defect condition (SCRATCH / DENT / CRACK / GOOD)
  const defectCondition = hasDamage
    ? (aggregatedDamage?.records?.[0]?.damageType || aggregatedDamage?.primaryConditionVi)
    : hasPreliminary
    ? preliminaryFinding?.conditionStatus
    : 'GOOD';

  // Centralized semantic color: SCRATCH -> #facc15 (Yellow), DENT -> #f97316 (Orange), CRACK -> #ef4444 (Red), GOOD -> #00f2fe (Cyan)
  const statusColor = resolveHotspotSemanticColor(defectCondition, true);
  const isUnderMaintenance = Boolean(aggregatedDamage?.isUnderMaintenance);

  const accentColor = isSelected
    ? '#ffffff'
    : statusColor;

  const recordCount = aggregatedDamage?.recordCount || 0;
  const visibleRingSize = isSelected ? '18px' : isHovered ? '16px' : '14px';
  const coreDotSize = isSelected ? '7px' : isHovered ? '6px' : '5px';

  return (
    <group position={hotspot.position}>
      <group ref={floatGroupRef}>
        {/* Subtle 3D Glowing Core Sphere attached to vehicle surface */}
        <mesh raycast={() => null}>
          <sphereGeometry args={[isSelected ? 0.026 : (hasDamage || hasPreliminary) ? 0.022 : 0.018, 14, 14]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={isSelected ? 2.8 : (hasDamage || hasPreliminary) ? 2.4 : isHovered ? 1.8 : 1.1}
          />
        </mesh>

        {/* Subtle 3D Pulsing Halo Sphere */}
        <mesh ref={pulseRingRef} raycast={() => null}>
          <sphereGeometry args={[(hasDamage || hasPreliminary) ? 0.046 : 0.038, 14, 14]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={isSelected ? 0.35 : (hasDamage || hasPreliminary) ? 0.28 : isHovered ? 0.2 : 0.1}
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
            {/* Subtle Hover / Active Mini Tooltip Pill — Strictly only on hover or active selection to prevent overlapping */}
            {(isHovered || isSelected) && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '28px',
                  background: isSelected
                    ? 'rgba(7, 20, 38, 0.98)'
                    : 'rgba(7, 20, 38, 0.92)',
                  color: '#ffffff',
                  border: `1.5px solid ${isSelected ? '#ffffff' : statusColor}`,
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.7), 0 0 10px ${statusColor}66`,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 100,
                }}
              >
                {(hasDamage || hasPreliminary) && (
                  <AlertTriangle size={10} color={statusColor} />
                )}
                <span>
                  {hotspot.title}
                  {hasDamage
                    ? ` • ${aggregatedDamage!.primaryConditionVi} (${isUnderMaintenance ? 'Đang sửa chữa' : 'Hư hỏng chưa xử lý'}${recordCount > 1 ? ` +${recordCount - 1}` : ''})`
                    : hasPreliminary
                    ? ` • ${preliminaryFinding!.conditionVi} (Phát hiện sơ bộ - Chờ xác nhận)`
                    : ' • Bình thường'}
                </span>
              </div>
            )}

            {/* 30x30px Invisible Hit Area Button containing 14-18px Visible Luminous Ring */}
            <button
              type="button"
              data-ui-interactive="true"
              aria-label={`Khám phá bộ phận: ${hotspot.title} - ${
                hotspot.subtitle || hotspot.shortDescription
              }${
                hasDamage
                  ? ` - Hư hỏng đã xác nhận: ${aggregatedDamage!.primaryConditionVi} (${recordCount} ghi nhận)`
                  : hasPreliminary
                  ? ` - Phát hiện sơ bộ: ${preliminaryFinding!.conditionVi} (Chờ xác nhận)`
                  : ''
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
                    ? `radial-gradient(circle, ${statusColor}66 0%, rgba(6, 18, 36, 0.92) 78%)`
                    : `radial-gradient(circle, ${statusColor}33 0%, rgba(6, 18, 36, 0.8) 80%)`,
                  border: hasPreliminary
                    ? `1.75px dashed ${isSelected ? '#ffffff' : statusColor}`
                    : hasDamage
                    ? `1.75px solid ${isSelected ? '#ffffff' : statusColor}`
                    : isSelected
                    ? '1.75px solid #ffffff'
                    : isHovered
                    ? `1.5px solid ${statusColor}`
                    : `1.25px solid ${statusColor}aa`,
                  boxShadow: isSelected
                    ? `0 0 0 4px ${statusColor}44, 0 0 16px ${statusColor}`
                    : isHovered
                    ? `0 0 0 3px ${statusColor}33, 0 0 12px ${statusColor}aa`
                    : `0 0 8px ${statusColor}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    width: coreDotSize,
                    height: coreDotSize,
                    borderRadius: '50%',
                    background: accentColor,
                    boxShadow: `0 0 8px ${statusColor}`,
                  }}
                />
                {/* Damage / preliminary finding mini badge */}
                {(hasDamage || hasPreliminary) && !isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      minWidth: '10px',
                      height: '10px',
                      padding: recordCount > 1 ? '0 2px' : 0,
                      borderRadius: '5px',
                      background: hasDamage ? '#ef4444' : '#f59e0b',
                      border: '1px solid #ffffff',
                      boxShadow: `0 0 4px ${statusColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '7px',
                      fontWeight: 900,
                      color: '#ffffff',
                      lineHeight: 1,
                    }}
                  >
                    {hasDamage && recordCount > 1 ? recordCount : '!'}
                  </span>
                )}
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
  const isAuthorized = !user?.role || user?.role === 'CO_OWNER' || user?.role === 'ADMIN';

  // Role Authorization: 3D component exploration is available for CO_OWNER and ADMIN
  if (!isAuthorized) {
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
  const selectVehiclePartCode = useWorldStore((state) => state.selectVehiclePartCode);
  const hoverVehiclePart = useWorldStore((state) => state.hoverVehiclePart);
  const clearVehiclePartSelection = useWorldStore(
    (state) => state.clearVehiclePartSelection
  );

  // Authoritative vehicle damage records query for CO_OWNER 3D exploration
  const { data: damages = [] } = useQuery<DamageRecordData[]>({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => (vehicle?.id ? fetchVehicleDamages(vehicle.id) : Promise.resolve([])),
    enabled: Boolean(vehicle?.id),
    staleTime: 5000,
    refetchInterval: 5000,
  });

  // Filter active, unresolved damages (respect repair status: resolved damages return to normal)
  const unresolvedDamages = useMemo(() => {
    return damages.filter(
      (d) => d.status !== 'RESOLVED' && (d.status as string) !== 'REPAIRED'
    );
  }, [damages]);

  // Authoritative active inspection query for the active vehicle to observe preliminary findings
  const { data: activeInspection } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['activeInspection', vehicle?.id],
    queryFn: () => (vehicle?.id ? fetchActiveInspection(vehicle.id) : Promise.resolve(null)),
    enabled: Boolean(vehicle?.id),
    staleTime: 4000,
    refetchInterval: 5000,
  });

  const preliminaryFindingsMap = useMemo(() => {
    const map = new Map<string, PreliminaryInspectionFinding>();
    if (!activeInspection?.items || !Array.isArray(activeInspection.items)) {
      return map;
    }

    for (const item of activeInspection.items) {
      if (!item.conditionStatus || item.conditionStatus === 'GOOD') {
        continue;
      }
      const canonicalCode = normalizeComponentId(item.vehiclePartCode) || item.vehiclePartCode;
      const componentMeta = CANONICAL_VEHICLE_COMPONENTS[canonicalCode as any];
      const componentNameVi = componentMeta?.nameVi || item.vehiclePartCode;
      const anchor = resolveVehicleComponentAnchor(vehicle, canonicalCode) || [0, 0.7, 0];

      map.set(canonicalCode, {
        canonicalCode,
        componentNameVi,
        conditionStatus: item.conditionStatus,
        conditionVi: mapInspectionConditionToVi(item.conditionStatus),
        note: item.note,
        anchor: [anchor[0], anchor[1], anchor[2]],
        inspectionId: item.inspectionId || activeInspection.id,
      });
    }

    return map;
  }, [activeInspection, vehicle]);

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

  // Resolve base model-aware hotspots
  const baseHotspots = useMemo(
    () => resolveVehicleHotspots(vehicle, vehicleCode),
    [vehicle, vehicleCode]
  );

  // Aggregate unresolved damages across components using centralized architecture
  const aggregatedDamages = useMemo(
    () => aggregateDamageHotspots(vehicle, unresolvedDamages),
    [vehicle, unresolvedDamages]
  );

  const aggregatedDamageMap = useMemo(() => {
    const map = new Map<string, AggregatedDamageHotspot>();
    for (const agg of aggregatedDamages) {
      map.set(agg.componentId, agg);
    }
    return map;
  }, [aggregatedDamages]);

  // Combine base educational hotspots with dynamically mapped damage hotspots and preliminary findings
  const hotspots = useMemo(() => {
    const list: VehicleHotspotItem[] = [];
    const presentIds = new Set<string>();

    for (const b of baseHotspots) {
      const canonicalId = normalizeComponentId(b.id) || b.id;
      const agg = aggregatedDamageMap.get(canonicalId);
      const prel = preliminaryFindingsMap.get(canonicalId);

      if (agg) {
        list.push({
          ...b,
          subtitle: `Hư hỏng đã xác nhận: ${agg.primaryConditionVi}`,
          infoFrames: [
            {
              label: 'Tình trạng',
              value: `${agg.primaryConditionVi} (Đã xác nhận)`,
              text: `Tình trạng: ${agg.primaryConditionVi} (Đã xác nhận)`,
            },
            {
              label: 'Mức độ',
              value: resolveSeverityLabelVi(agg.highestSeverity),
              text: `Mức độ: ${resolveSeverityLabelVi(agg.highestSeverity)}`,
            },
            {
              label: 'Số lượng ghi nhận',
              value: `${agg.recordCount} sự cố`,
              text: `Số lượng ghi nhận: ${agg.recordCount} sự cố`,
            },
            ...(b.infoFrames || []),
          ],
        });
      } else if (prel) {
        list.push({
          ...b,
          subtitle: `Phát hiện sơ bộ: ${prel.conditionVi} (Chờ xác nhận)`,
          infoFrames: [
            {
              label: 'Phát hiện sơ bộ',
              value: `${prel.conditionVi} (Chờ xác nhận)`,
              text: `Phát hiện sơ bộ: ${prel.conditionVi} (Chờ xác nhận)`,
            },
            {
              label: 'Trạng thái',
              value: 'Đang kiểm tra - Chờ hoàn tất biên bản',
              text: 'Trạng thái: Đang kiểm tra - Chờ hoàn tất biên bản',
            },
            ...(prel.note ? [{
              label: 'Ghi chú kiểm tra',
              value: prel.note,
              text: `Ghi chú kiểm tra: ${prel.note}`,
            }] : []),
            ...(b.infoFrames || []),
          ],
        });
      } else {
        list.push(b);
      }
      presentIds.add(canonicalId);
    }

    // Synthesize confirmed damage components not in baseHotspots
    for (const agg of aggregatedDamages) {
      if (!presentIds.has(agg.componentId)) {
        list.push({
          id: agg.componentId as any,
          title: agg.componentNameVi,
          subtitle: `Hư hỏng đã xác nhận: ${agg.primaryConditionVi}`,
          shortDescription: `Phát hiện ${agg.recordCount} điểm bất thường tại ${agg.componentNameVi}. Mức độ: ${agg.highestSeverity}.`,
          position: agg.anchor,
          calloutOffset: resolveVehicleCalloutOffset(vehicle, agg.componentId),
          icon: 'shield',
          infoFrames: [
            {
              label: 'Tình trạng',
              value: `${agg.primaryConditionVi} (Đã xác nhận)`,
              text: `Tình trạng: ${agg.primaryConditionVi} (Đã xác nhận)`,
            },
            {
              label: 'Mức độ',
              value: resolveSeverityLabelVi(agg.highestSeverity),
              text: `Mức độ: ${resolveSeverityLabelVi(agg.highestSeverity)}`,
            },
            {
              label: 'Số lượng ghi nhận',
              value: `${agg.recordCount} sự cố đang chờ xử lý`,
              text: `Số lượng ghi nhận: ${agg.recordCount} sự cố đang chờ xử lý`,
            },
            {
              label: 'Mã linh kiện',
              value: agg.componentId,
              text: `Mã linh kiện: ${agg.componentId}`,
            },
          ],
        });
        presentIds.add(agg.componentId);
      }
    }

    // Synthesize preliminary findings not in baseHotspots and not in aggregatedDamages
    for (const [canonicalId, prel] of preliminaryFindingsMap.entries()) {
      if (!presentIds.has(canonicalId)) {
        list.push({
          id: canonicalId as any,
          title: prel.componentNameVi,
          subtitle: `Phát hiện sơ bộ: ${prel.conditionVi} (Chờ xác nhận)`,
          shortDescription: `Đang có đánh giá sơ bộ chờ xác nhận tại ${prel.componentNameVi}. Tình trạng: ${prel.conditionVi}.`,
          position: prel.anchor,
          calloutOffset: resolveVehicleCalloutOffset(vehicle, canonicalId),
          icon: 'shield',
          infoFrames: [
            {
              label: 'Phát hiện sơ bộ',
              value: `${prel.conditionVi} (Chờ xác nhận)`,
              text: `Phát hiện sơ bộ: ${prel.conditionVi} (Chờ xác nhận)`,
            },
            {
              label: 'Trạng thái',
              value: 'Đang kiểm tra - Chờ hoàn tất biên bản',
              text: 'Trạng thái: Đang kiểm tra - Chờ hoàn tất biên bản',
            },
            ...(prel.note ? [{
              label: 'Ghi chú kiểm tra',
              value: prel.note,
              text: `Ghi chú kiểm tra: ${prel.note}`,
            }] : []),
            {
              label: 'Mã linh kiện',
              value: canonicalId,
              text: `Mã linh kiện: ${canonicalId}`,
            },
          ],
        });
        presentIds.add(canonicalId);
      }
    }

    return list;
  }, [baseHotspots, aggregatedDamageMap, aggregatedDamages, preliminaryFindingsMap, vehicle]);

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
      selectVehiclePartCode(hotspot.id);
    }
  };

  const handleStepHotspot = (delta: number) => {
    if (hotspots.length === 0) return;
    const currentIndex = activeHotspotIndex >= 0 ? activeHotspotIndex : 0;
    const nextIndex =
      (currentIndex + delta + hotspots.length) % hotspots.length;
    selectVehiclePart(hotspots[nextIndex].id);
    selectVehiclePartCode(hotspots[nextIndex].id);
  };

  return (
    <group ref={layerGroupRef} name="VehicleHotspotLayer3D">
      {/* 1. Render all 3D Glowing Hotspot Markers directly on the Vehicle */}
      {exploreHotspotsVisible &&
        hotspots.map((hotspot, idx) => {
          const canonicalId = normalizeComponentId(hotspot.id) || hotspot.id;
          const aggDamage = canonicalId ? aggregatedDamageMap.get(canonicalId) || null : null;
          const prelFinding = canonicalId ? preliminaryFindingsMap.get(canonicalId) || null : null;
          return (
            <SingleHotspotNode
              key={hotspot.id}
              hotspot={hotspot}
              index={idx}
              isSelected={selectedVehiclePartId === hotspot.id}
              isHovered={hoveredVehiclePartId === hotspot.id}
              aggregatedDamage={aggDamage}
              preliminaryFinding={prelFinding}
              onSelect={handleSelectHotspot}
              onHover={(id) => hoverVehiclePart(id)}
            />
          );
        })}

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
