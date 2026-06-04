import type { CombatState, CombatLogEntry, CombatLastAction, CombatEnemyInstance } from '../../types/game-state';
import type { CombatEffectResult } from '../../types/definitions';
import { getEnemy, getSkill } from '../../content/registries';
import { buildCombatContext } from './CombatContext';
import { applyBleedStatus, applyStatus, statusDamagePerTick, tickStatuses } from './status-effects';
import { computeSynergyBonuses } from '../systems/SynergySystem';
import { getHemophiliaBonuses, getSkillCooldown } from '../systems/SkillSystem';
import type { RunState } from '../../types/game-state';
import { nextRandom } from '../rng';
import { rollCritDamage } from './combat-damage';
import {
  allEnemiesDefeated,
  enemyByInstanceId,
  livingEnemies,
  mapEnemyUpdate,
  nextEnemyInstanceId,
  pickLowestHpTargetIndex,
  resetEnemyInstanceIds,
  targetEnemy,
  weakenAttackMultiplier,
} from './combat-state';

export interface StartCombatEnemyParams {
  enemyId: string;
  hp: number;
  maxHp: number;
  attack: number;
}

export interface StartCombatParams {
  enemies: StartCombatEnemyParams[];
  skillCooldowns: Record<string, number>;
  isBoss: boolean;
  goldReward: number;
}

export function startCombat(params: StartCombatParams): CombatState {
  resetEnemyInstanceIds();
  const enemies: CombatEnemyInstance[] = params.enemies.map((e) => ({
    instanceId: nextEnemyInstanceId(),
    enemyId: e.enemyId,
    hp: e.hp,
    maxHp: e.maxHp,
    attack: e.attack,
    statuses: [],
    stunned: false,
    turnCount: 0,
  }));

  return {
    enemies,
    targetIndex: 0,
    playerStatuses: [],
    turn: 'player',
    enemyPhaseIndex: 0,
    log: [{ text: 'Combat begins!', type: 'system' }],
    skillCooldowns: { ...params.skillCooldowns },
    playerDodgeNext: false,
    playerCounterDamage: 0,
    playerBonusBlock: 0,
    playerPierceNext: false,
    isBoss: params.isBoss,
    goldReward: params.goldReward,
    finished: false,
  };
}

function addLog(combat: CombatState, text: string, type: CombatLogEntry['type'] = 'system'): CombatState {
  return { ...combat, log: [...combat.log, { text, type }] };
}

function withLastAction(
  combat: CombatState,
  action: CombatLastAction,
  targetInstanceId?: string,
): CombatState {
  return {
    ...combat,
    lastAction: { ...action, targetInstanceId: targetInstanceId ?? action.targetInstanceId },
  };
}

export function clearCombatLastAction(run: RunState): RunState {
  if (!run.combat?.lastAction) return run;
  return { ...run, combat: { ...run.combat, lastAction: undefined } };
}

function tickCooldowns(combat: CombatState, excludeSkillId?: string): CombatState {
  const skillCooldowns = { ...combat.skillCooldowns };
  for (const id of Object.keys(skillCooldowns)) {
    if (id === excludeSkillId) continue;
    if (skillCooldowns[id] > 0) skillCooldowns[id]--;
  }
  return { ...combat, skillCooldowns };
}

function endPlayerTurn(combat: CombatState, excludeSkillId?: string): CombatState {
  return { ...tickCooldowns(combat, excludeSkillId), enemyPhaseIndex: 0 };
}

function beginPlayerTurn(combat: CombatState): CombatState {
  return { ...combat, enemyPhaseIndex: 0, targetIndex: pickLowestHpTargetIndex(combat) };
}

function consumeRng(run: RunState): { value: number; run: RunState } {
  const result = nextRandom(run.rngState);
  return { value: result.value, run: { ...run, rngState: result.state } };
}

function combatSynergyBonuses(skills: RunState['player']['skills']) {
  const bonuses = computeSynergyBonuses(skills);
  const hem = getHemophiliaBonuses(skills);
  if (hem) {
    return { ...bonuses, bleedBonusPerStack: hem.bonusDamagePerStack };
  }
  return bonuses;
}

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

