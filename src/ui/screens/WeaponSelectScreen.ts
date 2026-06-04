import type { GameEngine } from '../../game/GameEngine';
import { getWeaponsForClass } from '../../content/registries';
import { Card } from '../components/Card';

export function WeaponSelectScreen(engine: GameEngine): HTMLElement {
  const { classId } = engine.getState().run.player;
  const weapons = getWeaponsForClass(classId);

  const el = document.createElement('div');
  el.innerHTML = `<h1 class="screen-title">Choose Your Weapon</h1>
    <p class="screen-subtitle">Your weapon shapes how you fight.</p>`;

  const grid = document.createElement('div');
  grid.className = 'card-grid';

  for (const weapon of weapons) {
    grid.appendChild(
      Card({
        title: weapon.name,
        description: weapon.description,
        imageKey: weapon.imageKey,
        onClick: () => engine.selectWeapon(weapon.id),
      }),
    );
  }

  el.appendChild(grid);
  return el;
}
