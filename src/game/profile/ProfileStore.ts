import type { ProfileState } from '../../types/game-state';
import { PROFILE_VERSION } from '../../types/game-state';

const STORAGE_KEY = 'joices-profile';

export interface ProfileStore {
  load(): ProfileState;
  save(profile: ProfileState): void;
}

export class LocalProfileStore implements ProfileStore {
  load(): ProfileState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: PROFILE_VERSION };
      const parsed = JSON.parse(raw) as ProfileState;
      if (parsed.version !== PROFILE_VERSION) return { version: PROFILE_VERSION };
      return parsed;
    } catch {
      return { version: PROFILE_VERSION };
    }
  }

  save(profile: ProfileState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
}

export const profileStore = new LocalProfileStore();
