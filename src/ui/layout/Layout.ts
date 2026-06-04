import type { GameState } from '../../types/game-state';
import { StatsPanel } from './StatsPanel';

export function Layout(state: GameState, content: HTMLElement): HTMLElement {
  const layout = document.createElement('div');
  layout.className = 'layout';

  const main = document.createElement('main');
  main.className = 'layout-main';
  main.appendChild(content);

  layout.appendChild(main);
  layout.appendChild(StatsPanel(state));

  return layout;
}
