/**
 * Centralized Multi-Vehicle 3D Model Catalog (Phase 25)
 *
 * Single Source of Truth for:
 * - 3D GLB model asset paths in `frontend/public/models/`
 * - Powertrain classification (BEV vs. ICE)
 * - Registration business eligibility (EVShare operates pure electric vehicles)
 * - Body paint mesh/material mappings per model
 * - 3D presentation normalization & framing
 */

export type PowertrainType = 'BEV' | 'ICE' | 'HYBRID' | 'PHEV';

export interface VehiclePaintConfig {
  /** Exact material names that represent exterior body paint */
  bodyMaterialNames: string[];
  /** Exact mesh names that represent exterior body paint */
  bodyMeshNames?: string[];
  /** Protected material names that must never be recolored (glass, tires, lights, badges) */
  protectedMaterialNames?: string[];
  /** Protected mesh name keywords (glass, window, tire, wheel, light, mirror, chrome) */
  protectedMeshKeywords?: string[];
  /** Whether runtime 3D paint recoloring is supported for this model */
  supportsPaintCustomization?: boolean;
  /** Explanation if paint customization is disabled or constrained */
  paintCustomizationNoticeVi?: string;
}

export interface VehicleNormalizationConfig {
  /** Target length in Three.js world units (standard ~4.2 - 4.4m) */
  targetLength?: number;
  /** Extra rotation adjustment [x, y, z] in radians */
  rotationOffset?: [number, number, number];
  /** Vertical micro-adjustment for turntable platform seating */
  groundOffset?: number;
  /** Custom scale multiplier if geometry bounds require fine-tuning */
  scaleMultiplier?: number;
}

export interface VehicleCatalogEntry {
  /** Stable catalog ID independent of filename */
  id: string;
  brand: string;
  model: string;
  displayName: string;
  modelYear?: number;
  powertrain: PowertrainType;
  /** Relative public asset URL resolved through Vite public directory */
  model3dUrl: string;
  fallbackModel3dUrl?: string;
  /** Whether model can be registered for co-ownership on EVShare (EVs only) */
  isRegistrableEV: boolean;
  /** User-facing notice regarding vehicle type & registration status */
  noticeVi?: string;
  defaultColorHex: string;
  defaultColorNameVi: string;
  /** Verified EV battery capacity (kWh) — undefined for ICE */
  batteryCapacityKwh?: number;
  /** Estimated asset valuation (VND) for registered models */
  estimatedValueVnd?: number;
  paintConfig: VehiclePaintConfig;
  normalization: VehicleNormalizationConfig;
}

