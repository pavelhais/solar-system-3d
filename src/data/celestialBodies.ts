// Reálná astronomická data (NASA/JPL Planetary Fact Sheets, JPL Solar System Dynamics).
// Vzdálenosti a poloměry jsou reálné hodnoty; ve scéně se zobrazují ve zkráceném
// (nerealistickém) měřítku pro přehlednost - viz src/scene/scale.ts.

export type BodyType = 'star' | 'planet' | 'dwarfPlanet' | 'moon';

export interface CelestialBodyData {
  id: string;
  name: string;
  nameEn: string;
  type: BodyType;
  parentId: string | null;
  /** Hmotnost v kg */
  massKg: number;
  /** Střední poloměr v km */
  radiusKm: number;
  /** Oběžná doba kolem rodiče ve dnech (0 = nemá rodiče / Slunce) */
  orbitalPeriodDays: number;
  /** Doba rotace kolem vlastní osy v hodinách (záporná = retrográdní rotace) */
  rotationPeriodHours: number;
  /** Střední vzdálenost od rodiče (Slunce nebo planety) v km */
  distanceFromParentKm: number;
  /** Sklon oběžné dráhy/rotační osy v stupních, jen informační */
  axialTiltDeg: number;
  /** Cesta k textuře povrchu (relativně k /textures) */
  texture: string;
  /** Volitelná textura mraků (Země) */
  cloudsTexture?: string;
  /** Volitelný prstenec */
  ring?: {
    texture?: string;
    innerRadiusKm: number;
    outerRadiusKm: number;
    color?: string;
  };
  /** Barva použitá, pokud není k dispozici fotorealistická textura (menší měsíce) */
  fallbackColor?: string;
  description: string;
}

