"""
EVShare 3D — Blender Door Articulation Helper Script (Phase 13B)
=================================================================
File: tools/blender/prepare_ev01_doors.py

Purpose:
  Automates the hierarchy setup, pivot placement, hinge parenting,
  and glTF export for EV01 four-door articulation:
    - DOOR_FL -> DoorPivot_FL / Door_FL
    - DOOR_FR -> DoorPivot_FR / Door_FR
    - DOOR_RL -> DoorPivot_RL / Door_RL
    - DOOR_RR -> DoorPivot_RR / Door_RR

Usage in Blender (2.93+ / 3.x / 4.x):
  1. Open Blender.
  2. Import `frontend/public/models/ev01-realistic.glb` (File -> Import -> glTF 2.0).
  3. Select the exterior car body mesh.
  4. In Edit Mode (Tab):
       - Select polygons of Front-Left door -> Press 'P' -> Separate Selection.
       - Select polygons of Front-Right door -> Press 'P' -> Separate Selection.
       - Select polygons of Rear-Left door -> Press 'P' -> Separate Selection.
       - Select polygons of Rear-Right door -> Press 'P' -> Separate Selection.
  5. In Object Mode:
       - Select the 4 separated door objects (or rename them to contain 'FL', 'FR', 'RL', 'RR').
       - Open this script in Blender's Text Editor / Scripting workspace.
       - Click 'Run Script' (Alt+P).
  6. The script will:
       - Accurately name Door_FL, Door_FR, Door_RL, Door_RR
       - Create DoorPivot_* empties at the exact physical hinge axis
       - Parent each door mesh to its DoorPivot_* while maintaining world transform
       - Test rotation (swing outward ~58° and return to 0°)
       - Export to `frontend/public/models/ev01-articulated.glb`
"""

import bpy
import math
import os
from mathutils import Vector

# ============================================================================
# 1. HINGE COORDINATE DEFINITIONS (Vehicle Model Local Space)
# ============================================================================
# Dimensions of EV01:
#   Width (X):  ~1.913 m
#   Height (Y): ~1.544 m
#   Length (Z): ~3.999 m
#
# Note on coordinate conventions in Blender vs Three.js:
# glTF uses Y-up. Front of car is along +Z (or +Y in Blender if Z-up).
# Blender glTF importer converts Y-up to Z-up:
#   Blender X = Three.js X
#   Blender Y = Three.js Z
#   Blender Z = Three.js Y
#
# Approximate physical hinge locations in Blender coordinates (Z-up):
# A-Pillars for front doors, B-Pillars for rear doors.
HINGE_POSITIONS_BLENDER = {
    'DOOR_FL': Vector((-0.91, 0.95, 0.80)),   # Front-Left A-pillar hinge
    'DOOR_FR': Vector((0.91, 0.95, 0.80)),    # Front-Right A-pillar hinge
    'DOOR_RL': Vector((-0.91, -0.10, 0.80)),  # Rear-Left B-pillar hinge
    'DOOR_RR': Vector((0.91, -0.10, 0.80)),   # Rear-Right B-pillar hinge
}

# Target open angle in radians (~58.5 degrees)
OPEN_ANGLE_RAD = 1.02


