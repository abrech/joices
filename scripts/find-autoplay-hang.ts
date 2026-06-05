/**
 * Locate infinite loops in autoplay (bounded, no batch). Run: npx tsx scripts/find-autoplay-hang.ts
 */
import { createEmptyProfile, createInitialRunState } from '../src/types/game-state.ts';
import type { GameState } from '../src/types/game-state.ts';
import { getPolicy } from '../src/game/autoplay/policy.ts';
import {
  applyClaimLoot,
  applyCombatSkill,
  applyCombatEndTurn,
  applyLootSkillReward,
  applyPickFloor,
  applySelectClass,
  applySelectSkill,
  applySelectWeapon,
  applySkipCombatLootSkillPick,
  applySkipLootSkillReward,
  drainCombatEnemyPhase,
  needsLootScreenBeforeClaim,
  openCombatLoot,
} from '../src/game/RunCommands.ts';
import { completeEvent } from '../src/game/events/EventResolver.ts';
import { purchaseShopItem } from '../src/game/shop/ShopPurchase.ts';
import type { AutoplayPolicy } from '../src/game/autoplay/policy.ts';
import type { LootPayload, ShopPayload, SkillPickPayload } from '../src/types/events.ts';
import { appendAction } from '../src/game/logging/RunLogger.ts';
import { fingerprint } from '../src/game/autoplay/runMetrics.ts';
import { enemyTurn } from '../src/game/combat/CombatEngine.ts';

const MAX_MAIN = 400;
const MAX_SKILL_LOOP = 40;
const MAX_DRAIN = 80;
const MAX_COMBAT_OUTER = 250;

const policy = getPolicy('greedy');

function commit(state: GameState, action?: Parameters<typeof appendAction>[1]): GameState {
  const run = action ? appendAction(state.run, action) : state.run;
  return { ...state, run };
}

function spendPlayerPhase(state: GameState, pol: AutoplayPolicy): GameState | null {
  let current = state;
  let skillLoops = 0;

  while (current.run.combat?.turn === 'player' && !current.run.combat.finished) {
    skillLoops++;
    if (skillLoops > MAX_SKILL_LOOP) {
      throw new Error(
        `skill loop > ${MAX_SKILL_LOOP} mana=${current.run.combat!.currentMana} pick=${pol.selectCombatSkill(current)}`,
      );
    }
    const skillId = pol.selectCombatSkill(current);
    if (!skillId) break;
    const next = applyCombatSkill(current, skillId);
    if (next === current || next.run === current.run) break;
    current = commit(next, { kind: 'combatSkill', skillId });
  }

  if (!current.run.combat || current.run.combat.finished) return current;
  if (current.run.combat.turn !== 'player') return current;

  const ended = applyCombatEndTurn(current);
  if (ended === current) return null;
  return drainCombatEnemyPhaseBounded(commit(ended, { kind: 'combatEndTurn' }));
}

function drainCombatEnemyPhaseBounded(state: GameState): GameState {
  let { run } = state;
  let drainSteps = 0;
  while (run.combat && !run.combat.finished && run.combat.turn === 'enemy') {
    drainSteps++;
    if (drainSteps > MAX_DRAIN) {
      throw new Error(
        `enemy drain > ${MAX_DRAIN} idx=${run.combat.enemyPhaseIndex} living=${run.combat.enemies.filter((e) => e.hp > 0).length}`,
      );
    }
    const prevFp = JSON.stringify({
      idx: run.combat.enemyPhaseIndex,
      la: run.combat.lastAction?.kind,
      turn: run.combat.turn,
    });
    run = enemyTurn(run);
    const nextFp = JSON.stringify({
      idx: run.combat?.enemyPhaseIndex,
      la: run.combat?.lastAction?.kind,
      turn: run.combat?.turn,
    });
    if (run.combat?.turn === 'enemy' && nextFp === prevFp) {
      throw new Error(`enemy drain no progress at step ${drainSteps} ${prevFp}`);
    }
  }
  return { ...state, run };
}

