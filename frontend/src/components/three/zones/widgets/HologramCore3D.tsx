import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HologramCore3DProps {
  position?: [number, number, number];
  color?: string;
}

/**
 * HologramCore3D: Authoritative 3D Spatial Projection Engine
 * Centered above the vehicle roof and podium matching reference design.
 * 
 * Composition:
 * 1. Center Crystal Core at y = -0.15 (sits directly in the central opening beneath the Quỹ Chung banner)
 * 2. Horizontal Concentric Glowing Projection Rings at y = -0.32 (encircling projection waist)
 * 3. Vertical Projection Light Ray Streamers from vehicle roof (y = -1.13) to projection rings
 * 4. Translucent Conical Light Beam connecting vehicle roof to the hologram
 * 5. Vehicle Roof Emitter Rings (y = -1.13) grounding the projection to the car
 * 6. Vertical Energy Streamer funneling power upward into the Quỹ Chung banner
 */
export const HologramCore3D: React.FC<HologramCore3DProps> = ({
  position = [0, 0, 0],
  color = '#00f2fe',
}) => {
  // Crystal core refs
  const crystalGroupRef = useRef<THREE.Group>(null);
  const crystalMeshRef = useRef<THREE.Mesh>(null);
  const crystalWireRef = useRef<THREE.Mesh>(null);
  const crystalCoreRef = useRef<THREE.Mesh>(null);

  // Projection ring refs (encircling crystal & projection zone)
  const ringGroupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const tickOrbitRef = useRef<THREE.Mesh>(null);
  const gimbalRingRef = useRef<THREE.Group>(null);
  const satellitesGroupRef = useRef<THREE.Group>(null);

  // Projection beam & rays refs
  const beamRef = useRef<THREE.Mesh>(null);
  const raysGroupRef = useRef<THREE.Group>(null);
  const roofRingsRef = useRef<THREE.Group>(null);
  const energyStreamRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Crystal core floating breathing & rotation (y = -0.10)
    if (crystalGroupRef.current) {
      crystalGroupRef.current.position.y = -0.10 + Math.sin(time * 1.8) * 0.020;
    }
    if (crystalMeshRef.current) {
      crystalMeshRef.current.rotation.y += delta * 0.85;
      crystalMeshRef.current.rotation.z = Math.sin(time * 1.5) * 0.12;
    }
    if (crystalWireRef.current) {
      crystalWireRef.current.rotation.y -= delta * 0.55;
      crystalWireRef.current.rotation.x = Math.cos(time * 1.3) * 0.10;
    }
    if (crystalCoreRef.current) {
      const scale = 1.0 + Math.sin(time * 3.5) * 0.15;
      crystalCoreRef.current.scale.set(scale, scale, scale);
    }

    // 2. Horizontal projection rings rotation (y = -0.26)
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.22;
    }
    if (tickOrbitRef.current) {
      tickOrbitRef.current.rotation.z -= delta * 0.35;
    }
    if (midRingRef.current) {
      midRingRef.current.rotation.z += delta * 0.55;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.85;
    }
    if (gimbalRingRef.current) {
      gimbalRingRef.current.rotation.y += delta * 0.65;
      gimbalRingRef.current.rotation.z += delta * 0.35;
    }
    if (satellitesGroupRef.current) {
      satellitesGroupRef.current.rotation.y += delta * 0.95;
    }

    // 3. Conical projection beam breathing opacity
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.15 + Math.sin(time * 2.2) * 0.03;
      }
    }

    // 4. Vertical projection light rays rotation
    if (raysGroupRef.current) {
      raysGroupRef.current.rotation.y += delta * 0.18;
    }

    // 5. Vehicle roof emitter rings rotation
    if (roofRingsRef.current) {
      roofRingsRef.current.rotation.z -= delta * 0.30;
    }

    // 6. Upward energy stream pulse
    if (energyStreamRef.current) {
      const mat = energyStreamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.35 + Math.sin(time * 4.0) * 0.12;
      }
    }
  });

  return (
    <group position={position}>
      {/* ======================================================== */}
      {/* 1. CENTER CRYSTAL CORE (DATA-ENERGY HUB)                 */}
      {/* Positioned at y = -0.10, nestled in the central opening  */}
      {/* ======================================================== */}
      <group ref={crystalGroupRef} position={[0, -0.10, 0.02]}>
        {/* Faceted 3D Octahedron Crystal Core (Translucent Gem with High Transmission) */}
        <mesh ref={crystalMeshRef} castShadow={false}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            emissive={color}
            emissiveIntensity={0.65}
            roughness={0.08}
            metalness={0.06}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
            reflectivity={0.90}
            transmission={0.65}
            ior={1.48}
            transparent
            opacity={0.82}
          />
        </mesh>

        {/* Inner Wireframe Digital Matrix Cage (Delicate Cyan/White Edges) */}
        <mesh ref={crystalWireRef}>
          <octahedronGeometry args={[0.165, 0]} />
          <meshBasicMaterial
            color="#ffffff"
            wireframe
            transparent
            opacity={0.40}
          />
        </mesh>

        {/* Internal Glowing Core Singularity */}
        <mesh ref={crystalCoreRef}>
          <sphereGeometry args={[0.026, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
        </mesh>

        {/* Subtle Accent Point Light (Soft glow on crystal & rings, zero spill on vehicle) */}
        <pointLight color={color} intensity={0.40} distance={2.0} decay={2} />

        {/* Gyroscopic Tilted Ring around Crystal */}
        <group ref={gimbalRingRef} rotation={[0.38, 0, 0.25]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.33, 0.345, 48]} />
            <meshBasicMaterial
              color={color}
              side={THREE.DoubleSide}
              transparent
              opacity={0.45}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>

        {/* Fast Inner Arc Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.235, 32, 1, 0, Math.PI * 1.5]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            side={THREE.DoubleSide}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Orbital Energy Satellites */}
        <group ref={satellitesGroupRef}>
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => {
            const rad = 0.32;
            const x = Math.cos(angle) * rad;
            const z = Math.sin(angle) * rad;
            return (
              <mesh key={`sat-${i}`} position={[x, 0, z]}>
                <octahedronGeometry args={[0.012, 0]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive={color}
                  emissiveIntensity={1.2}
                />
              </mesh>
            );
          })}
        </group>
      </group>

      {/* ======================================================== */}
      {/* 2. HORIZONTAL PROJECTION RINGS (y = -0.26)               */}
      {/* Elegant, thin concentric rings framing projection waist  */}
      {/* ======================================================== */}
      <group ref={ringGroupRef} position={[0, -0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Outer Halo Glow Ring */}
        <mesh position={[0, 0, -0.002]}>
          <ringGeometry args={[0.67, 0.73, 64]} />
          <meshBasicMaterial
            color={color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Outer Fine Precision Orbit Ring */}
        <mesh ref={outerRingRef} position={[0, 0, 0]}>
          <ringGeometry args={[0.70, 0.712, 64]} />
          <meshBasicMaterial
            color={color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Technical Orbit with Divisions */}
        <mesh ref={tickOrbitRef} position={[0, 0, 0.01]}>
          <ringGeometry args={[0.56, 0.57, 48]} />
          <meshBasicMaterial
            color="#ffffff"
            side={THREE.DoubleSide}
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Middle Segmented Arc Ring */}
        <mesh ref={midRingRef} position={[0, 0, 0.02]}>
          <ringGeometry args={[0.44, 0.458, 48, 1, 0, Math.PI * 1.6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.2}
            side={THREE.DoubleSide}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Inner Rapid Glow Ring */}
        <mesh ref={innerRingRef} position={[0, 0, 0.03]}>
          <ringGeometry args={[0.28, 0.295, 36]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.4}
            side={THREE.DoubleSide}
            transparent
            opacity={0.70}
          />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 3. VERTICAL PROJECTION LIGHT RAYS & CONE (VEHICLE TO RING)*/}
      {/* Extends from vehicle roof (y = -1.08) to rings (y = -0.26)*/}
      {/* ======================================================== */}
      {/* Conical Light Beam (Ethereal Sheer Volumetric Column) */}
      <mesh ref={beamRef} position={[0, -0.67, 0]}>
        <cylinderGeometry args={[0.58, 0.30, 0.82, 48, 1, true]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Vertical Holographic Projector Ray Streamers (18 fine light columns) */}
      <group ref={raysGroupRef}>
        {Array.from({ length: 18 }).map((_, i) => {
          const angle = (i / 18) * Math.PI * 2;
          const topRadius = 0.52;
          const bottomRadius = 0.27;
          const topX = Math.cos(angle) * topRadius;
          const topZ = Math.sin(angle) * topRadius;
          const bottomX = Math.cos(angle) * bottomRadius;
          const bottomZ = Math.sin(angle) * bottomRadius;
          const midX = (topX + bottomX) / 2;
          const midZ = (topZ + bottomZ) / 2;

          return (
            <mesh key={`ray-${i}`} position={[midX, -0.67, midZ]}>
              <cylinderGeometry args={[0.002, 0.002, 0.82, 6]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.20}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          );
        })}
      </group>

      {/* ======================================================== */}
      {/* 4. VEHICLE ROOF EMITTER RINGS (y = -1.08)                */}
      {/* Physically anchors projection to the vehicle roofline    */}
      {/* ======================================================== */}
      <group position={[0, -1.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Outer Roof Ring */}
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.38, 0.405, 48]} />
          <meshBasicMaterial
            color={color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.40}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Inner Roof Ring */}
        <mesh ref={roofRingsRef} position={[0, 0, 0.02]}>
          <ringGeometry args={[0.23, 0.255, 36, 1, 0, Math.PI * 1.8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.1}
            side={THREE.DoubleSide}
            transparent
            opacity={0.55}
          />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 5. VERTICAL ENERGY STREAM TO QUỸ CHUNG BANNER (UPWARD)   */}
      {/* Connects crystal core (y = -0.10) to center banner       */}
      {/* ======================================================== */}
      <mesh ref={energyStreamRef} position={[0, 0.04, 0.01]}>
        <cylinderGeometry args={[0.015, 0.030, 0.22, 16, 1, true]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};


