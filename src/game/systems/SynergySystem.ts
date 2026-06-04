import type { SynergyBonuses } from '../../types/definitions';
import { getAllSynergies, getSkill } from '../../content/registries';

export function getOwnedSkillTags(ownedSkills: { id: string; level: number }[]): string[] {
  const tags: string[] = [];
  for (const owned of ownedSkills) {
    const skill = getSkill(owned.id);
    if (skill) tags.push(...skill.tags);
  }
  return tags;
}

export function getActiveSynergies(ownedSkills: { id: string; level: number }[]): string[] {
  const tags = getOwnedSkillTags(ownedSkills);
  const active: string[] = [];

  for (const synergy of getAllSynergies()) {
    const count = synergy.requiredTags.reduce((total, tag) => {
      return total + tags.filter((t) => t === tag).length;
    }, 0);
    if (count >= synergy.minCount) {
      active.push(synergy.id);
    }
  }

  return active;
}

export function computeSynergyBonuses(
  ownedSkills: { id: string; level: number }[],
): SynergyBonuses {
  const tags = getOwnedSkillTags(ownedSkills);
  const skillLevels = Object.fromEntries(ownedSkills.map((s) => [s.id, s.level]));
  let bonuses: SynergyBonuses = {};

  for (const synergy of getAllSynergies()) {
    const count = synergy.requiredTags.reduce((total, tag) => {
      return total + tags.filter((t) => t === tag).length;
    }, 0);
    if (count >= synergy.minCount) {
      const effect = synergy.effect({ ownedSkillTags: tags, skillLevels });
      bonuses = { ...bonuses, ...effect };
    }
  }

  return bonuses;
}

export function detectNewSynergy(
  prevIds: string[],
  newIds: string[],
): string | undefined {
  const added = newIds.find((id) => !prevIds.includes(id));
  if (!added) return undefined;
  const synergy = getAllSynergies().find((s) => s.id === added);
  return synergy ? `${synergy.name} unlocked! ${synergy.description}` : undefined;
}
