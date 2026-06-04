import type { PlayerState, ProfileState, RunState } from '../../types/game-state';

export function onRunStart(_profile: ProfileState): Partial<PlayerState> {
  return {};
}

export function onRunEnd(run: RunState, profile: ProfileState): ProfileState {
  const history = profile.runHistory ?? [];
  return {
    ...profile,
    runHistory: [
      ...history,
      {
        floorReached: run.floor,
        classId: run.player.classId,
        victory: run.victory ?? false,
      },
    ],
  };
}
