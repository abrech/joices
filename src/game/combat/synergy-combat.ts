import type { RunState } from '../../types/game-state';
import type { SynergyBonuses } from '../../types/definitions';
import { computeSynergyBonuses } from '../systems/SynergySystem';
import { getHemophiliaBonuses } from '../systems/SkillSystem';

export function combatSynergyBonuses(
  skills: RunState['player']['skills'],
): SynergyBonuses {
  const bonuses = computeSynergyBonuses(skills);
  const hem = getHemophiliaBonuses(skills);
  if (hem) {
    return { ...bonuses, bleedBonusPerStack: hem.bonusDamagePerStack };
  }
  return bonuses;
}
