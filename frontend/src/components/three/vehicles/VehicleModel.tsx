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
import { resolveVehicleColorHex } from '../../../config/vehicleColors';
import { getVehicleAnchor } from '../../../config/vehicleCameraPresets';
import { INTERACTION_CONFIG } from '../../../config/interactionConfig';
import { globalInteractionState, isRecentDragInteraction } from '../globalInteractionState';

interface VehicleModelMeshProps {
  isSelected: boolean;
  isHovered: boolean;
  isDeEmphasized?: boolean;
  isBatteryXray?: boolean;
  modelUrl: string;
  exteriorColor?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  disableRaycast?: boolean;
  disableDoorAnimation?: boolean;
  onSelectVehicle?: () => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
}

/**
 * Inner mesh renderer for EV 3D GLB models.
 * Handles model loading, scene cloning, transform calibration, and PBR automotive material setup.
 */
const VehicleModelMeshComponent: React.FC<VehicleModelMeshProps> = ({
  isSelected,
  isHovered,
  isDeEmphasized,
  isBatteryXray,
  modelUrl,
  exteriorColor,
  castShadow = true,
  receiveShadow = true,
  disableRaycast = false,
  disableDoorAnimation = false,
  onSelectVehicle,
  onPointerDown,
}) => {
  // Load 3D GLB model asset
  const gltf = useGLTF(modelUrl);

  const isLegacyModel = modelUrl.includes('ev-car.glb');
  const transformConfig = useMemo(() => getModelTransformConfig(modelUrl), [modelUrl]);

  // Clone scene and configure automotive PBR materials ONCE per asset/color combination
  const { clonedScene, dynamicMaterials } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    // Apply calibrated model transforms
    scene.scale.set(...transformConfig.scale);
    scene.rotation.set(...transformConfig.rotation);
    scene.position.set(...transformConfig.offset);

    const headlights: THREE.MeshStandardMaterial[] = [];
    const taillights: THREE.MeshStandardMaterial[] = [];
    const ev02Body: THREE.MeshStandardMaterial[] = [];
    const legacyHeadlights: THREE.MeshStandardMaterial[] = [];
    const legacyChassis: THREE.MeshStandardMaterial[] = [];
    const fadeMeshes: { mesh: THREE.Mesh; defaultMat: THREE.Material; isWheel: boolean }[] = [];
    const createdMaterials: THREE.Material[] = [];

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;

        if (disableRaycast) {
          mesh.raycast = () => null;
        }

        const originalMat = mesh.material;
        if (!originalMat) return;

        const isWheelOrTire =
          mesh.name.toLowerCase().includes('tire') ||
          mesh.name.toLowerCase().includes('wheel') ||
          mesh.name.toLowerCase().includes('rim') ||
          (originalMat as any).name === 'Material.011' ||
          (originalMat as any).name === 'MA_tire_003.001';

        if (isLegacyModel) {
          if (mesh.name === 'Headlight_Bar' && 'emissiveIntensity' in (originalMat as any)) {
            const mat = (originalMat as THREE.MeshStandardMaterial).clone();
            createdMaterials.push(mat);
            mesh.material = mat;
            legacyHeadlights.push(mat);
          } else if (mesh.name === 'Chassis_Body' || mesh.name === 'Chassis_Nose') {
            const mat = (originalMat as THREE.MeshStandardMaterial).clone();
            createdMaterials.push(mat);
            mesh.material = mat;
            legacyChassis.push(mat);
          }
        } else {
          const mat = originalMat as THREE.MeshStandardMaterial;

          if (mat.name === 'Material.003') {
            if (exteriorColor) {
              const paintHex = resolveVehicleColorHex(exteriorColor);
              const bodyMat = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(paintHex),
                metalness: 0.42,
                roughness: 0.30,
                clearcoat: 0.85,
                clearcoatRoughness: 0.12,
                reflectivity: 0.60,
                envMapIntensity: 0.45,
                emissive: new THREE.Color('#000000'),
                emissiveIntensity: 0,
              });
              createdMaterials.push(bodyMat);
              mesh.material = bodyMat;
            }
          } else if (mat.name === 'Material.006') {
            const glassMat = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#0f172a'),
              metalness: 0.10,
              roughness: 0.10,
              clearcoat: 0.88,
              clearcoatRoughness: 0.08,
              reflectivity: 0.72,
              envMapIntensity: 0.65,
            });
            createdMaterials.push(glassMat);
            mesh.material = glassMat;
          } else if (mat.name === 'Material.011') {
            const rimMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#cbd5e1'),
              metalness: 0.85,
              roughness: 0.22,
              envMapIntensity: 0.60,
            });
            createdMaterials.push(rimMat);
            mesh.material = rimMat;
          } else if (mat.name === 'MA_tire_003.001') {
            const tireMat = mat.clone();
            tireMat.color = new THREE.Color('#121214');
            tireMat.metalness = 0.02;
            tireMat.roughness = 0.94;
            createdMaterials.push(tireMat);
            mesh.material = tireMat;
          } else if (mat.name === 'Material.009') {
            const headMat = mat.clone();
            headMat.color = new THREE.Color('#ffffff');
            headMat.emissive = new THREE.Color('#ffffff');
            headMat.emissiveIntensity = 1.3;
            createdMaterials.push(headMat);
            mesh.material = headMat;
            headlights.push(headMat);
          } else if (mat.name === 'Material.007') {
            const tailMat = mat.clone();
            tailMat.color = new THREE.Color('#ef4444');
            tailMat.emissive = new THREE.Color('#ef4444');
            tailMat.emissiveIntensity = 1.2;
            createdMaterials.push(tailMat);
            mesh.material = tailMat;
            taillights.push(tailMat);
          } else if (mat.name === 'PD_VehiclePack_bodycolor') {
            const bodyMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#d97706'),
              metalness: 0.18,
              roughness: 0.45,
            });
            createdMaterials.push(bodyMat);
            mesh.material = bodyMat;
            ev02Body.push(bodyMat);
          } else if (mat.name === 'PD_VehiclePack_MAT') {
            const trimMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#1e293b'),
              metalness: 0.15,
              roughness: 0.60,
            });
            createdMaterials.push(trimMat);
            mesh.material = trimMat;
          } else {
            const matName = mat.name || '';
            const meshName = mesh.name || '';
            const isGenericBodyPaint =
              matName.toLowerCase().includes('paint') ||
              matName.toLowerCase().includes('body') ||
              matName === 'CarPaint' ||
              matName.toLowerCase().includes('exterior') ||
              meshName.toLowerCase().includes('car paint') ||
              meshName.toLowerCase().includes('car_paint') ||
              meshName.toLowerCase().includes('body');

            const isGenericProtected =
              matName.toLowerCase().includes('glass') ||
              matName.toLowerCase().includes('window') ||
              matName.toLowerCase().includes('tire') ||
              matName.toLowerCase().includes('wheel') ||
              matName.toLowerCase().includes('light') ||
              matName.toLowerCase().includes('rim') ||
              matName.toLowerCase().includes('trim') ||
              meshName.toLowerCase().includes('glass') ||
              meshName.toLowerCase().includes('window') ||
              meshName.toLowerCase().includes('tire') ||
              meshName.toLowerCase().includes('wheel') ||
              meshName.toLowerCase().includes('light');

            if (isGenericBodyPaint && !isGenericProtected && exteriorColor) {
              const paintHex = resolveVehicleColorHex(exteriorColor);
              const bodyMat = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(paintHex),
                metalness: 0.42,
                roughness: 0.30,
                clearcoat: 0.85,
                clearcoatRoughness: 0.12,
                reflectivity: 0.60,
                envMapIntensity: 0.45,
              });
              createdMaterials.push(bodyMat);
              mesh.material = bodyMat;
            } else if ('envMapIntensity' in (originalMat as any)) {
              const clone = (originalMat as THREE.Material).clone();
              (clone as any).envMapIntensity = 0.20;
              createdMaterials.push(clone);
              mesh.material = clone;
            }
          }
        }

        const activeMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        fadeMeshes.push({
          mesh,
          defaultMat: activeMat,
          isWheel: isWheelOrTire,
        });
      }
    });

    return {
      clonedScene: scene,
      dynamicMaterials: {
        headlights,
        taillights,
        ev02Body,
        legacyHeadlights,
        legacyChassis,
        fadeMeshes,
        createdMaterials,
      },
    };
  }, [gltf.scene, transformConfig, exteriorColor, castShadow, receiveShadow, disableRaycast, isLegacyModel]);

  // Clean up created materials on unmount
  useEffect(() => {
    return () => {
      dynamicMaterials.createdMaterials.forEach((m) => m.dispose());
    };
  }, [dynamicMaterials]);

  // Instantaneous in-place uniform updates (emissive, color) on hover/select (ZERO shader recompilation)
  useEffect(() => {
    const headIntensity = isSelected ? 2.0 : isHovered ? 1.6 : 1.3;
    const tailIntensity = isSelected ? 1.8 : isHovered ? 1.5 : 1.2;

    for (const mat of dynamicMaterials.headlights) {
      mat.emissiveIntensity = headIntensity;
    }
    for (const mat of dynamicMaterials.taillights) {
      mat.emissiveIntensity = tailIntensity;
    }
    for (const mat of dynamicMaterials.legacyHeadlights) {
      mat.emissiveIntensity = isSelected ? 2.5 : isHovered ? 2.0 : 1.6;
    }
    for (const mat of dynamicMaterials.legacyChassis) {
      if (isSelected) {
        mat.emissive.set('#00f2fe');
        mat.emissiveIntensity = 0.15;
      } else if (isHovered) {
        mat.emissive.set('#38bdf8');
        mat.emissiveIntensity = 0.08;
      } else {
        mat.emissive.set('#000000');
        mat.emissiveIntensity = 0;
      }
    }
    for (const mat of dynamicMaterials.ev02Body) {
      mat.color.set(isSelected ? '#d97706' : isHovered ? '#f59e0b' : '#d97706');
    }
  }, [dynamicMaterials, isSelected, isHovered]);

  // Battery X-Ray and De-emphasis opacity (Separated from hover/select to prevent main-thread shader recompile stalls)
  const prevTransparencyStateRef = React.useRef<{ isBatteryXray?: boolean; isDeEmphasized?: boolean }>({});
  useEffect(() => {
    const prevState = prevTransparencyStateRef.current;
    if (
      prevState.isBatteryXray === isBatteryXray &&
      prevState.isDeEmphasized === isDeEmphasized
    ) {
      return;
    }
    prevTransparencyStateRef.current = { isBatteryXray, isDeEmphasized };

    for (const { defaultMat, isWheel } of dynamicMaterials.fadeMeshes) {
      const targetTransparent = Boolean(isBatteryXray || isDeEmphasized);
      const targetDepthWrite = !isBatteryXray;
      const targetOpacity = isBatteryXray ? (isWheel ? 0.42 : 0.22) : isDeEmphasized ? 0.52 : 1.0;

      const needsRecompile =
        defaultMat.transparent !== targetTransparent ||
        defaultMat.depthWrite !== targetDepthWrite;

      defaultMat.transparent = targetTransparent;
      defaultMat.depthWrite = targetDepthWrite;
      defaultMat.opacity = targetOpacity;

      if (needsRecompile) {
        defaultMat.needsUpdate = true;
      }
    }
  }, [dynamicMaterials, isDeEmphasized, isBatteryXray]);

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
    if (disableDoorAnimation || !doorBindings?.isSupported) return;
    updateDoorAnimation(doorBindings, activeDoorPartCode, delta);
  });

  // Dynamic Raycast Optimization:
  // When not in inspection or damage mapping mode, bypass all mesh-level raycasting to eliminate pointer latency
  useEffect(() => {
    const shouldDisable = disableRaycast || (!vehicleDamageMappingMode && !vehicleInspectionMode);
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (shouldDisable) {
          mesh.raycast = () => null;
        } else {
          delete (mesh as any).raycast;
        }
      }
    });

    return () => {
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          delete ((child as THREE.Mesh) as any).raycast;
        }
      });
    };
  }, [clonedScene, disableRaycast, vehicleDamageMappingMode, vehicleInspectionMode]);

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

  const isRaycastActive = !disableRaycast && (Boolean(vehicleDamageMappingMode) || Boolean(vehicleInspectionMode));

  return (
    <primitive
      object={clonedScene}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      onPointerDown={isRaycastActive ? onPointerDown : undefined}
      onClick={isRaycastActive ? handleClick : undefined}
    />
  );
};

const VehicleModelMesh = React.memo(VehicleModelMeshComponent);

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
  exteriorColor?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  disableRaycast?: boolean;
  disableDoorAnimation?: boolean;
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
const VehicleModelRoot: React.FC<VehicleModelProps> = ({
  isSelected,
  isHovered,
  isDeEmphasized,
  isBatteryXray,
  modelUrl = EV01_REALISTIC_MODEL_URL,
  exteriorColor,
  castShadow = true,
  receiveShadow = true,
  disableRaycast = false,
  disableDoorAnimation = false,
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
          exteriorColor={exteriorColor}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          disableRaycast={disableRaycast}
          disableDoorAnimation={disableDoorAnimation}
          onSelectVehicle={onSelectVehicle}
          onPointerDown={onPointerDown}
        />
      </React.Suspense>
    </VehicleModelErrorBoundary>
  );
};

export const VehicleModel = React.memo(VehicleModelRoot);

// Preload primary 3D vehicle assets to eliminate interaction frame drops on initial load
useGLTF.preload(EV01_REALISTIC_MODEL_URL);
useGLTF.preload(EV02_STYLIZED_MODEL_URL);
useGLTF.preload(EV01_FALLBACK_MODEL_URL);
