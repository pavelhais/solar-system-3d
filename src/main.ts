import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildSolarSystem, createOrbitLine, type SceneBody } from './scene/sceneBuilder';
import { createKuiperBelt } from './scene/kuiperBelt';
import { loadMillenniumFalcon, FALCON_LABEL_ID } from './scene/millenniumFalcon';
import { loadDeathStar, DEATH_STAR_LABEL_ID } from './scene/deathStar';
import { loadDiscoveryOne, DISCOVERY_LABEL_ID } from './scene/discoveryOne';
import { createInfoPanel, hideInfoPanel, showInfoPanel, showCustomInfoPanel } from './ui/infoPanel';
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

// Easter egg: Millennium Falcon na vlastní (fiktivní) dráze kolem Země.
// falconOrbitPivot sleduje v animate() aktuální pozici Země ve scéně, takže
// oběžná dráha zůstává centrovaná na planetu i při jejím pohybu kolem Slunce.
const earthBody = bodyMap.get('earth');
const FALCON_ORBIT_RADIUS = 0.75;
const FALCON_ORBIT_PERIOD_DAYS = 3;
// Pokud model po načtení míří "zádí napřed" nebo bokem, doladit tímto úhlem
// (stupně) - viz vysvětlení u loadMillenniumFalcon().then() níže. Model má
// nativně příď na +X, tečna dráhy v lokálním prostoru pivotu směřuje k -Z,
// proto +90°.
const FALCON_NOSE_OFFSET_DEG = 90;
// Náklon (roll) kolem přídě-záď osy (lokální X - viz výše), aby loď letěla
// "břichem" (spodkem) k planetě místo břichem dolů/nahoru mimo rovinu dráhy.
const FALCON_ROLL_OFFSET_DEG = 90;
// Klopení (pitch) kolem příčné/křídlové osy (lokální Z) - naklápí příď
// nahoru/dolů mimo rovinu dráhy. Dřív byly roll a pitch omylem prohozené
// (obě navěšené na osy, které při FALCON_NOSE_OFFSET_DEG=90° vycházely na
// stejnou skutečnou otočnou osu lodi) - proto vypadaly jako totéž.
const FALCON_PITCH_OFFSET_DEG = 0;
const FALCON_INFO = {
  title: 'Millennium Falcon',
  subtitle: 'YT-1300f Corellian light freighter',
  rows: [
    ['Kapitán', 'Han Solo'],
    ['Posádka', 'Han Solo, Chewbacca'],
    ['Délka', '34,75 m'],
    ['Pohon', 'hyperpohon třídy 0,5'],
    ['Slavný výkon', 'Kesselský běh zkrácen na necelých 12 parseků (nejkratší známá trasa)'],
  ] as [string, string][],
  description:
    'Silně upravený pašerácký nákladní člun, v rukou správného pilota nejrychlejší loď v galaxii. Do sluneční soustavy zabloudila jako easter egg tohoto modelu.',
};
const falconInitialAngle = Math.random() * Math.PI * 2;
const falconOrbitPivot = new THREE.Object3D();
scene.add(falconOrbitPivot);
let falconGroup: THREE.Group | null = null;
loadMillenniumFalcon()
  .then((falcon) => {
    falcon.position.set(FALCON_ORBIT_RADIUS, 0, 0);
    // Loď je potomkem falconOrbitPivot, takže při jeho rotaci automaticky
    // "obtáčí" i svou lokální orientaci - žádná další rotace v animate()
    // není potřeba.
    // Roll (kolem X, přídě) a pitch (kolem Z, křídel) se aplikují nejdřív,
    // v původní orientaci modelu (příď +X, nahoru +Y) - teprve na výsledek
    // se aplikuje yaw, který přídí namíří ve směru letu. Kdyby se pořadí
    // otočilo, roll a pitch by (kvůli 90° yaw) skončily na stejné ose - to
    // byl původní bug.
    const rollQ = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(FALCON_ROLL_OFFSET_DEG),
    );
    const pitchQ = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      THREE.MathUtils.degToRad(FALCON_PITCH_OFFSET_DEG),
    );
    const yawQ = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(FALCON_NOSE_OFFSET_DEG),
    );
    falcon.quaternion.copy(yawQ).multiply(pitchQ).multiply(rollQ);
    falconOrbitPivot.add(falcon);
    falconGroup = falcon;
  })
  .catch((err) => console.error('Nepodařilo se načíst model Millennium Falconu:', err));

