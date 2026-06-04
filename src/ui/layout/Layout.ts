import type { GameState } from '../../types/game-state';
import { getAppView } from '../navigation/appView';
import { AppHeader } from './AppHeader';
import { StatsPanel } from './StatsPanel';

export function Layout(state: GameState, content: HTMLElement): HTMLElement {
  const isGlossary = getAppView() === 'glossary';

  const shell = document.createElement('div');
  shell.className = 'app-shell' + (isGlossary ? ' app-shell--glossary' : '');
  shell.appendChild(AppHeader());

  const layout = document.createElement('div');
  layout.className = 'layout';

  const main = document.createElement('main');
  main.className = 'layout-main';
  main.appendChild(content);

  layout.appendChild(main);
  if (!isGlossary) {
    layout.appendChild(StatsPanel(state));
  }

  shell.appendChild(layout);
  return shell;
}
