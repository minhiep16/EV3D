const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');
const fs = require('fs');
const path = require('path');

// Polyfill FileReader for Node.js GLTFExporter binary export
global.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};

const scene = new THREE.Scene();
scene.name = 'EVShare_Vehicle_Scene';

const carRoot = new THREE.Group();
carRoot.name = 'EV01_DigitalTwin';
scene.add(carRoot);

// Materials
const paintMaterial = new THREE.MeshStandardMaterial({
  color: 0x0284c7, // EV Cyan/Blue metallic paint
  metalness: 0.75,
  roughness: 0.25,
  name: 'Material_EV_Paint',
});

const darkTrimMaterial = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  metalness: 0.8,
  roughness: 0.4,
  name: 'Material_DarkTrim',
});

const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0x0a1120,
  metalness: 0.9,
  roughness: 0.1,
  transparent: true,
  opacity: 0.85,
  name: 'Material_Glass',
});

const tireMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.85,
  metalness: 0.1,
  name: 'Material_Tire',
});

const rimMaterial = new THREE.MeshStandardMaterial({
  color: 0x94a3b8,
  metalness: 0.9,
  roughness: 0.2,
  name: 'Material_Rim',
});

const headlightMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0x00f2fe,
  emissiveIntensity: 1.8,
  name: 'Material_Headlight',
});

const taillightMaterial = new THREE.MeshStandardMaterial({
  color: 0xff2222,
  emissive: 0xef4444,
  emissiveIntensity: 1.8,
  name: 'Material_Taillight',
});

const batteryMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  metalness: 0.7,
  roughness: 0.5,
  name: 'Material_Battery',
});

// 1. Chassis Body (Lower Main Hull)
const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.45, 4.2), paintMaterial);
lowerBody.name = 'Chassis_Body';
lowerBody.position.y = 0.45;
lowerBody.castShadow = true;
lowerBody.receiveShadow = true;
carRoot.add(lowerBody);

// Front Taper Nose
const noseGeom = new THREE.CylinderGeometry(0.85, 0.92, 0.45, 32, 1, false, 0, Math.PI);
const nose = new THREE.Mesh(noseGeom, paintMaterial);
nose.name = 'Chassis_Nose';
nose.rotation.y = -Math.PI / 2;
nose.position.set(0, 0.45, 2.05);
nose.scale.set(1.0, 1.0, 0.6);
carRoot.add(nose);

// 2. Cabin Glass Greenhouse (Aerodynamic Canopy)
const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.48, 2.3), glassMaterial);
cabin.name = 'Cabin_Glass';
cabin.position.set(0, 0.85, -0.2);
cabin.castShadow = true;
carRoot.add(cabin);

// Roof panel
const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.04, 2.0), paintMaterial);
roof.name = 'Roof_Panel';
roof.position.set(0, 1.1, -0.2);
carRoot.add(roof);

// 3. Wheels & Hubs
const wheelRadius = 0.36;
const wheelWidth = 0.24;
const wheelPositions = [
  { name: 'Wheel_Front_Left', x: -0.92, y: 0.36, z: 1.35 },
  { name: 'Wheel_Front_Right', x: 0.92, y: 0.36, z: 1.35 },
  { name: 'Wheel_Rear_Left', x: -0.92, y: 0.36, z: -1.35 },
  { name: 'Wheel_Rear_Right', x: 0.92, y: 0.36, z: -1.35 },
];

wheelPositions.forEach((wp) => {
  const wheelGroup = new THREE.Group();
  wheelGroup.name = wp.name;
  wheelGroup.position.set(wp.x, wp.y, wp.z);

  // Rubber Tire
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24),
    tireMaterial
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheelGroup.add(tire);

  // Metal Rim
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.01, 16),
    rimMaterial
  );
  rim.rotation.z = Math.PI / 2;
  wheelGroup.add(rim);

  carRoot.add(wheelGroup);
});

// 4. Cyber Headlight Bar (Front)
const headlightBar = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 0.08, 0.08),
  headlightMaterial
);
headlightBar.name = 'Headlight_Bar';
headlightBar.position.set(0, 0.55, 2.12);
carRoot.add(headlightBar);

// 5. Cyber Taillight Bar (Rear)
const taillightBar = new THREE.Mesh(
  new THREE.BoxGeometry(1.65, 0.08, 0.08),
  taillightMaterial
);
taillightBar.name = 'Taillight_Bar';
taillightBar.position.set(0, 0.62, -2.12);
carRoot.add(taillightBar);

// 6. Underbody Battery Pack (Mounted low for low center of gravity)
const batteryPack = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.12, 2.5),
  batteryMaterial
);
batteryPack.name = 'Battery_Pack';
batteryPack.position.set(0, 0.18, 0);
batteryPack.castShadow = true;
batteryPack.receiveShadow = true;
carRoot.add(batteryPack);

// 7. Charging Port (Rear-left flap)
const chargingPort = new THREE.Mesh(
  new THREE.BoxGeometry(0.04, 0.14, 0.18),
  new THREE.MeshStandardMaterial({
    color: 0x00f2fe,
    emissive: 0x00f2fe,
    emissiveIntensity: 1.0,
    name: 'Material_ChargingPort',
  })
);
chargingPort.name = 'Charging_Port';
chargingPort.position.set(-0.93, 0.65, -1.6);
carRoot.add(chargingPort);

// 8. Lower Aerodynamic Diffuser
const diffuser = new THREE.Mesh(
  new THREE.BoxGeometry(1.7, 0.12, 0.4),
  darkTrimMaterial
);
diffuser.name = 'Aerodynamic_Diffuser';
diffuser.position.set(0, 0.22, -2.05);
carRoot.add(diffuser);

// Output Directory
const outputDir = path.resolve(__dirname, '../public/models');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const outputPath = path.join(outputDir, 'ev-car.glb');

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (gltf) => {
    fs.writeFileSync(outputPath, Buffer.from(gltf));
    console.log(`[SUCCESS] EV 3D Digital Twin model generated: ${outputPath}`);
    console.log(`[STATS] File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    console.log(`[PARTS] Exported parts: Chassis_Body, Cabin_Glass, Roof_Panel, Wheel_Front_Left, Wheel_Front_Right, Wheel_Rear_Left, Wheel_Rear_Right, Headlight_Bar, Taillight_Bar, Battery_Pack, Charging_Port, Aerodynamic_Diffuser`);
  },
  (error) => {
    console.error('[ERROR] Failed to export GLTF:', error);
    process.exit(1);
  },
  { binary: true }
);
