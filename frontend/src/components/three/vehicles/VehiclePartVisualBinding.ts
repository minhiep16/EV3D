/**
 * VehiclePartVisualBinding Architecture (Phase 13)
 *
 * CURRENT GLB LIMITATION (ev-car-realistic.glb):
 * The current GLB model uses a monolithic exterior body shell where doors are welded into
 * the main exterior mesh (Material.003). Therefore, physical door hinge opening animation is
 * NOT SUPPORTED with the current GLB without destructive mesh splitting.
 *
 * Current Door Inspection UX:
 * - DOOR_FL, DOOR_FR, DOOR_RL, DOOR_RR support:
 *   1. Semantic hitboxes & contour highlighting
 *   2. Smooth camera focus and framing
 *   3. Inspection state machine and condition selection
 *   4. Precise 3D damage point mapping
 * - NO physical opening animation is played until Blender separation is completed.
 *
 * FUTURE BLENDER INTEGRATION SPECIFICATION:
 * When the 3D car asset is separated in Blender, the door objects must follow:
 * - Visual Node Names:
 *   DOOR_FL -> "Door_FL"
 *   DOOR_FR -> "Door_FR"
 *   DOOR_RL -> "Door_RL"
 *   DOOR_RR -> "Door_RR"
 * - Each must be an independent mesh/object.
 * - Each must have its local origin/pivot positioned exactly at the mechanical hinge axis.
 * - Preserve current vehicle dimensions, exterior/interior materials, and body alignment.
 * - VehiclePartVisualBinding will automatically bind and smoothly interpolate:
 *   0 rad -> 1.02 rad (~58.5 degrees) for left doors
 *   0 rad -> -1.02 rad (~ -58.5 degrees) for right doors
 */

import * as THREE from 'three';
import { VehiclePartId } from '../../../types/vehiclePart';

export interface VehiclePartVisualBinding {
  semanticPartCode: VehiclePartId | string;
  candidateNodeNames: string[];
  visualNode: THREE.Object3D | null;
  pivot: THREE.Object3D | null;
  isOpen: boolean;
  currentAngle: number;
  targetAngle: number;
  openAngleRad: number; // ~58.5 degrees (~1.02 rad)
  hingeAxis: 'y' | 'x' | 'z';
}

export interface DoorBindingRegistry {
  isSupported: boolean;
  explanation: string;
  bindings: Record<string, VehiclePartVisualBinding>;
}

const DOOR_CANDIDATE_NAMES: Record<string, string[]> = {
  DOOR_FL: [
    'wagon_A_DoorL.001',
    'wagon_A_DoorL',
    'wagon_a_doorl.001',
    'wagon_a_doorl',
    'Door_FL',
    'Door_Front_Left',
    'door_fl',
    'Door_L_Front',
    'DoorFrontLeft',
    'door_front_left',
  ],
  DOOR_FR: [
    'wagon_A_DoorR.001',
    'wagon_A_DoorR',
    'wagon_a_doorr.001',
    'wagon_a_doorr',
    'Door_FR',
    'Door_Front_Right',
    'door_fr',
    'Door_R_Front',
    'DoorFrontRight',
    'door_front_right',
  ],
  DOOR_RL: [
    'wagon_A_DoorL2.001',
    'wagon_A_DoorL2',
    'wagon_a_doorl2.001',
    'wagon_a_doorl2',
    'Door_RL',
    'Door_Rear_Left',
    'door_rl',
    'Door_L_Rear',
    'DoorRearLeft',
    'door_rear_left',
  ],
  DOOR_RR: [
    'wagon_A_DoorR2.001',
    'wagon_A_DoorR2',
    'wagon_a_doorr2.001',
    'wagon_a_doorr2',
    'Door_RR',
    'Door_Rear_Right',
    'door_rr',
    'Door_R_Rear',
    'DoorRearRight',
    'door_rear_right',
  ],
};

const DOOR_PIVOT_CANDIDATE_NAMES: Record<string, string[]> = {
  DOOR_FL: ['DoorPivot_FL', 'Door_FL_Pivot', 'Pivot_Door_FL', 'pivot_door_fl', 'DoorPivotFL'],
  DOOR_FR: ['DoorPivot_FR', 'Door_FR_Pivot', 'Pivot_Door_FR', 'pivot_door_fr', 'DoorPivotFR'],
  DOOR_RL: ['DoorPivot_RL', 'Door_RL_Pivot', 'Pivot_Door_RL', 'pivot_door_rl', 'DoorPivotRL'],
  DOOR_RR: ['DoorPivot_RR', 'Door_RR_Pivot', 'Pivot_Door_RR', 'pivot_door_rr', 'DoorPivotRR'],
};

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Inspects a cloned GLB scene to resolve visual nodes and hinge pivots for semantic door parts.
 * Decouples business logic (DOOR_FL, DOOR_FR...) from raw 3D mesh names.
 */
