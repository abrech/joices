import type { CombatState, CombatLogEntry, CombatLastAction } from '../../types/game-state';
import type { CombatEffectResult } from '../../types/definitions';
import { getEnemy, getSkill } from '../../content/registries';
import { buildCombatContext } from './CombatContext';
import { applyBleedStatus, applyStatus, statusDamagePerTick, tickStatuses } from './status-effects';
import { computeSynergyBonuses } from '../systems/SynergySystem';
import { getHemophiliaBonuses, getSkillCooldown } from '../systems/SkillSystem';
import type { RunState } from '../../types/game-state';
import { nextRandom } from '../rng';

export interface StartCombatParams {
  enemyId: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyAttack: number;
  skillCooldowns: Record<string, number>;
  isBoss: boolean;
  goldReward: number;
}

export function startCombat(params: StartCombatParams): CombatState {
  return {
    enemyId: params.enemyId,
    enemyHp: params.enemyHp,
    enemyMaxHp: params.enemyMaxHp,
    enemyAttack: params.enemyAttack,
    enemyStatuses: [],
    playerStatuses: [],
    turn: 'player',
    log: [{ text: 'Combat begins!', type: 'system' }],
    skillCooldowns: { ...params.skillCooldowns },
    playerDodgeNext: false,
    enemyTurnCount: 0,
    enemyStunned: false,
    isBoss: params.isBoss,
    goldReward: params.goldReward,
    finished: false,
  };
}

function addLog(combat: CombatState, text: string, type: CombatLogEntry['type'] = 'system'): CombatState {
  return { ...combat, log: [...combat.log, { text, type }] };
}

function withLastAction(combat: CombatState, action: CombatLastAction): CombatState {
  return { ...combat, lastAction: action };
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
  return tickCooldowns(combat, excludeSkillId);
}

