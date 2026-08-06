import type { CelestialBodyData } from '../data/celestialBodies';
import { celestialBodies } from '../data/celestialBodies';
import {
  formatDistanceFromPlanet,
  formatDistanceFromSun,
  formatMass,
  formatOrbitalPeriod,
  formatRadius,
  formatRotationPeriod,
} from '../utils/format';

let panelEl: HTMLDivElement;

export interface InfoPanelContent {
  title: string;
  subtitle?: string;
  rows: [string, string][];
  description: string;
}

export function createInfoPanel(container: HTMLElement, onClose: () => void): void {
  panelEl = document.createElement('div');
  panelEl.className = 'info-panel info-panel--hidden';
  container.appendChild(panelEl);

  panelEl.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).dataset.action === 'close') {
      hideInfoPanel();
      onClose();
    }
  });
}

export function showCustomInfoPanel(content: InfoPanelContent): void {
  panelEl.innerHTML = `
    <button class="info-panel__close" data-action="close" aria-label="Zavřít">×</button>
    <h2>${content.title}${content.subtitle ? ` <span class="info-panel__en">(${content.subtitle})</span>` : ''}</h2>
    <table class="info-panel__table">
      ${content.rows.map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join('')}
    </table>
    <p class="info-panel__description">${content.description}</p>
  `;
  panelEl.classList.remove('info-panel--hidden');
}

export function showInfoPanel(data: CelestialBodyData): void {
  const moonCount = celestialBodies.filter((b) => b.parentId === data.id).length;
  const isMoon = data.type === 'moon';
  const isSun = data.type === 'star';

  const rows: [string, string][] = [
    ['Hmotnost', formatMass(data.massKg)],
    ['Střední poloměr', formatRadius(data.radiusKm)],
  ];

  if (!isSun) {
    rows.push([
      isMoon ? 'Oběžná doba kolem planety' : 'Oběžná doba kolem Slunce',
      formatOrbitalPeriod(data.orbitalPeriodDays),
    ]);
  }
  rows.push(['Doba rotace (délka dne)', formatRotationPeriod(data.rotationPeriodHours)]);
  if (!isSun) {
    rows.push([
      isMoon ? 'Vzdálenost od planety' : 'Vzdálenost od Slunce',
      isMoon ? formatDistanceFromPlanet(data.distanceFromParentKm) : formatDistanceFromSun(data.distanceFromParentKm),
    ]);
  }
  if (data.type === 'planet' || data.type === 'dwarfPlanet') {
    rows.push(['Počet měsíců', String(moonCount)]);
  }

  showCustomInfoPanel({ title: data.name, subtitle: data.nameEn, rows, description: data.description });
}

export function hideInfoPanel(): void {
  panelEl.classList.add('info-panel--hidden');
}