export function createVehicleDoorVisualBinding(scene: THREE.Object3D): DoorBindingRegistry {
  const bindings: Record<string, VehiclePartVisualBinding> = {};
  let anyDoorFound = false;

  const nodeNameMap = new Map<string, THREE.Object3D>();
  const normalizedNodeMap = new Map<string, THREE.Object3D>();
  scene.traverse((child) => {
    if (child.name) {
      nodeNameMap.set(child.name.toLowerCase(), child);
      normalizedNodeMap.set(normalizeKey(child.name), child);
    }
  });

  for (const [partCode, candidateNames] of Object.entries(DOOR_CANDIDATE_NAMES)) {
    const pivotCandidates = DOOR_PIVOT_CANDIDATE_NAMES[partCode] || [];
    let resolvedPivot: THREE.Object3D | null = null;
    let resolvedNode: THREE.Object3D | null = null;

    // 1. Look for explicit hinge pivot node first (DoorPivot_*)
    for (const name of pivotCandidates) {
      const found = nodeNameMap.get(name.toLowerCase()) || normalizedNodeMap.get(normalizeKey(name));
      if (found) {
        resolvedPivot = found;
        break;
      }
    }

    // 2. Look for visual door mesh node (Door_*)
    for (const name of candidateNames) {
      const found = nodeNameMap.get(name.toLowerCase()) || normalizedNodeMap.get(normalizeKey(name));
      if (found) {
        resolvedNode = found;
        break;
      }
    }

    // Outward swing angles:
    // EV02 Driver/Left door is located at +X: negative rotation (-0.96 rad) swings outward towards +X exterior.
    // EV02 Passenger/Right door is located at -X: positive rotation (+0.96 rad) swings outward towards -X exterior.
    const isRightSide = partCode.endsWith('_FR') || partCode.endsWith('_RR');
    const openAngle = isRightSide ? 0.96 : -0.96;

    if (resolvedPivot) {
      anyDoorFound = true;
      bindings[partCode] = {
        semanticPartCode: partCode,
        candidateNodeNames: [...pivotCandidates, ...candidateNames],
        visualNode: resolvedNode || resolvedPivot,
        pivot: resolvedPivot,
        isOpen: false,
        currentAngle: 0,
        targetAngle: 0,
        openAngleRad: openAngle,
        hingeAxis: 'y',
      };
    } else if (resolvedNode) {
      anyDoorFound = true;

      // Construct a dynamic hinge pivot group if none exists, keeping exact resting position
      const parent = resolvedNode.parent || scene;
      const pivotName = `DynamicHingePivot_${partCode}`;
      let pivotGroup = parent.getObjectByName(pivotName);

      if (!pivotGroup) {
        const geom = (resolvedNode as THREE.Mesh).geometry;
        let hingeX = 0;
        let hingeY = 0;
        let hingeZ = 0;

        if (geom) {
          geom.computeBoundingBox();
          if (geom.boundingBox) {
            const bbox = new THREE.Box3();
            const min = geom.boundingBox.min;
            const max = geom.boundingBox.max;
            const corners = [
              new THREE.Vector3(min.x, min.y, min.z),
              new THREE.Vector3(min.x, min.y, max.z),
              new THREE.Vector3(min.x, max.y, min.z),
              new THREE.Vector3(min.x, max.y, max.z),
              new THREE.Vector3(max.x, min.y, min.z),
              new THREE.Vector3(max.x, min.y, max.z),
              new THREE.Vector3(max.x, max.y, min.z),
              new THREE.Vector3(max.x, max.y, max.z),
            ];
            corners.forEach((c) => {
              c.applyMatrix4(resolvedNode.matrix);
              bbox.expandByPoint(c);
            });

            // Outer hinge edge: +X for left doors, -X for right doors
            hingeX = isRightSide ? bbox.min.x : bbox.max.x;
            hingeY = (bbox.min.y + bbox.max.y) / 2;
            hingeZ = bbox.max.z; // Front edge of door
          }
        }

        if (hingeZ !== 0 || hingeX !== 0) {
          pivotGroup = new THREE.Group();
          pivotGroup.name = pivotName;
          pivotGroup.position.set(hingeX, hingeY, hingeZ);
          parent.add(pivotGroup);

          // Direct local vector subtraction avoids any stale matrixWorld issues during initialization
          resolvedNode.position.sub(pivotGroup.position);
          pivotGroup.add(resolvedNode);
        }
      }

      bindings[partCode] = {
        semanticPartCode: partCode,
        candidateNodeNames: [...pivotCandidates, ...candidateNames],
        visualNode: resolvedNode,
        pivot: pivotGroup || resolvedNode,
        isOpen: false,
        currentAngle: 0,
        targetAngle: 0,
        openAngleRad: openAngle,
        hingeAxis: 'y',
      };
    } else {
      bindings[partCode] = {
        semanticPartCode: partCode,
        candidateNodeNames: [...pivotCandidates, ...candidateNames],
        visualNode: null,
        pivot: null,
        isOpen: false,
        currentAngle: 0,
        targetAngle: 0,
        openAngleRad: openAngle,
        hingeAxis: 'y',
      };
    }
  }

  return {
    isSupported: anyDoorFound,
    explanation: anyDoorFound
      ? 'Mô hình GLB hỗ trợ các cụm cửa độc lập.'
      : 'Mô hình GLB sử dụng cấu trúc lưới thân xe liền khối (monolithic body shell), chưa tách rời các mesh cửa riêng biệt trong Blender. Tính năng định vị và kiểm tra bộ phận hoạt động độc lập qua semantic hitboxes.',
    bindings,
  };
}

/**
 * Updates smooth opening/closing animation for vehicle doors if supported by the GLB.
 */
export function updateDoorAnimation(
  registry: DoorBindingRegistry,
  activeDoorPartCode: string | null,
  delta: number
): void {
  if (!registry.isSupported) return;

  for (const [partCode, binding] of Object.entries(registry.bindings)) {
    const targetNode = binding.pivot || binding.visualNode;
    if (!targetNode) continue;

    const shouldBeOpen = activeDoorPartCode === partCode;
    binding.targetAngle = shouldBeOpen ? binding.openAngleRad : 0;

    // Smooth frame-rate-independent lerp animation
    const lerpFactor = 1 - Math.exp(-delta * 6.0);
    binding.currentAngle = THREE.MathUtils.lerp(
      binding.currentAngle,
      binding.targetAngle,
      lerpFactor
    );

    targetNode.rotation.y = binding.currentAngle;
  }
}
