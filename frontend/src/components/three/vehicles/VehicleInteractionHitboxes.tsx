import React, { useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore, setTransientInspectionError } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { SEMANTIC_HITBOX_DEFINITIONS, EV02_SEMANTIC_HITBOXES, SemanticHitboxDef, isPointOnSemanticPart } from '../../../data/vehicleParts';
import { getCheckpointByCode } from '../../../types/handover';
import { VehiclePartId } from '../../../types/vehiclePart';
import { INTERACTION_CONFIG } from '../../../config/interactionConfig';
import { getVehicleAnchor } from '../../../config/vehicleCameraPresets';
import { globalInteractionState, isRecentDragInteraction } from '../globalInteractionState';

interface VehicleInteractionHitboxesProps {
  vehicleCode?: 'EV01' | 'EV02';
  hitboxes?: SemanticHitboxDef[];
  onSelectVehicle?: () => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
}

export const VehicleInteractionHitboxes: React.FC<VehicleInteractionHitboxesProps> = ({
  vehicleCode = 'EV01',
  hitboxes,
  onSelectVehicle,
  onPointerDown,
}) => {
  const user = useAuthStore((state) => state.user);
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
  const clearVehiclePartSelection = useWorldStore(
    (state) => state.clearVehiclePartSelection
  );
  const enterVehicleInspectionMode = useWorldStore(
    (state) => state.enterVehicleInspectionMode
  );
  const hoverVehicle = useWorldStore((state) => state.hoverVehicle);

  const vehicleHandoverMode = useWorldStore(
    (state) => state.vehicleHandoverMode
  );
  const vehicleReceiptReviewMode = useWorldStore(
    (state) => state.vehicleReceiptReviewMode
  );
  const isHandoverOrReceipt = vehicleHandoverMode || vehicleReceiptReviewMode;

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
  const clearHandoverCheckpointSelection = useWorldStore(
    (state) => state.clearHandoverCheckpointSelection
  );

  // Phase 13: Pure 3D Damage Mapping Mode
  const vehicleDamageMappingMode = useWorldStore(
    (state) => state.vehicleDamageMappingMode
  );
  const selectedVehiclePartCode = useWorldStore(
    (state) => state.selectedVehiclePartCode
  );
  const selectVehiclePartCode = useWorldStore(
    (state) => state.selectVehiclePartCode
  );
  const selectVehiclePartWithPoint = useWorldStore(
    (state) => state.selectVehiclePartWithPoint
  );
  const setDraftDamage = useWorldStore((state) => state.setDraftDamage);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);
  const [hoveredDamagePartId, setHoveredDamagePartId] = useState<string | null>(null);

  const handleClick = (e: ThreeEvent<MouseEvent>, hitbox: SemanticHitboxDef) => {
    // Only accept left clicks (button === 0)
    if (e.button !== 0) return;
    // Prevent accidental selection during camera orbit/drag or vehicle turntable drag
    if (isRecentDragInteraction(e.delta)) return;
    e.stopPropagation();

    // 0. Phase 13: 3D Damage Mapping Mode (Single-Click: Semantic Part + Exact 3D Location)
    if (vehicleDamageMappingMode) {
      const v = e.point.clone();

      // Robust traversal to find the vehicle turntable root
      let obj: THREE.Object3D | null = e.object;
      let turntableObj: THREE.Object3D | null = null;
      while (obj) {
        if (obj.name && obj.name.includes('Turntable')) {
          turntableObj = obj;
          break;
        }
        obj = obj.parent;
      }

      if (turntableObj && 'worldToLocal' in turntableObj) {
        turntableObj.worldToLocal(v);
      } else if (e.object.parent?.parent?.parent && 'worldToLocal' in e.object.parent.parent.parent) {
        e.object.parent.parent.parent.worldToLocal(v);
      } else {
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
      selectVehiclePartWithPoint(hitbox.id, localPoint);
      return;
    }

    // 1. Handover & Receipt Modes: Select Handover Checkpoints
    if (isHandoverOrReceipt) {
      const cp = getCheckpointByCode(hitbox.id);
      if (cp) {
        if (selectedHandoverCheckpoint === cp.code) {
          clearHandoverCheckpointSelection();
        } else {
          selectHandoverCheckpoint(cp.code);
        }
      }
      return;
    }

    // 2. Vehicle Exploration / Inspection Mode: Select Vehicle Part (toggle off if clicked again)
    if (vehicleInspectionMode) {
      if (selectedVehiclePartId === hitbox.id) {
        clearVehiclePartSelection();
      } else {
        selectVehiclePart(hitbox.id);
      }
      return;
    }

    // 3. Fallback: In normal mode, do not select parts; select entire vehicle
    if (onSelectVehicle) {
      onSelectVehicle();
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>, hitbox: SemanticHitboxDef) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';

    if (vehicleDamageMappingMode) {
      if (!selectedVehiclePartCode || selectedVehiclePartCode === hitbox.id) {
        setHoveredDamagePartId(hitbox.id);
      }
      return;
    }

    if (isHandoverOrReceipt) {
      const cp = getCheckpointByCode(hitbox.id);
      if (cp) {
        hoverHandoverCheckpoint(cp.code);
      }
      return;
    }

    if (vehicleInspectionMode) {
      hoverVehiclePart(hitbox.id);
      return;
    }

    // Normal mode: hover vehicle
    hoverVehicle(vehicleCode);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>, hitbox: SemanticHitboxDef) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';

    if (vehicleDamageMappingMode) {
      setHoveredDamagePartId(null);
      return;
    }

    if (isHandoverOrReceipt) {
      hoverHandoverCheckpoint(null);
      return;
    }

    if (vehicleInspectionMode) {
      hoverVehiclePart(null);
      return;
    }

    hoverVehicle(null);
  };

  // Helper to render proxy geometries
  const renderGeometry = (hitbox: SemanticHitboxDef) => {
    switch (hitbox.shape) {
      case 'box':
        return <boxGeometry args={hitbox.args as [number, number, number]} />;
      case 'cylinder':
        return (
          <cylinderGeometry
            args={hitbox.args as [number, number, number, number]}
          />
        );
      case 'sphere':
        return <sphereGeometry args={hitbox.args as [number, number, number]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const hitboxesToRender = hitboxes || (vehicleCode === 'EV02' ? EV02_SEMANTIC_HITBOXES : SEMANTIC_HITBOX_DEFINITIONS);

  return (
    <group name={`${vehicleCode}InteractionHitboxes`}>
      {hitboxesToRender.map((hitbox) => {
        // Determine active highlight state in inspection/handover/damage modes
        const isHandoverActive =
          isHandoverOrReceipt &&
          (hitbox.id === selectedHandoverCheckpoint ||
            hitbox.id === hoveredHandoverCheckpoint);
        const isInspectionActive =
          vehicleInspectionMode &&
          (hitbox.id === selectedVehiclePartId ||
            hitbox.id === hoveredVehiclePartId);
        const isDamageHovered =
          vehicleDamageMappingMode &&
          hoveredDamagePartId === hitbox.id;
        const isDamageSelected =
          vehicleDamageMappingMode &&
          selectedVehiclePartCode === hitbox.id;

        const isSelected =
          (isHandoverOrReceipt && hitbox.id === selectedHandoverCheckpoint) ||
          (vehicleInspectionMode && hitbox.id === selectedVehiclePartId) ||
          isDamageSelected;

        const isHighlighted =
          isHandoverActive ||
          isInspectionActive ||
          isDamageHovered ||
          isDamageSelected;

        // In damage mapping mode, all semantic hitboxes capture raycasts so any click instantly selects part + 3D point
        const shouldCaptureRaycast = true;

        return (
          <group
            key={hitbox.id}
            position={hitbox.position}
            rotation={hitbox.rotation}
          >
            {/* Primary Raycast Proxy Volume (Invisible to user) */}
            {shouldCaptureRaycast && (
              <mesh
                onPointerDown={onPointerDown}
                onClick={(e) => handleClick(e, hitbox)}
                onPointerOver={(e) => handlePointerOver(e, hitbox)}
                onPointerOut={(e) => handlePointerOut(e, hitbox)}
              >
                {renderGeometry(hitbox)}
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            )}

            {/* Non-destructive PBR-friendly Holographic Contour Highlight */}
            {isHighlighted && (
              <mesh>
                {renderGeometry(hitbox)}
                <meshBasicMaterial
                  color={
                    isDamageSelected
                      ? '#00f2fe'
                      : isDamageHovered
                      ? '#06b6d4'
                      : isSelected
                      ? '#00f2fe'
                      : '#38bdf8'
                  }
                  wireframe
                  transparent
                  opacity={isDamageSelected ? 0.8 : isDamageHovered ? 0.45 : isSelected ? 0.75 : 0.4}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
