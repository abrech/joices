import { describe, expect, it } from 'vitest';
import { calculateStats } from './StatCalculator';

describe('calculateStats', () => {
  it('adds class and weapon bonuses on zero baseline', () => {
    const { stats } = calculateStats({
      classId: 'warrior',
      weaponId: 'longsword',
      skills: [{ id: 'thick-skin', level: 1 }],
    });
    expect(stats.maxHp).toBe(50 + 70 + 12);
    expect(stats.strength).toBe(3 + 3);
    expect(stats.block).toBe(3 + 3);
  });

  it('clamps critChance at 0.75', () => {
    const { stats } = calculateStats({
      classId: 'rogue',
      weaponId: 'twin-daggers',
      skills: [
        { id: 'keen-eye', level: 3 },
        { id: 'thick-skin', level: 1 },
      ],
    });
    expect(stats.critChance).toBeLessThanOrEqual(0.75);
    expect(stats.strength).toBeGreaterThanOrEqual(0);
  });

  it('applies spellBonus synergy on spell stat', () => {
    const { stats, activeSynergyIds } = calculateStats({
      classId: 'mage',
      weaponId: 'arcane-staff',
      skills: [
        { id: 'arcane-battery', level: 1 },
        { id: 'staff-fireball', level: 1 },
        { id: 'arcane-bolt', level: 1 },
      ],
    });
    expect(activeSynergyIds.length).toBeGreaterThan(0);
    expect(stats.spell).toBeGreaterThan(5 + 4);
  });
});