export const VEHICLE_CATALOG: VehicleCatalogEntry[] = [
  // --------------------------------------------------------------------------
  // EXISTING MODEL A: VinFast VF8 Plus (Authoritative Garage & Onboarding BEV)
  // --------------------------------------------------------------------------
  {
    id: 'VF8_PLUS',
    brand: 'VinFast',
    model: 'VF8 Plus',
    displayName: 'VinFast VF8 Plus',
    modelYear: 2024,
    powertrain: 'BEV',
    model3dUrl: '/models/ev01-realistic.glb',
    fallbackModel3dUrl: '/models/ev-car.glb',
    isRegistrableEV: true,
    defaultColorHex: '#F8F9FA',
    defaultColorNameVi: 'Trắng ngọc trai',
    batteryCapacityKwh: 87.7,
    estimatedValueVnd: 1200000000,
    paintConfig: {
      bodyMaterialNames: ['Material.003', 'Material_EV_Paint', 'PD_VehiclePack_bodycolor'],
      bodyMeshNames: ['Chassis_Body', 'Chassis_Nose'],
      protectedMaterialNames: ['Material.006', 'Material.011', 'MA_tire_003.001', 'Material.007', 'Material.009'],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'light', 'rim'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.25,
      rotationOffset: [0, 0, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // EXISTING MODEL B: Xe thử nghiệm tương tác (EV02 Stylized Concept)
  // --------------------------------------------------------------------------
  {
    id: 'EV02_STYLIZED',
    brand: 'EVShare Concept',
    model: 'EV02 Stylized',
    displayName: 'Xe thử nghiệm tương tác (EV02)',
    modelYear: 2024,
    powertrain: 'BEV',
    model3dUrl: '/models/ev02-stylized.glb',
    isRegistrableEV: false,
    noticeVi: 'Mô hình 3D thử nghiệm tương tác phần cứng và cửa xe trong Gara.',
    defaultColorHex: '#00f2fe',
    defaultColorNameVi: 'Xanh Cyan Neon',
    batteryCapacityKwh: 60.0,
    estimatedValueVnd: 750000000,
    paintConfig: {
      bodyMaterialNames: ['PD_VehiclePack_bodycolor'],
      bodyMeshNames: ['wagon_A_Body.001'],
      protectedMaterialNames: ['PD_VehiclePack_MAT'],
      protectedMeshKeywords: ['wheel', 'tire', 'glass', 'door_hinge'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.1,
      rotationOffset: [0, 0, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW MODEL 1: Volkswagen Teramont 2024 Highline (ICE VR6 3.6L)
  // --------------------------------------------------------------------------
  {
    id: 'VW_TERAMONT_2024',
    brand: 'Volkswagen',
    model: 'Teramont 3.6 Highline',
    displayName: 'Volkswagen Teramont 2024 Highline',
    modelYear: 2024,
    powertrain: 'ICE',
    model3dUrl: '/models/2024_volkswagen_teramont_3.6_highline.glb',
    isRegistrableEV: false,
    noticeVi: 'Chỉ xem trước 3D — Động cơ xăng VR6 3.6L (Hệ thống EVShare chỉ hỗ trợ đăng ký Xe thuần điện BEV).',
    defaultColorHex: '#1A1A1A',
    defaultColorNameVi: 'Đen huyền bí',
    paintConfig: {
      bodyMaterialNames: ['CarPaint'],
      bodyMeshNames: [
        'Ext Body#Car Paint_CarPaint_0',
        'Ext Door FL#Car Paint_CarPaint_0',
        'Ext Door FR#Car Paint_CarPaint_0',
        'Ext Door RL#Car Paint_CarPaint_0',
        'Ext Door RR#Car Paint_CarPaint_0',
        'Ext Trunk Lid#Car Paint_CarPaint_0',
      ],
      protectedMaterialNames: [
        'Atlas',
        'Breaks',
        'Light_glass',
        'red_glass',
        'Trim',
        'REF_White',
        'Stripes_Chrome',
        'Glow',
        'Windows',
        'tire',
        'SQ_Chrome',
      ],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'brake', 'trim', 'light', 'chrome', 'reflector'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.8,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW MODEL 2: Volkswagen Golf GTI 2024 (ICE 2.0L TSI)
  // --------------------------------------------------------------------------
  {
    id: 'VW_GOLF_GTI_2024',
    brand: 'Volkswagen',
    model: 'Golf GTI',
    displayName: 'Volkswagen Golf GTI 2024',
    modelYear: 2024,
    powertrain: 'ICE',
    model3dUrl: '/models/volkswagen_golf_gti_2024.glb',
    isRegistrableEV: false,
    noticeVi: 'Chỉ xem trước 3D — Động cơ xăng 2.0L TSI (Hệ thống EVShare chỉ hỗ trợ đăng ký Xe thuần điện BEV).',
    defaultColorHex: '#A31A24',
    defaultColorNameVi: 'Đỏ thẫm (Kings Red)',
    paintConfig: {
      bodyMaterialNames: ['Rojo_Kings_wyf5mjqd', 'CarPaint'],
      bodyMeshNames: [
        'Ext Body#Car Paint_132',
        'Ext Door FL#Car Paint_160',
        'Ext Door FR#Car Paint_166',
        'Ext Door RL#Car Paint_172',
        'Ext Door RR#Car Paint_176',
        'Ext Trunk Lid#Car Paint_185',
      ],
      protectedMaterialNames: [
        'Windows_Ext_Clear_e3220bc7',
        'Windows_Ext_Tinted_b8d3cd2c',
        'Chrome_Lines_a4448bef',
        'Brake_Rotor_e487b460',
        'Glass_Clear_HDR_1684b13c',
        'Glass_Red_ece4412d',
      ],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'brake', 'chrome', 'rotor', 'reflector'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.28,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW MODEL 3: Volkswagen Teramont 2025 (ICE 2.0L TSI / VR6)
  // --------------------------------------------------------------------------
  {
    id: 'VW_TERAMONT_2025',
    brand: 'Volkswagen',
    model: 'Teramont 2025',
    displayName: 'Volkswagen Teramont 2025',
    modelYear: 2025,
    powertrain: 'ICE',
    model3dUrl: '/models/volkswagen_teramont_2025.glb',
    isRegistrableEV: false,
    noticeVi: 'Chỉ xem trước 3D — Động cơ xăng (Hệ thống EVShare chỉ hỗ trợ đăng ký Xe thuần điện BEV).',
    defaultColorHex: '#10447C',
    defaultColorNameVi: 'Xanh đại dương (Lapiz Blue)',
    paintConfig: {
      bodyMaterialNames: ['Azul_Lapin_da7uzat6', 'CarPaint'],
      bodyMeshNames: [
        'Ext_Body#Car_Paint_149',
        'Ext_Door_FL#Car_Paint_184',
        'Ext_Door_FR#Car_Paint_188',
        'Ext_Door_RL#Car_Paint_196',
        'Ext_Door_RR#Car_Paint_200',
        'Ext_Trunk_Lid#Car_Paint_215',
      ],
      protectedMaterialNames: [
        'Glass_Clear_HDR_1684b13c',
        'Glass_Red_Dark_01a086a5',
        'Windows_Ext_Tinted_b8d3cd2c',
        'Windows_Ext_Clear_e3220bc7',
        'Brake_Rotor_e487b460',
        'Chrome_Lines_a4448befxnur73r4',
      ],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'brake', 'chrome', 'trim', 'reflector', 'light'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.85,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW MODEL 4: Volkswagen Tiguan 2025 (ICE 2.0L TSI)
  // --------------------------------------------------------------------------
  {
    id: 'VW_TIGUAN_2025',
    brand: 'Volkswagen',
    model: 'Tiguan 2025',
    displayName: 'Volkswagen Tiguan 2025',
    modelYear: 2025,
    powertrain: 'ICE',
    model3dUrl: '/models/volkswagen_tiguan_2025.glb',
    isRegistrableEV: false,
    noticeVi: 'Chỉ xem trước 3D — Động cơ xăng 2.0L TSI (Hệ thống EVShare chỉ hỗ trợ đăng ký Xe thuần điện BEV).',
    defaultColorHex: '#8E9297',
    defaultColorNameVi: 'Xám bạc (Ascot Grey)',
    paintConfig: {
      bodyMaterialNames: ['Gris_Ascot_laou1klg', 'CarPaint'],
      bodyMeshNames: [
        'Ext#Car_Paint_142',
        'Ext_Door_FL#Car_Paint_169',
        'Ext_Door_FR#Car_Paint_176',
        'Ext_Door_RL#Car_Paint_187',
        'Ext_Door_RR#Car_Paint_191',
        'Ext_Trunk_Lid#Car_Paint_197',
      ],
      protectedMaterialNames: [
        'Windows_Ext_Tinted_b8d3cd2c',
        'Windows_Ext_Clear_e3220bc7',
        'Glass_Clear_HDR_1684b13c',
        'Brake_Rotor_e487b460',
        'Brushed_Metal_5eb911771f1d8000160fbc46',
      ],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'brake', 'trim', 'light', 'reflector'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.54,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW MODEL 5: VinFast Fadil 2019 (ICE 1.4L)
  // --------------------------------------------------------------------------
  {
    id: 'VF_FADIL_2019',
    brand: 'VinFast',
    model: 'Fadil',
    displayName: 'VinFast Fadil 2019',
    modelYear: 2019,
    powertrain: 'ICE',
    model3dUrl: '/models/2019_vinfast_fadil.glb',
    isRegistrableEV: false,
    noticeVi: 'Chỉ xem trước 3D — Động cơ xăng 1.4L (Hệ thống EVShare chỉ hỗ trợ đăng ký Xe thuần điện BEV).',
    defaultColorHex: '#A31A24',
    defaultColorNameVi: 'Đỏ thẫm',
    paintConfig: {
      bodyMaterialNames: ['Desirefxme1471Mtl', 'Desirefxme1470301Mtl'],
      bodyMeshNames: ['Object_0', 'Object_1'],
      protectedMaterialNames: [
        'Desirefxme0191Mtl',
        'Desirefxme0240131Mtl',
        'Desirefxme0211Mtl',
        'Desirefxme1040241Mtl.001',
        'Desirefxme0501Mtl.001',
        'Desirefxme0201Mtl.002',
      ],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'mirror', 'chrome'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 3.85,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW MODEL 6: VinFast Lux A2.0 (ICE 2.0L Turbo)
  // --------------------------------------------------------------------------
  {
    id: 'VF_LUX_A20',
    brand: 'VinFast',
    model: 'Lux A2.0',
    displayName: 'VinFast Lux A2.0',
    modelYear: 2020,
    powertrain: 'ICE',
    model3dUrl: '/models/vinfast_lux_a2.0.glb',
    isRegistrableEV: false,
    noticeVi: 'Chỉ xem trước 3D — Động cơ xăng 2.0L Turbo (Hệ thống EVShare chỉ hỗ trợ đăng ký Xe thuần điện BEV).',
    defaultColorHex: '#1A1A1A',
    defaultColorNameVi: 'Đen huyền bí',
    paintConfig: {
      bodyMaterialNames: ['EXT_Body.001', 'metallic_PRIMARY.001'],
      bodyMeshNames: ['Object_1', 'Object_18'],
      protectedMaterialNames: [
        'chrome_trim.001',
        'light_glass.001',
        'chrome_metal.001',
        'chrome_light.001',
        'EXT_TYRE.001',
        'rim_ao.001',
        'caliper.001',
        'DISC_BRAKE.001',
        'ext_glass.001',
        'int_glass.001',
      ],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'brake', 'caliper', 'chrome', 'trim', 'light'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.88,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },
  // --------------------------------------------------------------------------
  // NEW BEV MODEL 1: VinFast VF3 (2024 Mini Electric SUV - Registrable BEV)
  // --------------------------------------------------------------------------
  {
    id: 'VF_VF3',
    brand: 'VinFast',
    model: 'VF3',
    displayName: 'VinFast VF3',
    modelYear: 2024,
    powertrain: 'BEV',
    model3dUrl: '/models/vinfast_vf3.glb',
    isRegistrableEV: true,
    noticeVi: 'Xe mini điện thông minh VinFast VF3 — Đủ điều kiện đăng ký đồng sở hữu vận hành.',
    defaultColorHex: '#EAB308',
    defaultColorNameVi: 'Vàng rực rỡ',
    batteryCapacityKwh: 18.64,
    estimatedValueVnd: 240000000,
    paintConfig: {
      bodyMaterialNames: ['Material.002'],
      bodyMeshNames: ['Object_20'],
      protectedMaterialNames: [
        'Mugen',
        'Nuts',
        'Tire.001',
        'Material.006',
        'Material.007',
        'Material.003',
        'Material.008',
        'Material.005',
      ],
      protectedMeshKeywords: [
        'glass',
        'window',
        'tire',
        'wheel',
        'rim',
        'light',
        'mirror',
        'interior',
        'trim',
        'bumper',
        'caliper',
      ],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 3.2,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW BEV MODEL 2: Tesla Model 3 2018 (Registrable BEV)
  // --------------------------------------------------------------------------
  {
    id: 'TESLA_MODEL_3_2018',
    brand: 'Tesla',
    model: 'Model 3 2018',
    displayName: 'Tesla Model 3 2018',
    modelYear: 2018,
    powertrain: 'BEV',
    model3dUrl: '/models/tesla_2018_model_3.glb',
    isRegistrableEV: true,
    noticeVi: 'Dòng xe sedan thuần điện Tesla Model 3 — Đủ điều kiện đăng ký đồng sở hữu vận hành.',
    defaultColorHex: '#A31A24',
    defaultColorNameVi: 'Đỏ thẫm (Red Multi-Coat)',
    batteryCapacityKwh: 75.0,
    estimatedValueVnd: 1200000000,
    paintConfig: {
      bodyMaterialNames: ['primary', 'primary.001', 'primary.002'],
      bodyMeshNames: [
        'body_primary_0',
        'boot_primary_0',
        'door_lf_primary_0',
        'door_lf_primary.002_0',
        'door_lf_ok_primary_0',
        'door_lr_primary_0',
        'door_lr_primary.002_0',
        'door_lr_ok_primary_0',
        'door_rf_primary_0',
        'door_rf_primary.002_0',
        'door_rf_ok_primary_0',
        'door_rr_primary_0',
        'door_rr_primary.002_0',
        'door_rr_ok_primary.002_0',
        'front_bumper_ok_primary_0',
        'rear_bumper_ok_primary_0',
        'bonnet_ok_primary_0',
        'bodysills_primary.001_0',
      ],
      protectedMaterialNames: [
        'hub_rb.0',
        'hub_rf.0',
        'hub_rf.1',
        'dvorright.0',
        'movsteer_1.0.1',
        'movsteer_1.0.0',
        'chassis.0',
        'JUST_BLACK.0',
        'black_lights.0',
        'back_chrome_light.0',
        'pantulans.0',
        'right_rear_light',
        'breaklight_l',
        'foglight_r',
        'foglight_l',
        'right_front_light',
        'left_front_light',
        'aluminium_light.0',
        'tembus_red.0',
        'light_night',
        'indicator_lf',
        'indicator_rf',
        'hitam.0',
        'Plastic.0',
        'belt.0',
        'satin_red.0',
        'suspensi.0',
        'suspensi.1',
        'aluminium2.0',
        'Putih.0',
        'Carpet.0',
        'Carpet_Light.0',
        'texture_Buttons.0',
        'LCDs.0',
        'Seat_Leather_white.0',
        'mirror_inside.0',
        'glass.0',
        'glass.1',
        'platnomor.1',
        'platnomor.2',
        'indicator_rr',
        'indicator_lr',
        'left_rear_light',
        'revlight_L',
        'door_lf.0',
        'door_lf.5',
        'front_black.0',
        'light_pantulan.0',
        'wheels.2',
        'wheels.0',
        'wheels.1',
        'wheels.3',
        'wheels.4',
        'wheels.6',
      ],
      protectedMeshKeywords: [
        'glass',
        'window',
        'tire',
        'wheel',
        'rim',
        'brake',
        'chrome',
        'light',
        'interior',
        'seat',
        'lcd',
        'screen',
        'caliper',
      ],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.4,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW BEV MODEL 3: Tesla Cybertruck (Registrable BEV)
  // --------------------------------------------------------------------------
  {
    id: 'TESLA_CYBERTRUCK',
    brand: 'Tesla',
    model: 'Cybertruck',
    displayName: 'Tesla Cybertruck',
    modelYear: 2024,
    powertrain: 'BEV',
    model3dUrl: '/models/tesla_cybertruck.glb',
    isRegistrableEV: true,
    noticeVi: 'Bán tải điện tương lai Tesla Cybertruck — Đủ điều kiện đăng ký đồng sở hữu vận hành.',
    defaultColorHex: '#94A3B8',
    defaultColorNameVi: 'Xám thép Stainless Steel',
    batteryCapacityKwh: 123.0,
    estimatedValueVnd: 2500000000,
    paintConfig: {
      bodyMaterialNames: ['Base'],
      bodyMeshNames: ['Object_0'],
      protectedMaterialNames: [
        'TeslaBlack',
        'TeslaFrontLight',
        'TeslaRearLight',
        'Material.004',
        'Material.001',
      ],
      protectedMeshKeywords: [
        'glass',
        'window',
        'tire',
        'wheel',
        'rim',
        'light',
        'interior',
        'mirror',
        'caliper',
      ],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.9,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW BEV MODEL 4: Tesla Roadster 2008 (Commercial Historical BEV - Registrable)
  // --------------------------------------------------------------------------
  {
    id: 'TESLA_ROADSTER_2008',
    brand: 'Tesla',
    model: 'Roadster 2008',
    displayName: 'Tesla Roadster 2008',
    modelYear: 2008,
    powertrain: 'BEV',
    model3dUrl: '/models/2008_tesla_roadster.glb',
    isRegistrableEV: true,
    noticeVi: 'Mẫu xe thể thao thuần điện lịch sử Tesla Roadster 2008 — Đủ điều kiện đăng ký đồng sở hữu.',
    defaultColorHex: '#E11D48',
    defaultColorNameVi: 'Đỏ thể thao (Radiant Red)',
    batteryCapacityKwh: 53.0,
    estimatedValueVnd: 1800000000,
    paintConfig: {
      bodyMaterialNames: ['Paint'],
      bodyMeshNames: ['2008 Tesla Roadster_Paint_0', 'Roof_Paint_0'],
      protectedMaterialNames: [
        'Trim',
        'Grill',
        'Glass',
        'Mirrors',
        'Interior',
        'Leather',
        'Rims',
        'Tire',
        'Tread',
        'Caliper',
      ],
      protectedMeshKeywords: [
        'glass',
        'window',
        'tire',
        'wheel',
        'rim',
        'light',
        'interior',
        'mirror',
        'caliper',
      ],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 3.9,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW BEV MODEL 5: Tesla Model S/X P100D (Uncertain Trim Disambiguation - 3D Preview)
  // --------------------------------------------------------------------------
  {
    id: 'TESLA_MODEL_P100D',
    brand: 'Tesla',
    model: 'Model P100D',
    displayName: 'Tesla Model S/X P100D',
    modelYear: 2017,
    powertrain: 'BEV',
    model3dUrl: '/models/tesla_model_p100d.glb',
    isRegistrableEV: false,
    noticeVi:
      'Mô hình 3D đại diện cho phiên bản hiệu năng cao Tesla P100D (100 kWh). Cần bổ sung hồ sơ kiểm định và xác định chính xác thân vỏ (Sedan S hoặc SUV X) để hoàn tất đăng ký vận hành.',
    defaultColorHex: '#0F172A',
    defaultColorNameVi: 'Đen Obsidian',
    batteryCapacityKwh: 100.0,
    estimatedValueVnd: 2200000000,
    paintConfig: {
      bodyMaterialNames: ['primary'],
      bodyMeshNames: [
        'bonnet_primary_0',
        'chassis_primary_0',
        'skirt_primary_0',
        'bump_f_primary_0',
        'bump_r_primary_0',
        'bodyshell_primary_0',
        'door_dside_r_primary_0',
        'door_pside_f_primary_0',
        'door_pside_r_primary_0',
        'door_dside_f_primary_0',
        'boot_primary_0',
      ],
      protectedMaterialNames: [
        'bonnet.0',
        'bonnet.2',
        'bonnet.4',
        'bonnet.3',
        'chassis.4',
        'chassis.11',
        'chassis.7',
        'chassis.6',
        'glass',
        'glass.001',
      ],
      protectedMeshKeywords: [
        'glass',
        'window',
        'tire',
        'wheel',
        'rim',
        'light',
        'interior',
        'mirror',
        'chrome',
      ],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.6,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // NEW BEV MODEL 6: Tesla Roadster Concept (Pre-production Concept - 3D Preview)
  // --------------------------------------------------------------------------
  {
    id: 'TESLA_ROADSTER_CONCEPT',
    brand: 'Tesla',
    model: 'Roadster Concept',
    displayName: 'Tesla Roadster (Concept 3D Preview)',
    modelYear: 2020,
    powertrain: 'BEV',
    model3dUrl: '/models/tesla_roadster_2020_www.vecarz.com.glb',
    isRegistrableEV: false,
    noticeVi:
      'Mô hình 3D Concept thế hệ mới — Chưa sản xuất thương mại hàng loạt. Chỉ dùng cho mục đích trải nghiệm 3D.',
    defaultColorHex: '#DC2626',
    defaultColorNameVi: 'Đỏ thẫm Concept',
    batteryCapacityKwh: 200.0,
    estimatedValueVnd: 4500000000,
    paintConfig: {
      bodyMaterialNames: ['car_main_paint'],
      bodyMeshNames: ['Body', 'Exterior'],
      protectedMaterialNames: [
        'Rims',
        'mirror',
        'Metal_-_Black_rough',
        'Brake_Disc',
        'Thread',
        'Sidewall',
        'grill',
        'Glass_mid_tint',
        'interior',
        'seats',
        'carbon_fibre',
        'chrome',
        'calipers',
      ],
      protectedMeshKeywords: [
        'glass',
        'window',
        'tire',
        'wheel',
        'rim',
        'light',
        'interior',
        'mirror',
        'caliper',
      ],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.2,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // SUPPORTED BEV MODEL: VinFast VF9 Plus (Registrable BEV)
  // --------------------------------------------------------------------------
  {
    id: 'VF9_PLUS',
    brand: 'VinFast',
    model: 'VF9 Plus',
    displayName: 'VinFast VF9 Plus',
    modelYear: 2024,
    powertrain: 'BEV',
    model3dUrl: '/models/ev01-realistic.glb',
    fallbackModel3dUrl: '/models/ev-car.glb',
    isRegistrableEV: true,
    noticeVi: 'SUV điện cỡ lớn cao cấp VinFast VF9 Plus — Đủ điều kiện đăng ký vận hành.',
    defaultColorHex: '#1E293B',
    defaultColorNameVi: 'Xanh thẫm (Deep Ocean)',
    batteryCapacityKwh: 123.0,
    estimatedValueVnd: 1600000000,
    paintConfig: {
      bodyMaterialNames: ['Material.003', 'CarPaint', 'Body'],
      bodyMeshNames: ['Chassis_Body', 'Chassis_Nose'],
      protectedMaterialNames: ['Material.006', 'Material.011', 'MA_tire_003.001'],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'light'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.8,
      rotationOffset: [0, 0, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // SUPPORTED BEV MODEL: VinFast VF7 Plus (Registrable BEV)
  // --------------------------------------------------------------------------
  {
    id: 'VF7_PLUS',
    brand: 'VinFast',
    model: 'VF7 Plus',
    displayName: 'VinFast VF7 Plus',
    modelYear: 2024,
    powertrain: 'BEV',
    model3dUrl: '/models/ev01-realistic.glb',
    fallbackModel3dUrl: '/models/ev-car.glb',
    isRegistrableEV: true,
    noticeVi: 'Crossover thể thao VinFast VF7 Plus — Đủ điều kiện đăng ký vận hành.',
    defaultColorHex: '#DC2626',
    defaultColorNameVi: 'Đỏ thẫm (Crimson Red)',
    batteryCapacityKwh: 75.3,
    estimatedValueVnd: 999000000,
    paintConfig: {
      bodyMaterialNames: ['Material.003', 'CarPaint', 'Body'],
      bodyMeshNames: ['Chassis_Body', 'Chassis_Nose'],
      protectedMaterialNames: ['Material.006', 'Material.011', 'MA_tire_003.001'],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'light'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.3,
      rotationOffset: [0, 0, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // SUPPORTED BEV MODEL: VinFast VF6 Plus (Registrable BEV)
  // --------------------------------------------------------------------------
  {
    id: 'VF6_PLUS',
    brand: 'VinFast',
    model: 'VF6 Plus',
    displayName: 'VinFast VF6 Plus',
    modelYear: 2024,
    powertrain: 'BEV',
    model3dUrl: '/models/ev01-realistic.glb',
    fallbackModel3dUrl: '/models/ev-car.glb',
    isRegistrableEV: true,
    noticeVi: 'Đô thị điện thông minh VinFast VF6 Plus — Đủ điều kiện đăng ký vận hành.',
    defaultColorHex: '#2563EB',
    defaultColorNameVi: 'Xanh lam (VinFast Blue)',
    batteryCapacityKwh: 59.6,
    estimatedValueVnd: 765000000,
    paintConfig: {
      bodyMaterialNames: ['Material.003', 'CarPaint', 'Body'],
      bodyMeshNames: ['Chassis_Body', 'Chassis_Nose'],
      protectedMaterialNames: ['Material.006', 'Material.011', 'MA_tire_003.001'],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'light'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.15,
      rotationOffset: [0, 0, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // SUPPORTED BEV MODEL: Volvo EX30 Ultra (Registrable BEV)
  // --------------------------------------------------------------------------
  {
    id: 'VOLVO_EX30',
    brand: 'Volvo',
    model: 'EX30 Ultra',
    displayName: 'Volvo EX30 Ultra',
    modelYear: 2024,
    powertrain: 'BEV',
    model3dUrl: '/models/ev01-realistic.glb',
    fallbackModel3dUrl: '/models/ev-car.glb',
    isRegistrableEV: true,
    noticeVi: 'Compact SUV điện Scandinavian Volvo EX30 Ultra — Đủ điều kiện đăng ký vận hành.',
    defaultColorHex: '#E2E8F0',
    defaultColorNameVi: 'Xám mây (Cloud Blue)',
    batteryCapacityKwh: 69.0,
    estimatedValueVnd: 1350000000,
    paintConfig: {
      bodyMaterialNames: ['Material.003', 'CarPaint', 'Body'],
      bodyMeshNames: ['Chassis_Body', 'Chassis_Nose'],
      protectedMaterialNames: ['Material.006', 'Material.011', 'MA_tire_003.001'],
      protectedMeshKeywords: ['glass', 'window', 'tire', 'wheel', 'light'],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.23,
      rotationOffset: [0, 0, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // SUPPORTED BEV MODEL: Tesla Model Y Long Range (Registrable BEV)
  // --------------------------------------------------------------------------
  {
    id: 'TESLA_MODEL_Y',
    brand: 'Tesla',
    model: 'Model Y Long Range',
    displayName: 'Tesla Model Y Long Range',
    modelYear: 2024,
    powertrain: 'BEV',
    model3dUrl: '/models/tesla_2018_model_3.glb',
    fallbackModel3dUrl: '/models/ev01-realistic.glb',
    isRegistrableEV: true,
    noticeVi: 'SUV thuần điện bán chạy nhất Tesla Model Y — Đủ điều kiện đăng ký vận hành.',
    defaultColorHex: '#FFFFFF',
    defaultColorNameVi: 'Trắng ngọc trai',
    batteryCapacityKwh: 75.0,
    estimatedValueVnd: 1500000000,
    paintConfig: {
      bodyMaterialNames: ['primary', 'primary.001', 'primary.002'],
      bodyMeshNames: [
        'body_primary_0',
        'boot_primary_0',
        'door_lf_primary_0',
        'door_lf_primary.002_0',
        'door_lf_ok_primary_0',
        'door_lr_primary_0',
        'door_lr_primary.002_0',
        'door_lr_ok_primary_0',
        'door_rf_primary_0',
        'door_rf_primary.002_0',
        'door_rf_ok_primary_0',
        'door_rr_primary_0',
        'door_rr_primary.002_0',
        'door_rr_ok_primary.002_0',
        'front_bumper_ok_primary_0',
        'rear_bumper_ok_primary_0',
        'bonnet_ok_primary_0',
        'bodysills_primary.001_0',
      ],
      protectedMaterialNames: [
        'hub_rb.0',
        'hub_rf.0',
        'hub_rf.1',
        'dvorright.0',
        'movsteer_1.0.1',
        'movsteer_1.0.0',
        'chassis.0',
        'JUST_BLACK.0',
        'black_lights.0',
        'back_chrome_light.0',
        'pantulans.0',
        'right_rear_light',
        'breaklight_l',
        'foglight_r',
        'foglight_l',
        'right_front_light',
        'left_front_light',
        'aluminium_light.0',
        'tembus_red.0',
        'light_night',
        'indicator_lf',
        'indicator_rf',
        'hitam.0',
        'Plastic.0',
        'belt.0',
        'satin_red.0',
        'suspensi.0',
        'suspensi.1',
        'aluminium2.0',
        'Putih.0',
        'Carpet.0',
        'Carpet_Light.0',
        'texture_Buttons.0',
        'LCDs.0',
        'Seat_Leather_white.0',
        'mirror_inside.0',
        'glass.0',
        'glass.1',
        'platnomor.1',
        'platnomor.2',
        'indicator_rr',
        'indicator_lr',
        'left_rear_light',
        'revlight_L',
        'door_lf.0',
        'door_lf.5',
        'front_black.0',
        'light_pantulan.0',
        'wheels.2',
        'wheels.0',
        'wheels.1',
        'wheels.3',
        'wheels.4',
        'wheels.6',
      ],
      protectedMeshKeywords: [
        'glass',
        'window',
        'tire',
        'wheel',
        'rim',
        'brake',
        'chrome',
        'light',
        'interior',
        'seat',
        'lcd',
        'screen',
        'caliper',
      ],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.45,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // HYUNDAI BEV MODEL 1: Hyundai Mistra EV 2021 (Registrable BEV)
  // --------------------------------------------------------------------------
  {
    id: 'HYUNDAI_MISTRA_EV_2021',
    brand: 'Hyundai',
    model: 'Mistra EV 2021',
    displayName: 'Hyundai Mistra EV 2021',
    modelYear: 2021,
    powertrain: 'BEV',
    model3dUrl: '/models/2021_hyundai_mistra_ev.glb',
    fallbackModel3dUrl: '/models/ev01-realistic.glb',
    isRegistrableEV: true,
    noticeVi: 'Sedan thuần điện Hyundai Mistra EV 2021 (Pin ternary 56.5 kWh CATL) — Đủ điều kiện đăng ký vận hành.',
    defaultColorHex: '#10447C',
    defaultColorNameVi: 'Xanh đại dương',
    batteryCapacityKwh: 56.5,
    estimatedValueVnd: 750000000,
    paintConfig: {
      bodyMaterialNames: ['CarPaint', 'CarPaint_2', 'M_CarPaint'],
      bodyMeshNames: [
        'Mesh2_1_CarPaint_0',
        'qianbaowei1_CarPaint_2_0',
        'doors_1_CarPaint_2_0',
        'doors_1_1_CarPaint_2_0',
        'trunk_1_CarPaint_2_0',
        'Object022_1_CarPaint_2_0',
        'body_part009_CarPaint_2_0',
        'body_part009_1_2_CarPaint_2_0',
        'Object057_CarPaint_2_0',
        'Object19634733_M_CarPaint_0',
        'Object19634735_M_CarPaint_0',
      ],
      protectedMaterialNames: [
        'MEtal',
        'Red_glass',
        'light_glass',
        'H_Plasatic',
        'H_Chrome_S',
        'H_Chrome',
        'Plastic_R',
        'Chrome',
        'N_Leather_Color',
        'plastic_Gray',
        'N_Plastic',
        'N_Plastic_S',
        'N_Chrome',
        'N_Leather_Gr',
        'N_Carpet',
        'Black_Plast_S',
        'Z_plastic_R',
        'Z_REdP',
        'Z_Seats_Dots',
        'Z_Leather_Color',
        'Z_Metal',
        'Z_Fabric',
        'tire',
        'D_Glass',
        'rubber',
        'M_Speaker_Color',
        'Windows',
        'W_Chrome',
        'W_Plastic_R',
        'M_Plastic_R',
        'M_leather_Black',
        'M_Leather_Color',
        'M_Chrome',
        'M_leather_GR',
        'M_rubber',
        'M_Plastic_S',
        'mirror',
        'Reflector',
        'W_Black_Plast',
        'nei_Plastic_R',
        'Nei_Roof',
        'Nei_Plastic_Color',
        'Breaks',
        'C_Chrome',
        'C_Plastic_S',
        'chassis',
        'glass_surr',
      ],
      protectedMeshKeywords: [
        'glass',
        'window',
        'tire',
        'wheel',
        'rim',
        'brake',
        'caliper',
        'light',
        'interior',
        'leather',
        'mirror',
        'grill',
        'trim',
        'chassis',
        'steering',
        'seat',
      ],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.78,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // HYUNDAI BEV MODEL 2: Hyundai Kona Electric 2024 (Registrable BEV)
  // --------------------------------------------------------------------------
  {
    id: 'HYUNDAI_KONA_ELECTRIC_2024',
    brand: 'Hyundai',
    model: 'Kona Electric 2024',
    displayName: 'Hyundai Kona Electric 2024',
    modelYear: 2024,
    powertrain: 'BEV',
    model3dUrl: '/models/2024_hyundai_kona_electric.glb',
    fallbackModel3dUrl: '/models/ev01-realistic.glb',
    isRegistrableEV: true,
    noticeVi: 'SUV thuần điện thế hệ mới Hyundai Kona Electric 2024 (Pin 64.8 kWh) — Đủ điều kiện đăng ký vận hành.',
    defaultColorHex: '#F8F9FA',
    defaultColorNameVi: 'Trắng ngọc trai',
    batteryCapacityKwh: 64.8,
    estimatedValueVnd: 1150000000,
    paintConfig: {
      bodyMaterialNames: ['CP_CarPaint'],
      bodyMeshNames: [
        'K_EV_PaintColor_Body_CP_CarPaint_0',
        'K_EV_PaintColor_TailGate_CP_CarPaint_0',
        'K_EV_PaintColor_ChargingCover_OS_CP_CarPaint_0',
        'K_EV_DoorFL_ANI_CP_CarPaint_0',
        'K_EV_PaintColor_DoorFL_CP_CarPaint_0',
        'K_EV_DoorFR_ANI_CP_CarPaint_0',
        'K_EV_PaintColor_DoorFR_CP_CarPaint_0',
        'K_EV_DoorRL_ANI_CP_CarPaint_0',
        'K_EV_PaintColor_DoorRL_CP_CarPaint_0',
        'K_EV_DoorRR_ANI_CP_CarPaint_0',
        'K_EV_PaintColor_DoorRR_CP_CarPaint_0',
      ],
      protectedMaterialNames: [
        'A_Light_Mesh_s',
        'ORM_s',
        'INT_Leather_B_s',
        'INT_MainColor',
        'INT_Speaker_s',
        'Glass_Light',
        'Tex_s',
        'Windows',
        'INT_BeltTape_s',
        'INT_MainColor_Black',
        'INT_Carpet_s',
        'INT_Cloth_P_s',
        'INT_Cloth_Roof_s',
        'INT_DB_s',
        'Display_1',
        'Display_2',
        'INT_Hairline',
        'INT_Leather_A_s',
        'INT_MainColor_Gray_s',
        'INT_MainColor_White_PT_s',
        'INT_Stitch_A_s',
        'INT_Stitch_B',
        'Lamp_Brake_s',
        'Lamp_DarkGray_s',
        'Lamp_DRL_s',
        'Lamp_ProjGlass_s',
        'Red_Glass',
        'Lamp_SatinGlass_s',
        'Lamp_SatinGlass_RED_s',
        'INT_Tire_WT17_s',
      ],
      protectedMeshKeywords: [
        'glass',
        'window',
        'tire',
        'wheel',
        'rim',
        'brake',
        'caliper',
        'light',
        'interior',
        'leather',
        'display',
        'screen',
        'lamp',
        'drl',
      ],
      supportsPaintCustomization: true,
    },
    normalization: {
      targetLength: 4.35,
      rotationOffset: [0, Math.PI / 2, 0],
      groundOffset: 0.0,
      scaleMultiplier: 1.0,
    },
  },
];

/**
 * Returns all catalog entries.
 */
export function getVehicleCatalog(): VehicleCatalogEntry[] {
  return VEHICLE_CATALOG;
}

/**
 * Resolves a catalog entry by stable ID or vehicleCode (e.g. 'VF8_PLUS', 'EV01', 'VF_VF3', 'TESLA_MODEL_3_2018').
 */
export function getCatalogEntryById(id?: string | null): VehicleCatalogEntry | undefined {
  if (!id) return undefined;
  const upper = id.toUpperCase();
  if (upper === 'EV01') return VEHICLE_CATALOG.find((v) => v.id === 'VF8_PLUS');
  if (upper === 'EV02') return VEHICLE_CATALOG.find((v) => v.id === 'EV02_STYLIZED');
  if (upper === 'HYUNDAI-MISTRA-EV-2021' || upper === 'HYUNDAI_MISTRA_EV_2021') {
    return VEHICLE_CATALOG.find((v) => v.id === 'HYUNDAI_MISTRA_EV_2021');
  }
  if (upper === 'HYUNDAI-KONA-ELECTRIC-2024' || upper === 'HYUNDAI_KONA_ELECTRIC_2024') {
    return VEHICLE_CATALOG.find((v) => v.id === 'HYUNDAI_KONA_ELECTRIC_2024');
  }
  return VEHICLE_CATALOG.find((v) => v.id.toUpperCase() === upper);
}

/**
 * Resolves a catalog entry by user-facing model name (e.g., 'VinFast VF3', 'Tesla Model 3 2018').
 */
export function findCatalogEntryByModel(modelName?: string | null): VehicleCatalogEntry | undefined {
  if (!modelName) return undefined;
  const trimmed = modelName.trim().toLowerCase();

  // 1. Exact match on display name
  const exact = VEHICLE_CATALOG.find((v) => v.displayName.toLowerCase() === trimmed);
  if (exact) return exact;

  // 2. Exact match on ID
  const byId = VEHICLE_CATALOG.find((v) => v.id.toLowerCase() === trimmed);
  if (byId) return byId;

  // 3. Keyword / partial matching
  // VinFast models
  if (trimmed.includes('vf3') || trimmed.includes('vf 3')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VF_VF3');
  }
  if (trimmed.includes('vf9') || trimmed.includes('vf 9')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VF9_PLUS');
  }
  if (trimmed.includes('vf7') || trimmed.includes('vf 7')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VF7_PLUS');
  }
  if (trimmed.includes('vf6') || trimmed.includes('vf 6')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VF6_PLUS');
  }
  if (trimmed.includes('vf8') || trimmed.includes('vf 8') || trimmed.includes('ev01')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VF8_PLUS');
  }
  if (trimmed.includes('fadil')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VF_FADIL_2019');
  }
  if (trimmed.includes('lux') || trimmed.includes('a2.0')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VF_LUX_A20');
  }

  // Tesla models
  if (trimmed.includes('cybertruck')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'TESLA_CYBERTRUCK');
  }
  if (trimmed.includes('model 3') || trimmed.includes('model3')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'TESLA_MODEL_3_2018');
  }
  if (trimmed.includes('model y') || trimmed.includes('modely')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'TESLA_MODEL_Y');
  }
  if (trimmed.includes('p100d')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'TESLA_MODEL_P100D');
  }
  if (trimmed.includes('roadster') && (trimmed.includes('2008') || trimmed.includes('classic') || trimmed.includes('gen1'))) {
    return VEHICLE_CATALOG.find((v) => v.id === 'TESLA_ROADSTER_2008');
  }
  if (trimmed.includes('roadster')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'TESLA_ROADSTER_CONCEPT') || VEHICLE_CATALOG.find((v) => v.id === 'TESLA_ROADSTER_2008');
  }

  // Hyundai models
  if (trimmed.includes('mistra')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'HYUNDAI_MISTRA_EV_2021');
  }
  if (trimmed.includes('kona')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'HYUNDAI_KONA_ELECTRIC_2024');
  }
  if (trimmed.includes('hyundai-mistra-ev-2021') || trimmed === 'hyundai mistra') {
    return VEHICLE_CATALOG.find((v) => v.id === 'HYUNDAI_MISTRA_EV_2021');
  }
  if (trimmed.includes('hyundai-kona-electric-2024') || trimmed === 'hyundai kona') {
    return VEHICLE_CATALOG.find((v) => v.id === 'HYUNDAI_KONA_ELECTRIC_2024');
  }

  // Volvo models
  if (trimmed.includes('ex30') || trimmed.includes('volvo')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VOLVO_EX30');
  }

  // Volkswagen ICE models
  if (trimmed.includes('golf') && trimmed.includes('gti')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VW_GOLF_GTI_2024');
  }
  if (trimmed.includes('teramont') && (trimmed.includes('2024') || trimmed.includes('highline') || trimmed.includes('3.6'))) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VW_TERAMONT_2024');
  }
  if (trimmed.includes('teramont') && trimmed.includes('2025')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VW_TERAMONT_2025');
  }
  if (trimmed.includes('teramont')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VW_TERAMONT_2025') || VEHICLE_CATALOG.find((v) => v.id === 'VW_TERAMONT_2024');
  }
  if (trimmed.includes('tiguan')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'VW_TIGUAN_2025');
  }

  // EV02 Concept
  if (trimmed.includes('ev02') || trimmed.includes('tương tác')) {
    return VEHICLE_CATALOG.find((v) => v.id === 'EV02_STYLIZED');
  }

  return undefined;
}

/**
 * Returns only the models permitted for active EV co-ownership registration.
 */
export function getRegistrableEVModels(): VehicleCatalogEntry[] {
  return VEHICLE_CATALOG.filter((v) => v.isRegistrableEV);
}

/**
 * Returns 3D preview-only models (ICE, concept, or trim-ambiguous assets).
 */
export function getPreview3DModels(): VehicleCatalogEntry[] {
  return VEHICLE_CATALOG.filter((v) => !v.isRegistrableEV);
}

