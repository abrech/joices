import { describe, expect, it } from 'vitest';
import type { CombatContext } from './CombatContext';
import { counterDamage, physicalDamage, spellDamage } from './skill-damage';

function mockCtx(overrides: Partial<CombatContext> = {}): CombatContext {
  return {
    run: {} as CombatContext['run'],
    combat: {} as CombatContext['combat'],
    player: {
      classId: 'warrior',
      weaponId: 'longsword',
      hp: 100,
      gold: 0,
      skills: [],
      stats: {
        maxHp: 100,
        strength: 6,
        critChance: 0.05,
        block: 3,
        spell: 0,
        maxMana: 5,
        manaRegen: 1,
      },
      activeSynergyIds: [],
    },
    synergies: {},
    skillLevel: () => 1,
    ...overrides,
  };
}

describe('physicalDamage', () => {
  it('adds base and strength', () => {
    const ctx = mockCtx();
    expect(physicalDamage(ctx, 1, [3, 4, 5])).toBe(9);
  });

  it('applies damageMultiplier synergy', () => {
    const ctx = mockCtx({ synergies: { damageMultiplier: 1.1 } });
    expect(physicalDamage(ctx, 1, [3, 4, 5])).toBe(Math.floor(9 * 1.1));
  });

  it('floors at zero', () => {
    const ctx = mockCtx({
      player: {
        ...mockCtx().player,
        stats: { ...mockCtx().player.stats, strength: 0 },
      },
    });
    expect(physicalDamage(ctx, 1, [0, 0, 0])).toBe(0);
  });
});

describe('spellDamage', () => {
  it('adds base and spell', () => {
    const ctx = mockCtx({
      player: {
        ...mockCtx().player,
        stats: { ...mockCtx().player.stats, spell: 9 },
      },
    });
    expect(spellDamage(ctx, 2, [1, 2, 3])).toBe(11);
  });
});

describe('counterDamage', () => {
  it('applies damageMultiplier synergy', () => {
    const ctx = mockCtx({ synergies: { damageMultiplier: 1.1 } });
    expect(counterDamage(ctx, 2, [0, 2, 4])).toBe(Math.floor(8 * 1.1));
  });
});
