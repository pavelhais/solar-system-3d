import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export interface EasterEggModelOptions {
  modelPath: string;
  /** Cílová délka nejdelší strany modelu ve scénických jednotkách. */
  targetSize: number;
  labelText: string;
  labelId: string;
  groupName: string;
}

// Sdílený loader pro "easter egg" modely (mimoúrovňové objekty na oběžné
// dráze - lodě, stanice) - přeškáluje na cílovou velikost, vycentruje podle
// těžiště a přidá klikatelný popisek ve stejném stylu jako u planet/měsíců.
export function loadEasterEggModel(options: EasterEggModelOptions): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      options.modelPath,
      (gltf) => {
        const model = gltf.scene;

        const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        model.scale.setScalar(options.targetSize / maxDim);

        // Vycentrovat model na jeho těžiště, aby se otáčel/oběhal kolem sebe
        // sama, ne kolem náhodného bodu původní geometrie.
        const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
        model.position.sub(center);

        const group = new THREE.Group();
        group.add(model);

        const labelEl = document.createElement('div');
        labelEl.className = 'body-label body-label--easter-egg';
        labelEl.textContent = options.labelText;
        labelEl.dataset.bodyId = options.labelId;
        const label = new CSS2DObject(labelEl);
        label.center.set(0.5, 1.2);
        group.add(label);

        group.name = options.groupName;
        resolve(group);
      },
      undefined,
      reject,
    );
  });
}
