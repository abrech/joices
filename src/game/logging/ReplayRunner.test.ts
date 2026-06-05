import { describe, expect, it } from 'vitest';
import type { RunRecord } from '../../types/game-state';
import { replayRun } from './ReplayRunner';
import golden from './__fixtures__/golden-replay.json';

describe('golden replay fixture', () => {
  it('replays class, weapon, and first floor pick consistently', () => {
    const state = replayRun(golden as RunRecord);
    expect(state.run.player.classId).toBe('warrior');
    expect(state.run.player.weaponId).toBe('longsword');
    expect(state.run.floor).toBe(1);
    expect(state.run.combat).toBeDefined();
    expect(state.run.combat?.turn).toBe('player');
    expect(state.run.player.stats.strength).toBe(6);
    expect(state.run.player.hp).toBe(state.run.player.stats.maxHp);
    expect(state.run.player.gold).toBe(20);
    expect(state.run.player.skills).toHaveLength(3);
    expect(state.run.runGoldEarned).toBe(0);
  });
});
