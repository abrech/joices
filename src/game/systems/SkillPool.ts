import type { FloorContext, SkillPoolFilter } from '../../types/events';
import { getAllSkills, getSkill } from '../../content/registries';

export function countWeaponAttacks(ctx: FloorContext): number {
  const weaponId = ctx.run.player.weaponId;
  return ctx.run.player.skills.filter((s) => {
    const def = getSkill(s.id);
    return def?.type === 'attack' && def.weaponId === weaponId;
  }).length;
}

/** Random unowned attack skills for the player's current weapon. */
export function pickWeaponAttacks(ctx: FloorContext, count: number): string[] {
  const weaponId = ctx.run.player.weaponId;
  const owned = new Set(ctx.run.player.skills.map((s) => s.id));
  const pool = getAllSkills().filter(
    (s) => !owned.has(s.id) && s.type === 'attack' && s.weaponId === weaponId,
  );
  const picked: string[] = [];
  const available = [...pool];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(ctx.rng() * available.length);
    picked.push(available[idx].id);
    available.splice(idx, 1);
  }
  return picked;
}

export function pickSkills(
  ctx: FloorContext,
  count: number,
  filter: SkillPoolFilter,
): string[] {
  const owned = new Set(ctx.run.player.skills.map((s) => s.id));
  const pool = getAllSkills().filter((s) => !owned.has(s.id) && filter(s, ctx));
  const picked: string[] = [];
  const available = [...pool];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(ctx.rng() * available.length);
    picked.push(available[idx].id);
    available.splice(idx, 1);
  }
  return picked;
}
