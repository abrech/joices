import type { StatusType, SynergyBonuses } from '../../types/definitions';
import type { StatusInstance } from '../../types/game-state';
import type { HemophiliaBonuses } from '../systems/SkillSystem';
import { getPoisonTickMultiplier } from './combat-damage';

export function applyStatus(
  statuses: StatusInstance[],
  type: StatusType,
  stacks = 1,
  duration = 3,
): StatusInstance[] {
  const existing = statuses.find((s) => s.type === type);
  if (existing) {
    return statuses.map((s) =>
      s.type === type
        ? { ...s, stacks: s.stacks + stacks, duration: Math.max(s.duration, duration) }
        : s,
    );
  }
  return [...statuses, { type, stacks, duration }];
}

export function applyBleedStatus(
  statuses: StatusInstance[],
  stacks: number,
  duration: number,
  hemophilia: HemophiliaBonuses | null,
): StatusInstance[] {
  if (hemophilia) {
    stacks += hemophilia.extraStacks;
    duration += hemophilia.extraDuration;
  }
  return applyStatus(statuses, 'bleed', stacks, duration);
}

export function tickStatuses(statuses: StatusInstance[]): StatusInstance[] {
  return statuses
    .map((s) => ({ ...s, duration: s.duration - 1 }))
    .filter((s) => s.duration > 0);
}

export function statusDamagePerTick(
  type: StatusType,
  stacks: number,
  synergies: SynergyBonuses,
  enemyStatuses: StatusInstance[] = [],
  playerSkills: { id: string; level: number }[] = [],
): number {
  const base = { bleed: 3, burn: 4, poison: 3, stun: 0, mark: 0, weaken: 0 }[type];
  let dmg = base * stacks;
  if (type === 'bleed' && synergies.bleedBonusPerStack) {
    dmg += synergies.bleedBonusPerStack * stacks;
  }
  if (type === 'burn' && synergies.burnMultiplier) {
    dmg = Math.floor(dmg * synergies.burnMultiplier);
  }
  if (type === 'poison') {
    dmg = Math.floor(dmg * getPoisonTickMultiplier(enemyStatuses, synergies, playerSkills));
  }
  return dmg;
}

export function isStunned(statuses: StatusInstance[]): boolean {
  return statuses.some((s) => s.type === 'stun' && s.duration > 0);
}
