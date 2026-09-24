import React, { useMemo, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../../../store/worldStore';
import { TripRouteNode } from '../../../types/trip';
import { Navigation, MapPin, Flag, Compass, CircleDot } from 'lucide-react';

// Demo Route Definition (strictly simulation/visualization-only, no fake GPS persisted)
// Coordinates in local space of VehicleDigitalTwin (centered at EV01 [-8, 0.14, 4])
const ROUTE_CONTROL_POINTS: [number, number, number][] = [
  [-0.2, 0.15, 2.4],   // Start bay exit
  [0.8, 0.22, 3.6],    // Turning into driveway
  [2.2, 0.28, 4.8],    // Waypoint 1
  [4.0, 0.28, 4.4],    // Waypoint 2
  [4.9, 0.22, 2.8],    // Midpoint / current simulated location
  [4.6, 0.20, 1.0],    // Waypoint 3
  [3.4, 0.18, -1.0],   // Waypoint 4
  [2.4, 0.16, -2.4],   // Destination arrival zone
];

export const TripRouteVisualizer3D: React.FC = () => {
  const selectedTripRouteNode = useWorldStore((state) => state.selectedTripRouteNode);
  const selectTripRouteNode = useWorldStore((state) => state.selectTripRouteNode);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // 1. Construct smooth 3D spline curve
  const curve = useMemo(() => {
    const vectors = ROUTE_CONTROL_POINTS.map((p) => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.5);
  }, []);

  // 2. Spatial Route Nodes definition
  const routeNodes: TripRouteNode[] = useMemo(() => {
    const pStart = curve.getPoint(0.0);
    const pCurrent = curve.getPoint(0.55);
    const pEnd = curve.getPoint(1.0);

    return [
      {
        id: 'START',
        title: 'ĐIỂM BẮT ĐẦU',
        subtitle: 'Trạm sạc EVShare',
        description: 'Vị trí xuất phát tại Trạm sạc EVShare',
        position: [pStart.x, pStart.y, pStart.z],
        type: 'START',
        status: 'PASSED',
        statusLabel: 'Đã xuất phát',
      },
      {
        id: 'CURRENT_PROGRESS',
        title: 'TIẾN TRÌNH HIỆN TẠI',
        subtitle: 'Đang lưu thông',
        description: 'Mô phỏng vị trí phương tiện đang lưu thông',
        position: [pCurrent.x, pCurrent.y, pCurrent.z],
        type: 'CURRENT',
        status: 'ACTIVE',
        statusLabel: 'Đang hoạt động',
      },
      {
        id: 'DESTINATION',
        title: 'ĐIỂM DỰ KIẾN',
        subtitle: 'Điểm trả xe',
        description: 'Điểm đến bàn giao dự kiến theo lịch trình',
        position: [pEnd.x, pEnd.y, pEnd.z],
        type: 'DESTINATION',
        status: 'UPCOMING',
        statusLabel: 'Dự kiến',
      },
    ];
  }, [curve]);

  // 3. Lightweight progress animation ref (no React state updates per frame)
  const beaconRef = useRef<THREE.Group>(null);
  const progressParam = useRef<number>(0.55);
  const tempPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const tempTangent = useRef<THREE.Vector3>(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!beaconRef.current) return;
    // Oscillate or progress smoothly around the simulated mid-route
    progressParam.current = (progressParam.current + delta * 0.05) % 1.0;
    curve.getPoint(progressParam.current, tempPos.current);
    curve.getTangent(progressParam.current, tempTangent.current);

    beaconRef.current.position.copy(tempPos.current);
    beaconRef.current.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      tempTangent.current.normalize()
    );
  });

  return (
    <group>
      {/* 1. Main Glowing Tube Pathway */}
      <mesh>
        <tubeGeometry args={[curve, 80, 0.038, 8, false]} />
        <meshStandardMaterial
          color="#00f2fe"
          emissive="#00f2fe"
          emissiveIntensity={1.9}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 2. Outer Halo Glow Tube */}
      <mesh>
        <tubeGeometry args={[curve, 60, 0.08, 8, false]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Subtle Ground Projection / Ribbon Line */}
      <mesh position={[0, -0.06, 0]}>
        <tubeGeometry args={[curve, 60, 0.015, 6, false]} />
        <meshBasicMaterial color="#0891b2" transparent opacity={0.4} />
      </mesh>

      {/* 4. Animated Simulated Progress Beacon (Ghost Marker) */}
      <group ref={beaconRef} position={[2.5, 0.3, 3.5]}>
        {/* Glowing Beacon Core */}
        <mesh>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={2.8}
            roughness={0.1}
          />
        </mesh>
        {/* Pulsing Light Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.12, 0.22, 24]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 5. Spatial Route Nodes (Interactive 3D Checkpoints) */}
      {routeNodes.map((node) => {
        const isSelected = selectedTripRouteNode === node.id;
        const isHovered = hoveredNodeId === node.id;

        const nodeColor =
          node.id === 'CURRENT_PROGRESS'
            ? '#00f2fe'
            : node.id === 'START'
            ? '#10b981'
            : '#a855f7';

        return (
          <group
            key={node.id}
            position={node.position}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              selectTripRouteNode(node.id);
            }}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHoveredNodeId(node.id);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              if (hoveredNodeId === node.id) {
                setHoveredNodeId(null);
              }
              document.body.style.cursor = 'auto';
            }}
          >
            {/* Ground Ring Base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
              <ringGeometry args={[0.14, 0.22, 24]} />
              <meshBasicMaterial
                color={nodeColor}
                transparent
                opacity={isSelected ? 0.9 : isHovered ? 0.7 : 0.4}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Glowing Node Sphere */}
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[isSelected ? 0.08 : 0.06, 16, 16]} />
              <meshStandardMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={isSelected ? 2.5 : isHovered ? 2.0 : 1.2}
              />
            </mesh>

            {/* Vertical Anchor Stem */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.12, 8]} />
              <meshBasicMaterial color={nodeColor} transparent opacity={0.8} />
            </mesh>

            {/* 3D Spatial Tag Pill */}
            <Billboard position={[0, 0.38, 0]} follow={true}>
              <Html
                center
                distanceFactor={7.5}
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    background: isSelected
                      ? 'rgba(6, 18, 36, 0.94)'
                      : 'rgba(8, 14, 26, 0.88)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${isSelected ? nodeColor : 'rgba(255, 255, 255, 0.2)'}`,
                    boxShadow: isSelected
                      ? `0 0 16px ${nodeColor}`
                      : '0 4px 14px rgba(0, 0, 0, 0.6)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#ffffff',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    transition: 'all 0.18s ease',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1.0)',
                  }}
                >
                  {node.id === 'START' ? (
                    <MapPin size={11} color={nodeColor} />
                  ) : node.id === 'CURRENT_PROGRESS' ? (
                    <Compass size={11} color={nodeColor} />
                  ) : (
                    <Flag size={11} color={nodeColor} />
                  )}
                  <span style={{ color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                    {node.title}
                  </span>
                </div>
              </Html>
            </Billboard>
          </group>
        );
      })}

      {/* 6. Overall Journey Simulation Label in 3D Space (Requirement 9) */}
      <group position={[2.2, 1.1, 4.0]}>
        <Billboard follow={true}>
          <Html
            center
            distanceFactor={9.0}
            style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
          >
            <div
              style={{
                background: 'rgba(4, 12, 24, 0.92)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 242, 254, 0.45)',
                boxShadow: '0 0 20px rgba(0, 242, 254, 0.25)',
                borderRadius: '9999px',
                padding: '6px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#00f2fe',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <Navigation size={13} color="#00f2fe" />
              <span>MÔ PHỎNG TIẾN TRÌNH CHUYẾN ĐI</span>
            </div>
          </Html>
        </Billboard>
      </group>
    </group>
  );
};
