import type { GameEngine } from '../../game/GameEngine';
import type { LootPayload } from '../../types/events';
import { getSkill } from '../../content/registries';
import { AssetImage } from '../components/AssetImage';
import { Card } from '../components/Card';
import { getSkillDescription } from '../../game/systems/SkillSystem';

function rewardTypeLabel(type: 'attack' | 'passive'): string {
  return type === 'attack' ? 'Attack' : 'Passive';
}

export function LootScreen(engine: GameEngine, forModal = false): HTMLElement {
  const payload = engine.getState().run.activeEvent?.payload as LootPayload;
  const hasSkillReward = (payload?.skillChoices?.length ?? 0) >= 2;

  const el = document.createElement('div');
  if (!forModal) {
    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'Victory!';
    el.appendChild(title);
  }

  const subtitle = document.createElement('p');
  subtitle.className = forModal ? 'modal-panel__subtitle' : 'screen-subtitle';
  subtitle.textContent = payload
    ? `You defeated the ${payload.enemyName}${payload.isBoss ? ' (Boss)' : payload.isElite ? ' (Elite)' : ''}.`
    : 'Enemy defeated.';
  el.appendChild(subtitle);

  if (payload) {
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '1rem';
    header.style.margin = '1rem 0';
    header.appendChild(AssetImage(payload.imageKey, 'card__image', payload.enemyName));
    el.appendChild(header);

    const lootTitle = document.createElement('h2');
    lootTitle.style.fontSize = '1.1rem';
    lootTitle.style.marginBottom = '0.75rem';
    lootTitle.textContent = 'Loot';
    el.appendChild(lootTitle);

    const list = document.createElement('div');
    list.className = 'loot-list';

    for (const item of payload.items) {
      const row = document.createElement('div');
      row.className = 'loot-item';

      if (item.imageKey) {
        row.appendChild(AssetImage(item.imageKey, 'skill-chip__img', item.name));
      }

      const info = document.createElement('div');
      const name = document.createElement('div');
      name.style.fontWeight = '600';
      if (item.type === 'gold' && item.amount != null) {
        name.textContent = `${item.name}: +${item.amount}`;
      } else if (item.type === 'heal' && item.amount != null) {
        name.textContent = `${item.name}: +${item.amount} HP`;
      } else if (item.type === 'stat' && item.stat && item.statDelta != null) {
        name.textContent = `${item.name}: +${item.statDelta} ${item.stat}`;
      } else {
        name.textContent = item.name;
      }
      info.appendChild(name);

      if (item.description) {
        const desc = document.createElement('div');
        desc.style.fontSize = '0.85rem';
        desc.style.color = 'var(--text-secondary)';
        desc.textContent = item.description;
        info.appendChild(desc);
      }

      row.appendChild(info);
      list.appendChild(row);
    }

    if (payload.items.length === 0 && !hasSkillReward) {
      list.innerHTML = '<p style="color:var(--text-muted)">Nothing found.</p>';
    }

    el.appendChild(list);

    if (hasSkillReward && payload.skillChoices) {
      const skillTitle = document.createElement('h2');
      skillTitle.style.fontSize = '1.1rem';
      skillTitle.style.margin = '1rem 0 0.75rem';
      skillTitle.textContent = 'Skill reward';
      el.appendChild(skillTitle);

      const hint = document.createElement('p');
      hint.style.fontSize = '0.9rem';
      hint.style.color = 'var(--text-secondary)';
      hint.style.marginBottom = '0.75rem';
      hint.textContent = 'Choose one reward below, or skip to keep only the loot above.';
      el.appendChild(hint);

      const grid = document.createElement('div');
      grid.className = 'card-grid card-grid--stagger';

      for (const skillId of payload.skillChoices) {
        const skill = getSkill(skillId);
        if (!skill) continue;
        const kind = rewardTypeLabel(skill.type);
        grid.appendChild(
          Card({
            title: `${skill.name} (${kind})`,
            description: `${skill.description}\n\n${getSkillDescription(skillId, 1)}`,
            imageKey: skill.imageKey,
            tags: skill.tags,
            onClick: () => engine.pickLootSkillReward(skillId),
          }),
        );
      }

      el.appendChild(grid);

      const actions = document.createElement('div');
      actions.className = 'btn-row';
      actions.style.marginTop = '1rem';

      const skip = document.createElement('button');
      skip.className = 'btn btn--secondary';
      skip.textContent = 'Skip skill reward';
      skip.addEventListener('click', () => engine.skipLootSkillReward());
      actions.appendChild(skip);

      el.appendChild(actions);
    }
  }

  if (!hasSkillReward) {
    const btn = document.createElement('button');
    btn.className = 'btn btn--primary';
    btn.style.marginTop = '1.5rem';
    btn.textContent = 'Continue';
    btn.addEventListener('click', () => engine.claimLoot());
    el.appendChild(btn);
  }

  return el;
}