function resolveCombatBounded(state: GameState, pol: AutoplayPolicy): GameState {
  let current = state;
  let loops = 0;
  while (current.run.combat && !current.run.combat.finished && loops < MAX_COMBAT_OUTER) {
    loops++;
    if (current.run.combat.turn === 'player') {
      const before = fingerprint(current);
      const next = spendPlayerPhase(current, pol);
      if (!next) break;
      current = next;
      if (!current.run.combat?.finished && fingerprint(current) === before) break;
    } else {
      current = drainCombatEnemyPhaseBounded(current);
    }
  }
  if (current.run.combat && !current.run.combat.finished && loops >= MAX_COMBAT_OUTER) {
    throw new Error(`resolveCombat outer > ${MAX_COMBAT_OUTER} turn=${current.run.combat.turn}`);
  }
  return current;
}

// Import real step from AutoplayRunner would pull too much; use minimal event step:
function stepPhase(state: GameState): GameState {
  const { phase, floorOptions } = state.run;
  if (phase === 'classSelect') {
    const classId = policy.selectClass(state);
    return applySelectClass(state, classId);
  }
  if (phase === 'weaponSelect') {
    const weaponId = policy.selectWeapon(state);
    return applySelectWeapon(state, weaponId);
  }
  if (phase === 'floorChoice' && floorOptions.length) {
    const index = policy.selectFloorIndex(state);
    return applyPickFloor(state, index);
  }
  if (phase === 'event') {
    const { combat, activeEvent } = state.run;
    if (combat?.finished && combat.result === 'win') {
      let cur = state;
      if (needsLootScreenBeforeClaim(cur)) cur = openCombatLoot(cur);
      const loot = cur.run.activeEvent?.payload as LootPayload | undefined;
      if (loot?.skillChoices && loot.skillChoices.length >= 2) {
        const pick = policy.selectSkillReward(cur, loot.skillChoices, 'loot');
        if (pick.type === 'skip') return applySkipLootSkillReward(cur);
        return applyLootSkillReward(cur, pick.skillId);
      }
      return applyClaimLoot(cur);
    }
    if (combat && !combat.finished) return resolveCombatBounded(state, policy);
    if (activeEvent?.screen === 'skillPick') {
      const payload = activeEvent.payload as SkillPickPayload;
      const action = policy.selectSkillReward(state, payload.skills, payload.afterCombatLoot ? 'loot' : 'training');
      if (action.type === 'skip') {
        if (payload.afterCombatLoot) return applySkipCombatLootSkillPick(state);
        return completeEvent(state, '__skip__');
      }
      return applySelectSkill(state, action.skillId);
    }
    if (activeEvent?.screen === 'heal') return completeEvent(state);
    if (activeEvent?.screen === 'shop') {
      const payload = activeEvent.payload as ShopPayload | undefined;
      if (!payload?.items.length) return completeEvent(state, '__leave__');
      const action = policy.selectShopAction(state, payload.items.map((i) => i.id));
      if (action.type === 'leave') return completeEvent(state, '__leave__');
      return purchaseShopItem(state, action.itemId);
    }
  }
  return state;
}

let state: GameState = { run: createInitialRunState(42), profile: createEmptyProfile() };
const t0 = Date.now();

try {
  for (let step = 0; step < MAX_MAIN && state.run.phase !== 'gameOver'; step++) {
    const before = fingerprint(state);
    state = stepPhase(state);
    const after = fingerprint(state);
    if (before === after) {
      console.log('STUCK (no fingerprint change)', {
        step,
        phase: state.run.phase,
        screen: state.run.activeEvent?.screen,
        combat: state.run.combat
          ? {
              turn: state.run.combat.turn,
              finished: state.run.combat.finished,
              mana: state.run.combat.currentMana,
              enemyHp: state.run.combat.enemies.reduce((n, e) => n + e.hp, 0),
            }
          : null,
        fp: before,
      });
      process.exit(1);
    }
    if (step % 50 === 49) {
      console.log(`step ${step + 1} floor=${state.run.floor} phase=${state.run.phase} screen=${state.run.activeEvent?.screen ?? '-'}`);
    }
  }
  console.log('OK', {
    ms: Date.now() - t0,
    phase: state.run.phase,
    floor: state.run.floor,
    victory: state.run.victory,
  });
} catch (e) {
  console.error('HANG', e);
  console.error('state', {
    phase: state.run.phase,
    screen: state.run.activeEvent?.screen,
    combatTurn: state.run.combat?.turn,
    combatIdx: state.run.combat?.enemyPhaseIndex,
    mana: state.run.combat?.currentMana,
  });
  process.exit(1);
}
