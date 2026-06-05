import type { CombatEnemyInstance, CombatLastAction, CombatState } from '../../types/game-state';
import type { RunState } from '../../types/game-state';
import type { SynergyBonuses } from '../../types/definitions';
import { getEnemy } from '../../content/registries';
import { nextRandom } from '../rng';
import { addLog, withLastAction } from './combat-log';
import {
  livingEnemies,
  mapEnemyUpdate,
  weakenAttackMultiplier,
} from './combat-state';
import { statusDamagePerTick, tickStatuses } from './status-effects';
import { enemyByInstanceId } from './combat-state';

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

export function processEnemyStatusTicks(
  combat: CombatState,
  run: RunState,
  synergies: SynergyBonuses,
): { combat: CombatState; lastAction?: CombatLastAction } {
  let updated = { ...combat };
  let totalStatusDamage = 0;
  let lastTargetId: string | undefined;

  for (const enemy of livingEnemies(updated)) {
    for (const status of enemy.statuses) {
      if (status.type === 'stun' || status.type === 'mark' || status.type === 'weaken') continue;
      let ticks = 1;
      if (status.type === 'bleed' && synergies.bleedDoubleTick) ticks = 2;
      for (let t = 0; t < ticks; t++) {
        const dmg = statusDamagePerTick(
          status.type,
          status.stacks,
          synergies,
          enemy.statuses,
          run.player.skills,
        );
        if (dmg > 0) {
          totalStatusDamage += dmg;
          updated = damageEnemyInstance(updated, enemy.instanceId, dmg);
          lastTargetId = enemy.instanceId;
          const name = getEnemy(enemy.enemyId)?.name ?? 'Enemy';
          updated = addLog(updated, `${status.type} deals ${dmg} to ${name}`, 'system');
        }
      }
    }
    const e = enemyByInstanceId(updated, enemy.instanceId);
    if (e) {
      updated = mapEnemyUpdate(updated, enemy.instanceId, (en) => ({
        ...en,
        statuses: tickStatuses(en.statuses),
      }));
    }
  }

  if (totalStatusDamage > 0) {
    return {
      combat: updated,
      lastAction: {
        actor: 'player',
        kind: 'status',
        damage: totalStatusDamage,
        label: 'Status damage',
        targetInstanceId: lastTargetId,
      },
    };
  }
  return { combat: updated };
}

export function singleEnemyAttack(
  run: RunState,
  combat: CombatState,
  enemyInstance: CombatEnemyInstance,
): { run: RunState; combat: CombatState } {
  const enemyDef = getEnemy(enemyInstance.enemyId);
  if (!enemyDef) return { run, combat };

  let updated = { ...combat };
  let dmg = enemyInstance.attack;
  const charged = enemyDef.behavior === 'bursty' && enemyInstance.turnCount % 3 === 0;
  if (charged) {
    const burstMult = combat.isBoss ? 1.35 : 1.5;
    dmg = Math.floor(dmg * burstMult);
    updated = addLog(updated, `${enemyDef.name} charges a powerful blow!`, 'enemy');
  }
  dmg = Math.floor(dmg * weakenAttackMultiplier(enemyInstance.statuses));

  const blockRoll = nextRandom(run.rngState);
  run = { ...run, rngState: blockRoll.state };
  if (
    enemyDef.behavior === 'defensive' &&
    blockRoll.value < 0.3 &&
    !updated.playerPierceNext
  ) {
    updated = addLog(updated, `${enemyDef.name} blocks and prepares...`, 'enemy');
    updated = withLastAction(
      updated,
      { actor: 'enemy', kind: 'block', label: 'Enemy braces…' },
      enemyInstance.instanceId,
    );
    return { run, combat: updated };
  }
  if (updated.playerPierceNext) updated = { ...updated, playerPierceNext: false };

  if (updated.playerDodgeNext) {
    updated.playerDodgeNext = false;
    let counter = updated.playerCounterDamage;
    updated.playerCounterDamage = 0;
    if (counter > 0) {
      updated = damageEnemyInstance(updated, enemyInstance.instanceId, counter);
      updated = addLog(updated, `Counter hits ${enemyDef.name} for ${counter}!`, 'player');
    }
    updated = addLog(updated, 'You dodge the attack!', 'player');
    updated = withLastAction(
      updated,
      {
        actor: 'enemy',
        kind: 'dodge',
        label: 'You dodge!',
        damage: counter > 0 ? counter : undefined,
      },
      enemyInstance.instanceId,
    );
    return { run, combat: updated };
  }

  const block = run.player.stats.block + updated.playerBonusBlock;
  const actualDmg = Math.max(0, dmg - block);
  run.player.hp = Math.max(0, run.player.hp - actualDmg);
  updated = addLog(
    updated,
    `${enemyDef.name} attacks for ${actualDmg}${block > 0 ? ` (${block} blocked)` : ''}!`,
    'enemy',
  );
  updated = withLastAction(
    updated,
    {
      actor: 'enemy',
      kind: 'attack',
      damage: actualDmg,
      charged,
      label: charged ? 'Powerful blow!' : `${enemyDef.name} attacks!`,
    },
    enemyInstance.instanceId,
  );

  return { run, combat: updated };
}
