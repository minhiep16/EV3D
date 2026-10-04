import React from 'react';
import * as THREE from 'three';
import { useWorldStore } from '../../store/worldStore';
import { shouldShowShowroomBranding } from '../../config/garageZoneVisibility';

/**
 * GarageStructure - High-End Futuristic EV Showroom Architecture
 * Modeled strictly after the EVShare 3D Reference Design:
 * - Sweeping panoramic floor-to-ceiling daylight windows overlooking sunny waterfront bay & modern city skyline
 * - Interior glass balustrade railing along the panoramic window
 * - Overhead curved white ceiling canopy with concentric recessed white & cyan LED halo rings
 * - Left architectural white wall with ultra-minimal wall-mounted charging stations & standing kiosk
 * - Brushed stainless-steel / aluminum cylindrical columns flanking the panoramic view
 * - Sleek, low-height architectural planter troughs with delicate, realistic indoor trees & botanical foliage
 * - Open, spacious, daylight-flooded luxury showroom shell
 */
export const GarageStructure: React.FC = () => {
  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const vehicleMaintenanceMode = useWorldStore((state) => state.vehicleMaintenanceMode);
  const vehicleBatteryXrayMode = useWorldStore((state) => state.vehicleBatteryXrayMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const vehicleDamageHistoryMode = useWorldStore((state) => state.vehicleDamageHistoryMode);
  const vehicleChargingMode = useWorldStore((state) => state.vehicleChargingMode);
  const vehicleTripStartMode = useWorldStore((state) => state.vehicleTripStartMode);
  const vehicleTripVisualizationMode = useWorldStore((state) => state.vehicleTripVisualizationMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const vehicleReceiptReviewMode = useWorldStore((state) => state.vehicleReceiptReviewMode);
  const vehicleCoOwnershipMode = useWorldStore((state) => state.vehicleCoOwnershipMode);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const isVehicleSelected = useWorldStore((state) => state.isVehicleSelected);
  const selectedZone = useWorldStore((state) => state.selectedZone);

  // Centralized Rule: Hide decorative floating wall branding during ALL primary business panels & submodes
  const showBranding = shouldShowShowroomBranding({
    vehicleBookingMode,
    vehicleMaintenanceMode,
    vehicleBatteryXrayMode,
    vehicleDamageMappingMode,
    vehicleDamageHistoryMode,
    vehicleChargingMode,
    vehicleTripStartMode,
    vehicleTripVisualizationMode,
    vehicleHandoverMode,
    vehicleReceiptReviewMode,
    vehicleCoOwnershipMode,
    vehicleInspectionMode,
    selectedVehicleId,
    isVehicleSelected,
    selectedZone,
  });

  // Curved Panoramic Window Glass Panels (5 wide, elegant curved glass panes matching reference curvature)
  const windowPanels = [
    { x: -10.2, z: -6.2, rotY: 0.35, width: 5.6 },
    { x: -5.3, z: -8.2, rotY: 0.17, width: 5.4 },
    { x: 0.0, z: -8.8, rotY: 0.0, width: 5.4 },
    { x: 5.3, z: -8.2, rotY: -0.17, width: 5.4 },
    { x: 10.2, z: -6.2, rotY: -0.35, width: 5.6 },
  ];

  // Distant City Skyline Towers (Vibrant, high-fidelity architectural towers across the bay)
  const skylineTowers = [
    { x: -28, width: 3.4, height: 11.0, depth: 2.6, color: '#93c5fd' },
    { x: -23, width: 2.8, height: 14.5, depth: 2.8, color: '#f8fafc', setback: true },
    { x: -18, width: 3.6, height: 10.2, depth: 2.4, color: '#7dd3fc' },
    { x: -13, width: 2.8, height: 17.0, depth: 2.6, color: '#f8fafc', setback: true },
    { x: -8.5, width: 3.2, height: 12.8, depth: 2.8, color: '#93c5fd' },
    { x: -4.0, width: 3.6, height: 19.2, depth: 3.2, color: '#f8fafc', setback: true },
    { x: 1.0, width: 2.8, height: 15.0, depth: 2.5, color: '#7dd3fc' },
    // Landmark Signature Skyscraper with Angled Crown & Needle Spire (Center-Right in reference)
    { x: 6.8, width: 4.2, height: 23.0, depth: 3.8, color: '#f8fafc', isLandmark: true },
    { x: 12.2, width: 2.8, height: 17.5, depth: 2.8, color: '#93c5fd', setback: true },
    { x: 16.8, width: 3.8, height: 13.0, depth: 2.8, color: '#f8fafc' },
    { x: 21.5, width: 3.0, height: 15.5, depth: 2.6, color: '#7dd3fc', setback: true },
    { x: 26.5, width: 3.8, height: 11.5, depth: 2.6, color: '#f8fafc' },
    { x: 31.0, width: 3.2, height: 9.5, depth: 2.4, color: '#93c5fd' },
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* =========================================================================
          1. BRIGHT DAYLIGHT WATERFRONT & MODERN CITY SKYLINE PANORAMA
          ========================================================================= */}
      <group name="DaylightWaterfrontAndSkyline" position={[0, 0, -30]}>
        {/* Sunny Summer Sky Backdrop Plane */}
        <mesh position={[0, 15, -9]}>
          <planeGeometry args={[120, 36]} />
          <meshBasicMaterial color="#a0d5f8" />
        </mesh>

        {/* Soft Fluffy White Clouds */}
        {[-34, -18, 0, 18, 36].map((cx, cidx) => (
          <mesh key={`cloud-${cidx}`} position={[cx, 21.0 + (cidx % 2) * 1.8, -8.2]}>
            <planeGeometry args={[20, 5.2]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.72} />
          </mesh>
        ))}

        {/* Distant Atmospheric Horizon Depth Haze Plane (Soft gradient behind towers) */}
        <mesh position={[0, 7.5, -4.5]}>
          <planeGeometry args={[115, 16]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={0.28} />
        </mesh>

        {/* Distant Waterfront Bay / Lake (Sparkling Blue Daylight Water with High Specular Sheen) */}
        <mesh position={[0, -0.05, 10]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[115, 26]} />
          <meshStandardMaterial
            color="#0ea5e9"
            roughness={0.12}
            metalness={0.72}
          />
        </mesh>

        {/* Waterfront Embankment & Summer Park Lawn */}
        <mesh position={[0, 0.15, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[110, 3.4]} />
          <meshStandardMaterial color="#16a34a" roughness={0.65} />
        </mesh>

        {/* Lush Greenery Tree Line Along Waterfront Shoreline */}
        {[-30, -26, -22, -18, -14, -10, -6, -2, 2, 6, 10, 14, 18, 22, 26, 30].map((tx, tidx) => (
          <group key={`shoretree-${tidx}`} position={[tx, 0.55, -0.6 + (tidx % 3) * 0.2]}>
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.08, 0.12, 0.9, 6]} />
              <meshStandardMaterial color="#78716c" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.30, 0]}>
              <sphereGeometry args={[0.90 + (tidx % 2) * 0.22, 12, 12]} />
              <meshStandardMaterial
                color={tidx % 2 === 0 ? '#15803d' : '#16a34a'}
                roughness={0.50}
              />
            </mesh>
          </group>
        ))}

        {/* Modern 3D Architectural City Skyline Towers Across the Water */}
        {skylineTowers.map((tower, idx) => (
          <group key={`tower-${idx}`} position={[tower.x, tower.height / 2 + 0.2, -3.5]}>
            {/* Tower Facade Body */}
            <mesh>
              <boxGeometry args={[tower.width, tower.height, tower.depth]} />
              <meshStandardMaterial
                color={tower.color}
                roughness={0.16}
                metalness={0.80}
              />
            </mesh>

            {/* Stepped Architectural Penthouse Setback */}
            {tower.setback && (
              <mesh position={[0, tower.height / 2 + 1.2, 0]}>
                <boxGeometry args={[tower.width * 0.72, 2.4, tower.depth * 0.72]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.18} metalness={0.75} />
              </mesh>
            )}

            {/* Vertical White Window Strips / Mullion Facade */}
            {[-tower.width * 0.32, 0, tower.width * 0.32].map((vx, vidx) => (
              <mesh key={`vstrip-${vidx}`} position={[vx, 0, tower.depth / 2 + 0.04]}>
                <boxGeometry args={[0.08, tower.height * 0.96, 0.02]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.8} />
              </mesh>
            ))}

            {/* Landmark Center-Right Angled Crown & Needle Spire */}
            {tower.isLandmark && (
              <group position={[0, tower.height / 2, 0]}>
                {/* Sloped Glass Crown */}
                <mesh position={[0, 2.2, 0]} rotation={[0, 0, -0.22]}>
                  <cylinderGeometry args={[0.4, tower.width * 0.75, 4.4, 4]} />
                  <meshStandardMaterial color="#38bdf8" roughness={0.10} metalness={0.88} />
                </mesh>
                {/* Needle Antenna Spire */}
                <mesh position={[-0.4, 5.2, 0]}>
                  <cylinderGeometry args={[0.04, 0.12, 3.2, 8]} />
                  <meshStandardMaterial color="#ffffff" metalness={0.96} roughness={0.08} />
                </mesh>
              </group>
            )}
          </group>
        ))}
      </group>

      {/* =========================================================================
          2. SWEEPING CURVED PANORAMIC GLASS CURTAIN WALL & BALUSTRADE
          ========================================================================= */}
      <group name="PanoramicCurvedGlazing">
        {windowPanels.map((panel, pidx) => (
          <group key={`win-${pidx}`} position={[panel.x, 4.5, panel.z]} rotation={[0, panel.rotY, 0]}>
            {/* High-Transparency Architectural Glass Curtain Wall with Clearcoat Specular */}
            <mesh receiveShadow>
              <planeGeometry args={[panel.width, 9.0]} />
              <meshPhysicalMaterial
                color="#f0f9ff"
                roughness={0.02}
                metalness={0.08}
                clearcoat={1.0}
                clearcoatRoughness={0.02}
                reflectivity={0.96}
                transparent
                opacity={0.10}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Ultra-Slender Vertical Dark Titanium Mullion (Hairline) */}
            <mesh position={[panel.width / 2, 0, 0.02]} castShadow>
              <boxGeometry args={[0.038, 9.0, 0.05]} />
              <meshStandardMaterial color="#334155" roughness={0.30} metalness={0.80} />
            </mesh>

            {/* Slender Top Transom Header */}
            <mesh position={[0, 4.48, 0.02]}>
              <boxGeometry args={[panel.width, 0.035, 0.045]} />
              <meshStandardMaterial color="#475569" roughness={0.30} metalness={0.80} />
            </mesh>

            {/* Slender Bottom Sill Rail */}
            <mesh position={[0, -4.48, 0.02]}>
              <boxGeometry args={[panel.width, 0.04, 0.05]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.25} metalness={0.75} />
            </mesh>

            {/* Interior Glass Balustrade Panel (Waist-height railing along window from reference) */}
            <group position={[0, -3.95, 0.22]}>
              {/* Balustrade Glass */}
              <mesh>
                <planeGeometry args={[panel.width * 0.98, 1.05]} />
                <meshPhysicalMaterial
                  color="#e0f2fe"
                  roughness={0.03}
                  metalness={0.08}
                  clearcoat={1.0}
                  transparent
                  opacity={0.15}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Metallic Top Handrail */}
              <mesh position={[0, 0.53, 0]}>
                <boxGeometry args={[panel.width * 0.98, 0.025, 0.03]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* =========================================================================
          3. LEFT CURVED ARCHITECTURAL WHITE WALL & MINIMALIST CHARGING STATIONS
          ========================================================================= */}
      <group name="LeftArchitecturalWall" position={[-9.2, 0, 1.5]}>
        {/* Main Smooth White Architectural Shell Wall */}
        <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.35, 9.0, 8.5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.45} metalness={0.05} />
        </mesh>

        {/* Soft Curved Corner Extending toward Foreground */}
        <mesh position={[0.7, 4.5, 4.2]} rotation={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.32, 9.0, 2.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.45} metalness={0.05} />
        </mesh>

        {/* Subtle Warm-White Perimeter Cove LED Glow Line */}
        <mesh position={[0.18, 4.5, 4.2]} rotation={[0, 0.42, 0]}>
          <boxGeometry args={[0.015, 8.9, 0.02]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* --- Minimalist Wall-Mounted EV Charging Pillar 1 --- */}
        <group position={[0.20, 2.1, 1.4]}>
          {/* Slim Matte-White Casing */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.08, 1.35, 0.26]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.1} />
          </mesh>
          {/* Flush Black Glass Center Strip */}
          <mesh position={[0.042, 0.04, 0]}>
            <boxGeometry args={[0.008, 1.05, 0.14]} />
            <meshPhysicalMaterial
              color="#0b1320"
              roughness={0.10}
              metalness={0.85}
              clearcoat={1.0}
            />
          </mesh>
          {/* Hairline Cyan Status LED Strip */}
          <mesh position={[0.048, 0.06, 0]}>
            <boxGeometry args={[0.005, 0.65, 0.012]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.85} />
          </mesh>
          {/* Slender Side Cable Loop */}
          <mesh position={[0, -0.2, 0.17]} rotation={[0, 0, 0.12]}>
            <cylinderGeometry args={[0.012, 0.012, 0.9, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
        </group>

        {/* --- Minimalist Wall-Mounted EV Charging Pillar 2 --- */}
        <group position={[0.20, 2.1, 2.8]}>
          {/* Slim Matte-White Casing */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.08, 1.35, 0.26]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.1} />
          </mesh>
          {/* Flush Black Glass Center Strip */}
          <mesh position={[0.042, 0.04, 0]}>
            <boxGeometry args={[0.008, 1.05, 0.14]} />
            <meshPhysicalMaterial
              color="#0b1320"
              roughness={0.10}
              metalness={0.85}
              clearcoat={1.0}
            />
          </mesh>
          {/* Hairline Cyan Status LED Strip */}
          <mesh position={[0.048, 0.06, 0]}>
            <boxGeometry args={[0.005, 0.65, 0.012]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.85} />
          </mesh>
          {/* Slender Side Cable Loop */}
          <mesh position={[0, -0.2, 0.17]} rotation={[0, 0, 0.12]}>
            <cylinderGeometry args={[0.012, 0.012, 0.9, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
        </group>

        {/* --- Minimalist Check-In Kiosk Stand --- */}
        <group position={[1.1, 0, -0.4]} rotation={[0, 0.32, 0]}>
          {/* Slim White Tapered Pedestal */}
          <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.24, 0.92, 0.20]} />
            <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.1} />
          </mesh>
          {/* Angled Touch Tablet Screen */}
          <group position={[0, 0.94, 0.03]} rotation={[-0.52, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.34, 0.018, 0.24]} />
              <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
              <planeGeometry args={[0.30, 0.20]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        </group>
      </group>

      {/* =========================================================================
          4. POLISHED BRUSHED-METAL CYLINDRICAL COLUMNS (FLANKING PANORAMA)
          ========================================================================= */}
      <group name="BrushedMetallicColumns">
        {/* Left Column (Beside Window & Left Wall) */}
        <group position={[-7.8, 4.8, -3.4]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.54, 0.54, 9.6, 64]} />
            <meshStandardMaterial
              color="#889bb0"
              metalness={0.96}
              roughness={0.18}
            />
          </mesh>
          {/* Ceiling Collar Ring */}
          <mesh position={[0, 4.75, 0]}>
            <cylinderGeometry args={[0.64, 0.58, 0.18, 64]} />
            <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.24} />
          </mesh>
          {/* Base Plinth Collar Ring */}
          <mesh position={[0, -4.75, 0]} receiveShadow>
            <cylinderGeometry args={[0.58, 0.64, 0.14, 64]} />
            <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.24} />
          </mesh>
        </group>

        {/* Right Column (Flanking Right Side of Window - Hero Foreground Column in Reference) */}
        <group position={[8.8, 4.8, -1.6]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.56, 0.56, 9.6, 64]} />
            <meshStandardMaterial
              color="#889bb0"
              metalness={0.96}
              roughness={0.18}
            />
          </mesh>
          {/* Ceiling Collar Ring */}
          <mesh position={[0, 4.75, 0]}>
            <cylinderGeometry args={[0.66, 0.60, 0.18, 64]} />
            <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.24} />
          </mesh>
          {/* Base Plinth Collar Ring */}
          <mesh position={[0, -4.75, 0]} receiveShadow>
            <cylinderGeometry args={[0.60, 0.66, 0.14, 64]} />
            <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.24} />
          </mesh>
        </group>
      </group>

      {/* =========================================================================
          5. SUBTLE ARCHITECTURAL INDOOR GREENERY (DELICATE, NATURAL SILHOUETTES)
          ========================================================================= */}
      <group name="ArchitecturalPlanters">
        {/* Left Planter Trough with Realistic Indoor Ficus Tree near Column */}
        <group position={[-7.2, 0, -2.4]}>
          {/* Low Minimalist White Planter Box */}
          <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.32, 0.7]} />
            <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.06} />
          </mesh>
          {/* Soil Bed */}
          <mesh position={[0, 0.31, 0]}>
            <boxGeometry args={[1.32, 0.02, 0.62]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          {/* Indoor Tree Multi-Stem Trunk Structure */}
          <group position={[0, 0.32, 0]}>
            <mesh position={[-0.1, 0.65, 0]} rotation={[0.05, 0, 0.08]}>
              <cylinderGeometry args={[0.025, 0.045, 1.3, 8]} />
              <meshStandardMaterial color="#78716c" roughness={0.8} />
            </mesh>
            <mesh position={[0.08, 0.75, -0.04]} rotation={[-0.08, 0, -0.1]}>
              <cylinderGeometry args={[0.02, 0.04, 1.5, 8]} />
              <meshStandardMaterial color="#78716c" roughness={0.8} />
            </mesh>
            {/* Delicate Leafy Foliage Spheres (Fresh Natural Summer Green) */}
            {[
              { pos: [-0.22, 1.45, 0.1], scale: 0.38 },
              { pos: [0.18, 1.55, -0.06], scale: 0.42 },
              { pos: [-0.05, 1.85, 0.02], scale: 0.45 },
              { pos: [0.12, 2.1, 0.0], scale: 0.35 },
            ].map((f, fidx) => (
              <mesh key={`ficus-${fidx}`} position={f.pos as [number, number, number]} castShadow>
                <sphereGeometry args={[f.scale, 16, 16]} />
                <meshStandardMaterial
                  color={fidx % 2 === 0 ? '#15803d' : '#16a34a'}
                  roughness={0.45}
                />
              </mesh>
            ))}
            {/* Low Shrub Clusters around Base */}
            {[-0.4, -0.15, 0.15, 0.4].map((sx, sidx) => (
              <mesh key={`shrub-${sidx}`} position={[sx, 0.08, (sidx % 2 === 0 ? 0.12 : -0.12)]} castShadow>
                <sphereGeometry args={[0.15, 12, 12]} />
                <meshStandardMaterial color="#166534" roughness={0.55} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Right Low Planter Trough with Subtle Ground Foliage */}
        <group position={[8.2, 0, -1.9]}>
          {/* Low Minimalist White Box */}
          <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.7, 0.32, 0.5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.06} />
          </mesh>
          {/* Soil Bed */}
          <mesh position={[0, 0.31, 0]}>
            <boxGeometry args={[1.62, 0.02, 0.42]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          {/* Subtle Low Botanical Clusters */}
          {[-0.55, -0.18, 0.20, 0.55].map((px, pidx) => (
            <mesh key={`rplant-${pidx}`} position={[px, 0.44, (pidx % 2 === 0 ? 0.03 : -0.03)]} castShadow>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#15803d" roughness={0.55} />
            </mesh>
          ))}
        </group>


      </group>

      {/* =========================================================================
          6. SWEEPING CURVED CEILING CANOPY & DUAL CONCENTRIC WHITE/CYAN HALO RINGS
          ========================================================================= */}
      <group name="CurvedCeilingAndHaloRings" position={[0, 7.4, 2.5]}>
        {/* Main Architectural Smooth White Curved Ceiling Canopy */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[16.0, 16.5, 0.4, 96]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.30} metalness={0.06} />
        </mesh>

        {/* Recessed Dome Ceiling Disc */}
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[7.8, 96]} />
          <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.04} />
        </mesh>

        {/* Outer Circular Recessed Pure White LED Light Ring Channel (High Luminous Brilliance) */}
        <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.10, 6.38, 128]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.4}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Outer Bevel Reveal Lip Trim */}
        <mesh position={[0, -0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.38, 6.45, 128]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.20} />
        </mesh>
        <mesh position={[0, -0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.03, 6.10, 128]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.20} />
        </mesh>

        {/* Inner Circular Recessed Cyan Accent Light Ring Channel (Crisp Refined Cyan Accent) */}
        <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.30, 4.48, 128]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={1.0}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Inner Bevel Reveal Lip Trim */}
        <mesh position={[0, -0.027, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.48, 4.54, 128]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.20} />
        </mesh>
        <mesh position={[0, -0.027, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.24, 4.30, 128]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.20} />
        </mesh>

        {/* Center Recessed Studio Downlight Plate */}
        <mesh position={[0, -0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.36, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Perimeter Ceiling Cove Lighting Channel (Sweeping arch along panoramic window header) */}
        <mesh position={[0, -0.015, -4.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[11.8, 11.95, 64, 1, Math.PI * 0.75, Math.PI * 1.5]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};
