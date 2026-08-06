import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { celestialBodies, getChildren, type CelestialBodyData } from '../data/celestialBodies';
import { bodyRadiusScene, layoutMoonOrbits, orbitRadiusFromSun, ringRadiiScene, SUN_RADIUS_SCENE } from './scale';
import { fixRingUVs } from './rings';
import { getCurrentOrbitalAngle } from './ephemeris';

const textureLoader = new THREE.TextureLoader();
function loadTexture(file: string): THREE.Texture {
  const tex = textureLoader.load(`textures/${file}`);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface SceneBody {
  data: CelestialBodyData;
  /** Otáčí se kolem rodiče (Slunce/planety) - simuluje oběh. */
  orbitPivot: THREE.Object3D;
  /** Vlastní síť tělesa - otáčí se kolem své osy - simuluje rotaci. */
  mesh: THREE.Mesh;
  orbitRadiusScene: number;
  label: CSS2DObject;
  /**
   * Nese sklon osy (a prstenec). Jeho rotace se každý snímek nastavuje na opak
   * rotace orbitPivotu, aby sklon zůstal pevný v prostoru bez ohledu na polohu
   * na oběžné dráze (planeta se nenaklápí tam a zpět, jak obíhá).
   */
  tiltGroup?: THREE.Object3D;
  /**
   * Počáteční natočení oběžné dráhy (rad) - u planet reálná poloha ke dnešnímu
   * datu, u měsíců náhodná fáze. Animační smyčka k němu přičítá pohyb v čase,
   * takže se (na rozdíl od jednorázového nastavení rotace při stavbě scény)
   * neztratí hned v prvním snímku.
   */
  initialOrbitAngle: number;
}

function makeLabel(data: CelestialBodyData): CSS2DObject {
  const el = document.createElement('div');
  el.className = `body-label body-label--${data.type}`;
  el.textContent = data.name;
  el.dataset.bodyId = data.id;
  const obj = new CSS2DObject(el);
  obj.center.set(0.5, 1.2);
  return obj;
}

export function buildSolarSystem(scene: THREE.Scene): SceneBody[] {
  const result: SceneBody[] = [];
  const anchorsById = new Map<string, THREE.Object3D>();

  const sunData = celestialBodies.find((b) => b.id === 'sun')!;
  const sunRadius = SUN_RADIUS_SCENE;
  const sunGeometry = new THREE.SphereGeometry(sunRadius, 48, 48);
  const sunMaterial = new THREE.MeshBasicMaterial({ map: loadTexture(sunData.texture) });
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
  const sunPivot = new THREE.Object3D();
  sunPivot.add(sunMesh);
  scene.add(sunPivot);
  sunMesh.add(makeLabel(sunData));
  anchorsById.set('sun', sunMesh);
  result.push({ data: sunData, orbitPivot: sunPivot, mesh: sunMesh, orbitRadiusScene: 0, label: sunMesh.children[0] as CSS2DObject, initialOrbitAngle: 0 });

  const light = new THREE.PointLight(0xffffff, 3, 0, 0);
  sunMesh.add(light);

  const planets = getChildren('sun');
  for (const planetData of planets) {
    const planetRadius = bodyRadiusScene(planetData.radiusKm);
    const orbitRadius = orbitRadiusFromSun(planetData.distanceFromParentKm);

    const orbitPivot = new THREE.Object3D();
    scene.add(orbitPivot);

    const anchor = new THREE.Object3D();
    anchor.position.set(orbitRadius, 0, 0);
    orbitPivot.add(anchor);

    // tiltGroup nese sklon osy; jeho rotation.y se za běhu vyrušuje s rotací
    // orbitPivotu, takže sklon zůstane pevný v prostoru nezávisle na poloze na dráze.
    const tiltGroup = new THREE.Object3D();
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(planetData.axialTiltDeg);
    anchor.add(tiltGroup);

    const geometry = new THREE.SphereGeometry(planetRadius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: loadTexture(planetData.texture),
      roughness: 1,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    tiltGroup.add(mesh);
    mesh.add(makeLabel(planetData));

    if (planetData.cloudsTexture) {
      const cloudGeometry = new THREE.SphereGeometry(planetRadius * 1.01, 64, 64);
      const cloudMaterial = new THREE.MeshStandardMaterial({
        map: loadTexture(planetData.cloudsTexture),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
      mesh.add(cloudMesh);
    }

    if (planetData.ring) {
      const { inner, outer } = ringRadiiScene(
        planetData.radiusKm,
        planetRadius,
        planetData.ring.innerRadiusKm,
        planetData.ring.outerRadiusKm,
      );
      const ringGeometry = new THREE.RingGeometry(inner, outer, 128, 1);
      fixRingUVs(ringGeometry, inner, outer);
      const ringMaterial = planetData.ring.texture
        ? new THREE.MeshBasicMaterial({
            map: loadTexture(planetData.ring.texture),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        : new THREE.MeshBasicMaterial({
            color: planetData.ring.color ?? '#aaaaaa',
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.rotation.x = -Math.PI / 2;
      // Prstenec visí na tiltGroup (ne na mesh), aby sdílel sklon planety,
      // ale netočil se s její (mnohem rychlejší) denní rotací.
      tiltGroup.add(ringMesh);
    }

    anchorsById.set(planetData.id, anchor);
    result.push({
      data: planetData,
      orbitPivot,
      mesh,
      orbitRadiusScene: orbitRadius,
      label: mesh.children[0] as CSS2DObject,
      tiltGroup,
      initialOrbitAngle: getCurrentOrbitalAngle(planetData.id, new Date()),
    });

    const ringOuterScene = planetData.ring
      ? ringRadiiScene(planetData.radiusKm, planetRadius, planetData.ring.innerRadiusKm, planetData.ring.outerRadiusKm).outer
      : undefined;

    const moons = getChildren(planetData.id).sort((a, b) => a.distanceFromParentKm - b.distanceFromParentKm);
    const moonOrbits = layoutMoonOrbits(planetData.id, planetRadius, planetData.radiusKm, ringOuterScene, moons);
    moons.forEach((moonData, index) => {
      const moonRadius = bodyRadiusScene(moonData.radiusKm);
      const moonOrbit = moonOrbits[index];

      const moonPivot = new THREE.Object3D();
      const moonInitialAngle = Math.random() * Math.PI * 2;
      anchor.add(moonPivot);

      const moonAnchor = new THREE.Object3D();
      moonAnchor.position.set(moonOrbit, 0, 0);
      moonPivot.add(moonAnchor);

      const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
      const moonMaterial = moonData.texture
        ? new THREE.MeshStandardMaterial({ map: loadTexture(moonData.texture), roughness: 1 })
        : new THREE.MeshStandardMaterial({ color: moonData.fallbackColor ?? '#999999', roughness: 1 });
      const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
      moonAnchor.add(moonMesh);
      moonMesh.add(makeLabel(moonData));

      anchorsById.set(moonData.id, moonAnchor);
      result.push({
        data: moonData,
        orbitPivot: moonPivot,
        mesh: moonMesh,
        orbitRadiusScene: moonOrbit,
        label: moonMesh.children[0] as CSS2DObject,
        initialOrbitAngle: moonInitialAngle,
      });
    });
  }

  return result;
}

export function createOrbitLine(radius: number): THREE.Line {
  const points: THREE.Vector3[] = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0x3a4a6b, transparent: true, opacity: 0.4 });
  return new THREE.Line(geometry, material);
}
