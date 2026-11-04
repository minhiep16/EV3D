import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { EV01_REALISTIC_MODEL_URL } from '../vehicles/vehicleModelConfig';

// Rotating showcase vehicle on pedestal
const ShowcaseVehicle: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(EV01_REALISTIC_MODEL_URL);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.05, 0]}>
      <primitive
        object={gltf.scene.clone(true)}
        scale={[0.82, 0.82, 0.82]}
        position={[0, 0, 0]}
      />
    </group>
  );
};

// Holographic Showroom Pedestal
const ShowroomPedestal: React.FC = () => {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.15;
    }
  });

  return (
    <group position={[0, -0.05, 0]}>
      {/* Base platform */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <cylinderGeometry args={[3.2, 3.4, 0.3, 64]} />
        <meshStandardMaterial
          color="#0b172a"
          metalness={0.9}
          roughness={0.2}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Glossy top glass disc */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[3.1, 3.1, 0.02, 64]} />
        <meshPhysicalMaterial
          color="#031525"
          metalness={0.1}
          roughness={0.05}
          transmission={0.4}
          thickness={0.5}
          reflectivity={0.9}
        />
      </mesh>

      {/* Inner Neon cyan ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[2.8, 2.9, 64]} />
        <meshBasicMaterial color="#00f2fe" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* Outer subtle glow ring */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0]}>
        <ringGeometry args={[3.05, 3.15, 64]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>

      {/* Ground projection / grid disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.29, 0]}>
        <circleGeometry args={[7, 64]} />
        <meshBasicMaterial color="#002b4d" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export const OnboardingWorld: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'auto',
      }}
    >
      <Canvas
        camera={{ position: [0, 1.8, 8.2], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%', background: '#050914' }}
      >
        <color attach="background" args={['#050914']} />
        <fog attach="fog" args={['#050914', 9, 28]} />

        {/* Cinematic Showroom Lighting */}
        <ambientLight intensity={0.55} color="#cce7ff" />
        <directionalLight position={[6, 9, 5]} intensity={1.2} color="#ffffff" castShadow />
        <directionalLight position={[-6, 6, -4]} intensity={0.6} color="#38bdf8" />
        <pointLight position={[0, 4.5, 0]} intensity={2.5} color="#00f2fe" distance={14} />
        <pointLight position={[-3.5, 1, 2]} intensity={1.8} color="#0284c7" distance={8} />
        <pointLight position={[3.5, 1, 2]} intensity={1.8} color="#00f2fe" distance={8} />
        <pointLight position={[0, -0.5, 0]} intensity={1.2} color="#00f2fe" distance={6} />

        {/* Space / Futuristic Background */}
        <Stars radius={50} depth={30} count={2000} factor={3.5} saturation={0.5} fade speed={0.6} />

        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.12} floatingRange={[-0.03, 0.03]}>
            <ShowcaseVehicle />
          </Float>
          <ShowroomPedestal />
        </Suspense>
      </Canvas>
    </div>
  );
};