// Easter egg: Hvězda smrti na vlastní (fiktivní) dráze kolem Marsu. Stejný
// princip sledování planety jako u falconOrbitPivot výše.
const marsBody = bodyMap.get('mars');
const DEATH_STAR_ORBIT_RADIUS = 0.55;
const DEATH_STAR_ORBIT_PERIOD_DAYS = 6;
const DEATH_STAR_INFO = {
  title: 'Hvězda smrti',
  subtitle: 'DS-1 Orbital Battle Station',
  rows: [
    ['Velitel', 'Grand Moff Tarkin'],
    ['Posádka', '~1 000 000 (důstojníci, technici, stormtroopeři)'],
    ['Průměr', '160 km'],
    ['Výzbroj', 'superlaser schopný zničit celou planetu'],
    ['Slavná slabina', 'dvoumetrový výfukový otvor termálního výtahu'],
  ] as [string, string][],
  description:
    'Pohyblivá bojová stanice velikosti malého měsíce, schopná jediným výstřelem zničit planetu. Tahle kopie zabloudila na oběžnou dráhu Marsu jako další easter egg tohoto modelu.',
};
const deathStarInitialAngle = Math.random() * Math.PI * 2;
const deathStarOrbitPivot = new THREE.Object3D();
scene.add(deathStarOrbitPivot);
let deathStarGroup: THREE.Group | null = null;
loadDeathStar()
  .then((deathStar) => {
    deathStar.position.set(DEATH_STAR_ORBIT_RADIUS, 0, 0);
    deathStarOrbitPivot.add(deathStar);
    deathStarGroup = deathStar;
  })
  .catch((err) => console.error('Nepodařilo se načíst model Hvězdy smrti:', err));

// Easter egg: Discovery One z 2001: Vesmírné odysey na dráze kolem Jupiteru.
// Jupiter má ve scéně poloměr ~5,5 j. a nejbližší měsíc (Io) obíhá na ~7,1 j.,
// takže dráha 6,3 j. vede mezerou mezi povrchem a Io. Stejný princip
// sledování planety jako u falconOrbitPivot.
const jupiterBody = bodyMap.get('jupiter');
const DISCOVERY_ORBIT_RADIUS = 6.3;
const DISCOVERY_ORBIT_PERIOD_DAYS = 1.2;
// Model má příď na +X, tečna dráhy v lokálním prostoru pivotu míří k -Z
// (stejně jako u Falconu), proto +90°.
const DISCOVERY_NOSE_OFFSET_DEG = 90;
const DISCOVERY_INFO = {
  title: 'Discovery One',
  subtitle: 'Meziplanetární loď USA (2001: Vesmírná odysea)',
  rows: [
    ['Velitel', 'David Bowman'],
    ['Posádka', 'Bowman, Frank Poole + 3 vědci v hibernaci'],
    ['Palubní počítač', 'HAL 9000'],
    ['Délka', '~140 m'],
    ['Cíl mise', 'Jupiter - stopa signálu monolitu TMA-1'],
  ] as [string, string][],
  description:
    'Loď z filmu Stanleyho Kubricka (1968) s kulovým velitelským modulem a dlouhou páteří zakončenou jaderným pohonem. Na oběžnou dráhu Jupiteru dorazila jako další easter egg tohoto modelu. „Je mi líto, Dave. Obávám se, že to nemohu udělat."',
};
const discoveryInitialAngle = Math.random() * Math.PI * 2;
const discoveryOrbitPivot = new THREE.Object3D();
scene.add(discoveryOrbitPivot);
let discoveryGroup: THREE.Group | null = null;
loadDiscoveryOne()
  .then((discovery) => {
    discovery.position.set(DISCOVERY_ORBIT_RADIUS, 0, 0);
    discovery.quaternion.setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(DISCOVERY_NOSE_OFFSET_DEG),
    );
    discoveryOrbitPivot.add(discovery);
    discoveryGroup = discovery;
  })
  .catch((err) => console.error('Nepodařilo se načíst model Discovery One:', err));

createInfoPanel(app, () => {
  focusedBody = null;
});

