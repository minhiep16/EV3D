import * as THREE from 'three';
import { ChargingStationStatus } from '../types/charging';

export interface StationVisualConfig {
  code: string;
  bayId: string;
  stationPosition: [number, number, number];
  kioskOffset: [number, number, number];
  socketOffset: [number, number, number];
}

export const CHARGING_STATION_VISUALS: Record<string, StationVisualConfig> = {
  CS01: {
    code: 'CS01',
    bayId: 'BAY_CHARGING_01',
    stationPosition: [6.5, 0.14, 0.5],
    kioskOffset: [1.35, 0, 0],
    socketOffset: [1.35 + 0.42, 0.95, 0.05],
  },
  CS02: {
    code: 'CS02',
    bayId: 'BAY_CHARGING_02',
    stationPosition: [6.5, 0.14, -3.8],
    kioskOffset: [1.35, 0, 0],
    socketOffset: [1.35 + 0.42, 0.95, 0.05],
  },
};

export const VEHICLE_CHARGE_PORT_ANCHORS: Record<string, [number, number, number]> = {
  EV01: [-0.92, 0.82, -1.40],
  EV02: [-0.85, 0.78, -1.25],
};

export interface ChargingStatusTheme {
  primary: string;
  glow: string;
  border: string;
  bg: string;
  labelVi: string;
}

export const CHARGING_STATION_THEMES: Record<ChargingStationStatus, ChargingStatusTheme> = {
  AVAILABLE: {
    primary: '#10b981',
    glow: '#34d399',
    border: 'rgba(16, 185, 129, 0.45)',
    bg: 'rgba(16, 185, 129, 0.12)',
    labelVi: 'Khả dụng',
  },
  OCCUPIED: {
    primary: '#00f2fe',
    glow: '#38bdf8',
    border: 'rgba(0, 242, 254, 0.65)',
    bg: 'rgba(0, 242, 254, 0.16)',
    labelVi: 'Đang sạc',
  },
  OUT_OF_SERVICE: {
    primary: '#ef4444',
    glow: '#f87171',
    border: 'rgba(239, 68, 68, 0.45)',
    bg: 'rgba(239, 68, 68, 0.12)',
    labelVi: 'Tạm ngưng',
  },
};

/**
 * Generate a 3D CatmullRomCurve3 cable path from station socket to vehicle charge port
 * with realistic hanging droop under gravity.
 */
export function createChargingCableCurve(
  startWorld: THREE.Vector3,
  endWorld: THREE.Vector3
): THREE.CatmullRomCurve3 {
  const midPoint = new THREE.Vector3().addVectors(startWorld, endWorld).multiplyScalar(0.5);
  // Calculate ground-safe droop
  const distance = startWorld.distanceTo(endWorld);
  const droopAmount = Math.min(0.65, Math.max(0.18, distance * 0.16));
  midPoint.y = Math.max(0.24, midPoint.y - droopAmount);

  const startTension = startWorld.clone().add(new THREE.Vector3(0, -0.22, 0.08));
  const endTension = endWorld.clone().add(new THREE.Vector3(-0.15, -0.18, 0));

  return new THREE.CatmullRomCurve3([
    startWorld,
    startTension,
    midPoint,
    endTension,
    endWorld,
  ]);
}
