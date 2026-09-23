export type VehiclePartId =
  | 'BODY'
  | 'HOOD'
  | 'WINDSHIELD'
  | 'ROOF'
  | 'WHEEL_FL'
  | 'WHEEL_FR'
  | 'WHEEL_RL'
  | 'WHEEL_RR'
  | 'HEADLIGHTS'
  | 'TAILLIGHTS'
  | 'BATTERY'
  | 'CHARGING_PORT'
  | 'DIFFUSER';

export type PartStatus = 'NORMAL' | 'WARNING' | 'DAMAGED';

export interface PartSpecItem {
  label: string;
  value: string;
}

export interface VehiclePartConfig {
  id: VehiclePartId;
  nodeNames: string[];
  nameVi: string;
  categoryVi: string;
  status: PartStatus;
  descriptionVi: string;
  specs: PartSpecItem[];
  localCenter: [number, number, number];
  cameraPreset: {
    target: [number, number, number];
    position: [number, number, number];
  };
  panelPosition: [number, number, number];
}
