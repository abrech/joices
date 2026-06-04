import type { ProfileState, PlayerState } from '../types/game-state';
import { getClass, getWeapon } from '../content/registries';
import { calculateStats } from './systems/StatCalculator';
import { onRunStart } from './profile/RunLifecycle';

export function createPlayer(
  classId: string,
  weaponId: string,
  profile?: ProfileState,
): PlayerState {
  const classDef = getClass(classId);
  const weaponDef = getWeapon(weaponId);
  if (!classDef || !weaponDef) {
    throw new Error('Invalid class or weapon');
  }

  const skills: { id: string; level: number }[] = [];
  if (classDef.starterPassiveId) {
    skills.push({ id: classDef.starterPassiveId, level: 1 });
  }

  const base: PlayerState = {
    classId,
    weaponId,
    hp: 0,
    gold: 20,
    skills,
    stats: { maxHp: 0, attack: 0, critChance: 0, block: 0, spellPower: 0 },
    activeSynergyIds: [],
  };

  const bonuses = profile ? onRunStart(profile) : {};
  const merged = { ...base, ...bonuses, skills: bonuses.skills ?? base.skills };

  const { stats, activeSynergyIds } = calculateStats(merged, profile);
  return { ...merged, stats, hp: stats.maxHp, activeSynergyIds };
}

export function isContentUnlocked(
  unlockRequirement: string | undefined,
  _profile: ProfileState,
): boolean {
  if (!unlockRequirement) return true;
  return true;
}
