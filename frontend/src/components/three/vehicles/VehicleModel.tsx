import React, { useMemo, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore, setTransientInspectionError } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import {
  resolveSemanticPartFromLocalPoint,
  isPointOnSemanticPart,
  SEMANTIC_HITBOX_DEFINITIONS,
} from '../../../data/vehicleParts';
import {
  createVehicleDoorVisualBinding,
  updateDoorAnimation,
} from './VehiclePartVisualBinding';
import {
  EV01_ARTICULATED_MODEL_URL,
  EV01_REALISTIC_MODEL_URL,
  EV01_FALLBACK_MODEL_URL,
  EV02_STYLIZED_MODEL_URL,
  getModelTransformConfig,
  resolveVehicleCode,
} from './vehicleModelConfig';
import { getVehicleAnchor } from '../../../config/vehicleCameraPresets';
import { INTERACTION_CONFIG } from '../../../config/interactionConfig';
import { globalInteractionState, isRecentDragInteraction } from '../globalInteractionState';

interface VehicleModelMeshProps {
  isSelected: boolean;
  isHovered: boolean;
  isDeEmphasized?: boolean;
  isBatteryXray?: boolean;
  modelUrl: string;
  onSelectVehicle?: () => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
}

/**
 * Inner mesh renderer for EV 3D GLB models.
 * Handles model loading, scene cloning, transform calibration, and PBR automotive material setup.
 */
