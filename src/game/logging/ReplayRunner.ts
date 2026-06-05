import type { GameState, ProfileState, RunRecord } from '../../types/game-state';
import { RUN_LOG_VERSION, createEmptyProfile, createInitialRunState } from '../../types/game-state';
import {
  dispatchAction,
  prepareReplayAfterCombatWin,
  prepareReplayBeforeAction,
} from '../dispatch';

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

    state = prepareReplayBeforeAction(state, action);
    state = dispatchAction(state, action, { drainEnemyPhase: true });
    state = prepareReplayAfterCombatWin(state, action, next);
  }

  return state;
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