export const celestialBodies: CelestialBodyData[] = [
  {
    id: 'sun',
    name: 'Slunce',
    nameEn: 'Sun',
    type: 'star',
    parentId: null,
    massKg: 1.989e30,
    radiusKm: 696340,
    orbitalPeriodDays: 0,
    rotationPeriodHours: 609.12, // ~25.4 dne na rovníku
    distanceFromParentKm: 0,
    axialTiltDeg: 7.25,
    texture: '2k_sun.jpg',
    description:
      'Hvězda v centru sluneční soustavy, obsahuje přes 99,8 % veškeré hmoty soustavy. Jde o žhavou plazmatickou kouli, kde probíhá jaderná fúze vodíku na helium.',
  },

  // --- Merkur ---
  {
    id: 'mercury',
    name: 'Merkur',
    nameEn: 'Mercury',
    type: 'planet',
    parentId: 'sun',
    massKg: 3.3011e23,
    radiusKm: 2439.7,
    orbitalPeriodDays: 87.969,
    rotationPeriodHours: 1407.6,
    distanceFromParentKm: 57.909e6,
    axialTiltDeg: 0.034,
    texture: '2k_mercury.jpg',
    description:
      'Nejmenší a Slunci nejbližší planeta. Nemá atmosféru, teplotní rozdíly mezi dnem a nocí patří k největším ve sluneční soustavě.',
  },

  // --- Venuše ---
  {
    id: 'venus',
    name: 'Venuše',
    nameEn: 'Venus',
    type: 'planet',
    parentId: 'sun',
    massKg: 4.8675e24,
    radiusKm: 6051.8,
    orbitalPeriodDays: 224.701,
    rotationPeriodHours: -5832.5, // retrográdní rotace
    distanceFromParentKm: 108.209e6,
    axialTiltDeg: 177.4,
    texture: '2k_venus_surface.jpg',
    cloudsTexture: '2k_venus_atmosphere.jpg',
    description:
      'Nejteplejší planeta sluneční soustavy díky extrémnímu skleníkovému efektu husté atmosféry CO2. Rotuje opačným směrem než většina planet.',
  },

  // --- Země ---
  {
    id: 'earth',
    name: 'Země',
    nameEn: 'Earth',
    type: 'planet',
    parentId: 'sun',
    massKg: 5.972e24,
    radiusKm: 6371,
    orbitalPeriodDays: 365.256,
    rotationPeriodHours: 23.9345,
    distanceFromParentKm: 149.598e6,
    axialTiltDeg: 23.44,
    texture: '2k_earth_daymap.jpg',
    cloudsTexture: '2k_earth_clouds.jpg',
    description:
      'Jediná dosud známá planeta s životem. Povrch pokrývá ze 71 % voda, atmosféra je bohatá na dusík a kyslík.',
  },
  {
    id: 'moon',
    name: 'Měsíc',
    nameEn: 'Moon',
    type: 'moon',
    parentId: 'earth',
    massKg: 7.342e22,
    radiusKm: 1737.4,
    orbitalPeriodDays: 27.322,
    rotationPeriodHours: 655.7,
    distanceFromParentKm: 384400,
    axialTiltDeg: 6.68,
    texture: '2k_moon.jpg',
    description:
      'Jediný přirozený satelit Země. Je slapově vázaný, takže k Zemi natáčí stále stejnou polokouli.',
  },

  // --- Mars ---
  {
    id: 'mars',
    name: 'Mars',
    nameEn: 'Mars',
    type: 'planet',
    parentId: 'sun',
    massKg: 6.4171e23,
    radiusKm: 3389.5,
    orbitalPeriodDays: 686.98,
    rotationPeriodHours: 24.6229,
    distanceFromParentKm: 227.923e6,
    axialTiltDeg: 25.19,
    texture: '2k_mars.jpg',
    description:
      '"Rudá planeta" pojmenovaná podle římského boha války. Má dva malé měsíce a nejvyšší známou sopku ve sluneční soustavě, Olympus Mons.',
  },
  {
    id: 'phobos',
    name: 'Phobos',
    nameEn: 'Phobos',
    type: 'moon',
    parentId: 'mars',
    massKg: 1.0659e16,
    radiusKm: 11.267,
    orbitalPeriodDays: 0.31891,
    rotationPeriodHours: 7.65,
    distanceFromParentKm: 9376,
    axialTiltDeg: 0,
    texture: 'moon_phobos.jpg',
    fallbackColor: '#8a7f73',
    description: 'Větší a Marsu bližší z obou měsíců, nepravidelného bramborovitého tvaru.',
  },
  {
    id: 'deimos',
    name: 'Deimos',
    nameEn: 'Deimos',
    type: 'moon',
    parentId: 'mars',
    massKg: 1.4762e15,
    radiusKm: 6.2,
    orbitalPeriodDays: 1.263,
    rotationPeriodHours: 30.3,
    distanceFromParentKm: 23463,
    axialTiltDeg: 0,
    texture: 'moon_deimos.jpg',
    fallbackColor: '#9c9186',
    description: 'Menší a vzdálenější z marsovských měsíců.',
  },

  // --- Jupiter ---
  {
    id: 'jupiter',
    name: 'Jupiter',
    nameEn: 'Jupiter',
    type: 'planet',
    parentId: 'sun',
    massKg: 1.8982e27,
    radiusKm: 69911,
    orbitalPeriodDays: 4332.59,
    rotationPeriodHours: 9.925,
    distanceFromParentKm: 778.57e6,
    axialTiltDeg: 3.13,
    texture: '2k_jupiter.jpg',
    description:
      'Největší planeta sluneční soustavy, plynový obr. Jeho Velká rudá skvrna je staletí trvající anticyklonální bouře.',
  },
  {
    id: 'io',
    name: 'Io',
    nameEn: 'Io',
    type: 'moon',
    parentId: 'jupiter',
    massKg: 8.9319e22,
    radiusKm: 1821.6,
    orbitalPeriodDays: 1.769,
    rotationPeriodHours: 42.5,
    distanceFromParentKm: 421700,
    axialTiltDeg: 0,
    texture: 'moon_io.jpg',
    fallbackColor: '#e2d16b',
    description: 'Vulkanicky nejaktivnější těleso sluneční soustavy.',
  },
  {
    id: 'europa',
    name: 'Europa',
    nameEn: 'Europa',
    type: 'moon',
    parentId: 'jupiter',
    massKg: 4.7998e22,
    radiusKm: 1560.8,
    orbitalPeriodDays: 3.551,
    rotationPeriodHours: 85.2,
    distanceFromParentKm: 671034,
    axialTiltDeg: 0,
    texture: 'moon_europa.jpg',
    fallbackColor: '#d8cfc0',
    description: 'Ledový měsíc s pravděpodobným podpovrchovým oceánem - jeden z hlavních cílů hledání mimozemského života.',
  },
  {
    id: 'ganymede',
    name: 'Ganymed',
    nameEn: 'Ganymede',
    type: 'moon',
    parentId: 'jupiter',
    massKg: 1.4819e23,
    radiusKm: 2634.1,
    orbitalPeriodDays: 7.154,
    rotationPeriodHours: 171.7,
    distanceFromParentKm: 1070412,
    axialTiltDeg: 0,
    texture: 'moon_ganymede.jpg',
    fallbackColor: '#8f8579',
    description: 'Největší měsíc ve sluneční soustavě, větší než planeta Merkur. Jediný měsíc s vlastním magnetickým polem.',
  },
  {
    id: 'callisto',
    name: 'Callisto',
    nameEn: 'Callisto',
    type: 'moon',
    parentId: 'jupiter',
    massKg: 1.0759e23,
    radiusKm: 2410.3,
    orbitalPeriodDays: 16.689,
    rotationPeriodHours: 400.5,
    distanceFromParentKm: 1882709,
    axialTiltDeg: 0,
    texture: 'moon_callisto.jpg',
    fallbackColor: '#5f574d',
    description: 'Nejvíce kráterovaný objekt ve sluneční soustavě, geologicky téměř neaktivní.',
  },

  // --- Saturn ---
  {
    id: 'saturn',
    name: 'Saturn',
    nameEn: 'Saturn',
    type: 'planet',
    parentId: 'sun',
    massKg: 5.6834e26,
    radiusKm: 58232,
    orbitalPeriodDays: 10759.22,
    rotationPeriodHours: 10.55,
    distanceFromParentKm: 1433.53e6,
    axialTiltDeg: 26.73,
    texture: '2k_saturn.jpg',
    ring: {
      texture: '2k_saturn_ring_alpha.png',
      innerRadiusKm: 74500,
      outerRadiusKm: 140220,
    },
    description:
      'Druhá největší planeta, proslulá mohutnou soustavou prstenů tvořených převážně vodním ledem.',
  },
  {
    id: 'mimas',
    name: 'Mimas',
    nameEn: 'Mimas',
    type: 'moon',
    parentId: 'saturn',
    massKg: 3.7493e19,
    radiusKm: 198.2,
    orbitalPeriodDays: 0.942,
    rotationPeriodHours: 22.6,
    distanceFromParentKm: 185539,
    axialTiltDeg: 0,
    texture: 'moon_mimas.jpg',
    fallbackColor: '#b9b4ad',
    description: 'Nejmenší z větších měsíců Saturnu, díky obřímu kráteru Herschel připomíná "Hvězdu smrti".',
  },
  {
    id: 'enceladus',
    name: 'Enceladus',
    nameEn: 'Enceladus',
    type: 'moon',
    parentId: 'saturn',
    massKg: 1.08022e20,
    radiusKm: 252.1,
    orbitalPeriodDays: 1.370,
    rotationPeriodHours: 32.9,
    distanceFromParentKm: 237948,
    axialTiltDeg: 0,
    texture: 'moon_enceladus.jpg',
    fallbackColor: '#eef3f5',
    description: 'Vysoce reflexní ledový měsíc s gejzíry vodní páry tryskajícími z jižního pólu.',
  },
  {
    id: 'tethys',
    name: 'Tethys',
    nameEn: 'Tethys',
    type: 'moon',
    parentId: 'saturn',
    massKg: 6.17449e20,
    radiusKm: 531.1,
    orbitalPeriodDays: 1.888,
    rotationPeriodHours: 45.3,
    distanceFromParentKm: 294619,
    axialTiltDeg: 0,
    texture: 'moon_tethys.jpg',
    fallbackColor: '#c9c5bd',
    description: 'Ledový měsíc s obřím kaňonem Ithaca Chasma táhnoucím se téměř přes tři čtvrtiny obvodu.',
  },
  {
    id: 'dione',
    name: 'Dione',
    nameEn: 'Dione',
    type: 'moon',
    parentId: 'saturn',
    massKg: 1.095452e21,
    radiusKm: 561.4,
    orbitalPeriodDays: 2.737,
    rotationPeriodHours: 65.7,
    distanceFromParentKm: 377396,
    axialTiltDeg: 0,
    texture: 'moon_dione.jpg',
    fallbackColor: '#b7b2a9',
    description: 'Ledový měsíc s výraznými světlými útesy na odvrácené straně od Saturnu.',
  },
  {
    id: 'rhea',
    name: 'Rhea',
    nameEn: 'Rhea',
    type: 'moon',
    parentId: 'saturn',
    massKg: 2.306518e21,
    radiusKm: 763.8,
    orbitalPeriodDays: 4.518,
    rotationPeriodHours: 108.4,
    distanceFromParentKm: 527108,
    axialTiltDeg: 0,
    texture: 'moon_rhea.jpg',
    fallbackColor: '#a9a49c',
    description: 'Druhý největší měsíc Saturnu, možná s vlastním řídkým prstencem.',
  },
  {
    id: 'titan',
    name: 'Titan',
    nameEn: 'Titan',
    type: 'moon',
    parentId: 'saturn',
    massKg: 1.3452e23,
    radiusKm: 2574.7,
    orbitalPeriodDays: 15.945,
    rotationPeriodHours: 382.7,
    distanceFromParentKm: 1221870,
    axialTiltDeg: 0,
    texture: 'moon_titan.jpg',
    fallbackColor: '#d9a441',
    description: 'Největší měsíc Saturnu a jediný měsíc s hustou atmosférou; na povrchu má jezera kapalného metanu.',
  },
  {
    id: 'iapetus',
    name: 'Iapetus',
    nameEn: 'Iapetus',
    type: 'moon',
    parentId: 'saturn',
    massKg: 1.805635e21,
    radiusKm: 734.5,
    orbitalPeriodDays: 79.32,
    rotationPeriodHours: 1903.7,
    distanceFromParentKm: 3560820,
    axialTiltDeg: 0,
    texture: 'moon_iapetus.jpg',
    fallbackColor: '#8f8577',
    description: 'Nezvykle "dvoubarevný" měsíc - jedna polokoule je tmavá, druhá jasně světlá.',
  },

  // --- Uran ---
  {
    id: 'uranus',
    name: 'Uran',
    nameEn: 'Uranus',
    type: 'planet',
    parentId: 'sun',
    massKg: 8.6810e25,
    radiusKm: 25362,
    orbitalPeriodDays: 30688.5,
    rotationPeriodHours: -17.24, // retrográdní rotace
    distanceFromParentKm: 2872.46e6,
    axialTiltDeg: 97.77,
    texture: '2k_uranus.jpg',
    ring: {
      innerRadiusKm: 38000,
      outerRadiusKm: 51000,
      color: '#7d8a94',
    },
    description:
      'Ledový obr rotující "na boku" (sklon osy téměř 98°). Má soustavu tenkých tmavých prstenů.',
  },
  {
    id: 'miranda',
    name: 'Miranda',
    nameEn: 'Miranda',
    type: 'moon',
    parentId: 'uranus',
    massKg: 6.4e19,
    radiusKm: 235.8,
    orbitalPeriodDays: 1.413,
    rotationPeriodHours: 33.9,
    distanceFromParentKm: 129390,
    axialTiltDeg: 0,
    texture: 'moon_miranda.jpg',
    fallbackColor: '#9aa3a8',
    description: 'Nejmenší z pěti velkých měsíců Uranu s extrémně rozeklaným povrchem.',
  },
  {
    id: 'ariel',
    name: 'Ariel',
    nameEn: 'Ariel',
    type: 'moon',
    parentId: 'uranus',
    massKg: 1.251e21,
    radiusKm: 578.9,
    orbitalPeriodDays: 2.520,
    rotationPeriodHours: 60.5,
    distanceFromParentKm: 190900,
    axialTiltDeg: 0,
    texture: 'moon_ariel.jpg',
    fallbackColor: '#aab0b3',
    description: 'Nejjasnější z měsíců Uranu s poměrně mladým, málo kráterovaným povrchem.',
  },
  {
    id: 'umbriel',
    name: 'Umbriel',
    nameEn: 'Umbriel',
    type: 'moon',
    parentId: 'uranus',
    massKg: 1.275e21,
    radiusKm: 584.7,
    orbitalPeriodDays: 4.144,
    rotationPeriodHours: 99.5,
    distanceFromParentKm: 266000,
    axialTiltDeg: 0,
    texture: 'moon_umbriel.jpg',
    fallbackColor: '#6e6f70',
    description: 'Nejtmavší z velkých měsíců Uranu, geologicky málo aktivní.',
  },
  {
    id: 'titania',
    name: 'Titania',
    nameEn: 'Titania',
    type: 'moon',
    parentId: 'uranus',
    massKg: 3.400e21,
    radiusKm: 788.9,
    orbitalPeriodDays: 8.706,
    rotationPeriodHours: 208.9,
    distanceFromParentKm: 436300,
    axialTiltDeg: 0,
    texture: 'moon_titania.jpg',
    fallbackColor: '#8f9598',
    description: 'Největší měsíc Uranu, pojmenovaný po královně víl z Shakespearova díla.',
  },
  {
    id: 'oberon',
    name: 'Oberon',
    nameEn: 'Oberon',
    type: 'moon',
    parentId: 'uranus',
    massKg: 3.076e21,
    radiusKm: 761.4,
    orbitalPeriodDays: 13.463,
    rotationPeriodHours: 323.1,
    distanceFromParentKm: 583500,
    axialTiltDeg: 0,
    texture: 'moon_oberon.jpg',
    fallbackColor: '#867d75',
    description: 'Druhý největší měsíc Uranu s hustě kráterovaným, starým povrchem.',
  },

  // --- Neptun ---
  {
    id: 'neptune',
    name: 'Neptun',
    nameEn: 'Neptune',
    type: 'planet',
    parentId: 'sun',
    massKg: 1.02413e26,
    radiusKm: 24622,
    orbitalPeriodDays: 60195,
    rotationPeriodHours: 16.11,
    distanceFromParentKm: 4495.06e6,
    axialTiltDeg: 28.32,
    texture: '2k_neptune.jpg',
    ring: {
      innerRadiusKm: 41900,
      outerRadiusKm: 63000,
      color: '#3a5a8c',
    },
    description:
      'Nejvzdálenější planeta sluneční soustavy, s nejsilnějšími větry ze všech planet (až 2100 km/h).',
  },
  {
    id: 'triton',
    name: 'Triton',
    nameEn: 'Triton',
    type: 'moon',
    parentId: 'neptune',
    massKg: 2.14e22,
    radiusKm: 1353.4,
    orbitalPeriodDays: -5.877, // retrográdní oběh
    rotationPeriodHours: 141.0,
    distanceFromParentKm: 354759,
    axialTiltDeg: 0,
    texture: 'moon_triton.jpg',
    fallbackColor: '#d9cfc2',
    description: 'Největší měsíc Neptunu, obíhá retrográdně - pravděpodobně jde o zachycené Kuiperovo těleso.',
  },

  // --- Pluto (trpasličí planeta) ---
  {
    id: 'pluto',
    name: 'Pluto',
    nameEn: 'Pluto',
    type: 'dwarfPlanet',
    parentId: 'sun',
    massKg: 1.303e22,
    radiusKm: 1188.3,
    orbitalPeriodDays: 90560,
    rotationPeriodHours: -153.2928, // retrográdní rotace (sklon osy > 90°)
    distanceFromParentKm: 5906.38e6,
    axialTiltDeg: 119.51,
    texture: '2k_pluto.jpg',
    description:
      'Trpasličí planeta v Kuiperově pásu, do roku 2006 označovaná za devátou planetu sluneční soustavy. Má silně excentrickou a skloněnou dráhu. Kromě Charonu má ještě čtyři drobné měsíce (Styx, Nix, Kerberos, Hydra), v tomto modelu nezahrnuté.',
  },
  {
    id: 'charon',
    name: 'Charon',
    nameEn: 'Charon',
    type: 'moon',
    parentId: 'pluto',
    massKg: 1.586e21,
    radiusKm: 606,
    orbitalPeriodDays: 6.3872,
    rotationPeriodHours: 153.2928,
    distanceFromParentKm: 19591,
    axialTiltDeg: 0,
    texture: 'moon_charon.jpg',
    fallbackColor: '#a8a4a0',
    description:
      'Největší měsíc Pluta, s průměrem přes polovinu průměru Pluta. Těžiště soustavy leží vně Pluta, takže jde fakticky o dvojici vzájemně slapově vázaných těles obíhajících společný střed.',
  },
];

export function getBodyById(id: string): CelestialBodyData | undefined {
  return celestialBodies.find((b) => b.id === id);
}

export function getChildren(parentId: string): CelestialBodyData[] {
  return celestialBodies.filter((b) => b.parentId === parentId);
}