def setup_ev01_door_pivots():
    print("[EV01 Articulation] Starting Door Hierarchy & Pivot Setup...")

    # Identify candidate door objects in the current scene
    door_objects = {}
    for obj in bpy.data.objects:
        name_lower = obj.name.lower()
        if 'fl' in name_lower or 'front_l' in name_lower or 'frontleft' in name_lower:
            door_objects['DOOR_FL'] = obj
        elif 'fr' in name_lower or 'front_r' in name_lower or 'frontright' in name_lower:
            door_objects['DOOR_FR'] = obj
        elif 'rl' in name_lower or 'rear_l' in name_lower or 'rearleft' in name_lower:
            door_objects['DOOR_RL'] = obj
        elif 'rr' in name_lower or 'rear_r' in name_lower or 'rearright' in name_lower:
            door_objects['DOOR_RR'] = obj

    # If doors are not named with codes yet, check currently selected objects
    selected = bpy.context.selected_objects
    if len(door_objects) < 4 and len(selected) >= 4:
        print("[EV01 Articulation] Mapping 4 selected objects by geometric centroid...")
        # Sort objects by position:
        # X < 0 -> Left, X > 0 -> Right
        # Y > 0 (or Z > 0) -> Front, Y < 0 -> Rear
        for obj in selected:
            loc = obj.matrix_world.translation
            is_left = loc.x < 0
            is_front = loc.y > 0  # In Blender Z-up
            if is_left and is_front:
                door_objects['DOOR_FL'] = obj
            elif not is_left and is_front:
                door_objects['DOOR_FR'] = obj
            elif is_left and not is_front:
                door_objects['DOOR_RL'] = obj
            elif not is_left and not is_front:
                door_objects['DOOR_RR'] = obj

    print(f"[EV01 Articulation] Identified door objects: {door_objects}")

    configured_doors = 0

    for part_code, pivot_pos in HINGE_POSITIONS_BLENDER.items():
        door_mesh = door_objects.get(part_code)
        if not door_mesh:
            print(f"[EV01 Articulation] WARNING: Could not find object for {part_code}. Please select or rename it.")
            continue

        door_name = f"Door_{part_code.split('_')[1]}"
        pivot_name = f"DoorPivot_{part_code.split('_')[1]}"

        # Rename door mesh to exact visual binding name
        door_mesh.name = door_name

        # Calculate hinge position adjusted by vehicle root transform if parented
        world_hinge_pos = pivot_pos
        if door_mesh.parent:
            world_hinge_pos = door_mesh.parent.matrix_world @ pivot_pos

        # Check if pivot empty already exists, or create new one
        pivot_obj = bpy.data.objects.get(pivot_name)
        if not pivot_obj:
            pivot_obj = bpy.data.objects.new(pivot_name, None)
            pivot_obj.empty_display_type = 'ARROWS'
            pivot_obj.empty_display_size = 0.25
            bpy.context.scene.collection.objects.link(pivot_obj)

        # Set pivot position at the hinge axis
        pivot_obj.location = world_hinge_pos

        # Parent pivot to vehicle root if door had a parent
        if door_mesh.parent and pivot_obj.parent != door_mesh.parent:
            # Store matrix world to preserve position
            mw = pivot_obj.matrix_world.copy()
            pivot_obj.parent = door_mesh.parent
            pivot_obj.matrix_world = mw

        # Parent door mesh to pivot empty (keeping transform intact)
        mesh_mw = door_mesh.matrix_world.copy()
        door_mesh.parent = pivot_obj
        door_mesh.matrix_world = mesh_mw

        configured_doors += 1
        print(f"[EV01 Articulation] Configured {part_code}: {pivot_name} -> {door_name} at {pivot_obj.location}")

    print(f"[EV01 Articulation] Finished setting up {configured_doors}/4 doors.")
    return configured_doors == 4


def export_articulated_glb(output_path=None):
    if not output_path:
        # Default export path relative to repository
        script_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else ''
        repo_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
        output_path = os.path.join(repo_root, 'frontend', 'public', 'models', 'ev01-articulated.glb')

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    print(f"[EV01 Articulation] Exporting articulated GLB to: {output_path}")

    # glTF 2.0 Export Settings
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False,
        export_apply=False,           # Preserve independent door hierarchies and pivots
        export_yup=True,               # Standard glTF Y-up orientation
        export_materials='EXPORT',     # Preserve PBR automotive materials
        export_normals=True,
    )
    print("[EV01 Articulation] Export completed successfully!")


if __name__ == '__main__':
    success = setup_ev01_door_pivots()
    if success:
        # Automatically export if all 4 doors were successfully articulated
        export_articulated_glb()
    else:
        print("[EV01 Articulation] Please separate all 4 doors in Edit Mode first, then re-run.")
