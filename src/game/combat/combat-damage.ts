import type { StatusInstance } from '../../types/game-state';
import type { SynergyBonuses } from '../../types/definitions';
import { getToxicBloodBonuses } from '../systems/SkillSystem';

const MARK_POISON_MULT = 1.5;

export function rollCritDamage(
  baseDamage: number,
  critChance: number,
  rngValue: number,
): { damage: number; crit: boolean } {
  if (baseDamage <= 0) return { damage: 0, crit: false };
  const crit = rngValue < critChance;
  return {
    damage: crit ? Math.floor(baseDamage * 1.5) : baseDamage,
    crit,
  };
}

export function getPoisonTickMultiplier(
  enemyStatuses: StatusInstance[],
  synergies: SynergyBonuses,
  skills: { id: string; level: number }[],
): number {
  let mult = 1;
  if (synergies.poisonMultiplier) mult *= synergies.poisonMultiplier;
  const toxic = getToxicBloodBonuses(skills);
  if (toxic) mult *= toxic.poisonDamageMultiplier;
  if (enemyStatuses.some((s) => s.type === 'mark')) mult *= MARK_POISON_MULT;
  return mult;
}
