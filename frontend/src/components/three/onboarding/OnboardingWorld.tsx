import React, { useRef, useMemo, useState, useEffect, Suspense, createContext, useContext } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { EV01_REALISTIC_MODEL_URL } from '../vehicles/vehicleModelConfig';
import { resolveVehicleColorHex } from '../../../config/vehicleColors';
import {
  VEHICLE_CATALOG,
  findCatalogEntryByModel,
  getCatalogEntryById,
  VehicleCatalogEntry,
} from '../../../data/vehicleCatalog';

// Default 3/4 front perspective rotation matching approved reference
const DEFAULT_ROTATION_Y = -Math.PI / 2 + 0.35;
const DEFAULT_ZOOM = 1.0;
const MIN_ZOOM = 0.82;
const MAX_ZOOM = 1.25;

// Showroom Auto-Rotation Constants (360° revolution in 60 seconds, 3000ms idle resume)
export const AUTO_ROTATION_SPEED = (Math.PI * 2) / 60;
export const IDLE_RESUME_DELAY_MS = 3000;

interface VehicleControlContextType {
  targetRotationY: React.MutableRefObject<number>;
  currentRotationY: React.MutableRefObject<number>;
  targetZoom: React.MutableRefObject<number>;
  currentZoom: React.MutableRefObject<number>;
  isInteracting: React.MutableRefObject<boolean>;
  isIdleReadyRef: React.MutableRefObject<boolean>;
  prefersReducedMotion: boolean;
  isWorkspace: boolean;
}

const VehicleControlContext = createContext<VehicleControlContextType | null>(null);

/**
 * Creates a bright, daylight panoramic texture for the large showroom curved windows
 * Depicting distant soft-blue mountain peaks and skyline under clear ice-blue daylight.
 */
function useDaylightPanoramicTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Daylight sky gradient: Ice blue to crisp white horizon
    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#d4ecfc');
    sky.addColorStop(0.5, '#e8f5fe');
    sky.addColorStop(0.85, '#f3faff');
    sky.addColorStop(1, '#ffffff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 512);

    // Distant subtle mountain skyline in pale misty blue
    ctx.fillStyle = 'rgba(164, 202, 230, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 340);
    ctx.lineTo(80, 260);
    ctx.lineTo(190, 310);
    ctx.lineTo(310, 220);
    ctx.lineTo(440, 290);
    ctx.lineTo(580, 210);
    ctx.lineTo(720, 280);
    ctx.lineTo(860, 225);
    ctx.lineTo(960, 280);
    ctx.lineTo(1024, 250);
    ctx.lineTo(1024, 512);
    ctx.lineTo(0, 512);
    ctx.closePath();
    ctx.fill();

    // Midground soft silhouette hills
    ctx.fillStyle = 'rgba(142, 185, 218, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, 380);
    ctx.lineTo(120, 300);
    ctx.lineTo(240, 335);
    ctx.lineTo(390, 275);
    ctx.lineTo(520, 330);
    ctx.lineTo(670, 265);
    ctx.lineTo(810, 320);
    ctx.lineTo(950, 285);
    ctx.lineTo(1024, 310);
    ctx.lineTo(1024, 512);
    ctx.lineTo(0, 512);
    ctx.closePath();
    ctx.fill();

    // Foreground showroom terrace ledge
    ctx.fillStyle = '#edf6fd';
    ctx.fillRect(0, 420, 1024, 92);

    // Architectural window mullions (vertical sleek white columns)
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = 'rgba(180, 215, 240, 0.6)';
    ctx.lineWidth = 1.5;
    const framePositions = [80, 235, 390, 545, 700, 855, 980];
    framePositions.forEach((x) => {
      ctx.fillRect(x - 4, 0, 8, 512);
      ctx.strokeRect(x - 4, 0, 8, 512);
    });

    // Horizontal window frame lines
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 415, 1024, 6);
    ctx.fillRect(0, 20, 1024, 6);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);
}

