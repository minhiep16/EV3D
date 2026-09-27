import React, { useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { SEMANTIC_HITBOX_DEFINITIONS, SemanticHitboxDef } from '../../../data/vehicleParts';
import { getCheckpointByCode } from '../../../types/handover';
import { VehiclePartId } from '../../../types/vehiclePart';
import { INTERACTION_CONFIG } from '../../../config/interactionConfig';
import { globalInteractionState, isRecentDragInteraction } from '../GlobalInteractionManager';

interface VehicleInteractionHitboxesProps {
  onSelectVehicle?: () => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
}

export const VehicleInteractionHitboxes: React.FC<VehicleInteractionHitboxesProps> = ({
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
  const setDraftDamage = useWorldStore((state) => state.setDraftDamage);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);
  const [hoveredDamagePartId, setHoveredDamagePartId] = useState<string | null>(null);

  const handleClick = (e: ThreeEvent<MouseEvent>, hitbox: SemanticHitboxDef) => {
    // Prevent accidental selection during camera orbit/drag or vehicle turntable drag
    if (isRecentDragInteraction(e.delta)) return;
    e.stopPropagation();

    // 0. Phase 13: 3D Damage Mapping Mode (STAFF places draft marker)
    if (vehicleDamageMappingMode) {
      if (user?.role === 'STAFF') {
        const hitMesh = e.object;
        let localPoint: [number, number, number];
        const vehicleRoot = hitMesh.parent?.parent?.parent;
        if (vehicleRoot && 'worldToLocal' in vehicleRoot) {
          const v = vehicleRoot.worldToLocal(e.point.clone());
          localPoint = [
            Number(v.x.toFixed(3)),
            Number(v.y.toFixed(3)),
            Number(v.z.toFixed(3)),
          ];
        } else {
          // Operations (STAFF) EV01 is situated at [0.0, 0.14, 0.5]
          const vx = 0.0;
          const vy = 0.14;
          const vz = 0.5;
          localPoint = [
            Number((e.point.x - vx).toFixed(3)),
            Number((e.point.y - vy).toFixed(3)),
            Number((e.point.z - vz).toFixed(3)),
          ];
        }

        setDraftDamage({
          partCode: hitbox.id,
          localPosition: localPoint,
        });
        selectDamageRecord(null);
      }
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

    // 2. Vehicle Inspection Mode: Select Vehicle Part
    if (vehicleInspectionMode) {
      if (selectedVehiclePartId === hitbox.id) {
        selectVehiclePart(null);
      } else {
        selectVehiclePart(hitbox.id);
      }
      return;
    }

    // 3. Normal Mode: Select entire EV01 vehicle
    if (onSelectVehicle) {
      onSelectVehicle();
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>, hitbox: SemanticHitboxDef) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';

    if (vehicleDamageMappingMode) {
      if (user?.role === 'STAFF') {
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

    // Normal mode: hover entire EV01
    hoverVehicle('EV01');
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

  // In damage mapping mode, CO_OWNER and ADMIN are read-only: hitboxes must NOT intercept raycasts or clicks!
  if (vehicleDamageMappingMode && user?.role !== 'STAFF') {
    return null;
  }

  return (
    <group name="VehicleInteractionHitboxes">
      {SEMANTIC_HITBOX_DEFINITIONS.map((hitbox) => {
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
          user?.role === 'STAFF' &&
          hoveredDamagePartId === hitbox.id;

        const isSelected =
          (isHandoverOrReceipt && hitbox.id === selectedHandoverCheckpoint) ||
          (vehicleInspectionMode && hitbox.id === selectedVehiclePartId);

        const isHighlighted = isHandoverActive || isInspectionActive || isDamageHovered;

        return (
          <group
            key={hitbox.id}
            position={hitbox.position}
            rotation={hitbox.rotation}
          >
            {/* Primary Raycast Proxy Volume (Invisible to user) */}
            <mesh
              onPointerDown={onPointerDown}
              onClick={(e) => handleClick(e, hitbox)}
              onPointerOver={(e) => handlePointerOver(e, hitbox)}
              onPointerOut={(e) => handlePointerOut(e, hitbox)}
            >
              {renderGeometry(hitbox)}
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Non-destructive PBR-friendly Holographic Contour Highlight */}
            {isHighlighted && (
              <mesh>
                {renderGeometry(hitbox)}
                <meshBasicMaterial
                  color={
                    isDamageHovered
                      ? '#06b6d4'
                      : isSelected
                      ? '#00f2fe'
                      : '#38bdf8'
                  }
                  wireframe
                  transparent
                  opacity={isDamageHovered ? 0.45 : isSelected ? 0.75 : 0.4}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