function applySkillResult(
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

function processEnemyStatusTicks(
  combat: CombatState,
  run: RunState,
  synergies: ReturnType<typeof computeSynergyBonuses>,
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

function singleEnemyAttack(
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
    dmg = Math.floor(dmg * 1.5);
    updated = addLog(updated, `${enemyDef.name} charges a powerful blow!`, 'enemy');
  }
  dmg = Math.floor(dmg * weakenAttackMultiplier(enemyInstance.statuses));

  const blockRoll = consumeRng(run);
  run = blockRoll.run;
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

export function enemyTurn(run: RunState): RunState {
  if (!run.combat || run.combat.finished) return run;

  let combat = { ...run.combat };
  const synergies = combatSynergyBonuses(run.player.skills);

  if (combat.enemyPhaseIndex === 0) {
    const statusResult = processEnemyStatusTicks(combat, run, synergies);
    combat = statusResult.combat;
    if (statusResult.lastAction) {
      combat = withLastAction(combat, statusResult.lastAction, statusResult.lastAction.targetInstanceId);
    }
  }

  if (allEnemiesDefeated(combat)) {
    combat.finished = true;
    combat.result = 'win';
    combat = addLog(combat, 'All enemies defeated!', 'system');
    return { ...run, combat };
  }

  const living = livingEnemies(combat);
  if (living.length === 0) {
    combat.turn = 'player';
    return { ...run, combat: beginPlayerTurn(combat) };
  }

  const phaseIdx = combat.enemyPhaseIndex;
  if (phaseIdx >= living.length) {
    combat.turn = 'player';
    return { ...run, combat: beginPlayerTurn(combat) };
  }

  const attacker = living[phaseIdx];
  const attackerIdx = combat.enemies.findIndex((e) => e.instanceId === attacker.instanceId);

  if (attacker.stunned) {
    combat = mapEnemyUpdate(combat, attacker.instanceId, (e) => ({ ...e, stunned: false }));
    combat = addLog(combat, `${getEnemy(attacker.enemyId)?.name ?? 'Enemy'} is stunned!`, 'system');
    combat = withLastAction(
      combat,
      { actor: 'enemy', kind: 'stun', label: 'Enemy is stunned!' },
      attacker.instanceId,
    );
    combat.enemyPhaseIndex = phaseIdx + 1;
    if (combat.enemyPhaseIndex < livingEnemies(combat).length) {
      return { ...run, combat };
    }
    combat.turn = 'player';
    return { ...run, combat: beginPlayerTurn(combat) };
  }

  combat = mapEnemyUpdate(combat, attacker.instanceId, (e) => ({
    ...e,
    turnCount: e.turnCount + 1,
  }));

  const attackResult = singleEnemyAttack(run, combat, combat.enemies[attackerIdx]!);
  run = attackResult.run;
  combat = attackResult.combat;

  if (allEnemiesDefeated(combat)) {
    combat.finished = true;
    combat.result = 'win';
    combat = addLog(combat, 'All enemies defeated!', 'system');
    return { ...run, combat };
  }

  if (run.player.hp <= 0) {
    combat.finished = true;
    combat.result = 'lose';
    combat = addLog(combat, 'You have been defeated...', 'system');
    return { ...run, combat };
  }

  if (combat.lastAction?.kind === 'dodge' || combat.lastAction?.kind === 'block') {
    combat.enemyPhaseIndex = phaseIdx + 1;
    if (combat.enemyPhaseIndex < livingEnemies(combat).length) {
      return { ...run, combat };
    }
    combat.turn = 'player';
    return { ...run, combat: beginPlayerTurn(combat) };
  }

  combat.enemyPhaseIndex = phaseIdx + 1;
  if (combat.enemyPhaseIndex < livingEnemies(combat).length) {
    return { ...run, combat };
  }

  combat.turn = 'player';
  combat = beginPlayerTurn(combat);
  return { ...run, combat };
}

export function useSkill(run: RunState, skillId: string): RunState {
  if (!run.combat || run.combat.finished || run.combat.turn !== 'player') return run;

  const cd = run.combat.skillCooldowns[skillId] ?? 0;
  if (cd > 0) return run;

  const skill = getSkill(skillId);
  if (!skill?.onUse) return run;

  const owned = run.player.skills.find((s) => s.id === skillId);
  if (!owned) return run;

  const synergies = combatSynergyBonuses(run.player.skills);
  const ctx = buildCombatContext(run, synergies);
  let result = skill.onUse(ctx, owned.level);
  let crit = false;

  if (typeof result.damage === 'number' && result.damage > 0) {
    const critRoll = consumeRng(run);
    run = critRoll.run;
    const rolled = rollCritDamage(result.damage, run.player.stats.critChance, critRoll.value);
    result = { ...result, damage: rolled.damage };
    crit = rolled.crit;
  }

  const applied = applySkillResult(run.combat!, run, result, skill.tags);
  let combat = applied.combat;
  if (applied.lastAction) {
    const la = crit ? { ...applied.lastAction, crit: true } : applied.lastAction;
    combat = withLastAction(combat, la, la.targetInstanceId);
  }

  const cooldownTurns = getSkillCooldown(skillId, owned.level);
  combat.skillCooldowns = { ...combat.skillCooldowns, [skillId]: cooldownTurns };

  if (allEnemiesDefeated(combat)) {
    combat.finished = true;
    combat.result = 'win';
    combat = addLog(combat, 'All enemies defeated!', 'system');
    return { ...run, combat };
  }

  combat.turn = 'enemy';
  combat = endPlayerTurn(combat, skillId);
  return { ...run, combat };
}

export function resolveEnemyTurn(run: RunState): RunState {
  return enemyTurn(run);
}

export function applyCombatStartPassives(run: RunState): RunState {
  if (!run.combat) return run;

  let combat = { ...run.combat };
  const synergies = combatSynergyBonuses(run.player.skills);
  const ctx = buildCombatContext(run, synergies);

  for (const owned of run.player.skills) {
    const skill = getSkill(owned.id);
    if (skill?.combatStart) {
      const result = skill.combatStart(ctx, owned.level);
      const applied = applySkillResult(combat, run, result, skill.tags);
      combat = applied.combat;
      if (applied.lastAction) {
        combat = withLastAction(combat, applied.lastAction, applied.lastAction.targetInstanceId);
      }
    }
  }

  return { ...run, combat };
}
