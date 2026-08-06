// Přibližný výpočet aktuální heliocentrické ekliptikální délky planet z Keplerových
// dráhových elementů (zdroj: JPL "Keplerian Elements for Approximate Positions of the
// Major Planets", platné pro roky 1800-2050). Používá se jen pro počáteční natočení
// oběžné dráhy při startu aplikace, aby planety odpovídaly reálné aktuální poloze -
// samotný pohyb ve scéně pak dál běží po zjednodušené kruhové dráze.

interface OrbitalElements {
  e0: number;
  eDot: number; // /století
  L0: number; // deg, střední délka
  LDot: number; // deg/století
  peri0: number; // deg, délka přísluní (ϖ)
  periDot: number; // deg/století
}

const ELEMENTS: Record<string, OrbitalElements> = {
  mercury: { e0: 0.20563593, eDot: 0.00001906, L0: 252.2503235, LDot: 149472.67411175, peri0: 77.45779628, periDot: 0.16047689 },
  venus: { e0: 0.00677672, eDot: -0.00004107, L0: 181.979095, LDot: 58517.81538729, peri0: 131.60246718, periDot: 0.00268329 },
  earth: { e0: 0.01671123, eDot: -0.00004392, L0: 100.46457166, LDot: 35999.37244981, peri0: 102.93768193, periDot: 0.32327364 },
  mars: { e0: 0.0933941, eDot: 0.00007882, L0: -4.55343205, LDot: 19140.30268499, peri0: -23.94362959, periDot: 0.44441088 },
  jupiter: { e0: 0.04838624, eDot: -0.00013253, L0: 34.39644051, LDot: 3034.74612775, peri0: 14.72847983, periDot: 0.21252668 },
  saturn: { e0: 0.05386179, eDot: -0.00050991, L0: 49.95424423, LDot: 1222.49362201, peri0: 92.59887831, periDot: -0.41897216 },
  uranus: { e0: 0.04725744, eDot: -0.00004397, L0: 313.23810451, LDot: 428.48202785, peri0: 170.9542763, periDot: 0.40805281 },
  neptune: { e0: 0.00859048, eDot: 0.00005105, L0: -55.12002969, LDot: 218.45945325, peri0: 44.96476227, periDot: -0.32241464 },
  // Pluto - ze stejné JPL tabulky (samostatný řádek platný pro roky 1800-2050); sklon dráhy
  // (17,1°) se stejně jako u ostatních těles v tomto výpočtu ignoruje (viz getCurrentOrbitalAngle).
  pluto: { e0: 0.2488273, eDot: 0.0000517, L0: 238.92903833, LDot: 145.20780515, peri0: 224.06891629, periDot: -0.04062942 },
};

const DEG2RAD = Math.PI / 180;

function centuriesSinceJ2000(date: Date): number {
  const julianDate = date.getTime() / 86400000 + 2440587.5;
  return (julianDate - 2451545.0) / 36525;
}

function normalizeDeg(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/** Vrátí aktuální heliocentrickou ekliptikální délku planety v radiánech k danému datu. */
export function getCurrentOrbitalAngle(planetId: string, date: Date): number {
  const el = ELEMENTS[planetId];
  if (!el) return 0;

  const T = centuriesSinceJ2000(date);
  const e = el.e0 + el.eDot * T;
  const L = normalizeDeg(el.L0 + el.LDot * T);
  const peri = normalizeDeg(el.peri0 + el.periDot * T);
  const M = DEG2RAD * normalizeDeg(L - peri);

  let E = M;
  for (let i = 0; i < 8; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }

  const trueAnomaly = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  return trueAnomaly + DEG2RAD * peri;
}
