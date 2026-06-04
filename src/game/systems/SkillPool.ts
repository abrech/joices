import type { FloorContext, SkillPoolFilter } from '../../types/events';
import { getAllSkills } from '../../content/registries';

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
