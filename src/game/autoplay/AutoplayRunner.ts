import type { GameState, RunActionPayload, RunRecord } from '../../types/game-state';
import { createEmptyProfile, createInitialRunState } from '../../types/game-state';
import type { LootPayload, ShopPayload, SkillPickPayload } from '../../types/events';
import { appendAction, buildRunRecord } from '../logging/RunLogger';
import { assertReplayMatches, replayRun } from '../logging/ReplayRunner';
import { MemoryProfileStore, setProfileStore } from '../profile/ProfileStore';
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
} from '../RunCommands';
import { completeEvent } from '../events/EventResolver';
import { purchaseShopItem } from '../shop/ShopPurchase';
import type { AutoplayPolicy, AutoplayPolicyName } from './policy';
import { getPolicy } from './policy';
import {
  computeMetrics,
  fingerprint,
  type AutoplayRunMetrics,
  type StuckReason,
} from './runMetrics';

const MAX_STEPS_PER_RUN = 8000;
const MAX_SHOP_BUYS_PER_VISIT = 12;
const MAX_COMBAT_LOOP = 500;
const MAX_SKILL_CASTS_PER_PHASE = 32;
const MAX_COMBAT_STALE_HP_ROUNDS = 12;

/** Persists across step() calls so stale-HP detection is not reset every resolveCombat entry. */
let combatStaleSession: string | null = null;
let combatStaleHp: number | null = null;
let combatStaleRounds = 0;

function resetCombatStaleTracking(): void {
  combatStaleSession = null;
  combatStaleHp = null;
  combatStaleRounds = 0;
}

function updateCombatStaleTracking(state: GameState): boolean {
  const combat = state.run.combat;
  if (!combat || combat.finished) {
    resetCombatStaleTracking();
    return false;
  }

  const session = combat.enemies.map((e) => e.instanceId).join('|');
  const enemyHp = totalEnemyHp(state);

  if (combatStaleSession !== session) {
    combatStaleSession = session;
    combatStaleHp = enemyHp;
    combatStaleRounds = 0;
    return false;
  }

  if (combatStaleHp === enemyHp) combatStaleRounds++;
  else {
    combatStaleHp = enemyHp;
    combatStaleRounds = 0;
  }

  return combatStaleRounds >= MAX_COMBAT_STALE_HP_ROUNDS;
}

function commit(state: GameState, action?: RunActionPayload): GameState {
  const run = action ? appendAction(state.run, action) : state.run;
  return { ...state, run };
}

function spendPlayerPhase(state: GameState, policy: AutoplayPolicy): GameState | null {
  let current = state;
  let progressed = false;
  let casts = 0;

  while (current.run.combat?.turn === 'player' && !current.run.combat.finished) {
    if (casts >= MAX_SKILL_CASTS_PER_PHASE) break;

    const skillId = policy.selectCombatSkill(current);
    if (!skillId) break;

    const next = applyCombatSkill(current, skillId);
    if (next === current || next.run === current.run) break;

    current = commit(next, { kind: 'combatSkill', skillId });
    casts++;
    progressed = true;
  }

  if (!current.run.combat || current.run.combat.finished) {
    return progressed || current !== state ? current : null;
  }
  if (current.run.combat.turn !== 'player') {
    return progressed || current !== state ? current : null;
  }

  const ended = applyCombatEndTurn(current);
  if (ended === current) return null;

  current = commit(ended, { kind: 'combatEndTurn' });
  return drainCombatEnemyPhase(current);
}

function totalEnemyHp(state: GameState): number {
  return state.run.combat?.enemies.reduce((sum, e) => sum + e.hp, 0) ?? 0;
}

function resolveCombat(state: GameState, policy: AutoplayPolicy): GameState {
  let current = state;
  let loops = 0;

  while (current.run.combat && !current.run.combat.finished && loops < MAX_COMBAT_LOOP) {
    loops++;
    if (updateCombatStaleTracking(current)) break;

    if (current.run.combat.turn === 'player') {
      const before = fingerprint(current);
      const next = spendPlayerPhase(current, policy);
      if (!next) break;
      current = next;
      if (!current.run.combat?.finished && fingerprint(current) === before) break;
    } else {
      current = drainCombatEnemyPhase(current);
    }
  }

  if (current.run.combat?.finished) {
    resetCombatStaleTracking();
  }

  if (current.run.combat?.finished && current.run.combat.result === 'lose') {
    return commit(completeEvent({ ...current, run: current.run }, undefined, 'lose'), {
      kind: 'combatDefeatContinue',
    });
  }

  return current;
}

