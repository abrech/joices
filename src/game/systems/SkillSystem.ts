import type { GameState, RunState } from '../../types/game-state';
import { getSkill } from '../../content/registries';
import { recalculatePlayerStats } from './StatCalculator';
import { detectNewSynergy } from './SynergySystem';

export function addSkill(run: RunState, skillId: string, level = 1, profile?: GameState['profile']): RunState {
  const existing = run.player.skills.find((s) => s.id === skillId);
  const prevSynergies = [...run.player.activeSynergyIds];

  let skills = [...run.player.skills];
  if (existing) {
    skills = skills.map((s) =>
      s.id === skillId ? { ...s, level: Math.min(s.level + 1, getSkill(skillId)?.maxLevel ?? 3) } : s,
    );
  } else {
    skills.push({ id: skillId, level });
  }

  let player = recalculatePlayerStats({ ...run.player, skills }, profile);
  const toast = detectNewSynergy(prevSynergies, player.activeSynergyIds);

  return { ...run, player, newSynergyToast: toast };
}

export function upgradeSkill(run: RunState, skillId: string, profile?: GameState['profile']): RunState {
  return addSkill(run, skillId, 1, profile);
}

export function getSkillDescription(skillId: string, level: number): string {
  const skill = getSkill(skillId);
  if (!skill) return '';
  const idx = Math.min(level - 1, skill.levelDescriptions.length - 1);
  return skill.levelDescriptions[idx] ?? skill.description;
}

export function getAttackSkills(run: RunState) {
  return run.player.skills.filter((s) => getSkill(s.id)?.type === 'attack');
}

/** @deprecated Use getAttackSkills */
export function getActiveSkills(run: RunState) {
  return getAttackSkills(run);
}

export function getPassiveSkills(run: RunState) {
  return run.player.skills.filter((s) => getSkill(s.id)?.type === 'passive');
}

/** Cooldown turns after using a skill (0 = ready). Lv1=3, Lv2=2, Lv3=1 by default. */
export function getSkillCooldown(skillId: string, level: number): number {
  const skill = getSkill(skillId);
  const base = skill?.baseCooldown ?? 3;
  if (base === 0) return 0;
  return Math.max(1, base - (level - 1));
}

export interface HemophiliaBonuses {
  extraDuration: number;
  extraStacks: number;
  bonusDamagePerStack: number;
}

/** Hemophilia passive: longer bleed, extra stacks on apply, bonus tick damage per stack. */
export function getHemophiliaBonuses(
  skills: { id: string; level: number }[],
): HemophiliaBonuses | null {
  const owned = skills.find((s) => s.id === 'hemophilia');
  if (!owned) return null;
  const level = owned.level;
  return {
    extraDuration: level >= 3 ? 2 : 1,
    extraStacks: level >= 2 ? 1 : 0,
    bonusDamagePerStack: level + (level >= 2 ? 1 : 0),
  };
}

export interface ToxicBloodBonuses {
  poisonDamageMultiplier: number;
}

/** Toxic Blood: +25% / +40% / +55% poison tick damage. */
export function getToxicBloodBonuses(
  skills: { id: string; level: number }[],
): ToxicBloodBonuses | null {
  const owned = skills.find((s) => s.id === 'toxic-blood');
  if (!owned) return null;
  const mult = [1.35, 1.52, 1.7][owned.level - 1];
  return { poisonDamageMultiplier: mult };
}

export function initSkillCooldowns(run: RunState): Record<string, number> {
  const cooldowns: Record<string, number> = {};
  for (const s of run.player.skills) {
    const def = getSkill(s.id);
    if (def?.type === 'attack') cooldowns[s.id] = 0;
  }
  return cooldowns;
}
