import type { GameState } from '../../types/game-state';
import type { ShopItem } from '../../types/events';
import { getSkill, getWeapon } from '../../content/registries';
import { buildCombatContext } from '../combat/CombatContext';
import { combatSynergyBonuses } from '../combat/synergy-combat';
import {
  canAffordSkill,
  getSkillCooldown,
  getSkillManaCost,
  getAttackSkills,
} from '../systems/SkillSystem';
import { isUpgradeable } from '../systems/SkillFilters';

export function countAttacks(state: GameState): number {
  return getAttackSkills(state.run).length;
}

export function isBasicAttack(state: GameState, skillId: string): boolean {
  return getWeapon(state.run.player.weaponId)?.starterAttackId === skillId;
}

/** Rough damage estimate for combat decisions (uses live combat context). */
export function estimateCombatDamage(state: GameState, skillId: string): number {
  if (!state.run.combat) return 0;
  const skill = getSkill(skillId);
  const owned = state.run.player.skills.find((s) => s.id === skillId);
  if (!skill?.onUse || !owned) return 0;

  const synergies = combatSynergyBonuses(state.run.player.skills);
  const ctx = buildCombatContext(state.run, synergies);
  const result = skill.onUse(ctx, owned.level);
  let score = result.damage ?? 0;
  if (result.applyStatus) {
    const stacks = result.applyStatus.stacks ?? 1;
    if (result.applyStatus.type === 'poison') score += 10 * stacks;
    else if (result.applyStatus.type === 'burn' || result.applyStatus.type === 'bleed') {
      score += 6 * stacks;
    } else score += 4 * stacks;
  }
  if (result.extraStatuses?.some((s) => s.type === 'mark')) score += 18;
  if (result.stun) score += 8;
  return score;
}

export function scoreSkillChoice(state: GameState, skillId: string): number {
  const def = getSkill(skillId);
  if (!def) return -1;

  const owned = state.run.player.skills.find((s) => s.id === skillId);
  const attacks = countAttacks(state);
  const basicId = getWeapon(state.run.player.weaponId)?.starterAttackId;

  if (!owned) {
    if (def.type === 'attack' && def.weaponId === state.run.player.weaponId) {
      return 100 - attacks * 15;
    }
    if (def.type === 'passive' && def.classId === state.run.player.classId) {
      return 55 - state.run.player.skills.length * 3;
    }
    return 20;
  }

  if (isUpgradeable(owned, def)) {
    let score = 40;
    if (skillId === basicId) score += 25;
    if (def.type === 'attack') score += 10;
    return score;
  }

  return 0;
}

export function pickBestSkill(state: GameState, skillIds: string[]): string {
  let best = skillIds[0];
  let bestScore = -Infinity;
  for (const id of skillIds) {
    const s = scoreSkillChoice(state, id);
    if (s > bestScore) {
      bestScore = s;
      best = id;
    }
  }
  return best;
}

export function scoreShopItem(state: GameState, item: ShopItem): number {
  const { player } = state.run;
  if (player.gold < item.price) return -1;

  const hpRatio = player.hp / Math.max(1, player.stats.maxHp);
  const attacks = countAttacks(state);
  const isMage = player.stats.spell > player.stats.strength;

  if (item.type === 'skill' && item.skillId) {
    return 120 - attacks * 20 + scoreSkillChoice(state, item.skillId);
  }
  if (item.type === 'heal') {
    return hpRatio < 0.5 ? 90 : hpRatio < 0.75 ? 40 : 10;
  }
  if (item.type === 'stat' && item.stat) {
    if (item.stat === 'strength') return isMage ? 25 : 55;
    if (item.stat === 'spell') return isMage ? 60 : 15;
    if (item.stat === 'maxHp') return hpRatio < 0.6 ? 50 : 35;
    if (item.stat === 'block') return 40;
    if (item.stat === 'maxMana') return isMage ? 55 : 35;
    if (item.stat === 'manaRegen') return isMage ? 50 : 30;
    if (item.stat === 'critChance') return 30;
  }
  return 5;
}

export function combatSkillScore(state: GameState, skillId: string): number {
  const combat = state.run.combat;
  if (!combat) return 0;

  const owned = state.run.player.skills.find((s) => s.id === skillId);
  if (!owned) return 0;

  const cd = combat.skillCooldowns[skillId] ?? 0;
  if (cd > 0) return -1;
  if (!canAffordSkill(combat, skillId)) return -1;

  const skill = getSkill(skillId);
  if (!skill) return 0;

  const damage = estimateCombatDamage(state, skillId);
  const cooldown = getSkillCooldown(skillId, owned.level);
  const manaCost = getSkillManaCost(skillId);
  let score = damage / (cooldown + 1);
  score += damage / Math.max(1, manaCost * 2);

  const hpRatio = state.run.player.hp / Math.max(1, state.run.player.stats.maxHp);
  if (damage === 0 && skill.type === 'attack') {
    score = hpRatio < 0.55 ? 12 : -1;
  }

  const totalHp = combat.enemies.reduce((s, e) => s + e.hp, 0);
  if (damage >= totalHp) score += 50;
  const living = combat.enemies.filter((e) => e.hp > 0).length;
  if (living > 1 && skill.tags.includes('aoe') && damage > 0) score += 25;

  const basic = isBasicAttack(state, skillId);
  if (!basic && damage > 0) score += 22;
  if (basic) {
    const bestAlt = getAttackSkills(state.run)
      .filter((s) => !isBasicAttack(state, s.id))
      .map((s) => estimateCombatDamage(state, s.id))
      .reduce((m, d) => Math.max(m, d), 0);
    if (bestAlt > damage) score -= 22;
    if (combat.isBoss && bestAlt > 0) score -= 8;
  }

  return score;
}
