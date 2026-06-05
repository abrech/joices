import { describe, expect, it } from 'vitest';
import { createEmptyProfile, createInitialRunState } from '../../types/game-state';
import { createPlayer } from '../createPlayer';
import { applyEffects } from './EffectApplier';

describe('modifyStat via applyEffects', () => {
  it('persists shop strength bonus after clamp', () => {
    const player = createPlayer('warrior', 'longsword');
    let run = {
      ...createInitialRunState(1),
      player,
      phase: 'event' as const,
      floor: 2,
    };
    const state = { run, profile: createEmptyProfile() };
    const next = applyEffects(state, [{ type: 'modifyStat', stat: 'strength', delta: 2 }]);
    expect(next.run.player.stats.strength).toBe(player.stats.strength + 2);
  });
});
