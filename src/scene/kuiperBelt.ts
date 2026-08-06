import * as THREE from 'three';
import { orbitRadiusFromAU } from './scale';

// Klasický Kuiperův pás sahá zhruba od dráhy Neptunu (30 AU) do ~50 AU.
// Používá stejnou mocninnou kompresi vzdáleností jako planety, takže navazuje
// plynule na Neptun/Pluto.
const INNER_AU = 30;
const OUTER_AU = 50;
const PARTICLE_COUNT = 12000;
const VERTICAL_SPREAD = 4;

export function createKuiperBelt(): THREE.Points {
  const innerRadius = orbitRadiusFromAU(INNER_AU);
  const outerRadius = orbitRadiusFromAU(OUTER_AU);

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Odmocnina z rovnoměrně rozloženého čtverce poloměru => rovnoměrná hustota
    // podle plochy mezikruží (jinak by se body hromadily u vnitřního okraje).
    const radius = Math.sqrt(
      THREE.MathUtils.lerp(innerRadius * innerRadius, outerRadius * outerRadius, Math.random()),
    );
    const y = (Math.random() - 0.5) * VERTICAL_SPREAD;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xccddff,
    size: 0.35,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'kuiperBelt';
  return points;
}
