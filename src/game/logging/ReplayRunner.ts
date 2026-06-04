import type { GameState, ProfileState, RunAction, RunRecord } from '../../types/game-state';
import { RUN_LOG_VERSION, createEmptyProfile, createInitialRunState } from '../../types/game-state';
import type { SkillPickPayload } from '../../types/events';
import { getWeapon } from '../../content/registries';
import type { LootPayload } from '../../types/events';
import {
  applyClaimLoot,
  applyCombatSkill,
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
} from '../RunCommands';
import { completeEvent } from '../events/EventResolver';
import { purchaseShopItem } from '../shop/ShopPurchase';

export function replayRun(record: RunRecord, profile?: ProfileState): GameState {
  if (record.logVersion !== RUN_LOG_VERSION) {
    throw new Error(`Unsupported run log version: ${record.logVersion}`);
  }

  let state: GameState = {
    run: createInitialRunState(record.rngSeed),
    profile: profile ?? createEmptyProfile(),
  };

  for (let i = 0; i < record.actions.length; i++) {
    const action = record.actions[i];
    const next = record.actions[i + 1];

    if (
      (action.kind === 'claimLoot' || action.kind === 'selectSkill') &&
      needsLootScreenBeforeClaim(state)
    ) {
      state = openCombatLoot(state);
    }

    state = applyReplayAction(state, action);

    if (
      (action.kind === 'combatAttack' || action.kind === 'combatSkill') &&
      state.run.combat?.finished &&
      state.run.combat.result === 'win' &&
      next &&
      (next.kind === 'claimLoot' ||
        next.kind === 'selectSkill' ||
        next.kind === 'skipSkillPick')
    ) {
      state = openCombatLoot(state);
    }
  }

  return state;
}

function applySkipSkillPickReplay(state: GameState): GameState {
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

function applyReplayAction(state: GameState, action: RunAction): GameState {
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
      return drainCombatEnemyPhase(applyCombatSkill(state, basicId));
    }
    case 'combatSkill':
      return drainCombatEnemyPhase(applyCombatSkill(state, action.skillId));
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
      return applySkipSkillPickReplay(state);
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

export function assertReplayMatches(
  original: GameState,
  replayed: GameState,
): { ok: boolean; diffs: string[] } {
  const diffs: string[] = [];
  const o = original.run;
  const r = replayed.run;

  if (o.floor !== r.floor) diffs.push(`floor: ${o.floor} vs ${r.floor}`);
  if (o.runGoldEarned !== r.runGoldEarned) {
    diffs.push(`runGoldEarned: ${o.runGoldEarned} vs ${r.runGoldEarned}`);
  }
  if (o.player.hp !== r.player.hp) diffs.push(`hp: ${o.player.hp} vs ${r.player.hp}`);
  if (o.player.gold !== r.player.gold) diffs.push(`gold: ${o.player.gold} vs ${r.player.gold}`);
  if (o.player.skills.length !== r.player.skills.length) {
    diffs.push(`skill count: ${o.player.skills.length} vs ${r.player.skills.length}`);
  } else {
    for (let i = 0; i < o.player.skills.length; i++) {
      const a = o.player.skills[i];
      const b = r.player.skills[i];
      if (a.id !== b.id || a.level !== b.level) {
        diffs.push(`skill[${i}]: ${a.id} Lv${a.level} vs ${b?.id} Lv${b?.level}`);
      }
    }
  }
  if ((o.victory ?? false) !== (r.victory ?? false)) {
    diffs.push(`victory: ${o.victory} vs ${r.victory}`);
  }

  return { ok: diffs.length === 0, diffs };
}
