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
  grid.className = 'card-grid card-grid--stagger';

  run.floorOptions.forEach((option, index) => {
    let preview = option.preview;
    if (option.eventId === 'enemy' || option.eventId === 'boss') {
      const payload = option.payload as { enemyId: string; enemyIds?: string[] };
      const ids = payload.enemyIds ?? [payload.enemyId];
      let totalHp = 0;
      let maxAtk = 0;
      for (const id of ids) {
        const enemy = getEnemy(id);
        if (!enemy) continue;
        const scaled = scaledEnemyStats(
          enemy.baseStats.maxHp,
          enemy.baseStats.attack,
          run.floor,
          enemy.tier,
        );
        totalHp += scaled.hp;
        maxAtk = Math.max(maxAtk, scaled.attack);
      }
      if (totalHp > 0) {
        const threat = calcThreatLevel(
          playerPower(run.player.stats, run.player.hp),
          totalHp,
          maxAtk,
        );
        const base = preview ?? option.name;
        preview = `${base} · Threat: ${threat.charAt(0).toUpperCase() + threat.slice(1)}`;
      }
    }

    const card = Card({
      title: option.name,
      description: option.description,
      imageKey: option.imageKey,
      preview,
      onClick: () => {
        grid.classList.add('card-grid--chosen');
        card.classList.add('card--selected');
        setTimeout(() => engine.selectFloorOption(index), 180);
      },
    });
    grid.appendChild(card);
  });

  el.appendChild(grid);
  return el;
}
