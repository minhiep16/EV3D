import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { X } from 'lucide-react';
import { HologramProjectionBase3D } from './HologramProjectionBase3D';

export interface FeatureHologramPanel3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  panelW?: number;
  panelH?: number;
  distanceFactor?: number;
  contentWidth?: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  statusBadge?: React.ReactNode;
  headerExtra?: React.ReactNode;
  accentColor?: string;
  onClose?: () => void;
  visible?: boolean;
  testId?: string;
  children: React.ReactNode;
}

/**
 * FeatureHologramPanel3D:
 * Standardized 3D World-Space Holographic Frame Primitive for EVShare Showroom Features.
 * Extracted directly from the canonically approved Finance 3D Hologram implementation.
 * Encapsulates the entire multi-layered glass structure, emissive corner brackets,
 * floor projection base, and Drei HTML transform container.
 */
export const FeatureHologramPanel3D: React.FC<FeatureHologramPanel3DProps> = ({
  position = [6.5, 1.5, 2.80],
  rotation = [0, -0.1745, 0],
  panelW = 2.85,
  panelH = 4.20,
  distanceFactor = 3.25,
  contentWidth = '330px',
  title,
  subtitle,
  icon,
  statusBadge,
  headerExtra,
  accentColor = '#00f2fe',
  onClose,
  visible = true,
  testId,
  children,
}) => {
  const consoleFloatRef = useRef<THREE.Group>(null);
  const frameGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const hw = panelW / 2;
  const hh = panelH / 2;
  const bracketLen = 0.32;
  const bracketThick = 0.02;

  // Gentle hovering animation & edge emissive pulsation synchronized with showroom tempo
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

  if (!visible) return null;

  return (
    <group name="FeatureHologramPanelRoot" visible={visible}>
      {/* =========================================================================
          1. HOLOGRAPHIC PROJECTION BASE (FLOOR ANCHOR)
          Centered directly on showroom floor beneath this control panel
          ========================================================================= */}
      <HologramProjectionBase3D
        position={[position[0], 0.005, position[2]]}
        color={accentColor}
        visible={visible}
      />

      {/* =========================================================================
          2. MAIN WORLD-SPACE HOLOGRAPHIC CONSOLE
          Positioned on the right side and angled inward toward the showroom hero
          ========================================================================= */}
      <group position={position} rotation={rotation} visible={visible}>
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
              color={accentColor}
              wireframe
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh position={[0, 0, -0.042]} raycast={() => null}>
            <ringGeometry args={[1.05, 1.08, 32]} />
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
                  color={accentColor}
                  emissive={accentColor}
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, -bracketLen / 2, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
                <meshStandardMaterial
                  color={accentColor}
                  emissive={accentColor}
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
                  color={accentColor}
                  emissive={accentColor}
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, -bracketLen / 2, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
                <meshStandardMaterial
                  color={accentColor}
                  emissive={accentColor}
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
                  color={accentColor}
                  emissive={accentColor}
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, bracketLen / 2, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
                <meshStandardMaterial
                  color={accentColor}
                  emissive={accentColor}
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
                  color={accentColor}
                  emissive={accentColor}
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, bracketLen / 2, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
                <meshStandardMaterial
                  color={accentColor}
                  emissive={accentColor}
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
              <cylinderGeometry args={[0.018, 0.018, 0.06, 12]} />
              <meshStandardMaterial
                color={accentColor}
                emissive={accentColor}
                emissiveIntensity={2.2}
              />
            </mesh>

            {/* Bottom Projection Connector Node Lens */}
            <group position={[0, -hh - 0.045, 0.005]}>
              <mesh raycast={() => null}>
                <cylinderGeometry args={[0.08, 0.045, 0.08, 16]} />
                <meshStandardMaterial
                  color="#091628"
                  metalness={0.8}
                  roughness={0.2}
                  emissive={accentColor}
                  emissiveIntensity={0.5}
                />
              </mesh>
              <mesh position={[0, 0.025, 0]} raycast={() => null}>
                <torusGeometry args={[0.055, 0.01, 8, 16]} />
                <meshBasicMaterial color={accentColor} />
              </mesh>
            </group>
          </group>

          {/* -------------------------------------------------------------
              LAYER 4: MAIN FRONT INTERACTIVE GLASS CONSOLE (DREI HTML TRANSFORM)
              ------------------------------------------------------------- */}
          <Html
            transform
            distanceFactor={distanceFactor}
            position={[0, 0, 0.015]}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              data-testid={testId || 'feature-3d-hologram-panel'}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: contentWidth,
                background:
                  'linear-gradient(180deg, rgba(8, 22, 42, 0.90) 0%, rgba(4, 12, 26, 0.97) 100%)',
                backdropFilter: 'blur(26px)',
                WebkitBackdropFilter: 'blur(26px)',
                border: `2px solid ${accentColor}bf`,
                borderRadius: '28px',
                boxShadow: `0 28px 70px rgba(0, 0, 0, 0.85), 0 0 40px ${accentColor}66, inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 0 24px ${accentColor}24`,
                padding: '24px 26px',
                color: '#ffffff',
                fontFamily: "var(--font-family, 'Outfit', sans-serif)",
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                boxSizing: 'border-box',
              }}
            >
              {/* Standard Hologram Panel Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      background: `${accentColor}28`,
                      border: `2px solid ${accentColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 20px ${accentColor}73`,
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2
                        style={{
                          fontSize: '25px',
                          fontWeight: 800,
                          letterSpacing: '-0.01em',
                          color: '#ffffff',
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        {title}
                      </h2>
                      {statusBadge}
                    </div>
                    {subtitle && (
                      <p
                        style={{
                          fontSize: '12.5px',
                          color: '#94a3b8',
                          margin: '3px 0 0 0',
                          fontWeight: 500,
                        }}
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {headerExtra}

                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
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
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
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
                  )}
                </div>
              </div>

              {/* Dynamic Feature Body Content */}
              {children}
            </div>
          </Html>
        </group>
      </group>
    </group>
  );
};