// Large Curved Floor-to-Ceiling Panoramic Window behind Vehicle
const CurvedShowroomWindow: React.FC = () => {
  const texture = useDaylightPanoramicTexture();
  const groupRef = useRef<THREE.Group>(null);
  const control = useContext(VehicleControlContext);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetX = control?.isWorkspace ? 0 : -0.5;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * Math.min(1, delta * 8);
  });

  return (
    <group ref={groupRef} position={[-0.5, 2.2, -2.6]}>
      {texture && (
        <mesh rotation={[0, -Math.PI * 0.16, 0]}>
          <cylinderGeometry args={[11, 11, 6.8, 64, 1, true, Math.PI * 0.44, Math.PI * 1.12]} />
          <meshBasicMaterial map={texture} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Top and Bottom architectural white framing rings */}
      <mesh rotation={[0, -Math.PI * 0.16, 0]} position={[0, 3.42, 0]}>
        <cylinderGeometry args={[10.98, 10.98, 0.08, 64, 1, true, Math.PI * 0.44, Math.PI * 1.12]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.2} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[0, -Math.PI * 0.16, 0]} position={[0, -3.42, 0]}>
        <cylinderGeometry args={[10.98, 10.98, 0.08, 64, 1, true, Math.PI * 0.44, Math.PI * 1.12]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.2} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

// Elegant Minimalist Ceiling Light Ring
const CeilingLightingRing: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const control = useContext(VehicleControlContext);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetX = control?.isWorkspace ? 0 : -0.5;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * Math.min(1, delta * 8);
  });

  return (
    <group ref={groupRef} position={[-0.5, 4.3, 0]}>
      {/* Sleek white structural casing */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[2.8, 2.95, 0.16, 64]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.25} />
      </mesh>

      {/* Primary Luminous Cyan/White Neon Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <torusGeometry args={[2.78, 0.04, 16, 64]} />
        <meshBasicMaterial color="#00e5f3" />
      </mesh>

      {/* Downward Key Spot and Soft Cyan Accent Light */}
      <spotLight
        position={[0, -0.2, 0]}
        intensity={2.2}
        color="#ffffff"
        angle={Math.PI / 3}
        penumbra={0.6}
        distance={9}
      />
      <pointLight position={[0, -0.2, 0]} intensity={1.5} color="#00c9d8" distance={7} />
    </group>
  );
};

