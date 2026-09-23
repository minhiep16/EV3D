import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../../../store/worldStore';
import { getPartIdFromMesh } from '../../../data/vehicleParts';
import { getCheckpointByCode } from '../../../types/handover';

interface VehicleModelProps {
  isSelected: boolean;
  isHovered: boolean;
  modelUrl?: string;
}

export const VehicleModel: React.FC<VehicleModelProps> = ({
  isSelected,
  isHovered,
  modelUrl = '/models/ev-car.glb',
}) => {
  // Load the EV 3D GLB model
  const gltf = useGLTF(modelUrl);

  const vehicleInspectionMode = useWorldStore(
    (state) => state.vehicleInspectionMode
  );
  const hoveredVehiclePartId = useWorldStore(
    (state) => state.hoveredVehiclePartId
  );
  const selectedVehiclePartId = useWorldStore(
    (state) => state.selectedVehiclePartId
  );
  const hoverVehiclePart = useWorldStore((state) => state.hoverVehiclePart);
  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);

  // Phase 09: Handover mode support
  const vehicleHandoverMode = useWorldStore(
    (state) => state.vehicleHandoverMode
  );
  const selectedHandoverCheckpoint = useWorldStore(
    (state) => state.selectedHandoverCheckpoint
  );
  const hoveredHandoverCheckpoint = useWorldStore(
    (state) => state.hoveredHandoverCheckpoint
  );
  const hoverHandoverCheckpoint = useWorldStore(
    (state) => state.hoverHandoverCheckpoint
  );
  const selectHandoverCheckpoint = useWorldStore(
    (state) => state.selectHandoverCheckpoint
  );

  // Clone scene so multiple instances don't cross-contaminate
  const clonedScene = useMemo(() => {
    return gltf.scene.clone(true);
  }, [gltf.scene]);

  // Safely cache original cloned material instances for every mesh
  const originalMaterialsMap = useMemo(() => {
    const map = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        map.set(mesh, mesh.material);
      }
    });
    return map;
  }, [clonedScene]);

  // Apply safe, dynamic emissive highlighting based on interaction state
  useEffect(() => {
    // Helper to clone and apply highlight safely to a single material
    const applyHighlight = (
      mat: THREE.Material,
      emissiveHex: string,
      intensity: number
    ): THREE.Material => {
      if ('emissive' in mat && 'clone' in mat) {
        const cloned = (mat as THREE.MeshStandardMaterial).clone();
        cloned.emissive = new THREE.Color(emissiveHex);
        cloned.emissiveIntensity = intensity;
        return cloned;
      }
      return mat;
    };

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const originalMat = originalMaterialsMap.get(mesh);
        if (!originalMat) return;

        if (vehicleHandoverMode) {
          const partId = getPartIdFromMesh(mesh);
          if (partId && partId === selectedHandoverCheckpoint) {
            // Selected checkpoint: prominent glowing cyan highlight
            mesh.material = Array.isArray(originalMat)
              ? originalMat.map((m) => applyHighlight(m, '#00f2fe', 0.85))
              : applyHighlight(originalMat, '#00f2fe', 0.85);
          } else if (partId && partId === hoveredHandoverCheckpoint) {
            // Hovered checkpoint: subtle sky-blue highlight
            mesh.material = Array.isArray(originalMat)
              ? originalMat.map((m) => applyHighlight(m, '#38bdf8', 0.45))
              : applyHighlight(originalMat, '#38bdf8', 0.45);
          } else {
            // Unselected part during handover: restore original material
            mesh.material = originalMat;
          }
        } else if (vehicleInspectionMode) {
          const partId = getPartIdFromMesh(mesh);

          if (partId && partId === selectedVehiclePartId) {
            // Selected part: prominent glowing cyan highlight
            mesh.material = Array.isArray(originalMat)
              ? originalMat.map((m) => applyHighlight(m, '#00f2fe', 0.85))
              : applyHighlight(originalMat, '#00f2fe', 0.85);
          } else if (partId && partId === hoveredVehiclePartId) {
            // Hovered part: subtle sky-blue highlight
            mesh.material = Array.isArray(originalMat)
              ? originalMat.map((m) => applyHighlight(m, '#38bdf8', 0.45))
              : applyHighlight(originalMat, '#38bdf8', 0.45);
          } else {
            // Unselected part during inspection: restore original material
            mesh.material = originalMat;
          }
        } else {
          // Standard full-vehicle view:
          if (mesh.name === 'Chassis_Body' || mesh.name === 'Chassis_Nose') {
            if (isSelected) {
              mesh.material = Array.isArray(originalMat)
                ? originalMat.map((m) => applyHighlight(m, '#00f2fe', 0.5))
                : applyHighlight(originalMat, '#00f2fe', 0.5);
            } else if (isHovered) {
              mesh.material = Array.isArray(originalMat)
                ? originalMat.map((m) => applyHighlight(m, '#38bdf8', 0.25))
                : applyHighlight(originalMat, '#38bdf8', 0.25);
            } else {
              mesh.material = originalMat;
            }
          } else if (mesh.name === 'Headlight_Bar') {
            const intensity = isSelected ? 2.8 : isHovered ? 2.2 : 1.8;
            mesh.material = Array.isArray(originalMat)
              ? originalMat.map((m) => {
                  const cloned = (m as THREE.MeshStandardMaterial).clone();
                  cloned.emissiveIntensity = intensity;
                  return cloned;
                })
              : (() => {
                  const cloned = (originalMat as THREE.MeshStandardMaterial).clone();
                  cloned.emissiveIntensity = intensity;
                  return cloned;
                })();
          } else {
            mesh.material = originalMat;
          }
        }
      }
    });
  }, [
    clonedScene,
    originalMaterialsMap,
    vehicleHandoverMode,
    selectedHandoverCheckpoint,
    hoveredHandoverCheckpoint,
    vehicleInspectionMode,
    selectedVehiclePartId,
    hoveredVehiclePartId,
    isSelected,
    isHovered,
  ]);

  // Pointer interaction during vehicle handover mode or inspection mode
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (vehicleHandoverMode) {
      e.stopPropagation();
      const partId = getPartIdFromMesh(e.object);
      if (partId) {
        const cp = getCheckpointByCode(partId);
        if (cp) {
          hoverHandoverCheckpoint(cp.code);
          document.body.style.cursor = 'pointer';
        }
      }
      return;
    }
    if (!vehicleInspectionMode) return;
    e.stopPropagation();
    const partId = getPartIdFromMesh(e.object);
    if (partId) {
      hoverVehiclePart(partId);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (vehicleHandoverMode) {
      e.stopPropagation();
      hoverHandoverCheckpoint(null);
      document.body.style.cursor = 'auto';
      return;
    }
    if (!vehicleInspectionMode) return;
    e.stopPropagation();
    hoverVehiclePart(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (vehicleHandoverMode) {
      e.stopPropagation();
      const partId = getPartIdFromMesh(e.object);
      if (partId) {
        const cp = getCheckpointByCode(partId);
        if (cp) {
          selectHandoverCheckpoint(cp.code);
        }
      }
      return;
    }
    if (!vehicleInspectionMode) return;
    e.stopPropagation();
    const partId = getPartIdFromMesh(e.object);
    if (partId) {
      selectVehiclePart(partId);
    }
  };

  return (
    <primitive
      object={clonedScene}
      castShadow
      receiveShadow
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
};

// Preload the EV model asset
useGLTF.preload('/models/ev-car.glb');
