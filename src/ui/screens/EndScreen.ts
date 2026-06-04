import type { GameEngine } from '../../game/GameEngine';
import { getSkill } from '../../content/registries';

export function EndScreen(engine: GameEngine): HTMLElement {
  const { run } = engine.getState();
  const victory = run.victory ?? false;

  const el = document.createElement('div');
  el.innerHTML = `<h1 class="screen-title">${victory ? 'Victory!' : 'Game Over'}</h1>
    <p class="screen-subtitle">${victory ? 'You conquered the dungeon!' : 'Your run has ended.'}</p>`;

  const summary = document.createElement('div');
  summary.className = 'end-summary';

  const rows: [string, string][] = [
    ['Floor reached', String(run.floor)],
    ['Gold earned', String(run.runGoldEarned)],
    ['Class', run.player.classId],
    ['Skills collected', String(run.player.skills.length)],
  ];

  for (const [label, value] of rows) {
    const row = document.createElement('div');
    row.className = 'end-summary__row';
    row.innerHTML = `<span>${label}</span><span>${value}</span>`;
    summary.appendChild(row);
  }

  if (run.player.skills.length > 0) {
    const skillList = document.createElement('div');
    skillList.style.marginTop = '0.75rem';
    skillList.style.fontSize = '0.85rem';
    skillList.style.color = 'var(--text-secondary)';
    skillList.textContent = run.player.skills
      .map((s) => {
        const def = getSkill(s.id);
        return def ? `${def.name} Lv${s.level}` : s.id;
      })
      .join(', ');
    summary.appendChild(skillList);
  }

  el.appendChild(summary);

  const restart = document.createElement('button');
  restart.className = 'btn btn--primary';
  restart.textContent = 'New Run';
  restart.addEventListener('click', () => engine.restart());
  el.appendChild(restart);

  return el;
}
