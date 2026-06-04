import type { GameEngine } from '../../game/GameEngine';
import type { SkillPickPayload } from '../../types/events';
import { getSkill } from '../../content/registries';
import { Card } from '../components/Card';
import { getSkillDescription } from '../../game/systems/SkillSystem';

export function SkillPickScreen(engine: GameEngine): HTMLElement {
  const payload = engine.getState().run.activeEvent?.payload as SkillPickPayload;

  const el = document.createElement('div');
  el.innerHTML = `<h1 class="screen-title">Skill Choice</h1>
    <p class="screen-subtitle">${payload?.label ?? 'Choose a skill'}</p>`;

  const grid = document.createElement('div');
  grid.className = 'card-grid';

  for (const skillId of payload?.skills ?? []) {
    const skill = getSkill(skillId);
    if (!skill) continue;
    const owned = engine.getState().run.player.skills.find((s) => s.id === skillId);
    const level = owned ? owned.level + 1 : 1;
    const desc = getSkillDescription(skillId, level);

    grid.appendChild(
      Card({
        title: skill.name + (owned ? ` (Upgrade to Lv${level})` : ''),
        description: `${skill.description}\n\n${desc}`,
        imageKey: skill.imageKey,
        tags: skill.tags,
        onClick: () => engine.selectSkill(skillId),
      }),
    );
  }

  el.appendChild(grid);

  if (payload?.allowSkip) {
    const skip = document.createElement('button');
    skip.className = 'btn btn--secondary';
    skip.style.marginTop = '1rem';
    skip.textContent = 'Skip';
    skip.addEventListener('click', () => engine.skipSkillPick());
    el.appendChild(skip);
  }

  return el;
}