// Circular Raised Showroom Stage with Balanced Proportions & Front "EVSHARE 3D" Nameplate
const ShowroomPedestal: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const control = useContext(VehicleControlContext);

  const badgeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark teal/cyan pill capsule matching reference screenshot
    ctx.fillStyle = '#072836';
    ctx.beginPath();
    ctx.roundRect(20, 24, 984, 208, 104);
    ctx.fill();

    // Vibrant cyan glowing border
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 10;
    ctx.shadowColor = 'rgba(0, 242, 254, 0.65)';
    ctx.shadowBlur = 18;
    ctx.stroke();

    // Crisp white bold typography
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 86px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EVSHARE 3D', 512, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetX = control?.isWorkspace ? 0 : -0.5;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * Math.min(1, delta * 8);
  });

  return (
    <group ref={groupRef} position={[-0.5, 0, 0]}>
      {/* Tier 1: Clean white/metallic base cylinder with balanced proportions */}
      <mesh position={[0, -0.09, 0]} receiveShadow>
        <cylinderGeometry args={[2.35, 2.5, 0.18, 64]} />
        <meshStandardMaterial color="#f4f9fd" metalness={0.25} roughness={0.2} />
      </mesh>

      {/* Top rim luminous cyan ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <torusGeometry args={[2.33, 0.03, 16, 64]} />
        <meshBasicMaterial color="#00c9d8" />
      </mesh>

      {/* Tier 2: Top disc with soft clearcoat reflection */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[2.18, 2.18, 0.06, 64]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.12}
          roughness={0.08}
          transmission={0.18}
          reflectivity={0.92}
        />
      </mesh>

      {/* Inner subtle cyan accent ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.062, 0]}>
        <ringGeometry args={[1.92, 1.98, 64]} />
        <meshBasicMaterial color="#00e5f3" side={THREE.DoubleSide} />
      </mesh>

      {/* Front Glowing "EVSHARE 3D" Nameplate (Proud of cylinder & tilted upward towards camera) */}
      {badgeTexture && (
        <mesh position={[0, 0.02, 2.42]} rotation={[-0.18, 0, 0]}>
          <planeGeometry args={[1.25, 0.32]} />
          <meshBasicMaterial map={badgeTexture} transparent={true} depthTest={true} depthWrite={false} />
        </mesh>
      )}

      {/* Bright Showroom Reflective Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.19, 0]} receiveShadow>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial color="#edf6fd" metalness={0.28} roughness={0.12} />
      </mesh>

      {/* Concentric soft cyan floor glow reflections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.188, 0]}>
        <ringGeometry args={[2.6, 3.0, 64]} />
        <meshBasicMaterial color="#00c9d8" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.186, 0]}>
        <ringGeometry args={[3.3, 3.7, 64]} />
        <meshBasicMaterial color="#00a0be" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// 3D Loading Fallback Indicator for Asynchronous Vehicle Model Swapping
const ModelLoadingIndicator: React.FC<{ modelName: string }> = ({ modelName }) => (
  <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
    <div
      style={{
        background: 'rgba(7, 24, 46, 0.90)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(0, 242, 254, 0.55)',
        borderRadius: '9999px',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#00f2fe',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 242, 254, 0.35)',
        whiteSpace: 'nowrap',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          border: '2px solid #00f2fe',
          borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.04em' }}>
        ĐANG TẢI 3D: {modelName.toUpperCase()}...
      </span>
    </div>
  </Html>
);

// Top-level HTML Error Boundary that prevents any 3D/WebGL error from crashing the Onboarding UI
export class ThreeCanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; isWorkspace?: boolean },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode; isWorkspace?: boolean }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Lỗi khởi tạo môi trường 3D',
    };
  }

  componentDidCatch(error: any, info: any) {
    console.warn('[Onboarding3D] WebGL / 3D Canvas error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: this.props.isWorkspace ? '42%' : '100%',
            height: '100%',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #EAF7FF 0%, #D8EEF8 100%)',
            padding: '32px 24px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: '380px',
              padding: '24px 28px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(0, 201, 216, 0.4)',
              boxShadow: '0 12px 36px rgba(0, 180, 200, 0.15)',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🚗</div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              Không thể tải mô hình xe 3D
            </div>
            <div
              style={{
                fontSize: '12.5px',
                color: '#475569',
                lineHeight: 1.55,
                marginBottom: '16px',
              }}
            >
              Bạn vẫn có thể tiếp tục đăng ký xe và sử dụng đầy đủ các tính năng nền tảng EVShare bình thường.
            </div>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: '1px solid rgba(0, 201, 216, 0.45)',
                background: 'rgba(0, 201, 216, 0.12)',
                color: '#009e9d',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Thử tải lại 3D
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Isolated Error Boundary for Robust Model Loading (Prevents App Crashing on Missing Assets)
class ModelErrorBoundary extends React.Component<
  { modelName: string; children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { modelName: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error?.message || 'Lỗi tải mô hình 3D' };
  }
  componentDidCatch(error: any) {
    console.warn(`[VehicleModel] Failed to load 3D model for ${this.props.modelName}:`, error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.18)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(239, 68, 68, 0.65)',
              borderRadius: '16px',
              padding: '12px 22px',
              textAlign: 'center',
              color: '#f87171',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 850, marginBottom: '4px' }}>
              KHÔNG THỂ TẢI MÔ HÌNH 3D
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
              Mô hình "{this.props.modelName}" tạm thời không khả dụng. Vui lòng chọn dòng xe khác.
            </div>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

// Inner Component that loads specific GLB and normalizes its transforms, bounds and PBR lacquer
interface VehicleModelLoaderProps {
  catalogEntry: VehicleCatalogEntry;
  exteriorColor?: string;
}

const VehicleModelLoader: React.FC<VehicleModelLoaderProps> = ({ catalogEntry, exteriorColor }) => {
  const gltf = useGLTF(catalogEntry.model3dUrl);

  // 1. Clone and normalize GLB geometry ONCE per model (independent of exterior paint color)
  const normalizedScene = useMemo(() => {
    if (!gltf || !gltf.scene) return null;

    let cloned: THREE.Object3D;
    try {
      cloned = gltf.scene.clone(true);
    } catch {
      return gltf.scene;
    }

    // Measure initial geometry bounds safely
    const initialBox = new THREE.Box3().setFromObject(cloned);
    const initialSize = new THREE.Vector3();
    initialBox.getSize(initialSize);

    // Compute normalization scale with strict finite bounds
    const maxHoriz = Math.max(
      Number.isFinite(initialSize.x) ? initialSize.x : 0,
      Number.isFinite(initialSize.z) ? initialSize.z : 0
    );
    const targetLen = catalogEntry.normalization?.targetLength || 4.3;
    const scaleMult = catalogEntry.normalization?.scaleMultiplier || 1.0;
    const baseScale =
      Number.isFinite(maxHoriz) && maxHoriz > 0.05
        ? (targetLen / maxHoriz) * scaleMult
        : 1.0;

    const root = new THREE.Group();
    root.add(cloned);

    // Normalization rotation
    if (catalogEntry.normalization?.rotationOffset) {
      cloned.rotation.x += catalogEntry.normalization.rotationOffset[0] || 0;
      cloned.rotation.y += catalogEntry.normalization.rotationOffset[1] || 0;
      cloned.rotation.z += catalogEntry.normalization.rotationOffset[2] || 0;
    } else if (
      Number.isFinite(initialSize.z) &&
      Number.isFinite(initialSize.x) &&
      initialSize.z > initialSize.x * 1.25
    ) {
      // Model modeled along Z, rotate 90 deg around Y so it faces uniformly 3/4 front
      cloned.rotation.y += Math.PI / 2;
    }

    if (Number.isFinite(baseScale) && baseScale > 0) {
      cloned.scale.setScalar(baseScale);
    }

    // Center horizontally and place tires on pedestal platform at y = 0.06
    const scaledBox = new THREE.Box3().setFromObject(cloned);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    cloned.position.x = Number.isFinite(scaledCenter.x) ? -scaledCenter.x : 0;
    cloned.position.z = Number.isFinite(scaledCenter.z) ? -scaledCenter.z : 0;
    const groundOffset = catalogEntry.normalization?.groundOffset || 0;
    const minY = Number.isFinite(scaledBox.min.y) ? scaledBox.min.y : 0;
    cloned.position.y = -minY + 0.06 + groundOffset;

    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return root;
  }, [gltf?.scene, catalogEntry]);

  // 2. Apply live exterior paint color in-place without re-cloning or resetting vehicle rotation
  useEffect(() => {
    if (!normalizedScene) return;

    const paintCustomizationSupported = catalogEntry.paintConfig?.supportsPaintCustomization ?? true;
    if (!paintCustomizationSupported) return;

    const paintHex = resolveVehicleColorHex(exteriorColor || catalogEntry.defaultColorHex || '#F8F9FA');

    const processSingleMaterial = (
      mat: THREE.Material | null | undefined,
      meshName: string
    ): THREE.Material | null | undefined => {
      if (!mat) return mat;
      const matName = mat.name || '';

      const isBodyMat =
        catalogEntry.paintConfig?.bodyMaterialNames?.some(
          (b) =>
            matName.toLowerCase() === b.toLowerCase() ||
            matName.toLowerCase().includes(b.toLowerCase())
        ) ||
        matName === 'primary' ||
        matName === 'primary.001' ||
        matName === 'primary.002' ||
        matName === 'Material.003' ||
        matName === 'Material.002' ||
        matName === 'Base' ||
        matName === 'Paint' ||
        matName === 'car_main_paint' ||
        matName === 'PD_VehiclePack_bodycolor' ||
        matName === 'CarPaint' ||
        matName === 'CarPaint_2' ||
        matName === 'M_CarPaint' ||
        matName === 'CP_CarPaint' ||
        matName === 'EXT_Body.001' ||
        matName === 'metallic_PRIMARY.001' ||
        matName === 'Rojo_Kings_wyf5mjqd' ||
        matName === 'Azul_Lapin_da7uzat6' ||
        matName === 'Gris_Ascot_laou1klg' ||
        matName === 'Desirefxme1471Mtl' ||
        matName === 'Desirefxme1470301Mtl' ||
        matName.toLowerCase().includes('paint') ||
        matName.toLowerCase().includes('bodycolor');

      const isBodyMesh =
        catalogEntry.paintConfig?.bodyMeshNames?.some((m) => meshName === m) ||
        meshName.includes('body_primary') ||
        meshName.includes('boot_primary') ||
        (meshName.includes('door_') && meshName.includes('primary')) ||
        meshName.includes('front_bumper_ok_primary') ||
        meshName.includes('rear_bumper_ok_primary') ||
        meshName.includes('bonnet_ok_primary') ||
        meshName.includes('Car Paint') ||
        meshName.includes('Car_Paint') ||
        meshName === 'Chassis_Body' ||
        meshName === 'Chassis_Nose' ||
        meshName === 'Object_20';

      const isProtectedMat =
        catalogEntry.paintConfig?.protectedMaterialNames?.some((p) => matName === p) ||
        matName === 'Material.006' ||
        matName === 'Material.011' ||
        matName === 'MA_tire_003.001' ||
        matName.toLowerCase().includes('glass') ||
        matName.toLowerCase().includes('window') ||
        matName.toLowerCase().includes('tire') ||
        matName.toLowerCase().includes('wheel') ||
        matName.toLowerCase().includes('rim') ||
        matName.toLowerCase().includes('brake') ||
        matName.toLowerCase().includes('light') ||
        matName.toLowerCase().includes('interior') ||
        matName.toLowerCase().includes('leather') ||
        matName.toLowerCase().includes('chrome') ||
        matName.toLowerCase().includes('trim') ||
        meshName.toLowerCase().includes('glass') ||
        meshName.toLowerCase().includes('window') ||
        meshName.toLowerCase().includes('tire') ||
        meshName.toLowerCase().includes('wheel') ||
        meshName.toLowerCase().includes('light') ||
        meshName.toLowerCase().includes('caliper');

      if ((isBodyMat || isBodyMesh) && !isProtectedMat) {
        if ((mat as any).userData?.__isEvSharePaintClone && 'color' in mat && (mat as any).color) {
          (mat as any).color.set(paintHex);
          mat.needsUpdate = true;
          return mat;
        }
        try {
          const clonedMat = mat.clone();
          clonedMat.name = matName;
          clonedMat.userData = { ...clonedMat.userData, __isEvSharePaintClone: true };
          if ('color' in clonedMat && (clonedMat as any).color) {
            (clonedMat as any).color.set(paintHex);
            if ('metalness' in clonedMat) (clonedMat as any).metalness = 0.38;
            if ('roughness' in clonedMat) (clonedMat as any).roughness = 0.28;
            if ('clearcoat' in clonedMat) (clonedMat as any).clearcoat = 0.85;
            if ('clearcoatRoughness' in clonedMat) (clonedMat as any).clearcoatRoughness = 0.12;
            clonedMat.needsUpdate = true;
            return clonedMat;
          }
        } catch {
          // Fallback if material clone is unsupported
        }
        const fallbackMat = new THREE.MeshPhysicalMaterial({
          name: matName,
          color: new THREE.Color(paintHex),
          metalness: 0.38,
          roughness: 0.28,
          clearcoat: 0.85,
          clearcoatRoughness: 0.12,
          reflectivity: 0.65,
          envMapIntensity: 0.45,
        });
        fallbackMat.userData = { __isEvSharePaintClone: true };
        return fallbackMat;
      }
      return mat;
    };

    normalizedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const meshName = mesh.name || '';
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(
              (m) => processSingleMaterial(m, meshName) || m
            );
          } else {
            mesh.material =
              processSingleMaterial(mesh.material, meshName) || mesh.material;
          }
        }
      }
    });
  }, [normalizedScene, catalogEntry, exteriorColor]);

  if (!normalizedScene) return null;

  return <primitive object={normalizedScene} position={[0, 0, 0]} />;
};

// Showcase Vehicle Coordinator with Dynamic Catalog Resolution & Showroom 360-Degree Auto-Rotation
const ShowcaseVehicle: React.FC<{
  selectedModel?: string;
  exteriorColor?: string;
}> = ({ selectedModel, exteriorColor }) => {
  const groupRef = useRef<THREE.Group>(null);
  const control = useContext(VehicleControlContext);

  const catalogEntry = useMemo(() => {
    return (
      findCatalogEntryByModel(selectedModel) ||
      getCatalogEntryById(selectedModel) ||
      VEHICLE_CATALOG[0]
    );
  }, [selectedModel]);

  useFrame((_, delta) => {
    if (!groupRef.current || !control) return;

    const dt = Math.min(delta, 0.1);

    // Smooth horizontal position interpolation between landing (x = -0.5) and workspace (x = 0)
    const targetX = control.isWorkspace ? 0 : -0.5;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * Math.min(1, dt * 8);

    // Continuous slow showroom auto-rotation around vertical Y axis when not interacting and idle timer ready
    if (
      !control.isInteracting.current &&
      !control.prefersReducedMotion &&
      control.isIdleReadyRef.current
    ) {
      control.targetRotationY.current += AUTO_ROTATION_SPEED * dt;
    }

    // Smooth inertia / damping for 360° rotation and zoom
    control.currentRotationY.current +=
      (control.targetRotationY.current - control.currentRotationY.current) *
      Math.min(1, dt * 12);

    control.currentZoom.current +=
      (control.targetZoom.current - control.currentZoom.current) *
      Math.min(1, dt * 10);

    groupRef.current.rotation.y = control.currentRotationY.current;
    groupRef.current.scale.setScalar(0.82 * control.currentZoom.current);
  });

  return (
    <group ref={groupRef} position={[-0.5, 0.15, 0]}>
      <ModelErrorBoundary key={catalogEntry.id} modelName={catalogEntry.displayName}>
        <Suspense fallback={<ModelLoadingIndicator modelName={catalogEntry.displayName} />}>
          <VehicleModelLoader catalogEntry={catalogEntry} exteriorColor={exteriorColor} />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
};

// Dedicated Camera Rig that smoothly adapts framing between Landing and Workspace modes
const CameraRig: React.FC<{ isWorkspace: boolean }> = ({ isWorkspace }) => {
  const { camera } = useThree();

  useFrame((_, delta) => {
    // In Landing mode: Wide composition with car at left-center
    // In Workspace mode: Centered tightly within the left 42% preview area (target width 65-72%)
    const targetCamX = isWorkspace ? 0 : -0.3;
    const targetCamY = isWorkspace ? 1.35 : 1.7;
    const targetCamZ = isWorkspace ? 7.2 : 7.8;
    const targetLookX = isWorkspace ? 0 : -0.4;
    const targetLookY = isWorkspace ? 0.28 : 0.45;

    camera.position.x += (targetCamX - camera.position.x) * Math.min(1, delta * 8);
    camera.position.y += (targetCamY - camera.position.y) * Math.min(1, delta * 8);
    camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, delta * 8);
    camera.lookAt(targetLookX, targetLookY, 0);
  });

  return null;
};

export interface OnboardingWorldProps {
  isWorkspace?: boolean;
  exteriorColor?: string;
  selectedModel?: string;
}

export const OnboardingWorld: React.FC<OnboardingWorldProps> = ({
  isWorkspace = false,
  exteriorColor,
  selectedModel,
}) => {
  // Shared authoritative rotation and zoom state refs
  const targetRotationY = useRef<number>(DEFAULT_ROTATION_Y);
  const currentRotationY = useRef<number>(DEFAULT_ROTATION_Y);
  const targetZoom = useRef<number>(DEFAULT_ZOOM);
  const currentZoom = useRef<number>(DEFAULT_ZOOM);
  const isInteracting = useRef<boolean>(false);
  const isIdleReadyRef = useRef<boolean>(true);
  const idleResumeTimerRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const lastPointerX = useRef<number>(0);

  // Detect OS prefers-reduced-motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Clean up any active drag or pending timer when switching vehicle models or unmounting
  useEffect(() => {
    isInteracting.current = false;
    setIsDragging(false);
    if (idleResumeTimerRef.current !== null) {
      window.clearTimeout(idleResumeTimerRef.current);
      idleResumeTimerRef.current = null;
    }
    isIdleReadyRef.current = true;
  }, [selectedModel]);

  useEffect(() => {
    return () => {
      if (idleResumeTimerRef.current !== null) {
        window.clearTimeout(idleResumeTimerRef.current);
        idleResumeTimerRef.current = null;
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (idleResumeTimerRef.current !== null) {
      window.clearTimeout(idleResumeTimerRef.current);
      idleResumeTimerRef.current = null;
    }
    isIdleReadyRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    isInteracting.current = true;
    setIsDragging(true);
    lastPointerX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteracting.current || !isDragging) return;
    const deltaX = e.clientX - lastPointerX.current;
    lastPointerX.current = e.clientX;

    // Sensitivity for smooth 360° rotation (radians per pixel)
    const sensitivity = 0.007;
    targetRotationY.current += deltaX * sensitivity;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer release errors
    }
    isInteracting.current = false;
    setIsDragging(false);

    if (idleResumeTimerRef.current !== null) {
      window.clearTimeout(idleResumeTimerRef.current);
    }
    // Resume slow showroom auto-rotation from current orientation after 3000ms of inactivity
    idleResumeTimerRef.current = window.setTimeout(() => {
      isIdleReadyRef.current = true;
      idleResumeTimerRef.current = null;
    }, IDLE_RESUME_DELAY_MS);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Controlled zoom limits
    const zoomDelta = -e.deltaY * 0.0008;
    targetZoom.current = THREE.MathUtils.clamp(
      targetZoom.current + zoomDelta,
      MIN_ZOOM,
      MAX_ZOOM
    );
  };

  const controlContextValue = useMemo(
    () => ({
      targetRotationY,
      currentRotationY,
      targetZoom,
      currentZoom,
      isInteracting,
      isIdleReadyRef,
      prefersReducedMotion,
      isWorkspace,
    }),
    [isWorkspace, prefersReducedMotion]
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: isWorkspace ? '42%' : '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'auto',
        transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      <ThreeCanvasErrorBoundary isWorkspace={isWorkspace}>
        <Canvas
          camera={{ position: [-0.3, 1.7, 7.8], fov: 38 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          style={{ width: '100%', height: '100%', background: '#EAF7FF' }}
        >
          <color attach="background" args={['#EAF7FF']} />
          <fog attach="fog" args={['#EAF7FF', 14, 32]} />

          {/* Crisp Showroom Daylight Lighting */}
          <ambientLight intensity={1.15} color="#e8f5ff" />
          <directionalLight position={[5, 9, 6]} intensity={1.6} color="#ffffff" castShadow />
          <directionalLight position={[-6, 6, -2]} intensity={0.9} color="#cceeff" />
          <pointLight position={[0, 0.25, 0]} intensity={1.5} color="#00c9d8" distance={6} />

          <Suspense fallback={null}>
            <VehicleControlContext.Provider value={controlContextValue}>
              <CameraRig isWorkspace={isWorkspace} />
              <CurvedShowroomWindow />
              <CeilingLightingRing />
              <ShowcaseVehicle exteriorColor={exteriorColor} selectedModel={selectedModel} />
              <ShowroomPedestal />
            </VehicleControlContext.Provider>
          </Suspense>
        </Canvas>
      </ThreeCanvasErrorBoundary>

      {/* Dedicated Interactive 360-Degree Rotation Overlay Zone (No visible buttons or toolbar) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{
          position: 'absolute',
          top: '70px',
          bottom: '56px',
          left: 0,
          right: 0,
          zIndex: 3,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      />
    </div>
  );
};
