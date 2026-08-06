import * as THREE from 'three';

/** Přemapuje UV souřadnice prstence tak, aby radiální vzdálenost odpovídala ose U textury. */
export function fixRingUVs(geometry: THREE.RingGeometry, innerRadius: number, outerRadius: number): void {
  const positions = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    const distance = vertex.length();
    const u = (distance - innerRadius) / (outerRadius - innerRadius);
    uvs.setXY(i, u, 1);
  }
  uvs.needsUpdate = true;
}
