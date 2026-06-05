import type { CombatEnemyInstance, CombatState } from '../../types/game-state';
import { getEnemy, getSkill } from '../../content/registries';
import { buildCombatContext } from './CombatContext';
import { getSkillCooldown, getSkillManaCost } from '../systems/SkillSystem';
import { combatSynergyBonuses } from './synergy-combat';
import { addLog, withLastAction } from './combat-log';
import { applySkillResult } from './skill-application';
import { processEnemyStatusTicks, singleEnemyAttack } from './enemy-phase';
import type { RunState } from '../../types/game-state';
import { nextRandom } from '../rng';
import { rollCritDamage } from './combat-damage';
import {
  allEnemiesDefeated,
  livingEnemies,
  mapEnemyUpdate,
  nextEnemyInstanceId,
  pickLowestHpTargetIndex,
  resetEnemyInstanceIds,
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
  initialMana: number;
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
    currentMana: params.initialMana,
    playerDodgeNext: false,
    playerCounterDamage: 0,
    playerBonusBlock: 0,
    playerPierceNext: false,
    isBoss: params.isBoss,
    goldReward: params.goldReward,
    finished: false,
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

function regenMana(combat: CombatState, maxMana: number, manaRegen: number): CombatState {
  return {
    ...combat,
    currentMana: Math.min(maxMana, combat.currentMana + manaRegen),
  };
}

function beginPlayerTurn(
  combat: CombatState,
  maxMana: number,
  manaRegen: number,
): CombatState {
  const withMana = regenMana(combat, maxMana, manaRegen);
  return {
    ...withMana,
    enemyPhaseIndex: 0,
    playerBonusBlock: 0,
    targetIndex: pickLowestHpTargetIndex(withMana),
  };
}

function consumeRng(run: RunState): { value: number; run: RunState } {
  const result = nextRandom(run.rngState);
  return { value: result.value, run: { ...run, rngState: result.state } };
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
  const { maxMana, manaRegen } = run.player.stats;

  if (living.length === 0) {
    combat.turn = 'player';
    return { ...run, combat: beginPlayerTurn(combat, maxMana, manaRegen) };
  }

  const phaseIdx = combat.enemyPhaseIndex;
  if (phaseIdx >= living.length) {
    combat.turn = 'player';
    return { ...run, combat: beginPlayerTurn(combat, maxMana, manaRegen) };
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
    return { ...run, combat: beginPlayerTurn(combat, maxMana, manaRegen) };
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
    return { ...run, combat: beginPlayerTurn(combat, maxMana, manaRegen) };
  }

  combat.enemyPhaseIndex = phaseIdx + 1;
  if (combat.enemyPhaseIndex < livingEnemies(combat).length) {
    return { ...run, combat };
  }

  combat.turn = 'player';
  combat = beginPlayerTurn(combat, maxMana, manaRegen);
  return { ...run, combat };
}

/** End the player phase and start the enemy phase. */
export function finishPlayerTurn(run: RunState): RunState {
  if (!run.combat || run.combat.finished || run.combat.turn !== 'player') return run;

  let combat = endPlayerTurn(run.combat);
  combat.turn = 'enemy';
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

  const manaCost = getSkillManaCost(skillId);
  if (run.combat.currentMana < manaCost) return run;

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
  combat.currentMana -= manaCost;

  if (allEnemiesDefeated(combat)) {
    combat.finished = true;
    combat.result = 'win';
    combat = addLog(combat, 'All enemies defeated!', 'system');
    return { ...run, combat };
  }

  return { ...run, combat };
}

export function resolveEnemyTurn(run: RunState): RunState {
  return enemyTurn(run);
}

export { applySkillResult } from './skill-application';
export { processEnemyStatusTicks, singleEnemyAttack } from './enemy-phase';
export { addLog, withLastAction } from './combat-log';
export { combatSynergyBonuses } from './synergy-combat';

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