const VehicleModelMesh: React.FC<VehicleModelMeshProps> = ({
  isSelected,
  isHovered,
  isDeEmphasized,
  isBatteryXray,
  modelUrl,
  onSelectVehicle,
  onPointerDown,
}) => {
  // Load 3D GLB model asset
  const gltf = useGLTF(modelUrl);

  const isLegacyModel = modelUrl.includes('ev-car.glb');
  const transformConfig = useMemo(() => getModelTransformConfig(modelUrl), [modelUrl]);

  // Clone scene so multiple instances don't cross-contaminate
  const clonedScene = useMemo(() => {
    const scene = gltf.scene.clone(true);
    // Apply calibrated model transforms
    scene.scale.set(...transformConfig.scale);
    scene.rotation.set(...transformConfig.rotation);
    scene.position.set(...transformConfig.offset);
    return scene;
  }, [gltf.scene, transformConfig]);

  // Cache original materials
  const originalMaterialsMap = useMemo(() => {
    const map = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        map.set(mesh, mesh.material);
      }
    });
    return map;
  }, [clonedScene]);

  // Visual appearance & PBR material tuning
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const originalMat = originalMaterialsMap.get(mesh);
        if (!originalMat) return;

        // Phase 16: 3D X-Ray Battery Health inspection mode
        if (isBatteryXray) {
          const isWheelOrTire =
            mesh.name.toLowerCase().includes('tire') ||
            mesh.name.toLowerCase().includes('wheel') ||
            mesh.name.toLowerCase().includes('rim') ||
            (originalMat as any).name === 'Material.011' ||
            (originalMat as any).name === 'MA_tire_003.001';

          const mat = (originalMat as THREE.Material).clone();
          if ('transparent' in mat) {
            (mat as any).transparent = true;
            (mat as any).depthWrite = false;
            if (isWheelOrTire) {
              // Preserve wheels and structural chassis silhouette for clear vehicle spatial context
              (mat as any).opacity = 0.42;
            } else {
              // Exterior vehicle body shell & glass: semi-transparent ghost shell
              (mat as any).opacity = 0.22;
              if ('color' in mat && 'emissive' in mat) {
                (mat as any).emissive = new THREE.Color('#00f2fe');
                (mat as any).emissiveIntensity = 0.05;
              }
            }
          }
          mesh.material = mat;
          return;
        }

        if (isDeEmphasized) {
          const mat = (originalMat as THREE.Material).clone();
          if ('transparent' in mat) {
            (mat as any).transparent = true;
            (mat as any).opacity = 0.52;
          }
          mesh.material = mat;
          return;
        }

        if (isLegacyModel) {
          // Legacy model fallback accents
          if (mesh.name === 'Headlight_Bar') {
            const intensity = isSelected ? 2.5 : isHovered ? 2.0 : 1.6;
            if ('emissiveIntensity' in (originalMat as THREE.MeshStandardMaterial)) {
              const mat = (originalMat as THREE.MeshStandardMaterial).clone();
              mat.emissiveIntensity = intensity;
              mesh.material = mat;
            }
          } else if (mesh.name === 'Chassis_Body' || mesh.name === 'Chassis_Nose') {
            if (isSelected) {
              const mat = (originalMat as THREE.MeshStandardMaterial).clone();
              mat.emissive = new THREE.Color('#00f2fe');
              mat.emissiveIntensity = 0.15;
              mesh.material = mat;
            } else if (isHovered) {
              const mat = (originalMat as THREE.MeshStandardMaterial).clone();
              mat.emissive = new THREE.Color('#38bdf8');
              mat.emissiveIntensity = 0.08;
              mesh.material = mat;
            } else {
              mesh.material = originalMat;
            }
          } else {
            mesh.material = originalMat;
          }
        } else {
          // Realistic EV GLB: Professional automotive PBR shading
          const mat = originalMat as THREE.MeshStandardMaterial;

          if (mat.name === 'Material.003') {
            // Main exterior car body shell: Luxury Automotive Metallic EV Blue Paint
            // Tuned PBR response: moderate metalness protects against diffuse washout, clearcoat gives rich gloss with contour depth
            const bodyMat = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#0284c7'), // Recognizable rich EV electric blue
              metalness: 0.46,                   // Moderate metalness eliminates chalky diffuse wash & retains body color
              roughness: 0.32,                   // Controlled gloss rolloff preventing harsh highlight clipping
              clearcoat: 0.82,                   // Premium automotive clearcoat layer
              clearcoatRoughness: 0.14,          // Soft clearcoat highlight spread across curves
              reflectivity: 0.58,                // Controlled Fresnel reflectance
              envMapIntensity: 0.42,             // Crisp, non-scorching IBL reflection
              emissive: new THREE.Color('#000000'),
              emissiveIntensity: 0,
            });
            mesh.material = bodyMat;
          } else if (mat.name === 'Material.006') {
            // Panoramic glass & windows: Smoked luxury automotive glass with readable subtle reflection
            const glassMat = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#0f172a'), // Smoked dark navy/slate glass (not crushed #000000)
              metalness: 0.10,
              roughness: 0.10,
              clearcoat: 0.88,
              clearcoatRoughness: 0.08,
              reflectivity: 0.72,
              envMapIntensity: 0.65,             // Subtle environment sky & frame reflection
            });
            mesh.material = glassMat;
          } else if (mat.name === 'Material.011') {
            // Wheel rims: Precision diamond-cut satin alloy with crisp metallic specular response
            const rimMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#cbd5e1'),
              metalness: 0.85,
              roughness: 0.22,
              envMapIntensity: 0.60,
            });
            mesh.material = rimMat;
          } else if (mat.name === 'MA_tire_003.001') {
            // Tires: Matte dark vulcanized rubber
            const tireMat = mat.clone();
            tireMat.color = new THREE.Color('#121214');
            tireMat.metalness = 0.02;
            tireMat.roughness = 0.94;
            mesh.material = tireMat;
          } else if (mat.name === 'Material.009') {
            // Headlights: Modern crisp white LED projector & lightguide
            const headMat = mat.clone();
            headMat.color = new THREE.Color('#ffffff');
            headMat.emissive = new THREE.Color('#ffffff');
            headMat.emissiveIntensity = isSelected ? 2.0 : isHovered ? 1.6 : 1.3;
            mesh.material = headMat;
          } else if (mat.name === 'Material.007') {
            // Taillights: Precision red LED dynamic taillight bar
            const tailMat = mat.clone();
            tailMat.color = new THREE.Color('#ef4444');
            tailMat.emissive = new THREE.Color('#ef4444');
            tailMat.emissiveIntensity = isSelected ? 1.8 : isHovered ? 1.5 : 1.2;
            mesh.material = tailMat;
          } else if (mat.name === 'PD_VehiclePack_bodycolor') {
            // EV02 Stylized Exterior Body Paint: Vibrant Golden Amber with interaction sheen
            const bodyMat = new THREE.MeshStandardMaterial();
            bodyMat.color = new THREE.Color(isSelected ? '#d97706' : isHovered ? '#f59e0b' : '#d97706');
            bodyMat.metalness = 0.18;
            bodyMat.roughness = 0.45;
            bodyMat.emissive = new THREE.Color('#000000');
            bodyMat.emissiveIntensity = 0;
            mesh.material = bodyMat;
          } else if (mat.name === 'PD_VehiclePack_MAT') {
            // EV02 Interior, glass, tires & trim: Clean dark slate PBR finish
            const trimMat = new THREE.MeshStandardMaterial();
            trimMat.color = new THREE.Color('#1e293b');
            trimMat.metalness = 0.15;
            trimMat.roughness = 0.60;
            trimMat.emissive = new THREE.Color('#000000');
            trimMat.emissiveIntensity = 0;
            mesh.material = trimMat;
          } else {
            // Generic vehicle trims: Clamp environment reflection to prevent blowout on untracked trim meshes
            if ('envMapIntensity' in (originalMat as any)) {
              const clone = (originalMat as THREE.Material).clone();
              (clone as any).envMapIntensity = 0.20;
              mesh.material = clone;
            } else {
              mesh.material = originalMat;
            }
          }
        }
      }
    });
  }, [clonedScene, originalMaterialsMap, isLegacyModel, isSelected, isHovered, isDeEmphasized, isBatteryXray]);

  const user = useAuthStore((state) => state.user);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const selectedVehiclePartCode = useWorldStore((state) => state.selectedVehiclePartCode);
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const selectVehiclePartCode = useWorldStore((state) => state.selectVehiclePartCode);
  const selectVehiclePartWithPoint = useWorldStore((state) => state.selectVehiclePartWithPoint);
  const setDraftDamage = useWorldStore((state) => state.setDraftDamage);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);

  // Initialize visual door bindings and hinge adapter
  const doorBindings = useMemo(() => createVehicleDoorVisualBinding(clonedScene), [clonedScene]);

  // Open doors on the currently selected vehicle when a part is selected during inspection or damage mapping
  const isDoorActive =
    (Boolean(vehicleDamageMappingMode) || Boolean(vehicleInspectionMode)) &&
    Boolean(selectedVehiclePartCode || selectedVehiclePartId) &&
    isSelected;
  const activeDoorPartCode = isDoorActive
    ? selectedVehiclePartCode || (selectedVehiclePartId as string | null)
    : null;

  // Animate door opening/closing smoothly if model supports separate door meshes
  useFrame((_, delta) => {
    updateDoorAnimation(doorBindings, activeDoorPartCode, delta);
  });

  // Passive click fallback: selects vehicle if clicked directly on visual geometry
  // In DAMAGE_MAPPING mode: allows selecting part or placing draft damage point
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Only accept left clicks (button === 0)
    if (e.button !== 0) return;
    // Prevent accidental selection during camera orbit/drag or vehicle turntable drag
    if (isRecentDragInteraction(e.delta)) return;

    if (vehicleDamageMappingMode || vehicleInspectionMode) {
      e.stopPropagation();

      // Convert world click point accurately to vehicle turntable-local coordinates
      const v = e.point.clone();
      let obj: THREE.Object3D | null = e.object;
      let turntableObj: THREE.Object3D | null = null;
      while (obj) {
        if (obj.name.includes('Turntable')) {
          turntableObj = obj;
          break;
        }
        obj = obj.parent;
      }

      if (turntableObj && 'worldToLocal' in turntableObj) {
        turntableObj.worldToLocal(v);
      } else if (clonedScene.parent && 'worldToLocal' in clonedScene.parent) {
        clonedScene.parent.worldToLocal(v);
      } else {
        const vehicleCode = resolveVehicleCode(modelUrl);
        const [vx, vy, vz] = getVehicleAnchor(user?.role, vehicleCode);
        v.sub(new THREE.Vector3(vx, vy, vz));
        const yaw = useWorldStore.getState().vehicleYaw;
        v.applyAxisAngle(new THREE.Vector3(0, 1, 0), -yaw);
      }

      const localPoint: [number, number, number] = [
        Number(v.x.toFixed(3)),
        Number(v.y.toFixed(3)),
        Number(v.z.toFixed(3)),
      ];

      // Authoritative single-click: atomically select part and exact 3D inspection coordinate
      const vehicleCode = resolveVehicleCode(modelUrl);
      const resolvedPart = resolveSemanticPartFromLocalPoint(localPoint, vehicleCode);
      selectVehiclePartWithPoint(resolvedPart, localPoint);
      return;
    }

    if (onSelectVehicle) {
      e.stopPropagation();
      onSelectVehicle();
    }
  };

  return (
    <primitive
      object={clonedScene}
      castShadow
      receiveShadow
      onPointerDown={onPointerDown}
      onClick={handleClick}
    />
  );
};

