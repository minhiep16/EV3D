import React, { useMemo, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { resolveSemanticPartFromLocalPoint } from '../../../data/vehicleParts';
import {
  EV01_REALISTIC_MODEL_URL,
  EV01_FALLBACK_MODEL_URL,
  getModelTransformConfig,
} from './vehicleModelConfig';
import { INTERACTION_CONFIG } from '../../../config/interactionConfig';
import { globalInteractionState, isRecentDragInteraction } from '../GlobalInteractionManager';

interface VehicleModelMeshProps {
  isSelected: boolean;
  isHovered: boolean;
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
            // Main exterior car body shell: Electric Metallic Cyan-Blue Paint
            const bodyMat = mat.clone();
            bodyMat.color = new THREE.Color('#0284c7'); // Electric automotive blue
            bodyMat.metalness = 0.72;
            bodyMat.roughness = 0.22;
            bodyMat.envMapIntensity = 1.25;

            // Subtle interaction sheen without neon washing
            if (isSelected) {
              bodyMat.emissive = new THREE.Color('#00f2fe');
              bodyMat.emissiveIntensity = 0.06;
            } else if (isHovered) {
              bodyMat.emissive = new THREE.Color('#38bdf8');
              bodyMat.emissiveIntensity = 0.03;
            } else {
              bodyMat.emissive = new THREE.Color('#000000');
              bodyMat.emissiveIntensity = 0;
            }
            mesh.material = bodyMat;
          } else if (mat.name === 'Material.006') {
            // Panoramic glass & windows: Reflective dark tinted automotive glass
            const glassMat = mat.clone();
            glassMat.color = new THREE.Color('#080d1a');
            glassMat.metalness = 0.85;
            glassMat.roughness = 0.04;
            mesh.material = glassMat;
          } else if (mat.name === 'Material.011') {
            // Wheel rims: High-grade metallic alloy finish
            const rimMat = mat.clone();
            rimMat.color = new THREE.Color('#cbd5e1');
            rimMat.metalness = 0.88;
            rimMat.roughness = 0.18;
            mesh.material = rimMat;
          } else if (mat.name === 'MA_tire_003.001') {
            // Tires: Matte dark vulcanized rubber
            const tireMat = mat.clone();
            tireMat.color = new THREE.Color('#18181b');
            tireMat.metalness = 0.05;
            tireMat.roughness = 0.88;
            mesh.material = tireMat;
          } else if (mat.name === 'Material.009') {
            // Headlights: Modern white LED emissive bar
            const headMat = mat.clone();
            headMat.color = new THREE.Color('#f8fafc');
            headMat.emissive = new THREE.Color('#ffffff');
            headMat.emissiveIntensity = isSelected ? 2.2 : isHovered ? 1.7 : 1.3;
            mesh.material = headMat;
          } else if (mat.name === 'Material.007') {
            // Taillights: Red LED dynamic taillight bar
            const tailMat = mat.clone();
            tailMat.color = new THREE.Color('#ef4444');
            tailMat.emissive = new THREE.Color('#ef4444');
            tailMat.emissiveIntensity = isSelected ? 2.0 : isHovered ? 1.5 : 1.1;
            mesh.material = tailMat;
          } else {
            mesh.material = originalMat;
          }
        }
      }
    });
  }, [clonedScene, originalMaterialsMap, isLegacyModel, isSelected, isHovered]);

  const user = useAuthStore((state) => state.user);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const setDraftDamage = useWorldStore((state) => state.setDraftDamage);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);

  // Passive click fallback: selects vehicle if clicked directly on visual geometry
  // In DAMAGE_MAPPING mode: allows placing draft damage point directly on visual surface
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Prevent accidental selection during camera orbit/drag or vehicle turntable drag
    if (isRecentDragInteraction(e.delta)) return;

    if (vehicleDamageMappingMode) {
      if (user?.role === 'STAFF') {
        e.stopPropagation();
        // Operations (STAFF) EV01 is situated at [0.0, 0.14, 0.5]
        const vx = 0.0;
        const vy = 0.14;
        const vz = 0.5;

        const localPoint: [number, number, number] = [
          Number((e.point.x - vx).toFixed(3)),
          Number((e.point.y - vy).toFixed(3)),
          Number((e.point.z - vz).toFixed(3)),
        ];

        const partCode = resolveSemanticPartFromLocalPoint(localPoint);
        setDraftDamage({
          partCode,
          localPosition: localPoint,
        });
        selectDamageRecord(null);
      }
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
    console.warn(
      'VehicleModel failed to load primary 3D asset. Gracefully switching to fallback model:',
      error
    );
    this.props.onFallback();
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
  modelUrl?: string;
  onSelectVehicle?: () => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
}

/**
 * VehicleModel (Visual-First Component)
 *
 * Dedicated to loading, rendering, and shading the 3D EV vehicle asset.
 * Decoupled from semantic business logic (inspection, handover, check-in).
 * Gracefully falls back to legacy GLB if realistic model encounters any loading issue.
 */
export const VehicleModel: React.FC<VehicleModelProps> = ({
  isSelected,
  isHovered,
  modelUrl = EV01_REALISTIC_MODEL_URL,
  onSelectVehicle,
  onPointerDown,
}) => {
  const [activeModelUrl, setActiveModelUrl] = useState(modelUrl);

  useEffect(() => {
    setActiveModelUrl(modelUrl);
  }, [modelUrl]);

  return (
    <VehicleModelErrorBoundary
      fallbackUrl={EV01_FALLBACK_MODEL_URL}
      onFallback={() => setActiveModelUrl(EV01_FALLBACK_MODEL_URL)}
    >
      <VehicleModelMesh
        isSelected={isSelected}
        isHovered={isHovered}
        modelUrl={activeModelUrl}
        onSelectVehicle={onSelectVehicle}
        onPointerDown={onPointerDown}
      />
    </VehicleModelErrorBoundary>
  );
};

// Preload both realistic and fallback model assets for instant, seamless rendering
useGLTF.preload(EV01_REALISTIC_MODEL_URL);
useGLTF.preload(EV01_FALLBACK_MODEL_URL);
