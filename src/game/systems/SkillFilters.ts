import type { SkillDef } from '../../types/definitions';
import type { FloorContext, SkillPoolFilter } from '../../types/events';
import { getSkill } from '../../content/registries';

export function isAttackForWeapon(skill: SkillDef, ctx: FloorContext): boolean {
  return skill.type === 'attack' && skill.weaponId === ctx.run.player.weaponId;
}

export function isPassiveForClass(skill: SkillDef, ctx: FloorContext): boolean {
  return skill.type === 'passive' && skill.classId === ctx.run.player.classId;
}

export function isLearnable(skill: SkillDef, ctx: FloorContext): boolean {
  const owned = ctx.run.player.skills.some((s) => s.id === skill.id);
  if (owned) return false;
  return isAttackForWeapon(skill, ctx) || isPassiveForClass(skill, ctx);
}

export function isUpgradeable(owned: { id: string; level: number }, def: SkillDef): boolean {
  return owned.level < def.maxLevel;
}

export const learnableSkillFilter: SkillPoolFilter = (skill, ctx) => isLearnable(skill, ctx);

/** @deprecated Use learnableSkillFilter */
export const defaultSkillFilter: SkillPoolFilter = learnableSkillFilter;

export function filterTrainingChoices(ctx: FloorContext, choiceIds: string[]): string[] {
  const ownedMap = new Map(ctx.run.player.skills.map((s) => [s.id, s]));
  return choiceIds.filter((id) => {
    const def = getSkill(id);
    if (!def) return false;
    const owned = ownedMap.get(id);
    if (!owned) return true;
    return isUpgradeable(owned, def);
  });
}
