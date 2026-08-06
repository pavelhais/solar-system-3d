// Nerealistické ("přehledové") měřítko - viz ZADANI.md, bod 3.
// Reálné poměry velikostí planet mezi sebou jsou zachovány (přes mocninnou kompresi),
// vzdálenosti jsou silně zkráceny, aby celá soustava byla přehledná v jedné scéně.

const AU_KM = 149.598e6;

// --- Vzdálenosti planet od Slunce ---
const AU_SCENE_UNITS = 30;
const DISTANCE_POWER = 0.6;

export function orbitRadiusFromAU(au: number): number {
  return Math.pow(au, DISTANCE_POWER) * AU_SCENE_UNITS;
}

export function orbitRadiusFromSun(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  return orbitRadiusFromAU(distanceKm / AU_KM);
}

// --- Velikosti těles (poloměry) ---
// Lineární měřítko => reálné poměry velikostí mezi planetami a měsíci jsou zachovány
// naprosto přesně (např. Měsíc zůstává ~27 % poloměru Země, tak jako ve skutečnosti).
// Minimální poloměr je jen záchranná pojistka pro pár nejmenších měsíců (Phobos, Deimos...),
// které by jinak byly na obrazovce prakticky neviditelné/nekliknutelné.
const RADIUS_SCALE = 0.5 / 6371; // Země (6371 km) => 0,5 scénické jednotky
const MIN_BODY_RADIUS = 0.05;

export function bodyRadiusScene(radiusKm: number): number {
  const r = RADIUS_SCALE * radiusKm;
  return Math.max(r, MIN_BODY_RADIUS);
}

// Slunce je záměrně vyňato z lineárního měřítka těles - v reálném poměru (696 340 km,
// ~10× poloměr Jupiteru) by přesahovalo i dráhy vnitřních planet a scéna by byla
// nepoužitelná (viz ZADANI.md, bod 3 a diskuze v konverzaci). Konstanta je zvolena tak,
// aby Slunce zůstalo viditelně největším tělesem (větší než Jupiter i Saturn), ale
// nezasahovalo do Merkurovy dráhy.
export const SUN_RADIUS_SCENE = 8.5;

// --- Vzdálenosti měsíců od jejich planety ---
// Vychází ze skutečného poměru (vzdálenost měsíce / poloměr planety), mocninně
// zkomprimovaného - takže měsíce, které jsou ve skutečnosti dál (např. Saturnův
// Iapetus), vyjdou ve scéně dál i vizuálně, ne jen "o krok" od souseda jako dřív.
// Zároveň je výsledek přeškálovaný do bezpečného rozsahu [start, budget], aby ani
// nejrozlehlejší systém měsíců (Saturn) nezasáhl do sousední planety.
const MOON_DISTANCE_POWER = 0.45;

// Maximální vzdálenost od středu planety (ve scénických jednotkách), kam smí
// sahat i nejvzdálenější měsíc - odladěno ručně podle mezer mezi drahami planet.
const MOON_BUDGET: Record<string, number> = {
  earth: 5,
  mars: 2,
  jupiter: 13,
  saturn: 19,
  uranus: 8,
  neptune: 8,
  pluto: 0.5,
};

export function layoutMoonOrbits(
  planetId: string,
  planetRadiusScene: number,
  planetRadiusKm: number,
  ringOuterRadiusScene: number | undefined,
  moons: { distanceFromParentKm: number }[], // seřazené vzestupně podle reálné vzdálenosti
): number[] {
  if (moons.length === 0) return [];

  const start = ringOuterRadiusScene ? ringOuterRadiusScene + 0.6 : planetRadiusScene * 1.3;
  const budget = Math.max(MOON_BUDGET[planetId] ?? start * 2, start + 0.5);

  const raw = moons.map((m) => planetRadiusScene * Math.pow(m.distanceFromParentKm / planetRadiusKm, MOON_DISTANCE_POWER));

  if (raw.length === 1) {
    return [Math.min(Math.max(raw[0], start), budget)];
  }

  const minRaw = raw[0];
  const maxRaw = raw[raw.length - 1];
  const span = maxRaw - minRaw || 1;
  return raw.map((r) => start + ((r - minRaw) / span) * (budget - start));
}

export function ringRadiiScene(
  planetRadiusKm: number,
  planetRadiusScene: number,
  innerKm: number,
  outerKm: number,
): { inner: number; outer: number } {
  const ratio = planetRadiusScene / planetRadiusKm;
  return { inner: innerKm * ratio, outer: outerKm * ratio };
}
