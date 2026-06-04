import type { ProfileState } from '../../types/game-state';
import { PROFILE_VERSION, RUN_LOG_VERSION } from '../../types/game-state';

const STORAGE_KEY = 'joices-profile';

export interface ProfileStore {
  load(): ProfileState;
  save(profile: ProfileState): void;
}

function migrateProfile(parsed: ProfileState): ProfileState {
  if (parsed.version === PROFILE_VERSION) return parsed;

  if (parsed.version === 1) {
    const runLogs = (parsed.runHistory ?? []).map((h, i) => ({
      id: `legacy-${i}-${h.classId}`,
      logVersion: RUN_LOG_VERSION as typeof RUN_LOG_VERSION,
      startedAt: 0,
      endedAt: 0,
      rngSeed: 0,
      finalRngState: 0,
      classId: h.classId,
      weaponId: '',
      floorReached: h.floorReached,
      runGoldEarned: 0,
      victory: h.victory,
      skills: [],
      actions: [],
    }));
    return {
      ...parsed,
      version: PROFILE_VERSION,
      runLogs,
      runHistory: undefined,
    };
  }

  return { version: PROFILE_VERSION };
}

export class LocalProfileStore implements ProfileStore {
  load(): ProfileState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: PROFILE_VERSION };
      const parsed = JSON.parse(raw) as ProfileState;
      return migrateProfile(parsed);
    } catch {
      return { version: PROFILE_VERSION };
    }
  }

  save(profile: ProfileState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
}

export const profileStore = new LocalProfileStore();
