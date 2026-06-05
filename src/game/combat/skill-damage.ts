import type { CombatContext } from './CombatContext';

function levelIndex(level: number, bases: number[]): number {
  return Math.min(Math.max(level - 1, 0), bases.length - 1);
}

function applyDamageMultiplier(damage: number, ctx: CombatContext): number {
  const mult = ctx.synergies.damageMultiplier ?? 1;
  return Math.max(0, Math.floor(damage * mult));
}

export function physicalDamage(ctx: CombatContext, level: number, bases: number[]): number {
  const base = bases[levelIndex(level, bases)] ?? 0;
  const raw = base + ctx.player.stats.strength;
  return applyDamageMultiplier(raw, ctx);
}

export function spellDamage(ctx: CombatContext, level: number, bases: number[]): number {
  const base = bases[levelIndex(level, bases)] ?? 0;
  const raw = base + ctx.player.stats.spell;
  return applyDamageMultiplier(raw, ctx);
}

export function counterDamage(ctx: CombatContext, level: number, bases: number[]): number {
  const base = bases[levelIndex(level, bases)] ?? 0;
  const raw = base + ctx.player.stats.strength;
  return applyDamageMultiplier(raw, ctx);
}
