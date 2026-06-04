import type {
  ProfileState,
  RunAction,
  RunActionPayload,
  RunRecord,
  RunState,
} from '../../types/game-state';
import {
  MAX_STORED_RUN_LOGS,
  RUN_LOG_VERSION,
} from '../../types/game-state';
import { profileStore } from '../profile/ProfileStore';

export function appendAction(run: RunState, payload: RunActionPayload): RunState {
  const actionLog = run.actionLog ?? [];
  const action: RunAction = {
    ...payload,
    seq: actionLog.length,
    rngStateAfter: run.rngState,
  };
  return { ...run, actionLog: [...actionLog, action] };
}

export function initRunLogOnWeaponSelect(run: RunState): RunState {
  return {
    ...run,
    runLogId: run.runLogId ?? crypto.randomUUID(),
    runStartedAt: run.runStartedAt ?? Date.now(),
    actionLog: run.actionLog ?? [],
  };
}

export function buildRunRecord(run: RunState): RunRecord | null {
  if (!run.runLogId || !run.runStartedAt) return null;
  return {
    id: run.runLogId,
    logVersion: RUN_LOG_VERSION,
    startedAt: run.runStartedAt,
    endedAt: Date.now(),
    rngSeed: run.rngSeed,
    finalRngState: run.rngState,
    classId: run.player.classId,
    weaponId: run.player.weaponId,
    floorReached: run.floor,
    runGoldEarned: run.runGoldEarned,
    victory: run.victory ?? false,
    skills: run.player.skills.map((s) => ({ id: s.id, level: s.level })),
    actions: run.actionLog ?? [],
  };
}

export function saveRunRecord(profile: ProfileState, record: RunRecord): ProfileState {
  const runLogs = [record, ...(profile.runLogs ?? [])].slice(0, MAX_STORED_RUN_LOGS);
  return { ...profile, runLogs };
}

export function persistRunEnd(run: RunState, profile: ProfileState): ProfileState {
  const record = buildRunRecord(run);
  if (!record) return profile;
  const updated = saveRunRecord(profile, record);
  profileStore.save(updated);
  return updated;
}
