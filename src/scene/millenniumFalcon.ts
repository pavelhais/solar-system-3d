import * as THREE from 'three';
import { loadEasterEggModel } from './easterEgg';

// Easter egg - jako u Slunce (SUN_RADIUS_SCENE) je i tohle úmyslně mimo reálné
// měřítko: v reálném poměru (cca 35 m) by loď byla v scéně neviditelná.
// TARGET_SIZE je zvolena tak, aby byla srovnatelná s nejmenšími měsíci
// (MIN_BODY_RADIUS * 2 ve scale.ts), tedy pořád viditelná, ale co nejblíž
// reálnému měřítku Země.
const TARGET_SIZE = 0.09;
const MODEL_PATH = 'models/millenium_falcon.glb';

export const FALCON_LABEL_ID = 'millennium-falcon';

export function loadMillenniumFalcon(): Promise<THREE.Group> {
  return loadEasterEggModel({
    modelPath: MODEL_PATH,
    targetSize: TARGET_SIZE,
    labelText: 'Millennium Falcon',
    labelId: FALCON_LABEL_ID,
    groupName: 'millenniumFalcon',
  });
}
