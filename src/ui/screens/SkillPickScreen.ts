import type { GameEngine } from '../../game/GameEngine';
import type { SkillPickPayload } from '../../types/events';
import { getSkill } from '../../content/registries';
import { Card } from '../components/Card';
import { getSkillDescription } from '../../game/systems/SkillSystem';
import { isUpgradeable } from '../../game/systems/SkillFilters';
import { skillTypeLabel } from './shared/skillCardMeta';
import { createSelectScreenShell } from './shared/selectGrid';

export function SkillPickScreen(engine: GameEngine, forModal = false): HTMLElement {
  const payload = engine.getState().run.activeEvent?.payload as SkillPickPayload;

  const { root: el, grid } = createSelectScreenShell({
    title: 'Training',
    subtitle: payload?.label ?? 'Choose an attack or passive',
    forModal,
  });

  for (const skillId of payload?.skills ?? []) {
    const skill = getSkill(skillId);
    if (!skill) continue;
    const owned = engine.getState().run.player.skills.find((s) => s.id === skillId);
    if (owned && !isUpgradeable(owned, skill)) continue;

    const level = owned ? owned.level + 1 : 1;
    const desc = getSkillDescription(skillId, level);
    const kind = skillTypeLabel(skill.type);
    const title = owned
      ? `${skill.name} (${kind} — Upgrade to Lv${level})`
      : `${skill.name} (${kind})`;

    grid.appendChild(
      Card({
        title,
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