function handleLoot(state: GameState, policy: AutoplayPolicy): GameState {
  let current = state;
  if (needsLootScreenBeforeClaim(current)) {
    current = openCombatLoot(current);
  }

  const loot = current.run.activeEvent?.payload as LootPayload | undefined;
  if (!loot) return current;

  if (loot.skillChoices && loot.skillChoices.length >= 2) {
    const action = policy.selectSkillReward(current, loot.skillChoices, 'loot');
    if (action.type === 'skip') {
      return commit(applySkipLootSkillReward(current), { kind: 'skipSkillPick' });
    }
    const next = applyLootSkillReward(current, action.skillId);
    if (next === current) return tryEscape(current, policy) ?? current;
    return commit(next, { kind: 'selectSkill', skillId: action.skillId });
  }

  const next = applyClaimLoot(current);
  if (next === current) return tryEscape(current, policy) ?? current;
  return commit(next, { kind: 'claimLoot' });
}

function handleSkillPick(state: GameState, policy: AutoplayPolicy): GameState {
  const payload = state.run.activeEvent?.payload as SkillPickPayload | undefined;
  if (!payload?.skills.length) {
    return commit(completeEvent(state, '__skip__'), { kind: 'skipSkillPick' });
  }

  const context = payload.afterCombatLoot ? 'loot' : 'training';
  const action = policy.selectSkillReward(state, payload.skills, context);

  if (action.type === 'skip') {
    if (payload.afterCombatLoot) {
      return commit(applySkipCombatLootSkillPick(state), { kind: 'skipSkillPick' });
    }
    return commit(completeEvent(state, '__skip__'), { kind: 'skipSkillPick' });
  }

  const next = applySelectSkill(state, action.skillId);
  if (next === state) return tryEscape(state, policy) ?? state;
  return commit(next, { kind: 'selectSkill', skillId: action.skillId });
}

function handleShop(state: GameState, policy: AutoplayPolicy): GameState {
  let current = state;

  for (let i = 0; i < MAX_SHOP_BUYS_PER_VISIT; i++) {
    const payload = current.run.activeEvent?.payload as ShopPayload | undefined;
    if (!payload?.items.length) break;

    const action = policy.selectShopAction(
      current,
      payload.items.map((it) => it.id),
    );

    if (action.type === 'leave') {
      return commit(completeEvent(current, '__leave__'), { kind: 'leaveShop' });
    }

    const next = purchaseShopItem(current, action.itemId);
    if (next === current) continue;

    current = commit(next, { kind: 'buyShop', itemId: action.itemId });
  }

  const payload = current.run.activeEvent?.payload as ShopPayload | undefined;
  if (payload?.items.length) {
    return commit(completeEvent(current, '__leave__'), { kind: 'leaveShop' });
  }

  return current;
}

function tryEscape(state: GameState, _policy: AutoplayPolicy): GameState | null {
  const { phase, activeEvent, combat, floorOptions } = state.run;

  if (combat && !combat.finished && combat.turn === 'player') {
    const escaped = spendPlayerPhase(state, _policy);
    if (escaped && escaped !== state) return escaped;
  }

  if (activeEvent?.screen === 'shop') {
    const left = commit(completeEvent(state, '__leave__'), { kind: 'leaveShop' });
    if (left !== state) return left;
  }

  if (activeEvent?.screen === 'loot') {
    const loot = activeEvent.payload as LootPayload;
    if (loot.skillChoices && loot.skillChoices.length >= 2) {
      const next = commit(applySkipLootSkillReward(state), { kind: 'skipSkillPick' });
      if (next !== state) return next;
    }
    const next = commit(applyClaimLoot(state), { kind: 'claimLoot' });
    if (next !== state) return next;
  }

  if (activeEvent?.screen === 'skillPick') {
    const payload = activeEvent.payload as SkillPickPayload;
    if (payload.afterCombatLoot) {
      const next = commit(applySkipCombatLootSkillPick(state), { kind: 'skipSkillPick' });
      if (next !== state) return next;
    }
    const next = commit(completeEvent(state, '__skip__'), { kind: 'skipSkillPick' });
    if (next !== state) return next;
  }

  if (activeEvent?.screen === 'heal') {
    const next = commit(completeEvent(state), { kind: 'confirmHeal' });
    if (next !== state) return next;
  }

  if (phase === 'floorChoice' && floorOptions.length > 0) {
    const idx = 0;
    const option = floorOptions[idx];
    const next = commit(applyPickFloor(state, idx), {
      kind: 'pickFloor',
      index: idx,
      eventId: option.eventId,
    });
    if (next !== state) return next;
  }

  return null;
}

