import type { GameEngine } from '../../game/GameEngine';
import { getEnemy } from '../../content/registries';
import { scaledEnemyStats, calcThreatLevel, playerPower } from '../../game/progression/Scaling';
import { Card } from '../components/Card';

export function FloorChoiceScreen(engine: GameEngine): HTMLElement {
  const { run } = engine.getState();
  const el = document.createElement('div');

  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = `Floor ${run.floor}`;

  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent =
    run.floorOptions.length === 1
      ? 'Your path is clear — choose your encounter.'
      : 'Multiple paths await — choose wisely.';

  el.appendChild(title);
  el.appendChild(subtitle);

  const grid = document.createElement('div');
  grid.className = 'card-grid';

  run.floorOptions.forEach((option, index) => {
    let preview = option.preview;
    if (option.eventId === 'enemy' || option.eventId === 'boss') {
      const payload = option.payload as { enemyId: string };
      const enemy = getEnemy(payload.enemyId);
      if (enemy) {
        const scaled = scaledEnemyStats(
          enemy.baseStats.maxHp,
          enemy.baseStats.attack,
          run.floor,
          enemy.tier,
        );
        const threat = calcThreatLevel(
          playerPower(run.player.stats, run.player.hp),
          scaled.hp,
          scaled.attack,
        );
        const base = preview ?? enemy.name;
        preview = `${base} · Threat: ${threat.charAt(0).toUpperCase() + threat.slice(1)}`;
      }
    }

    grid.appendChild(
      Card({
        title: option.name,
        description: option.description,
        imageKey: option.imageKey,
        preview,
        onClick: () => engine.selectFloorOption(index),
      }),
    );
  });

  el.appendChild(grid);
  return el;
}
