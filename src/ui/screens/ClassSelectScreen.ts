import type { GameEngine } from '../../game/GameEngine';
import { getAllClasses } from '../../content/registries';
import { isContentUnlocked } from '../../game/createPlayer';
import { Card } from '../components/Card';

export function ClassSelectScreen(engine: GameEngine): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = `<h1 class="screen-title">Choose Your Class</h1>
    <p class="screen-subtitle">Each class has unique stats and playstyle.</p>`;

  const grid = document.createElement('div');
  grid.className = 'card-grid';

  const profile = engine.getState().profile;

  for (const cls of getAllClasses()) {
    const unlocked = isContentUnlocked(cls.unlockRequirement, profile);
    grid.appendChild(
      Card({
        title: cls.name,
        description: cls.description,
        imageKey: cls.imageKey,
        disabled: !unlocked,
        onClick: () => engine.selectClass(cls.id),
      }),
    );
  }

  el.appendChild(grid);
  return el;
}
