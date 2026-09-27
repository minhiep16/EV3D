# EVShare 3D Vehicle Camera & Interaction Architecture

This directory establishes the centralized, reusable camera preset and pointer interaction system for EVShare 3D Virtual Garage.

---

## 1. Core Principles for All Phases (Current & Future Phase 14+)

1. **NEVER Scale EV01 Down for Framing**:
   Always adjust camera position, target, distance, or field-of-view instead of modifying the 3D model scale.
2. **Panel-Safe Framing (Center-Left EV01 + Right Panel)**:
   When a feature displays a UI detail card on the right, use a preset with `panelSide: 'right'` and `panelOffsetX` (typically `+0.85` to `+1.15`). This ensures EV01 occupies the left ~55–65% of the screen while the panel occupies ~30–40% with clean breathing room.
3. **EV01 Remains the Orbit Target**:
   Camera controls target must resolve to the vehicle anchor (`getVehicleAnchor(role)`). Never orbit around the world origin `[0, 0, 0]` when the vehicle is positioned elsewhere.
4. **Full 360° Horizontal Orbit**:
   Horizontal rotation around the vehicle is unlimited (-180° to +180°). Vertical polar rotation is constrained between ~35° (`0.61 rad`) and ~82° (`1.43 rad`) to prevent camera clipping below the floor or extreme top-down angles.
5. **Zoom Boundaries**:
   `minDistance` (~4.8–5.2m) prevents the camera from clipping into the vehicle hood or windshield. `maxDistance` (~12.5–13.5m) prevents the car from shrinking into a speck.
6. **Centralized Click-vs-Drag Threshold**:
   A pointer movement threshold of **6px** (`INTERACTION_CONFIG.clickDragThresholdPx`) strictly distinguishes intentional clicks from camera orbit gestures. Dragging never triggers part selection, damage placement, or deselection.

---

## 2. How to Request a Camera Preset in a Feature

Avoid direct camera manipulation (`camera.position.set(...)`, `controls.target.set(...)`) in individual components.
Instead, use the centralized preset resolver:

```typescript
import { resolveActiveCameraPresetKey, getVehicleCameraPreset } from '../config/vehicleCameraPresets';

// The camera controller automatically evaluates active world store flags:
// - vehicleBookingMode -> 'VEHICLE_BOOKING'
// - vehicleHandoverMode -> 'HANDOVER_INSPECTION'
// - vehicleDamageMappingMode -> 'DAMAGE_MAPPING'
// - selectedVehicleId -> 'VEHICLE_WITH_RIGHT_PANEL'
// - default -> 'OVERVIEW'
```

---

## 3. How to Register a New Preset for a New Phase

1. Add the preset key to `VehiclePresetKey` in `frontend/src/config/vehicleCameraPresets.ts`:
   ```typescript
   export type VehiclePresetKey =
     | 'OVERVIEW'
     | ...
     | 'NEW_PHASE_PRESET';
   ```
2. Configure preset coordinates and limits in `getVehicleCameraPreset(...)`:
   ```typescript
   case 'NEW_PHASE_PRESET': {
     const panelOffsetX = 1.0;
     return {
       target: [vx + panelOffsetX, vy + 0.85, vz],
       position: [vx + panelOffsetX, vy + 2.5, vz + 7.8 * responsiveFactor],
       minDistance: 5.0,
       maxDistance: 13.0,
       minPolarAngle: 0.61,
       maxPolarAngle: 1.43,
       enableRotate: true,
       enableZoom: true,
       enablePan: true,
       panelSide: 'right',
       panelOffsetX,
       transitionDuration: 0.6,
     };
   }
   ```
3. Map the mode flag in `resolveActiveCameraPresetKey(...)`.
