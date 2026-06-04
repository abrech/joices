import type { PlayerState, ProfileState, RunState } from '../../types/game-state';
import { persistRunEnd } from '../logging/RunLogger';

export function onRunStart(_profile: ProfileState): Partial<PlayerState> {
  return {};
}

export function onRunEnd(run: RunState, profile: ProfileState): ProfileState {
  return persistRunEnd(run, profile);
}
