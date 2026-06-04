import type { Stats, EnemyTier } from '../../types/definitions';

export const ELITE_STAT_MULTIPLIER = 1.1;

export function hpMultiplier(floor: number): number {
  const rate = floor <= 3 ? 0.06 : 0.12;
  return 1 + floor * rate;
}

export function attackMultiplier(floor: number): number {
  const rate = floor <= 3 ? 0.04 : 0.08;
  return 1 + floor * rate;
}

/** Softer HP ramp for boss fights only (10% per floor after floor 3). */
export function bossHpMultiplier(floor: number): number {
  const rate = floor <= 3 ? 0.06 : 0.10;
  return 1 + floor * rate;
}

export function scaleEnemyHp(baseHp: number, floor: number, tier: EnemyTier = 'normal'): number {
  let hp = Math.floor(baseHp * hpMultiplier(floor));
  if (tier === 'elite') hp = Math.floor(hp * ELITE_STAT_MULTIPLIER);
  return hp;
}

export function scaleEnemyAttack(baseAttack: number, floor: number, tier: EnemyTier = 'normal'): number {
  let atk = Math.floor(baseAttack * attackMultiplier(floor));
  if (tier === 'elite') atk = Math.floor(atk * ELITE_STAT_MULTIPLIER);
  return atk;
}

export function scaleEnemyGold(goldDrop: [number, number], floor: number): [number, number] {
  const mult = 1 + floor * 0.05;
  return [Math.floor(goldDrop[0] * mult), Math.floor(goldDrop[1] * mult)];
}

export function scaleShopPrice(basePrice: number, floor: number): number {
  return Math.floor(basePrice * (1 + floor * 0.06));
}

export function calcHealAmount(maxHp: number, floor: number): number {
  const pct = Math.min(0.5, 0.3 + floor * 0.005);
  return Math.floor(maxHp * pct);
}

export type ThreatLevel = 'low' | 'medium' | 'high';

export function calcThreatLevel(
  playerPower: number,
  enemyHp: number,
  enemyAttack: number,
): ThreatLevel {
  const enemyPower = enemyHp * 0.3 + enemyAttack * 3;
  const ratio = enemyPower / Math.max(1, playerPower);
  if (ratio < 0.7) return 'low';
  if (ratio < 1.2) return 'medium';
  return 'high';
}

export function playerPower(stats: Stats, hp: number): number {
  return hp + stats.attack * 3 + stats.spellPower * 2 + stats.block * 2;
}

export function scaledEnemyStats(
  baseHp: number,
  baseAttack: number,
  floor: number,
  tier: EnemyTier = 'normal',
): { hp: number; attack: number } {
  return {
    hp: scaleEnemyHp(baseHp, floor, tier),
    attack: scaleEnemyAttack(baseAttack, floor, tier),
  };
}

/** Boss fights use softer HP scaling; attack uses normal floor ramp. */
export function scaledBossStats(
  baseHp: number,
  baseAttack: number,
  floor: number,
): { hp: number; attack: number } {
  return {
    hp: Math.floor(baseHp * bossHpMultiplier(floor)),
    attack: scaleEnemyAttack(baseAttack, floor, 'normal'),
  };
}

/** Elite chance when elites are allowed (floors 3+). */
export function eliteChanceForFloor(floor: number): number {
  if (floor <= 2) return 0;
  if (floor <= 5) return 0.15;
  return 0.32;
}
