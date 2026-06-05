import type { GameState } from '../types/game-state';
import { createInitialPacing } from '../types/game-state';
import type { CombatPayload, LootPayload, SkillPickPayload } from '../types/events';
import { createPlayer } from './createPlayer';
import { generateFloorOptions } from './progression/FloorGenerator';
import { beginEvent, completeEvent } from './events/EventResolver';
import {
  useSkill,
  applyCombatStartPassives,
  enemyTurn,
  finishPlayerTurn,
} from './combat/CombatEngine';
import { rollCombatLoot, lootToEffects } from './loot/LootRoller';
import { applyEffects } from './effects/EffectApplier';
import { initRunLogOnWeaponSelect } from './logging/RunLogger';

export function applySelectClass(state: GameState, classId: string): GameState {
  if (state.run.phase !== 'classSelect') return state;
  return {
    ...state,
    run: {
      ...state.run,
      phase: 'weaponSelect',
      player: { ...state.run.player, classId },
    },
  };
}

export function applySelectWeapon(state: GameState, weaponId: string): GameState {
  if (state.run.phase !== 'weaponSelect') return state;
  const { classId } = state.run.player;
  const player = createPlayer(classId, weaponId, state.profile);
  let run: import('../types/game-state').RunState = {
    ...state.run,
    player,
    phase: 'floorChoice',
    floor: 1,
    pacing: createInitialPacing(),
  };
  run = initRunLogOnWeaponSelect(run);
  run.floorOptions = generateFloorOptions(run);
  return { ...state, run };
}

export function applyPickFloor(state: GameState, index: number): GameState {
  if (state.run.phase !== 'floorChoice') return state;
  const option = state.run.floorOptions[index];
  if (!option) return state;

  let next = beginEvent(state, option.eventId, option.payload);
  if (next.run.combat) {
    next = { ...next, run: applyCombatStartPassives(next.run) };
  }
  return next;
}

const MAX_ENEMY_DRAIN_STEPS = 48;

export function drainCombatEnemyPhase(state: GameState): GameState {
  let { run } = state;
  let steps = 0;

  while (run.combat && !run.combat.finished && run.combat.turn === 'enemy') {
    if (++steps > MAX_ENEMY_DRAIN_STEPS) break;

    const prevIdx = run.combat.enemyPhaseIndex;
    const prevTurn = run.combat.turn;
    run = enemyTurn(run);

    if (
      run.combat &&
      !run.combat.finished &&
      run.combat.turn === prevTurn &&
      run.combat.enemyPhaseIndex === prevIdx &&
      steps > 1
    ) {
      break;
    }
  }
  return { ...state, run };
}

export function openCombatLoot(state: GameState): GameState {
  const run = state.run;
  const active = run.activeEvent;
  const combatPayload = (active?.eventPayload ?? active?.payload) as CombatPayload;
  let next: GameState = { ...state, run: { ...run, combat: undefined } };
  const { loot, state: afterRoll } = rollCombatLoot(next, combatPayload);
  next = afterRoll;

  const combatPayloadStored = active?.eventPayload ?? active?.payload;
  return {
    ...next,
    run: {
      ...next.run,
      activeEvent: active
        ? {
            eventId: active.eventId,
            screen: 'loot' as const,
            payload: loot,
            eventPayload: combatPayloadStored,
          }
        : undefined,
    },
  };
}

export function applyCombatSkill(state: GameState, skillId: string): GameState {
  const run = useSkill(state.run, skillId);
  if (run === state.run) return state;
  return { ...state, run };
}

export function applyCombatEndTurn(state: GameState): GameState {
  const run = finishPlayerTurn(state.run);
  if (run === state.run) return state;
  return { ...state, run };
}

function finishLootWithoutSkill(state: GameState): GameState {
  return completeEvent(state, undefined, 'win');
}

export function applyClaimLoot(state: GameState): GameState {
  const { activeEvent } = state.run;
  if (!activeEvent || activeEvent.screen !== 'loot') return state;

  const loot = activeEvent.payload as LootPayload;

  let next = applyEffects(state, lootToEffects(loot.items));

  if (loot.skillChoices && loot.skillChoices.length >= 2) {
    const combatPayload = activeEvent.eventPayload ?? activeEvent.payload;
    return {
      ...next,
      run: {
        ...next.run,
        activeEvent: {
          eventId: activeEvent.eventId,
          screen: 'skillPick',
          payload: {
            label: 'Choose an attack or passive reward',
            skills: loot.skillChoices,
            allowSkip: true,
            afterCombatLoot: true,
          } satisfies SkillPickPayload,
          eventPayload: combatPayload,
        },
      },
    };
  }

  return finishLootWithoutSkill(next);
}

/** Collect loot items and advance without taking a combat skill reward. */
export function applySkipLootSkillReward(state: GameState): GameState {
  const { activeEvent } = state.run;
  if (!activeEvent || activeEvent.screen !== 'loot') return state;

  const loot = activeEvent.payload as LootPayload;
  let next = applyEffects(state, lootToEffects(loot.items));
  return finishLootWithoutSkill(next);
}

/** Skip skill pick after loot was already claimed (legacy skillPick step). */
export function applySkipCombatLootSkillPick(state: GameState): GameState {
  const { activeEvent } = state.run;
  const payload = activeEvent?.payload as SkillPickPayload | undefined;
  if (activeEvent?.screen !== 'skillPick' || !payload?.afterCombatLoot) return state;
  return finishLootWithoutSkill(state);
}

export function applyLootSkillReward(state: GameState, skillId: string): GameState {
  const { activeEvent } = state.run;
  if (!activeEvent || activeEvent.screen !== 'loot') return state;

  const loot = activeEvent.payload as LootPayload;
  if (!loot.skillChoices?.includes(skillId)) return state;

  let next = applyEffects(state, lootToEffects(loot.items));
  next = applyEffects(next, [{ type: 'addSkill', skillId }]);
  return completeEvent(next, undefined, 'win');
}

export function applySelectSkill(state: GameState, skillId: string): GameState {
  const { activeEvent } = state.run;
  const payload = activeEvent?.payload as SkillPickPayload | undefined;
  if (activeEvent?.screen === 'skillPick' && payload?.afterCombatLoot) {
    let next = applyEffects(state, [{ type: 'addSkill', skillId }]);
    return completeEvent(next, undefined, 'win');
  }
  return completeEvent(state, skillId);
}

export function needsLootScreenBeforeClaim(state: GameState): boolean {
  const { combat, activeEvent } = state.run;
  return (
    !!combat?.finished &&
    combat.result === 'win' &&
    activeEvent?.screen !== 'loot'
  );
}
