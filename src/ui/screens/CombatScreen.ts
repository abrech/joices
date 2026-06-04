import type { GameEngine } from '../../game/GameEngine';
import { getEnemy, getSkill, getClass, getWeapon } from '../../content/registries';
import { getSkillDescription } from '../../game/systems/SkillSystem';
import { AssetImage } from '../components/AssetImage';
import { CombatLog } from '../components/CombatLog';
import { StatusBadges } from '../components/StatusBadges';
import { formatTagsLine } from '../components/TagChips';
import { Tooltip } from '../components/Tooltip';

export function CombatScreen(engine: GameEngine): HTMLElement {
  const { run } = engine.getState();
  const combat = run.combat!;
  const enemy = getEnemy(combat.enemyId)!;
  const classDef = getClass(run.player.classId);

  const el = document.createElement('div');
  const heading = document.createElement('h1');
  heading.className = 'screen-title';
  heading.textContent = combat.isBoss ? 'Boss Fight' : 'Combat';
  el.appendChild(heading);

  const area = document.createElement('div');
  area.className = 'combat-area';

  const playerDiv = document.createElement('div');
  playerDiv.className = 'combat-fighter';
  playerDiv.appendChild(AssetImage(classDef?.imageKey ?? 'warrior', 'card__image', 'Player'));
  const playerTitle = document.createElement('h3');
  playerTitle.textContent = 'You';
  playerDiv.appendChild(playerTitle);
  const playerHpText = document.createElement('p');
  playerHpText.textContent = `${run.player.hp} / ${run.player.stats.maxHp} HP`;
  playerDiv.appendChild(playerHpText);
  const playerHp = document.createElement('div');
  playerHp.className = 'hp-bar';
  const playerFill = document.createElement('div');
  playerFill.className = 'hp-bar__fill';
  playerFill.style.width = `${(run.player.hp / run.player.stats.maxHp) * 100}%`;
  playerHp.appendChild(playerFill);
  playerDiv.appendChild(playerHp);
  playerDiv.appendChild(
    StatusBadges({
      statuses: combat.playerStatuses,
      dodgeNext: combat.playerDodgeNext,
    }),
  );

  const enemyDiv = document.createElement('div');
  enemyDiv.className = 'combat-fighter';
  enemyDiv.appendChild(AssetImage(enemy.imageKey, 'card__image', enemy.name));
  const enemyTitle = document.createElement('h3');
  enemyTitle.textContent = enemy.name;
  enemyDiv.appendChild(enemyTitle);
  const enemyHpText = document.createElement('p');
  enemyHpText.textContent = `${combat.enemyHp} / ${combat.enemyMaxHp} HP`;
  enemyDiv.appendChild(enemyHpText);
  const enemyHp = document.createElement('div');
  enemyHp.className = 'hp-bar';
  const enemyFill = document.createElement('div');
  enemyFill.className = 'hp-bar__fill hp-bar__fill--enemy';
  enemyFill.style.width = `${(combat.enemyHp / combat.enemyMaxHp) * 100}%`;
  enemyHp.appendChild(enemyFill);
  enemyDiv.appendChild(enemyHp);
  enemyDiv.appendChild(
    StatusBadges({
      statuses: combat.enemyStatuses,
      stunned: combat.enemyStunned,
    }),
  );

  area.appendChild(playerDiv);
  area.appendChild(enemyDiv);
  el.appendChild(area);
  el.appendChild(CombatLog(combat.log));

  if (!combat.finished && combat.turn === 'player') {
    const actions = document.createElement('div');
    actions.className = 'btn-row';
    const basicId = getWeapon(run.player.weaponId)?.starterAttackId;
    const attackSkills: { owned: (typeof run.player.skills)[number]; skill: NonNullable<ReturnType<typeof getSkill>> }[] =
      [];
    for (const owned of run.player.skills) {
      const skill = getSkill(owned.id);
      if (skill?.type !== 'attack') continue;
      attackSkills.push({ owned, skill });
    }
    if (basicId) {
      attackSkills.sort((a, b) => {
        if (a.owned.id === basicId) return -1;
        if (b.owned.id === basicId) return 1;
        return 0;
      });
    }

    for (const { owned, skill } of attackSkills) {
      const cd = combat.skillCooldowns[owned.id] ?? 0;
      const isBasic = owned.id === basicId;
      const btn = document.createElement('button');
      btn.className = isBasic ? 'btn btn--primary' : 'btn btn--secondary';
      btn.textContent = cd > 0 ? `${skill.name} (CD: ${cd})` : skill.name;
      btn.disabled = cd > 0;
      btn.addEventListener('click', () => engine.combatUseSkill(owned.id));

      const levelDesc = getSkillDescription(owned.id, owned.level);
      const tagsLine = formatTagsLine(skill.tags);
      const cdLine = cd > 0 ? `\nOn cooldown: ${cd} turn(s)` : '';
      const tooltipParts = [skill.description, levelDesc, tagsLine, cdLine].filter(Boolean);
      actions.appendChild(
        Tooltip(tooltipParts.join('\n\n'), btn, { variant: 'action' }),
      );
    }

    el.appendChild(actions);
  }

  return el;
}
