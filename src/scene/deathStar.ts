import * as THREE from 'three';
import { loadEasterEggModel } from './easterEgg';

// Easter egg - stejně jako Millennium Falcon úmyslně mimo reálné měřítko
// (reálný průměr ~120-160 km by v scéně vůbec nebyl vidět). TARGET_SIZE je
// zvolena o něco větší než Falcon, aby vyjádřila, že jde o gigantickou stanici,
// ale pořád v rozumném poměru k Marsu (nesmí ho vizuálně přebít).
const TARGET_SIZE = 0.15;
const MODEL_PATH = 'models/death_star.glb';

export const DEATH_STAR_LABEL_ID = 'death-star';

export function loadDeathStar(): Promise<THREE.Group> {
  return loadEasterEggModel({
    modelPath: MODEL_PATH,
    targetSize: TARGET_SIZE,
    labelText: 'Hvězda smrti',
    labelId: DEATH_STAR_LABEL_ID,
    groupName: 'deathStar',
  });
}
