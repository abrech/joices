import type { CombatEffectResult } from '../../types/definitions';
import type { CombatLastAction, CombatState } from '../../types/game-state';
import type { RunState } from '../../types/game-state';
import { getHemophiliaBonuses } from '../systems/SkillSystem';
import { applyBleedStatus, applyStatus } from './status-effects';
import { addLog } from './combat-log';
import {
  livingEnemies,
  mapEnemyUpdate,
  targetEnemy,
} from './combat-state';

function applyStatusToEnemy(
  combat: CombatState,
  instanceId: string,
  type: import('../../types/definitions').StatusType,
  stacks: number,
  duration: number,
  hem: ReturnType<typeof getHemophiliaBonuses>,
): CombatState {
  return mapEnemyUpdate(combat, instanceId, (enemy) => ({
    ...enemy,
    statuses:
      type === 'bleed'
        ? applyBleedStatus(enemy.statuses, stacks, duration, hem)
        : applyStatus(enemy.statuses, type, stacks, duration),
  }));
}

function damageEnemyInstance(
  combat: CombatState,
  instanceId: string,
  amount: number,
): CombatState {
  return mapEnemyUpdate(combat, instanceId, (enemy) => ({
    ...enemy,
    hp: Math.max(0, enemy.hp - amount),
  }));
}

export function applySkillResult(
  combat: CombatState,
  run: RunState,
  result: CombatEffectResult,
  skillTags: string[] = [],
): { combat: CombatState; lastAction?: CombatLastAction } {
  let updated = { ...combat };
  const hem = getHemophiliaBonuses(run.player.skills);
  const isAoe = result.aoe === true || skillTags.includes('aoe');

  let totalDamage = 0;
  let primaryTargetId: string | undefined;

  if (typeof result.damage === 'number' && result.damage > 0) {
    if (isAoe) {
      for (const enemy of livingEnemies(updated)) {
        updated = damageEnemyInstance(updated, enemy.instanceId, result.damage);
        totalDamage += result.damage;
      }
      primaryTargetId = livingEnemies(updated)[0]?.instanceId;
    } else {
      const target = targetEnemy(updated);
      if (target) {
        updated = damageEnemyInstance(updated, target.instanceId, result.damage);
        totalDamage = result.damage;
        primaryTargetId = target.instanceId;
      }
    }
  }

  if (result.counterOnDodge !== undefined) {
    updated.playerCounterDamage = result.counterOnDodge;
  }

  if (result.heal) {
    run.player.hp = Math.min(run.player.stats.maxHp, run.player.hp + result.heal);
  }

  const statusApplications = [
    ...(result.applyStatus ? [result.applyStatus] : []),
    ...(result.extraStatuses ?? []),
  ];
  for (const app of statusApplications) {
    const { target, type, stacks = 1, duration = 3 } = app;
    if (target === 'enemy') {
      if (isAoe) {
        for (const enemy of livingEnemies(updated)) {
          updated = applyStatusToEnemy(updated, enemy.instanceId, type, stacks, duration, hem);
        }
      } else {
        const t = targetEnemy(updated);
        if (t) {
          updated = applyStatusToEnemy(updated, t.instanceId, type, stacks, duration, hem);
          primaryTargetId = t.instanceId;
        }
      }
    } else {
      updated.playerStatuses = applyStatus(updated.playerStatuses, type, stacks, duration);
    }
  }

  if (result.stun) {
    const t = targetEnemy(updated);
    if (t) {
      updated = mapEnemyUpdate(updated, t.instanceId, (e) => ({ ...e, stunned: true }));
      primaryTargetId = t.instanceId;
    }
  }

  if (result.dodgeNext) updated.playerDodgeNext = true;
  if (result.grantBlock) updated.playerBonusBlock += result.grantBlock;
  if (result.pierceNext) updated.playerPierceNext = true;

  if (result.logMessage) {
    updated = addLog(updated, result.logMessage, 'player');
  }

  let lastAction: CombatLastAction | undefined;
  if (totalDamage > 0) {
    lastAction = {
      actor: 'player',
      kind: 'skill',
      damage: isAoe ? result.damage : totalDamage,
      aoe: isAoe,
    };
  } else if (result.dodgeNext) {
    lastAction = { actor: 'player', kind: 'dodge' };
  } else if (result.heal || result.applyStatus || result.stun || result.logMessage) {
    lastAction = { actor: 'player', kind: 'skill' };
  }

  return {
    combat: updated,
    lastAction: lastAction
      ? { ...lastAction, targetInstanceId: primaryTargetId ?? lastAction.targetInstanceId }
      : undefined,
  };
}
