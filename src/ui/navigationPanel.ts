export interface NavigationPanelCallbacks {
  onHome: () => void;
  onJumpToDate: (date: Date) => void;
  onToday: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });

export interface NavigationPanel {
  setDisplayedDate: (date: Date) => void;
}

export function createNavigationPanel(
  container: HTMLElement,
  callbacks: NavigationPanelCallbacks,
): NavigationPanel {
  const panel = document.createElement('div');
  panel.className = 'nav-panel';

  const homeBtn = document.createElement('button');
  homeBtn.className = 'nav-panel__home';
  homeBtn.title = 'Výchozí pohled';
  homeBtn.innerHTML = '⌂';
  homeBtn.addEventListener('click', () => callbacks.onHome());

  const dateSection = document.createElement('div');
  dateSection.className = 'nav-panel__date-section';

  const dateLabel = document.createElement('div');
  dateLabel.className = 'nav-panel__date-label';

  const controlsRow = document.createElement('div');
  controlsRow.className = 'nav-panel__date-controls';

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'nav-panel__date-input';
  dateInput.title = 'Přejít na datum';
  dateInput.addEventListener('change', () => {
    if (!dateInput.value) return;
    const picked = new Date(`${dateInput.value}T12:00:00`);
    callbacks.onJumpToDate(picked);
  });

  const todayBtn = document.createElement('button');
  todayBtn.className = 'nav-panel__today';
  todayBtn.textContent = 'Dnes';
  todayBtn.addEventListener('click', () => callbacks.onToday());

  controlsRow.appendChild(dateInput);
  controlsRow.appendChild(todayBtn);
  dateSection.appendChild(dateLabel);
  dateSection.appendChild(controlsRow);

  panel.appendChild(homeBtn);
  panel.appendChild(dateSection);
  container.appendChild(panel);

  const setDisplayedDate = (date: Date): void => {
    dateLabel.textContent = dateFormatter.format(date);
  };

  return { setDisplayedDate };
}