function beginPlayerTurn(combat: CombatState): CombatState {
  return combat;
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

function applySkillResult(
  combat: CombatState,
  run: RunState,
  result: CombatEffectResult,
): { combat: CombatState; lastAction?: CombatLastAction } {
  let updated = { ...combat };
  const hem = getHemophiliaBonuses(run.player.skills);

  if (typeof result.damage === 'number') {
    updated.enemyHp = Math.max(0, updated.enemyHp - result.damage);
  }
  if (result.heal) {
    run.player.hp = Math.min(run.player.stats.maxHp, run.player.hp + result.heal);
  }
  if (result.applyStatus) {
    const { target, type, stacks = 1, duration = 3 } = result.applyStatus;
    if (target === 'enemy') {
      updated.enemyStatuses =
        type === 'bleed'
          ? applyBleedStatus(updated.enemyStatuses, stacks, duration, hem)
          : applyStatus(updated.enemyStatuses, type, stacks, duration);
    } else {
      updated.playerStatuses = applyStatus(updated.playerStatuses, type, stacks, duration);
    }
  }
  if (result.stun) {
    updated.enemyStunned = true;
  }
  if (result.dodgeNext) {
    updated.playerDodgeNext = true;
  }
  if (result.logMessage) {
    updated = addLog(updated, result.logMessage, 'player');
  }

  let lastAction: CombatLastAction | undefined;
  if (typeof result.damage === 'number') {
    lastAction = { actor: 'player', kind: 'skill', damage: result.damage };
  } else if (result.dodgeNext) {
    lastAction = { actor: 'player', kind: 'dodge' };
  } else if (result.heal || result.applyStatus || result.stun || result.logMessage) {
    lastAction = { actor: 'player', kind: 'skill' };
  }

  return { combat: updated, lastAction };
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
  const result = skill.onUse(ctx, owned.level);

  const applied = applySkillResult({ ...run.combat }, run, result);
  let combat = applied.combat;
  if (applied.lastAction) {
    combat = withLastAction(combat, applied.lastAction);
  }
  const cooldownTurns = getSkillCooldown(skillId, owned.level);
  combat.skillCooldowns = { ...combat.skillCooldowns, [skillId]: cooldownTurns };

  if (combat.enemyHp <= 0) {
    combat.finished = true;
    combat.result = 'win';
    combat = addLog(combat, 'Enemy defeated!', 'system');
    return { ...run, combat };
  }

  combat.turn = 'enemy';
  combat = endPlayerTurn(combat, skillId);
  return { ...run, combat };
}

function processEnemyStatusTicks(
  combat: CombatState,
  synergies: ReturnType<typeof computeSynergyBonuses>,
): { combat: CombatState; lastAction?: CombatLastAction } {
  let updated = { ...combat };
  let totalStatusDamage = 0;

  for (const status of updated.enemyStatuses) {
    if (status.type === 'stun') continue;
    let ticks = 1;
    if (status.type === 'bleed' && synergies.bleedDoubleTick) ticks = 2;
    for (let t = 0; t < ticks; t++) {
      const dmg = statusDamagePerTick(status.type, status.stacks, synergies);
      if (dmg > 0) {
        totalStatusDamage += dmg;
        updated.enemyHp = Math.max(0, updated.enemyHp - dmg);
        updated = addLog(updated, `${status.type} deals ${dmg} to enemy`, 'system');
      }
    }
  }
  updated.enemyStatuses = tickStatuses(updated.enemyStatuses);

  if (totalStatusDamage > 0) {
    return {
      combat: updated,
      lastAction: { actor: 'player', kind: 'status', damage: totalStatusDamage },
    };
  }
  return { combat: updated };
}

export function enemyTurn(run: RunState): RunState {
  if (!run.combat || run.combat.finished) return run;

  let combat = { ...run.combat };
  const enemy = getEnemy(combat.enemyId);
  if (!enemy) return run;

  const synergies = combatSynergyBonuses(run.player.skills);
  const statusResult = processEnemyStatusTicks(combat, synergies);
  combat = statusResult.combat;
  if (statusResult.lastAction) {
    combat = withLastAction(combat, statusResult.lastAction);
  }

  if (combat.enemyHp <= 0) {
    combat.finished = true;
    combat.result = 'win';
    combat = addLog(combat, 'Enemy defeated!', 'system');
    return { ...run, combat };
  }

  if (combat.enemyStunned) {
    combat.enemyStunned = false;
    combat = addLog(combat, 'Enemy is stunned!', 'system');
    combat = withLastAction(combat, { actor: 'enemy', kind: 'stun' });
    combat.turn = 'player';
    combat = beginPlayerTurn(combat);
    return { ...run, combat };
  }

  combat.enemyTurnCount++;

  let dmg = combat.enemyAttack;
  if (enemy.behavior === 'bursty' && combat.enemyTurnCount % 3 === 0) {
    dmg = Math.floor(dmg * 1.5);
    combat = addLog(combat, 'Enemy charges a powerful blow!', 'enemy');
  }
  const blockRoll = consumeRng(run);
  run = blockRoll.run;
  if (enemy.behavior === 'defensive' && blockRoll.value < 0.3) {
    combat = addLog(combat, 'Enemy blocks and prepares...', 'enemy');
    combat = withLastAction(combat, { actor: 'enemy', kind: 'block' });
    combat.turn = 'player';
    combat = beginPlayerTurn(combat);
    return { ...run, combat };
  }

  if (combat.playerDodgeNext) {
    combat.playerDodgeNext = false;
    combat = addLog(combat, 'You dodge the attack!', 'player');
    combat = withLastAction(combat, { actor: 'enemy', kind: 'dodge' });
    combat.turn = 'player';
    combat = beginPlayerTurn(combat);
    return { ...run, combat };
  }

  const block = run.player.stats.block;
  const actualDmg = Math.max(0, dmg - block);
  run.player.hp = Math.max(0, run.player.hp - actualDmg);
  combat = addLog(
    combat,
    `${enemy.name} attacks for ${actualDmg}${block > 0 ? ` (${block} blocked)` : ''}!`,
    'enemy',
  );
  combat = withLastAction(combat, {
    actor: 'enemy',
    kind: 'attack',
    damage: actualDmg,
  });

  if (run.player.hp <= 0) {
    combat.finished = true;
    combat.result = 'lose';
    combat = addLog(combat, 'You have been defeated...', 'system');
    return { ...run, combat };
  }

  combat.turn = 'player';
  combat = beginPlayerTurn(combat);
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
      const applied = applySkillResult(combat, run, result);
      combat = applied.combat;
    }
  }

  return { ...run, combat };
}
