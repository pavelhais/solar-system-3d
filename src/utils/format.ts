const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
};

function toSuperscript(n: number): string {
  return String(n).split('').map((c) => SUPERSCRIPTS[c] ?? c).join('');
}

export function formatMass(kg: number): string {
  const exp = Math.floor(Math.log10(kg));
  const mantissa = kg / Math.pow(10, exp);
  return `${mantissa.toFixed(2)} × 10${toSuperscript(exp)} kg`;
}

export function formatRadius(km: number): string {
  return `${km.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} km`;
}

export function formatDistanceFromSun(km: number): string {
  const AU_KM = 149.598e6;
  const millions = km / 1e6;
  const au = km / AU_KM;
  return `${millions.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} mil. km (${au.toFixed(2)} AU)`;
}

export function formatDistanceFromPlanet(km: number): string {
  return `${km.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} km`;
}

export function formatOrbitalPeriod(days: number): string {
  const abs = Math.abs(days);
  const suffix = days < 0 ? ' (retrográdní oběh)' : '';
  if (abs >= 365) {
    return `${(abs / 365.25).toFixed(2)} roku (${abs.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} dní)${suffix}`;
  }
  return `${abs.toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} dní${suffix}`;
}

export function formatRotationPeriod(hours: number): string {
  const abs = Math.abs(hours);
  const suffix = hours < 0 ? ' (retrográdní rotace)' : '';
  if (abs >= 24) {
    return `${(abs / 24).toFixed(2)} dne${suffix}`;
  }
  return `${abs.toFixed(2)} hod${suffix}`;
}
