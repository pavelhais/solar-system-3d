export interface TimeControlsCallbacks {
  onPauseToggle: (paused: boolean) => void;
  onSpeedChange: (daysPerSecond: number) => void;
}

export function createTimeControls(
  container: HTMLElement,
  initialSpeedDaysPerSecond: number,
  callbacks: TimeControlsCallbacks,
): void {
  const bar = document.createElement('div');
  bar.className = 'time-controls';

  const playPauseBtn = document.createElement('button');
  playPauseBtn.className = 'time-controls__play-pause';
  playPauseBtn.textContent = '⏸';
  let paused = false;
  playPauseBtn.addEventListener('click', () => {
    paused = !paused;
    playPauseBtn.textContent = paused ? '▶' : '⏸';
    callbacks.onPauseToggle(paused);
  });

  const speedLabel = document.createElement('span');
  speedLabel.className = 'time-controls__speed-label';
  const updateLabel = (v: number) => {
    speedLabel.textContent = `${v.toFixed(v < 1 ? 2 : 1)} dní/s`;
  };
  updateLabel(initialSpeedDaysPerSecond);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '100';
  slider.step = '1';
  // logaritmická škála 0.01 - 200 dní/s
  const MIN_SPEED = 0.01;
  const MAX_SPEED = 200;
  const RATIO = MAX_SPEED / MIN_SPEED;
  const speedToSlider = (s: number) => (Math.log10(s / MIN_SPEED) / Math.log10(RATIO)) * 100;
  const sliderToSpeed = (v: number) => MIN_SPEED * Math.pow(RATIO, v / 100);
  slider.value = String(speedToSlider(initialSpeedDaysPerSecond));
  slider.addEventListener('input', () => {
    const speed = sliderToSpeed(Number(slider.value));
    updateLabel(speed);
    callbacks.onSpeedChange(speed);
  });

  bar.appendChild(playPauseBtn);
  bar.appendChild(slider);
  bar.appendChild(speedLabel);
  container.appendChild(bar);
}
