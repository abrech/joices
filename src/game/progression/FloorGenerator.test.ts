import { describe, expect, it } from 'vitest';
import { createInitialPacing, createInitialRunState } from '../../types/game-state';
import { createPlayer } from '../createPlayer';
import { generateFloorOptions } from './FloorGenerator';

describe('generateFloorOptions', () => {
  it('offers training on floor 2 with fixed seed', () => {
    const player = createPlayer('warrior', 'longsword');
    let run = {
      ...createInitialRunState(42),
      phase: 'floorChoice' as const,
      floor: 2,
      player,
      pacing: createInitialPacing(),
    };
    run.floorOptions = generateFloorOptions(run);
    const eventIds = run.floorOptions.map((o) => o.eventId);
    expect(eventIds.length).toBeGreaterThan(0);
    expect(eventIds.some((id) => ['enemy', 'skill-training', 'shop', 'heal'].includes(id))).toBe(
      true,
    );
  });
});
