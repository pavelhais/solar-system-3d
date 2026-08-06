import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildSolarSystem, createOrbitLine, type SceneBody } from './scene/sceneBuilder';
import { createKuiperBelt } from './scene/kuiperBelt';
import { createInfoPanel, hideInfoPanel, showInfoPanel } from './ui/infoPanel';
import { createTimeControls } from './ui/timeControls';
import { createNavigationPanel } from './ui/navigationPanel';
import './style.css';

const app = document.getElementById('app')!;

const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.className = 'label-layer';
app.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();

const starGeometry = new THREE.SphereGeometry(400, 64, 64);
const starTexture = new THREE.TextureLoader().load('textures/2k_stars_milky_way.jpg');
starTexture.colorSpace = THREE.SRGBColorSpace;
const starMaterial = new THREE.MeshBasicMaterial({ map: starTexture, side: THREE.BackSide });
scene.add(new THREE.Mesh(starGeometry, starMaterial));
scene.add(new THREE.AmbientLight(0xffffff, 0.15));

const INITIAL_CAMERA_POSITION = new THREE.Vector3(0, 45, 95);
const INITIAL_TARGET = new THREE.Vector3(0, 0, 0);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.001, 2000);
camera.position.copy(INITIAL_CAMERA_POSITION);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.01;
controls.maxDistance = 400;
controls.target.copy(INITIAL_TARGET);

const bodies = buildSolarSystem(scene);
const bodyMap = new Map<string, SceneBody>(bodies.map((b) => [b.data.id, b]));

for (const body of bodies) {
  if (body.data.type === 'planet' || body.data.type === 'dwarfPlanet') {
    scene.add(createOrbitLine(body.orbitRadiusScene));
  }
}

scene.add(createKuiperBelt());

createInfoPanel(app, () => {
  focusedBody = null;
});

let paused = false;
let speedDaysPerSecond = 0.05;
createTimeControls(app, speedDaysPerSecond, {
  onPauseToggle: (p) => (paused = p),
  onSpeedChange: (s) => (speedDaysPerSecond = s),
});

let focusedBody: SceneBody | null = null;
const lastWorldPos = new THREE.Vector3();

// referenceDate odpovídá simDays = 0 (okamžiku spuštění aplikace); planety mají
// initialOrbitAngle spočítaný přesně k tomuto datu (viz scene/ephemeris.ts).
const referenceDate = new Date();
let simDays = 0;

function resetView(): void {
  controls.target.copy(INITIAL_TARGET);
  camera.position.copy(INITIAL_CAMERA_POSITION);
  focusedBody = null;
  hideInfoPanel();
}

const navPanel = createNavigationPanel(app, {
  onHome: resetView,
  onJumpToDate: (date) => {
    simDays = (date.getTime() - referenceDate.getTime()) / 86400000;
  },
  onToday: () => {
    simDays = 0;
  },
});

function selectBody(id: string): void {
  const body = bodyMap.get(id);
  if (!body) return;

  showInfoPanel(body.data);

  const worldPos = new THREE.Vector3();
  body.mesh.getWorldPosition(worldPos);

  const dir = camera.position.clone().sub(controls.target);
  if (dir.lengthSq() < 1e-6) dir.set(0, 0.3, 1);
  dir.normalize();

  const bodyRadius = (body.mesh.geometry as THREE.SphereGeometry).parameters.radius as number;
  const desiredDistance = Math.max(bodyRadius * 5, 0.25);

  controls.target.copy(worldPos);
  camera.position.copy(worldPos).addScaledVector(dir, desiredDistance);

  focusedBody = body;
  lastWorldPos.copy(worldPos);
}

document.addEventListener('click', (e) => {
  const labelEl = (e.target as HTMLElement).closest('.body-label') as HTMLElement | null;
  if (labelEl?.dataset.bodyId) {
    selectBody(labelEl.dataset.bodyId);
  }
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointerup', (e) => {
  const movedDistance = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (movedDistance > 5) return; // to byl drag/orbitování kamery, ne klik

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(bodies.map((b) => b.mesh), false);
  if (intersects.length > 0) {
    const hit = bodies.find((b) => b.mesh === intersects[0].object);
    if (hit) selectBody(hit.data.id);
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (!paused) {
    simDays += delta * speedDaysPerSecond;
  }
  navPanel.setDisplayedDate(new Date(referenceDate.getTime() + simDays * 86400000));

  for (const body of bodies) {
    if (body.data.orbitalPeriodDays !== 0) {
      body.orbitPivot.rotation.y = body.initialOrbitAngle + (simDays / body.data.orbitalPeriodDays) * Math.PI * 2;
    }
    if (body.tiltGroup) {
      // vyruší rotaci orbitPivotu, takže sklon osy (a prstenec) zůstává pevný
      // v prostoru bez ohledu na polohu tělesa na oběžné dráze
      body.tiltGroup.rotation.y = -body.orbitPivot.rotation.y;
    }
    // Všechny měsíce v datasetu jsou vázaně rotující (doba rotace = oběžná doba) - stejně
    // jako ve skutečnosti. Otočení kolem planety (orbitPivot.rotation.y) samo o sobě už
    // vizuálně otáčí i síť měsíce (je jeho potomkem v hierarchii), takže přidávat ještě
    // samostatnou animaci rotace by měsíc otočilo dvakrát za jeden oběh - proto se u měsíců
    // rotationPeriodHours na 3D síť neaplikuje (v info panelu zůstává zobrazená správně).
    if (body.data.type !== 'moon' && body.data.rotationPeriodHours !== 0) {
      const periodDays = body.data.rotationPeriodHours / 24;
      body.mesh.rotation.y = (simDays / periodDays) * Math.PI * 2;
    }
  }

  if (focusedBody) {
    const worldPos = new THREE.Vector3();
    focusedBody.mesh.getWorldPosition(worldPos);
    const delta2 = worldPos.clone().sub(lastWorldPos);
    camera.position.add(delta2);
    controls.target.add(delta2);
    lastWorldPos.copy(worldPos);
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

animate();

// zavření info panelu klávesou Escape
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideInfoPanel();
    focusedBody = null;
  }
});