let paused = false;
let speedDaysPerSecond = 0.05;
createTimeControls(app, speedDaysPerSecond, {
  onPauseToggle: (p) => (paused = p),
  onSpeedChange: (s) => (speedDaysPerSecond = s),
});

type Focusable = { mesh: THREE.Object3D };
let focusedBody: Focusable | null = null;
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

function selectFalcon(): void {
  if (!falconGroup) return;

  showCustomInfoPanel(FALCON_INFO);

  const worldPos = new THREE.Vector3();
  falconGroup.getWorldPosition(worldPos);

  const dir = camera.position.clone().sub(controls.target);
  if (dir.lengthSq() < 1e-6) dir.set(0, 0.3, 1);
  dir.normalize();

  controls.target.copy(worldPos);
  camera.position.copy(worldPos).addScaledVector(dir, 0.6);

  focusedBody = { mesh: falconGroup };
  lastWorldPos.copy(worldPos);
}

function selectDeathStar(): void {
  if (!deathStarGroup) return;

  showCustomInfoPanel(DEATH_STAR_INFO);

  const worldPos = new THREE.Vector3();
  deathStarGroup.getWorldPosition(worldPos);

  const dir = camera.position.clone().sub(controls.target);
  if (dir.lengthSq() < 1e-6) dir.set(0, 0.3, 1);
  dir.normalize();

  controls.target.copy(worldPos);
  camera.position.copy(worldPos).addScaledVector(dir, 0.8);

  focusedBody = { mesh: deathStarGroup };
  lastWorldPos.copy(worldPos);
}

function selectDiscovery(): void {
  if (!discoveryGroup) return;

  showCustomInfoPanel(DISCOVERY_INFO);

  const worldPos = new THREE.Vector3();
  discoveryGroup.getWorldPosition(worldPos);

  const dir = camera.position.clone().sub(controls.target);
  if (dir.lengthSq() < 1e-6) dir.set(0, 0.3, 1);
  dir.normalize();

  controls.target.copy(worldPos);
  camera.position.copy(worldPos).addScaledVector(dir, 1.2);

  focusedBody = { mesh: discoveryGroup };
  lastWorldPos.copy(worldPos);
}

document.addEventListener('click', (e) => {
  const labelEl = (e.target as HTMLElement).closest('.body-label') as HTMLElement | null;
  if (!labelEl?.dataset.bodyId) return;
  if (labelEl.dataset.bodyId === FALCON_LABEL_ID) {
    selectFalcon();
  } else if (labelEl.dataset.bodyId === DEATH_STAR_LABEL_ID) {
    selectDeathStar();
  } else if (labelEl.dataset.bodyId === DISCOVERY_LABEL_ID) {
    selectDiscovery();
  } else {
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

  if (earthBody) {
    const earthWorldPos = new THREE.Vector3();
    earthBody.mesh.getWorldPosition(earthWorldPos);
    falconOrbitPivot.position.copy(earthWorldPos);
    falconOrbitPivot.rotation.y = falconInitialAngle + (simDays / FALCON_ORBIT_PERIOD_DAYS) * Math.PI * 2;
  }

  if (marsBody) {
    const marsWorldPos = new THREE.Vector3();
    marsBody.mesh.getWorldPosition(marsWorldPos);
    deathStarOrbitPivot.position.copy(marsWorldPos);
    // Stanice je potomkem pivotu s nulovou vlastní rotací, takže automaticky
    // přebírá jeho otočení - lokální směr k počátku pivotu (Mars) tak zůstává
    // pořád stejný, tzn. vázaná rotace (jeden bod stále míří k Marsu), stejně
    // jako Měsíc k Zemi.
    deathStarOrbitPivot.rotation.y = deathStarInitialAngle + (simDays / DEATH_STAR_ORBIT_PERIOD_DAYS) * Math.PI * 2;
  }

  if (jupiterBody) {
    const jupiterWorldPos = new THREE.Vector3();
    jupiterBody.mesh.getWorldPosition(jupiterWorldPos);
    discoveryOrbitPivot.position.copy(jupiterWorldPos);
    discoveryOrbitPivot.rotation.y = discoveryInitialAngle + (simDays / DISCOVERY_ORBIT_PERIOD_DAYS) * Math.PI * 2;
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
