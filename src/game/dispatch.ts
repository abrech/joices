import type { GameState, RunActionPayload } from '../types/game-state';
import type { LootPayload, SkillPickPayload } from '../types/events';
import { getWeapon } from '../content/registries';
import { completeEvent } from './events/EventResolver';
import { purchaseShopItem } from './shop/ShopPurchase';
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
} from './RunCommands';

export interface DispatchOptions {
  /** Batch-resolve enemy phase after player end turn or basic attack (replay/autoplay). */
  drainEnemyPhase?: boolean;
}

function applySkipSkillPick(state: GameState): GameState {
  const { activeEvent } = state.run;
  if (activeEvent?.screen === 'loot') {
    return applySkipLootSkillReward(state);
  }
  const payload = activeEvent?.payload as SkillPickPayload | undefined;
  if (activeEvent?.screen === 'skillPick' && payload?.afterCombatLoot) {
    return applySkipCombatLootSkillPick(state);
  }
  return completeEvent(state, '__skip__');
}

export function dispatchAction(
  state: GameState,
  action: RunActionPayload,
  options: DispatchOptions = {},
): GameState {
  switch (action.kind) {
    case 'selectClass':
      return applySelectClass(state, action.classId);
    case 'selectWeapon':
      return applySelectWeapon(state, action.weaponId);
    case 'pickFloor':
      return applyPickFloor(state, action.index);
    case 'combatAttack': {
      const basicId = getWeapon(state.run.player.weaponId)?.starterAttackId;
      if (!basicId) return state;
      let next = applyCombatEndTurn(applyCombatSkill(state, basicId));
      if (options.drainEnemyPhase) next = drainCombatEnemyPhase(next);
      return next;
    }
    case 'combatSkill':
      return applyCombatSkill(state, action.skillId);
    case 'combatEndTurn': {
      let next = applyCombatEndTurn(state);
      if (options.drainEnemyPhase) next = drainCombatEnemyPhase(next);
      return next;
    }
    case 'claimLoot':
      return applyClaimLoot(state);
    case 'selectSkill': {
      if (state.run.activeEvent?.screen === 'loot') {
        const loot = state.run.activeEvent.payload as LootPayload;
        if (loot.skillChoices?.includes(action.skillId)) {
          return applyLootSkillReward(state, action.skillId);
        }
      }
      return applySelectSkill(state, action.skillId);
    }
    case 'skipSkillPick':
      return applySkipSkillPick(state);
    case 'buyShop':
      return purchaseShopItem(state, action.itemId);
    case 'leaveShop':
      return completeEvent(state, '__leave__');
    case 'confirmHeal':
      return completeEvent(state);
    case 'combatDefeatContinue':
      return completeEvent({ ...state, run: state.run }, undefined, 'lose');
    default:
      return state;
  }
}

/** Open loot UI when replay log expects claim/select after a combat win. */
export function prepareReplayBeforeAction(
  state: GameState,
  action: RunActionPayload,
): GameState {
  if (
    (action.kind === 'claimLoot' || action.kind === 'selectSkill') &&
    needsLootScreenBeforeClaim(state)
  ) {
    return openCombatLoot(state);
  }
  return state;
}

export function prepareReplayAfterCombatWin(
  state: GameState,
  action: RunActionPayload,
  nextAction: RunActionPayload | undefined,
): GameState {
  if (
    (action.kind === 'combatAttack' ||
      action.kind === 'combatSkill' ||
      action.kind === 'combatEndTurn') &&
    state.run.combat?.finished &&
    state.run.combat.result === 'win' &&
    nextAction &&
    (nextAction.kind === 'claimLoot' ||
      nextAction.kind === 'selectSkill' ||
      nextAction.kind === 'skipSkillPick')
  ) {
    return openCombatLoot(state);
  }
  return state;
}