interface VehicleModelErrorBoundaryProps {
  activeUrl: string;
  fallbackUrl: string;
  children: React.ReactNode;
  onFallback: () => void;
}

class VehicleModelErrorBoundary extends React.Component<
  VehicleModelErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    if (
      this.props.activeUrl === EV01_REALISTIC_MODEL_URL ||
      this.props.activeUrl === EV01_ARTICULATED_MODEL_URL
    ) {
      console.warn('EV01 primary GLB failed to load; using fallback.', error);
    } else {
      console.warn(
        `VehicleModel failed to load 3D asset (${this.props.activeUrl}). Gracefully switching to fallback:`,
        error
      );
    }
    this.props.onFallback();
  }

  componentDidUpdate(prevProps: VehicleModelErrorBoundaryProps) {
    if (prevProps.activeUrl !== this.props.activeUrl && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

interface VehicleModelProps {
  isSelected: boolean;
  isHovered: boolean;
  isDeEmphasized?: boolean;
  isBatteryXray?: boolean;
  modelUrl?: string;
  onSelectVehicle?: () => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
}

/**
 * VehicleModel (Visual-First Component)
 *
 * Dedicated to loading, rendering, and shading the 3D EV vehicle asset.
 * Decoupled from semantic business logic (inspection, handover, check-in).
 * Gracefully falls back: articulated GLB -> realistic GLB -> legacy GLB.
 */
export const VehicleModel: React.FC<VehicleModelProps> = ({
  isSelected,
  isHovered,
  isDeEmphasized,
  isBatteryXray,
  modelUrl = EV01_REALISTIC_MODEL_URL,
  onSelectVehicle,
  onPointerDown,
}) => {
  const [activeModelUrl, setActiveModelUrl] = useState(modelUrl);

  useEffect(() => {
    setActiveModelUrl(modelUrl);
  }, [modelUrl]);

  const handleFallback = () => {
    // Preserve EV01 fallback chain; do NOT fallback EV02 to EV01 (Section 29)
    if (activeModelUrl.includes('ev02') || activeModelUrl.includes('stylized')) {
      return;
    }
    if (activeModelUrl === EV01_FALLBACK_MODEL_URL) {
      return;
    }
    if (activeModelUrl === EV01_ARTICULATED_MODEL_URL) {
      console.warn('EV01 primary GLB failed to load; using fallback.');
      setActiveModelUrl(EV01_REALISTIC_MODEL_URL);
    } else if (activeModelUrl === EV01_REALISTIC_MODEL_URL) {
      console.warn('EV01 primary GLB failed to load; using fallback.');
      setActiveModelUrl(EV01_FALLBACK_MODEL_URL);
    }
  };

  return (
    <VehicleModelErrorBoundary
      activeUrl={activeModelUrl}
      fallbackUrl={
        activeModelUrl.includes('ev02')
          ? EV02_STYLIZED_MODEL_URL
          : activeModelUrl === EV01_ARTICULATED_MODEL_URL
          ? EV01_REALISTIC_MODEL_URL
          : EV01_FALLBACK_MODEL_URL
      }
      onFallback={handleFallback}
    >
      <React.Suspense fallback={null}>
        <VehicleModelMesh
          key={activeModelUrl}
          isSelected={isSelected}
          isHovered={isHovered}
          isDeEmphasized={isDeEmphasized}
          isBatteryXray={isBatteryXray}
          modelUrl={activeModelUrl}
          onSelectVehicle={onSelectVehicle}
          onPointerDown={onPointerDown}
        />
      </React.Suspense>
    </VehicleModelErrorBoundary>
  );
};

// Preload proven models (realistic, stylized, and fallback)
useGLTF.preload(EV01_REALISTIC_MODEL_URL);
useGLTF.preload(EV02_STYLIZED_MODEL_URL);
useGLTF.preload(EV01_FALLBACK_MODEL_URL);
