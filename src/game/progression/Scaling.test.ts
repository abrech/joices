import { describe, expect, it } from 'vitest';
import { playerPower, scaledBossStats, scaledEnemyStats } from './Scaling';

describe('Scaling', () => {
  it('boss and normal scaling differ on boss floor', () => {
    const floor = 10;
    const baseHp = 135;
    const baseAtk = 15;
    const normal = scaledEnemyStats(baseHp, baseAtk, floor, 'normal');
    const boss = scaledBossStats(baseHp, baseAtk, floor);
    expect(boss.hp).not.toBe(normal.hp);
  });

  it('playerPower uses strength spell and block', () => {
    const power = playerPower(
      {
        maxHp: 100,
        strength: 6,
        critChance: 0,
        block: 3,
        spell: 0,
        maxMana: 5,
        manaRegen: 1,
      },
      80,
    );
    expect(power).toBe(80 + 6 * 3 + 0 * 2 + 3 * 2);
  });
});
