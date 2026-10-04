import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Bot, Sparkles, MessageSquare, Zap, Car, Compass } from 'lucide-react';
import { ZoneConfig } from '../../../config/garageZoneConfigs';
import { INTERACTION_CONFIG } from '../../../config/interactionConfig';
import { isRecentDragInteraction } from '../globalInteractionState';
import { useWorldStore } from '../../../store/worldStore';

interface AiAssistantInstallationProps {
  zone: ZoneConfig;
  isSelected: boolean;
  isHovered: boolean;
  isFinanceActive: boolean;
  isOtherZoneActive?: boolean;
  isVehicleFocused: boolean;
  isFocusedBusinessMode: boolean;
  onSelect: () => void;
  onClear: () => void;
}

export type EyeExpression = 'DEFAULT' | 'HAPPY' | 'CURIOUS' | 'THINKING' | 'CONFIDENT';

const aiPrompts = [
  'Bạn muốn hỏi gì?',
  'Hỏi tôi về xe, lịch đặt và chi phí...',
  'Tôi có thể tìm trạm sạc gần bạn.',
  'Cần kiểm tra pin hoặc lịch bảo dưỡng?',
  'Tôi có thể hỗ trợ kế hoạch chuyến đi.',
  'Hỏi tôi về hoạt động của xe.',
];

interface AiHologramHintCardProps {
  onSelect: () => void;
  isSelected?: boolean;
  isSubdued?: boolean;
}

/**
 * AiHologramHintCard:
 * Streamlined translucent holographic hint panel displaying soft typing rotating messages from `aiPrompts` (CÁCH 1).
 * Focused layout: Header identity + Large prominent dynamic prompt.
 * Sequence: Progressive type-in (~1.3s) -> Hold (2s) -> Smooth fade-out (~0.65s) -> Short pause (~0.3s) -> Next message.
 */