function stepEvent(state: GameState, policy: AutoplayPolicy): GameState {
  const { combat, activeEvent } = state.run;

  if (combat?.finished && combat.result === 'win') {
    return handleLoot(state, policy);
  }

  if (combat && !combat.finished) {
    return resolveCombat(state, policy);
  }

  if (!activeEvent) return state;

  switch (activeEvent.screen) {
    case 'loot':
      return handleLoot(state, policy);
    case 'skillPick':
      return handleSkillPick(state, policy);
    case 'shop':
      return handleShop(state, policy);
    case 'heal':
      return commit(completeEvent(state), { kind: 'confirmHeal' });
    case 'combat':
      return resolveCombat(state, policy);
    default:
      return state;
  }
}

function inferStuckReason(before: string, after: string, state: GameState): StuckReason {
  if (state.run.combat) return 'combat_no_progress';
  if (state.run.activeEvent?.screen === 'shop') return 'shop_no_progress';
  if (state.run.phase === 'event') return 'event_no_progress';
  if (before === after) return 'unknown';
  return 'unknown';
}

function step(state: GameState, policy: AutoplayPolicy): GameState {
  const { phase, floorOptions } = state.run;

  switch (phase) {
    case 'classSelect': {
      const classId = policy.selectClass(state);
      return commit(applySelectClass(state, classId), { kind: 'selectClass', classId });
    }
    case 'weaponSelect': {
      const weaponId = policy.selectWeapon(state);
      return commit(applySelectWeapon(state, weaponId), { kind: 'selectWeapon', weaponId });
    }
    case 'floorChoice': {
      if (!floorOptions.length) return state;
      const index = policy.selectFloorIndex(state);
      const option = floorOptions[index] ?? floorOptions[0];
      return commit(applyPickFloor(state, index), {
        kind: 'pickFloor',
        index,
        eventId: option.eventId,
      });
    }
    case 'event':
      return stepEvent(state, policy);
    case 'gameOver':
      return state;
    default:
      return state;
  }
}

export interface AutoplayRunResult {
  record: RunRecord | null;
  steps: number;
  stuck: boolean;
  stuckReason?: StuckReason;
  metrics: AutoplayRunMetrics;
  finalState: GameState;
}

export interface AutoplayBatchOptions {
  runs: number;
  policy?: AutoplayPolicyName;
  baseSeed?: number;
  verifyReplay?: boolean;
}

export interface AutoplayBatchResult {
  records: RunRecord[];
  results: AutoplayRunResult[];
  stuckRuns: number;
  replayFailures: number;
}

export function runSingleAutoplay(
  seed: number,
  policy: AutoplayPolicy = getPolicy('greedy'),
  profile = createEmptyProfile(),
  verifyReplay = true,
): AutoplayRunResult {
  let state: GameState = {
    run: createInitialRunState(seed),
    profile,
  };

  let steps = 0;
  let stuck = false;
  let stuckReason: StuckReason | undefined;

  while (state.run.phase !== 'gameOver' && steps < MAX_STEPS_PER_RUN) {
    const before = fingerprint(state);
    state = step(state, policy);
    steps++;

    if (state.run.phase === 'gameOver') break;

    const after = fingerprint(state);
    if (before === after) {
      const escaped = tryEscape(state, policy);
      if (escaped && escaped !== state) {
        state = escaped;
        continue;
      }
      stuck = true;
      stuckReason = inferStuckReason(before, after, state);
      break;
    }
  }

  if (state.run.phase !== 'gameOver') {
    stuck = true;
    stuckReason = stuckReason ?? 'max_steps';
  }

  const record = buildRunRecord(state.run);
  let replayOk: boolean | undefined;
  let replayDiffs: string[] | undefined;

  if (verifyReplay && record) {
    const replayed = replayRun(record, profile);
    const check = assertReplayMatches(state, replayed);
    replayOk = check.ok;
    replayDiffs = check.diffs;
  }

  const metrics = computeMetrics(state, state.run.actionLog ?? [], {
    stuck,
    stuckReason,
    replayOk,
    replayDiffs,
  });

  return { record, steps, stuck, stuckReason, metrics, finalState: state };
}

export function configureHeadlessProfileStore(): MemoryProfileStore {
  const store = new MemoryProfileStore();
  setProfileStore(store);
  return store;
}

export function runAutoplayBatch(options: AutoplayBatchOptions): AutoplayBatchResult {
  const policy = getPolicy(options.policy ?? 'greedy');
  const baseSeed = options.baseSeed ?? Date.now();
  const verifyReplay = options.verifyReplay ?? true;

  const records: RunRecord[] = [];
  const results: AutoplayRunResult[] = [];
  let stuckRuns = 0;
  let replayFailures = 0;

  for (let i = 0; i < options.runs; i++) {
    const profile = createEmptyProfile();
    const result = runSingleAutoplay(baseSeed + i, policy, profile, verifyReplay);
    results.push(result);
    if (result.stuck) stuckRuns++;
    if (result.metrics.replayOk === false) replayFailures++;
    if (result.record) records.push(result.record);
  }

  return { records, results, stuckRuns, replayFailures };
}
