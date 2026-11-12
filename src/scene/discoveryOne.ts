import * as THREE from 'three';
import { loadEasterEggModel } from './easterEgg';

// Easter egg - Discovery One z filmu 2001: Vesmírná odysea. Model je vlastní
// (postavený v Blenderu z primitiv, příď na +X). Stejně jako u ostatních
// easter eggů je úmyslně mimo reálné měřítko (reálných ~140 m by u Jupiteru
// nebylo vůbec vidět); délka je zvolena tak, aby loď byla u obřího Jupiteru
// (poloměr ~5,5 j.) dobře vidět, ale nepřebila jeho měsíce.
const TARGET_SIZE = 0.3;
const MODEL_PATH = 'models/discovery_one.glb';

export const DISCOVERY_LABEL_ID = 'discovery-one';

export function loadDiscoveryOne(): Promise<THREE.Group> {
  return loadEasterEggModel({
    modelPath: MODEL_PATH,
    targetSize: TARGET_SIZE,
    labelText: 'Discovery One',
    labelId: DISCOVERY_LABEL_ID,
    groupName: 'discoveryOne',
  });
}