const AiHologramHintCard: React.FC<AiHologramHintCardProps> = ({
  onSelect,
  isSelected = false,
  isSubdued = false,
}) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState<'TYPING' | 'HOLDING' | 'FADING' | 'PAUSE'>('TYPING');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentText = aiPrompts[msgIndex];

    if (phase === 'TYPING') {
      if (charCount < currentText.length) {
        // Typing duration: ~1.2s - 1.6s based on string length
        const charInterval = Math.max(36, Math.floor(1350 / currentText.length));
        timer = setTimeout(() => {
          setCharCount((prev) => prev + 1);
        }, charInterval);
      } else {
        // Typing finished -> HOLD complete message for 2.0 seconds
        setPhase('HOLDING');
      }
    } else if (phase === 'HOLDING') {
      timer = setTimeout(() => {
        setPhase('FADING');
      }, 2000);
    } else if (phase === 'FADING') {
      timer = setTimeout(() => {
        setPhase('PAUSE');
      }, 650); // Smooth fade duration
    } else if (phase === 'PAUSE') {
      timer = setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % aiPrompts.length);
        setCharCount(0);
        setPhase('TYPING');
      }, 300); // Short pause before next message
    }

    return () => {
      clearTimeout(timer);
    };
  }, [msgIndex, charCount, phase]);

  return (
    <div
      data-ui-interactive="false"
      style={{
        width: '264px',
        background:
          'linear-gradient(135deg, rgba(6, 16, 32, 0.50) 0%, rgba(3, 9, 20, 0.58) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isSelected
          ? '1px solid rgba(0, 242, 254, 0.90)'
          : isSubdued
          ? '1px solid rgba(0, 242, 254, 0.35)'
          : '1px solid rgba(0, 242, 254, 0.60)',
        borderRadius: '16px',
        padding: '12px 16px',
        boxShadow:
          '0 8px 28px rgba(0, 0, 0, 0.45), 0 0 16px rgba(0, 242, 254, 0.22), inset 0 0 14px rgba(0, 242, 254, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        color: '#ffffff',
        fontFamily: "var(--font-family, 'Outfit', sans-serif)",
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: isSelected ? 0.95 : isSubdued ? 0.68 : 0.92,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Header: Glowing Bot Icon + Title + System Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'rgba(0, 242, 254, 0.18)',
            border: '1px solid #00f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 8px rgba(0, 242, 254, 0.4)',
          }}
        >
          <Bot size={14} color="#ffffff" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.07em',
              lineHeight: '1.2',
              textTransform: 'uppercase',
              textShadow: '0 0 12px rgba(0, 242, 254, 0.75)',
            }}
          >
            TRỢ LÝ AI
          </span>
          <span
            style={{
              color: '#7dd3fc',
              fontSize: '9.5px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              lineHeight: '1.2',
            }}
          >
            EVShare Intelligence
          </span>
        </div>
      </div>

      {/* Dynamic AI Prompt Area (Prominent, High Readability, Soft Typing Rotation CÁCH 1) */}
      <div
        style={{
          minHeight: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '6px',
          borderTop: '1px solid rgba(0, 242, 254, 0.18)',
        }}
      >
        <div
          style={{
            fontSize: '12.5px',
            color: '#e0f2fe',
            textAlign: 'center',
            letterSpacing: '0.015em',
            fontWeight: 600,
            lineHeight: '1.4',
            textShadow: '0 0 10px rgba(0, 242, 254, 0.45)',
            opacity: phase === 'FADING' || phase === 'PAUSE' ? 0 : 1,
            transition: phase === 'FADING' ? 'opacity 0.65s ease-out' : 'none',
          }}
        >
          <span>{aiPrompts[msgIndex].slice(0, charCount)}</span>
          {phase === 'TYPING' && (
            <span
              style={{
                color: '#00f2fe',
                fontWeight: 300,
                marginLeft: '1.5px',
                display: 'inline-block',
                textShadow: '0 0 8px #00f2fe',
                fontSize: '13px',
              }}
            >
              |
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * AiAssistantInstallation — Option 4 EVShare AI Assistant Orb:
 *
 * Faithfully recreated from the selected Option 4 reference:
 * - Compact floating spherical robot with premium white ceramic-polymer shell
 * - Glossy curved black front faceplate visor with cyan border rim
 * - TWO distinct robotic digital LED eyes with cyan glow & dark pupils
 * - Synchronized blinking every 2 seconds (OPEN -> CLOSING -> CLOSED -> OPENING -> OPEN)
 * - Small friendly cyan robotic smile mouth
 * - TWO symmetric outward-angled top antennas with glowing cyan loop tips
 * - Circular side EV modules with cyan luminous rings & dark center
 * - Thin luminous cyan & violet body accent seams
 * - Under-orb cyan floating projection ring & floor levitation glow pool
 * - Floating holographic speech bubble inspired by Option 4 ("Ask me anything about EVs!")
 * - Two-level interaction (Ambient showroom overview vs Active focused mode)
 * - Non-intrusive subdued mode when Finance Mode or Vehicle Detail is active
 */
export const AiAssistantInstallation: React.FC<AiAssistantInstallationProps> = ({
  zone,
  isSelected,
  isHovered,
  isFinanceActive,
  isOtherZoneActive = false,
  isVehicleFocused,
  isFocusedBusinessMode,
  onSelect,
  onClear,
}) => {
  // Procedural animation references
  const orbGroupRef = useRef<THREE.Group>(null);
  const leftEyeGroupRef = useRef<THREE.Group>(null);
  const rightEyeGroupRef = useRef<THREE.Group>(null);
  const leftEyeGlowRef = useRef<THREE.MeshBasicMaterial>(null);
  const rightEyeGlowRef = useRef<THREE.MeshBasicMaterial>(null);
  const antennaLeftTipRef = useRef<THREE.MeshBasicMaterial>(null);
  const antennaRightTipRef = useRef<THREE.MeshBasicMaterial>(null);
  const hoverRingRef = useRef<THREE.Mesh>(null);
  const floorPulseRef = useRef<THREE.MeshBasicMaterial>(null);

  // Holographic Projection Engine References (Finance-style Spatial Rings & Beam)
  const aiHoloOuterRingRef = useRef<THREE.Mesh>(null);
  const aiHoloMidRingRef = useRef<THREE.Mesh>(null);
  const aiHoloGimbalRingRef = useRef<THREE.Group>(null);
  const aiHoloAccRingRef = useRef<THREE.Mesh>(null);
  const aiHoloBeamRef = useRef<THREE.Mesh>(null);

  // Authoritative garage and vehicle focus state
  const activeFeature = useWorldStore((state) => state.activeFeature);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const isVehicleSelectedStore = useWorldStore((state) => state.isVehicleSelected);
  const selectedZone = useWorldStore((state) => state.selectedZone);

  // Authoritative vehicle focus state:
  const effectiveVehicleFocused =
    Boolean(isVehicleFocused) ||
    Boolean(selectedVehicleId) ||
    Boolean(isVehicleSelectedStore) ||
    selectedZone === 'VEHICLE';

  const isGarageOverview = activeFeature === 'NONE' && !effectiveVehicleFocused;
  const isAiActive = activeFeature === 'AI_ASSISTANT' || isSelected;

  // Positive allow-list condition: show ONLY in Garage Overview or when AI is Active
  const showAiHint = (isGarageOverview || isAiActive) && !isFocusedBusinessMode;

  // Subdued state: When Finance Mode, Analytics, Charging, other zones, or vehicle detail is active,
  // the AI orb remains present in the background but visually subdued to prevent distraction or overlap.
  const isSubdued = isFinanceActive || isOtherZoneActive || effectiveVehicleFocused;

  // Active expression: reacts to hover, selection, or default
  const expression: EyeExpression = useMemo(() => {
    if (isSelected) return 'CONFIDENT';
    if (isHovered) return 'HAPPY';
    return 'DEFAULT';
  }, [isSelected, isHovered]);

  // Frame animation loop: 60fps smooth procedural bobbing, swaying, and synchronized 2-second eye blink
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Idle Floating Bobbing & Subtle Swaying
    if (orbGroupRef.current) {
      if (isSubdued) {
        // Very slow, calm idle in background
        orbGroupRef.current.position.y = 1.24 + Math.sin(t * 0.8) * 0.015;
        orbGroupRef.current.rotation.y = Math.sin(t * 0.4) * 0.02;
        orbGroupRef.current.rotation.z = Math.cos(t * 0.3) * 0.008;
      } else if (isSelected) {
        // Energetic focused active state
        orbGroupRef.current.position.y = 1.32 + Math.sin(t * 2.2) * 0.035;
        orbGroupRef.current.rotation.y = Math.sin(t * 1.0) * 0.05;
        orbGroupRef.current.rotation.z = Math.cos(t * 0.8) * 0.015;
      } else {
        // Ambient default floating state (Option 4 signature gentle floating companion)
        orbGroupRef.current.position.y = 1.28 + Math.sin(t * 1.4) * 0.028;
        orbGroupRef.current.rotation.y = Math.sin(t * 0.6) * 0.04;
        orbGroupRef.current.rotation.z = Math.cos(t * 0.5) * 0.012;
      }
    }

    // 2. Synchronized Blink Every 2 Seconds (Strictly following Option 4 Blink Sequence):
    // Sequence: OPEN (0.0s) -> BLINKING/CLOSING (0.10s) -> CLOSED SLIT (0.18s) -> OPENING (0.28s) -> OPEN
    const cycle = t % 2.0;
    let eyeScaleY = 1.0;
    let eyeScaleX = 1.0;

    if (cycle < 0.10) {
      // Closing phase (100 ms)
      const p = cycle / 0.10;
      eyeScaleY = THREE.MathUtils.lerp(1.0, 0.08, p);
      eyeScaleX = THREE.MathUtils.lerp(1.0, 1.12, p);
    } else if (cycle < 0.19) {
      // Closed hold phase (90 ms): Eyes become narrow glowing curved cyan horizontal slits
      eyeScaleY = 0.08;
      eyeScaleX = 1.12;
    } else if (cycle < 0.28) {
      // Opening phase (90 ms)
      const p = (cycle - 0.19) / 0.09;
      eyeScaleY = THREE.MathUtils.lerp(0.08, 1.0, p);
      eyeScaleX = THREE.MathUtils.lerp(1.12, 1.0, p);
    } else {
      // Fully open phase (1.72s)
      eyeScaleY = 1.0;
      eyeScaleX = 1.0;
    }

    // Apply synchronized blink scale to both robotic eyes
    if (leftEyeGroupRef.current) {
      leftEyeGroupRef.current.scale.set(eyeScaleX, eyeScaleY, 1);
    }
    if (rightEyeGroupRef.current) {
      rightEyeGroupRef.current.scale.set(eyeScaleX, eyeScaleY, 1);
    }

    // 3. Hover Ring Procedure
    if (hoverRingRef.current) {
      hoverRingRef.current.rotation.z += delta * (isSelected ? 1.4 : isSubdued ? 0.3 : 0.65);
    }

    // 4. Floor Glow Pulse
    if (floorPulseRef.current) {
      const pulseSpeed = isSelected ? 3.0 : isSubdued ? 0.8 : 1.6;
      const baseOpacity = isSelected ? 0.6 : isSubdued ? 0.12 : 0.38;
      const amp = isSelected ? 0.15 : isSubdued ? 0.03 : 0.1;
      floorPulseRef.current.opacity = baseOpacity + Math.sin(t * pulseSpeed) * amp;
    }

    // 5. Antenna Tips Gentle Pulse
    if (antennaLeftTipRef.current && antennaRightTipRef.current) {
      const tipGlow = isSubdued
        ? 0.4
        : isSelected
        ? 0.95 + Math.sin(t * 3.5) * 0.05
        : 0.85 + Math.sin(t * 1.8) * 0.12;
      antennaLeftTipRef.current.opacity = tipGlow;
      antennaRightTipRef.current.opacity = tipGlow;
    }

    // 6. Finance-Style Holographic Projection Rings & Beam Procedural Animation
    if (aiHoloOuterRingRef.current) {
      aiHoloOuterRingRef.current.rotation.z += delta * (isSelected ? 0.40 : isSubdued ? 0.08 : 0.20);
    }
    if (aiHoloMidRingRef.current) {
      aiHoloMidRingRef.current.rotation.z -= delta * (isSelected ? 0.60 : isSubdued ? 0.12 : 0.32);
    }
    if (aiHoloGimbalRingRef.current) {
      aiHoloGimbalRingRef.current.rotation.y += delta * 0.42;
      aiHoloGimbalRingRef.current.rotation.z += delta * 0.24;
    }
    if (aiHoloAccRingRef.current) {
      aiHoloAccRingRef.current.rotation.z += delta * 0.50;
    }
    if (aiHoloBeamRef.current) {
      const mat = aiHoloBeamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (isSubdued ? 0.02 : isSelected ? 0.085 : 0.05) + Math.sin(t * 2.2) * 0.012;
      }
    }
  });

  // Direct 3D Left-Click Pointer Interaction
  const handleOrbClick = (e: ThreeEvent<MouseEvent>) => {
    // Strictly respect global click-vs-drag threshold
    if (e.delta > INTERACTION_CONFIG.clickDragThresholdPx || isRecentDragInteraction(e.delta)) {
      return;
    }
    if (e.nativeEvent && e.nativeEvent.button !== 0) {
      return;
    }
    e.stopPropagation();

    if (isFocusedBusinessMode) return;

    if (isSelected) {
      onClear();
    } else {
      onSelect();
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isFocusedBusinessMode) return;
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
  };


  return (
    <group position={[0, 0, 0]}>
      {/* =========================================================================
          1. SLEEK FLOOR LEVITATION PROJECTION RINGS (OPTION 4 ANCHOR)
          ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Low-profile dark brushed floor emitter plinth disc */}
        <mesh position={[0, 0.008, 0]} receiveShadow>
          <cylinderGeometry args={[0.32, 0.36, 0.016, 32]} />
          <meshStandardMaterial color="#081424" roughness={0.25} metalness={0.85} />
        </mesh>

        {/* Soft Floor Ambient Glow Pool */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 1.05, 48]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={isSubdued ? 0.03 : isSelected ? 0.22 : 0.08}
          />
        </mesh>

        {/* Outer Precision Concentric Floor Neon Ring */}
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.82, 0.845, 64]} />
          <meshBasicMaterial
            ref={floorPulseRef}
            color="#00f2fe"
            transparent
            opacity={isSubdued ? 0.12 : isSelected ? 0.75 : 0.42}
          />
        </mesh>

        {/* Inner Luminous Floor Projection Ring */}
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.54, 0.558, 64]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={isSubdued ? 0.1 : isSelected ? 0.65 : 0.35}
          />
        </mesh>

        {/* Floor Recessed LED Trim Ring on Plinth */}
        <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.24, 0.28, 32]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={isSubdued ? 0.25 : isSelected ? 0.95 : 0.7}
          />
        </mesh>

        {/* 4 Delicate Floor Crosshair / Alignment Ticks */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <mesh
            key={`ai-tick-${idx}`}
            position={[Math.cos(angle) * 0.87, 0.005, Math.sin(angle) * 0.87]}
            rotation={[-Math.PI / 2, 0, angle]}
          >
            <planeGeometry args={[0.065, 0.008]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={isSubdued ? 0.15 : isSelected ? 0.8 : 0.45}
            />
          </mesh>
        ))}
      </group>

      {/* =========================================================================
          2. VERTICAL HOLOGRAPHIC PROJECTION LIGHT COLUMN
          ========================================================================= */}
      <mesh position={[0, 0.64, 0]}>
        <cylinderGeometry args={[0.14, 0.30, 1.24, 32, 1, true]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={isSubdued ? 0.01 : isSelected ? 0.065 : 0.03}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* =========================================================================
          3. MAIN OPTION 4 AI ASSISTANT ORB ROBOT
          Hovering at y = 1.28m; fully interactive on click
          ========================================================================= */}
      <group
        ref={orbGroupRef}
        position={[0, 1.28, 0]}
        onClick={handleOrbClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Invisible enlarged hit-test collider for comfortable pointer interaction */}
        <mesh visible={false}>
          <sphereGeometry args={[0.75, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* -------------------------------------------------------------
            A. BODY SHELL: Premium Glossy White Ceramic-Polymer Sphere
            ------------------------------------------------------------- */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.54, 64, 48]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.14}
            metalness={0.15}
          />
        </mesh>

        {/* -------------------------------------------------------------
            B. CYAN + VIOLET ACCENT SEAMS (Option 4 Signature Lighting)
            Thin, elegant luminous cuts embedded into the spherical shell
            ------------------------------------------------------------- */}
        {/* Underside Horizontal Seam Curve (Cyan Glow) */}
        <group position={[0, -0.18, 0]} rotation={[0.2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.505, 0.005, 8, 48, Math.PI * 1.4]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={isSubdued ? 0.25 : isSelected ? 0.95 : 0.75}
            />
          </mesh>
        </group>

        {/* Bottom Underside Violet Accent Curve (Option 4 Signature Violet Glow) */}
        <group position={[0, -0.36, -0.05]} rotation={[-0.3, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.40, 0.006, 8, 36, Math.PI * 1.2]} />
            <meshBasicMaterial
              color="#a855f7"
              transparent
              opacity={isSubdued ? 0.2 : isSelected ? 0.9 : 0.65}
            />
          </mesh>
        </group>

        {/* Rear Panel Division Seam Line (Back View Reference Match) */}
        <group position={[0, 0, -0.535]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.18, 0.004, 8, 32]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={isSubdued ? 0.15 : isSelected ? 0.8 : 0.5}
            />
          </mesh>
        </group>

        {/* -------------------------------------------------------------
            C. FRONT BLACK FACEPLATE VISOR
            Curved glossy black glass visor embedded into the front sphere
            ------------------------------------------------------------- */}
        <group position={[0, 0.04, 0.22]}>
          {/* Cyan Visor Edge Light Border Frame */}
          <mesh position={[0, 0, 0.24]}>
            <boxGeometry args={[0.63, 0.39, 0.12]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={isSubdued ? 0.2 : isSelected ? 0.95 : 0.75}
            />
          </mesh>

          {/* Glossy Black Faceplate Glass Visor */}
          <mesh position={[0, 0, 0.255]}>
            <boxGeometry args={[0.61, 0.37, 0.13]} />
            <meshStandardMaterial
              color="#040814"
              roughness={0.06}
              metalness={0.92}
            />
          </mesh>

          {/* ---------------------------------------------------------
              D. TWO ROBOTIC DIGITAL EYES (Option 4 Critical Core Feature)
              --------------------------------------------------------- */}
          {/* LEFT ROBOTIC EYE */}
          <group ref={leftEyeGroupRef} position={[-0.155, 0.035, 0.325]}>
            {/* Outer Luminous Cyan LED Ring */}
            <mesh>
              <ringGeometry args={[0.078, 0.108, 32]} />
              <meshBasicMaterial
                ref={leftEyeGlowRef}
                color="#00f2fe"
                transparent
                opacity={isSubdued ? 0.35 : 0.98}
              />
            </mesh>

            {/* Inner Segmented Telemetry Guide Ring */}
            <mesh position={[0, 0, 0.002]}>
              <ringGeometry args={[0.066, 0.074, 32]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={isSubdued ? 0.25 : 0.85}
              />
            </mesh>

            {/* Dark Inner Pupil Base */}
            <mesh position={[0, 0, 0.001]}>
              <circleGeometry args={[0.064, 32]} />
              <meshBasicMaterial color="#050e1c" />
            </mesh>

            {/* Central Bright Cyan Pupil Spark */}
            <mesh position={[0, 0, 0.003]}>
              <circleGeometry args={[0.022, 16]} />
              <meshBasicMaterial color={isSelected ? '#ffffff' : '#00f2fe'} />
            </mesh>

            {/* Cardinal Digital Segment Accent Dots */}
            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, i) => (
              <mesh
                key={`leye-dot-${i}`}
                position={[Math.cos(ang) * 0.093, Math.sin(ang) * 0.093, 0.003]}
              >
                <circleGeometry args={[0.006, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>

          {/* RIGHT ROBOTIC EYE */}
          <group ref={rightEyeGroupRef} position={[0.155, 0.035, 0.325]}>
            {/* Outer Luminous Cyan LED Ring */}
            <mesh>
              <ringGeometry args={[0.078, 0.108, 32]} />
              <meshBasicMaterial
                ref={rightEyeGlowRef}
                color="#00f2fe"
                transparent
                opacity={isSubdued ? 0.35 : 0.98}
              />
            </mesh>

            {/* Inner Segmented Telemetry Guide Ring */}
            <mesh position={[0, 0, 0.002]}>
              <ringGeometry args={[0.066, 0.074, 32]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={isSubdued ? 0.25 : 0.85}
              />
            </mesh>

            {/* Dark Inner Pupil Base */}
            <mesh position={[0, 0, 0.001]}>
              <circleGeometry args={[0.064, 32]} />
              <meshBasicMaterial color="#050e1c" />
            </mesh>

            {/* Central Bright Cyan Pupil Spark */}
            <mesh position={[0, 0, 0.003]}>
              <circleGeometry args={[0.022, 16]} />
              <meshBasicMaterial color={isSelected ? '#ffffff' : '#00f2fe'} />
            </mesh>

            {/* Cardinal Digital Segment Accent Dots */}
            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, i) => (
              <mesh
                key={`reye-dot-${i}`}
                position={[Math.cos(ang) * 0.093, Math.sin(ang) * 0.093, 0.003]}
              >
                <circleGeometry args={[0.006, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>

          {/* ---------------------------------------------------------
              E. SMALL ROBOT MOUTH (Friendly Curved Cyan Smile Line)
              --------------------------------------------------------- */}
          <group position={[0, -0.095, 0.325]} rotation={[0, 0, -Math.PI * 0.85]}>
            <mesh>
              <torusGeometry args={[0.040, 0.0045, 8, 24, Math.PI * 0.7]} />
              <meshBasicMaterial
                color="#00f2fe"
                transparent
                opacity={isSubdued ? 0.3 : isSelected ? 1.0 : 0.85}
              />
            </mesh>
          </group>
        </group>

        {/* -------------------------------------------------------------
            F. CHIN BRAND INTEGRATION ("EVShare" Signature Decal)
            Exact match to Option 4 Brand Integration callout
            ------------------------------------------------------------- */}
        <group position={[0, -0.27, 0.465]} rotation={[-0.25, 0, 0]}>
          {/* Subtle glossy glass plate */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.26, 0.065]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.0} />
          </mesh>
          {/* Cyan "EV" emblem */}
          <mesh position={[-0.048, 0, 0.002]}>
            <planeGeometry args={[0.045, 0.026]} />
            <meshBasicMaterial color="#00f2fe" />
          </mesh>
          {/* Dark Navy "Share" wordmark plate */}
          <mesh position={[0.032, 0, 0.002]}>
            <planeGeometry args={[0.082, 0.024]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        </group>

        {/* -------------------------------------------------------------
            G. TWO TOP ANTENNAS (Option 4 Critical Feature)
            Symmetric left/right outward-angled stalks with cyan loop tips
            ------------------------------------------------------------- */}
        {/* LEFT ANTENNA */}
        <group position={[-0.26, 0.44, 0.04]} rotation={[-0.08, 0, 0.44]}>
          {/* Base Dark Collar */}
          <mesh position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.038, 0.044, 0.025, 16]} />
            <meshStandardMaterial color="#0b1320" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Main White Tapered Stalk Body */}
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.026, 0.032, 0.18, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.15} />
          </mesh>
          {/* Top Dark Accent Collar */}
          <mesh position={[0, 0.205, 0]}>
            <cylinderGeometry args={[0.027, 0.027, 0.02, 16]} />
            <meshStandardMaterial color="#0b1320" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Glowing Cyan Arched Loop Tip (Option 4 Antenna Detail Match) */}
          <group position={[0, 0.23, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <torusGeometry args={[0.040, 0.010, 12, 24, Math.PI]} />
              <meshBasicMaterial
                ref={antennaLeftTipRef}
                color="#00f2fe"
                transparent
                opacity={isSubdued ? 0.35 : 0.95}
              />
            </mesh>
          </group>
        </group>

        {/* RIGHT ANTENNA */}
        <group position={[0.26, 0.44, 0.04]} rotation={[-0.08, 0, -0.44]}>
          {/* Base Dark Collar */}
          <mesh position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.038, 0.044, 0.025, 16]} />
            <meshStandardMaterial color="#0b1320" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Main White Tapered Stalk Body */}
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.026, 0.032, 0.18, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.15} />
          </mesh>
          {/* Top Dark Accent Collar */}
          <mesh position={[0, 0.205, 0]}>
            <cylinderGeometry args={[0.027, 0.027, 0.02, 16]} />
            <meshStandardMaterial color="#0b1320" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Glowing Cyan Arched Loop Tip (Option 4 Antenna Detail Match) */}
          <group position={[0, 0.23, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <torusGeometry args={[0.040, 0.010, 12, 24, Math.PI]} />
              <meshBasicMaterial
                ref={antennaRightTipRef}
                color="#00f2fe"
                transparent
                opacity={isSubdued ? 0.35 : 0.95}
              />
            </mesh>
          </group>
        </group>

        {/* -------------------------------------------------------------
            H. SIDE CIRCULAR EV MODULES (Option 4 Signature Side Profile)
            ------------------------------------------------------------- */}
        {/* LEFT SIDE EV MODULE */}
        <group position={[-0.525, 0.02, 0]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Outer White Bevel Ring */}
          <mesh position={[0, 0, 0.008]}>
            <ringGeometry args={[0.155, 0.182, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.15} />
          </mesh>
          {/* Cyan Luminous Outer Neon Ring */}
          <mesh position={[0, 0, 0.012]}>
            <ringGeometry args={[0.138, 0.152, 32]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={isSubdued ? 0.3 : isSelected ? 1.0 : 0.8}
            />
          </mesh>
          {/* Glossy Dark Center Disc */}
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[0.136, 32]} />
            <meshStandardMaterial color="#051020" roughness={0.1} metalness={0.85} />
          </mesh>
          {/* "EV" Cyan Emblem Plate */}
          <mesh position={[0, 0, 0.015]}>
            <planeGeometry args={[0.10, 0.05]} />
            <meshBasicMaterial color="#00f2fe" />
          </mesh>
        </group>

        {/* RIGHT SIDE EV MODULE */}
        <group position={[0.525, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
          {/* Outer White Bevel Ring */}
          <mesh position={[0, 0, 0.008]}>
            <ringGeometry args={[0.155, 0.182, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.15} />
          </mesh>
          {/* Cyan Luminous Outer Neon Ring */}
          <mesh position={[0, 0, 0.012]}>
            <ringGeometry args={[0.138, 0.152, 32]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={isSubdued ? 0.3 : isSelected ? 1.0 : 0.8}
            />
          </mesh>
          {/* Glossy Dark Center Disc */}
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[0.136, 32]} />
            <meshStandardMaterial color="#051020" roughness={0.1} metalness={0.85} />
          </mesh>
          {/* "EV" Cyan Emblem Plate */}
          <mesh position={[0, 0, 0.015]}>
            <planeGeometry args={[0.10, 0.05]} />
            <meshBasicMaterial color="#00f2fe" />
          </mesh>
        </group>

        {/* -------------------------------------------------------------
            I. LOWER FLOATING LEVITATION RING (Option 4 Hover Support)
            ------------------------------------------------------------- */}
        <group ref={hoverRingRef} position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.30, 0.007, 12, 32]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={isSubdued ? 0.2 : isSelected ? 0.95 : 0.65}
            />
          </mesh>
        </group>

        {/* -------------------------------------------------------------
            J. SPATIAL HOLOGRAPHIC PROJECTION ENGINE (Finance-Style Rings & Beam)
            Visual origin: Top crown of AI robot (y = 0.54)
            Spans upward through mid-accelerator to frame upper hologram cluster
            ------------------------------------------------------------- */}
        {showAiHint && (
          <group position={[0, 0, 0]}>
            {/* 1. Projector Footprint & Aperture on Robot Crown (y = 0.54) */}
            <mesh position={[0, 0.54, 0]}>
              <cylinderGeometry args={[0.046, 0.052, 0.012, 24]} />
              <meshStandardMaterial color="#081424" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.544, 0]}>
              <sphereGeometry args={[0.018, 16, 16]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
            </mesh>
            <mesh position={[0, 0.547, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.025, 0.045, 32]} />
              <meshBasicMaterial
                color="#00f2fe"
                transparent
                opacity={0.85}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 2. Central Conical Projection Light Beam (Connecting Crown to Upper Hologram) */}
            {/* Extends from y = 0.54 to y = 1.64 (height: 1.10, center y = 1.09) */}
            <mesh ref={aiHoloBeamRef} position={[0, 1.09, 0]}>
              <cylinderGeometry args={[0.36, 0.042, 1.10, 32, 1, true]} />
              <meshBasicMaterial
                color="#00f2fe"
                transparent
                opacity={0.055}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {/* Core luminous beam filament */}
            <mesh position={[0, 1.09, 0]}>
              <cylinderGeometry args={[0.13, 0.018, 1.10, 16, 1, true]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.035}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* 3. Mid-Way Holographic Accelerator Ring (y = 1.06 in the clear air gap) */}
            <group position={[0, 1.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              {/* Outer Accelerator Ring */}
              <mesh>
                <ringGeometry args={[0.22, 0.232, 48]} />
                <meshBasicMaterial
                  color="#00f2fe"
                  transparent
                  opacity={0.55}
                  blending={THREE.AdditiveBlending}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
              {/* Segmented Fast Arc */}
              <mesh ref={aiHoloAccRingRef}>
                <ringGeometry args={[0.19, 0.202, 32, 1, 0, Math.PI * 1.4]} />
                <meshBasicMaterial
                  color="#38bdf8"
                  transparent
                  opacity={0.7}
                  blending={THREE.AdditiveBlending}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            </group>

            {/* 4. Ascending Guided Photonic Data Streamers */}
            {[0.2, 0.45, 0.7, 0.9].map((factor, i) => (
              <mesh
                key={`holo-stream-${i}`}
                position={[
                  Math.sin(factor * Math.PI * 2) * 0.04 * (1 - factor * 0.3),
                  0.58 + factor * (1.58 - 0.58),
                  Math.cos(factor * Math.PI * 2) * 0.04 * (1 - factor * 0.3),
                ]}
              >
                <sphereGeometry args={[0.006, 8, 8]} />
                <meshBasicMaterial
                  color={i % 2 === 0 ? '#ffffff' : '#00f2fe'}
                  transparent
                  opacity={0.8 - i * 0.12}
                />
              </mesh>
            ))}

            {/* 5. Upper Horizontal Projection Rings (y = 1.60, Framing the Floating Hologram) */}
            {/* Matches Finance Zone HologramCore3D architecture */}
            <group position={[0, 1.60, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              {/* Soft Ambient Cyan Halo Ring */}
              <mesh position={[0, 0, -0.002]}>
                <ringGeometry args={[0.54, 0.62, 64]} />
                <meshBasicMaterial
                  color="#00f2fe"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.15}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>

              {/* Main Outer Precision Holographic Orbit Ring */}
              <mesh ref={aiHoloOuterRingRef} position={[0, 0, 0]}>
                <ringGeometry args={[0.56, 0.574, 64]} />
                <meshBasicMaterial
                  color="#00f2fe"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.72}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>

              {/* Technical Segmented Arc Ring */}
              <mesh ref={aiHoloMidRingRef} position={[0, 0, 0.005]}>
                <ringGeometry args={[0.44, 0.456, 48, 1, 0, Math.PI * 1.55]} />
                <meshBasicMaterial
                  color="#38bdf8"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.65}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>

              {/* Inner Focus Ring */}
              <mesh position={[0, 0, 0.008]}>
                <ringGeometry args={[0.34, 0.352, 48]} />
                <meshBasicMaterial
                  color="#ffffff"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.4}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>

              {/* Cardinal Holographic Calibration Ticks (Finance Style) */}
              {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
                <mesh
                  key={`ai-holo-tick-${idx}`}
                  position={[Math.cos(angle) * 0.567, Math.sin(angle) * 0.567, 0.006]}
                  rotation={[0, 0, angle]}
                >
                  <planeGeometry args={[0.038, 0.006]} />
                  <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.75}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              ))}
            </group>

            {/* 6. Gyroscopic Tilted Orbit Ring (Finance Signature Hologram Gesture) */}
            <group ref={aiHoloGimbalRingRef} position={[0, 1.60, 0]} rotation={[0.28, 0, 0.18]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.42, 0.434, 48]} />
                <meshBasicMaterial
                  color="#00f2fe"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.42}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            </group>
          </group>
        )}

        {/* -------------------------------------------------------------
            K. LIGHTWEIGHT WORLD-SPACE HOLOGRAPHIC LABEL (ABOVE ROBOT)
            Positioned at y = 1.64m: Elevated comfortable clearance above antennas
            Framed by Finance-style concentric holographic projection rings
            Rotating soft typing dynamic hint message (CÁCH 1)
            ------------------------------------------------------------- */}
        {showAiHint && (
          <Html
            position={[0.0, 1.64, 0.02]}
            center
            distanceFactor={9.2}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <AiHologramHintCard onSelect={onSelect} isSelected={isSelected} isSubdued={isSubdued} />
          </Html>
        )}
      </group>
    </group>
  );
};
