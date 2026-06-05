import type { Stats, StatModifier, SynergyBonuses } from '../../types/definitions';
import type { PlayerState, ProfileState } from '../../types/game-state';
import { getClass, getWeapon, getSkill } from '../../content/registries';
import { computeSynergyBonuses, getActiveSynergies } from './SynergySystem';

const BASE_STATS: Stats = {
  maxHp: 50,
  strength: 0,
  critChance: 0,
  block: 0,
  spell: 0,
  maxMana: 0,
  manaRegen: 0,
};

function applyModifiers(stats: Stats, mods: StatModifier[]): Stats {
  const result = { ...stats };
  for (const mod of mods) {
    if (mod.flat) result[mod.stat] = (result[mod.stat] as number) + mod.flat;
    if (mod.multiplier) result[mod.stat] = (result[mod.stat] as number) * mod.multiplier;
  }
  return result;
}

export function calculateStats(
  player: Pick<PlayerState, 'classId' | 'weaponId' | 'skills'>,
  _profile?: ProfileState,
): { stats: Stats; synergyBonuses: SynergyBonuses; activeSynergyIds: string[] } {
  const classDef = getClass(player.classId);
  const weaponDef = getWeapon(player.weaponId);
  if (!classDef || !weaponDef) {
    return { stats: { ...BASE_STATS }, synergyBonuses: {}, activeSynergyIds: [] };
  }

  let stats: Stats = { ...BASE_STATS };
  for (const key of Object.keys(classDef.baseStats) as (keyof Stats)[]) {
    const val = classDef.baseStats[key];
    if (val !== undefined) stats[key] = (stats[key] as number) + val;
  }
  for (const key of Object.keys(weaponDef.statModifiers) as (keyof Stats)[]) {
    const val = weaponDef.statModifiers[key];
    if (val !== undefined) stats[key] = (stats[key] as number) + val;
  }

  const ownedSkills = player.skills.map((s) => ({ id: s.id, level: s.level }));
  const activeSynergyIds = getActiveSynergies(ownedSkills);
  const synergyBonuses = computeSynergyBonuses(ownedSkills);

  if (synergyBonuses.critBonus) {
    stats.critChance += synergyBonuses.critBonus;
  }
  if (synergyBonuses.spellBonus) {
    stats.spell += Math.floor(stats.spell * synergyBonuses.spellBonus);
  }

  const passiveCtx = {
    player: { ...player, stats, activeSynergyIds } as PlayerState,
    ownedSkills,
    synergies: synergyBonuses,
  };

  const allMods: StatModifier[] = [];
  for (const owned of player.skills) {
    const skill = getSkill(owned.id);
    if (skill?.type === 'passive' && skill.onPassive) {
      allMods.push(...skill.onPassive(passiveCtx, owned.level));
    }
  }

  stats = applyModifiers(stats, allMods);
  stats = clampStats(stats);

  return { stats, synergyBonuses, activeSynergyIds };
}

export function clampStats(stats: Stats): Stats {
  return {
    ...stats,
    critChance: Math.min(0.75, Math.max(0, stats.critChance)),
    maxHp: Math.max(1, stats.maxHp),
    strength: Math.max(0, stats.strength),
    spell: Math.max(0, stats.spell),
    maxMana: Math.max(1, stats.maxMana),
    manaRegen: Math.max(0, stats.manaRegen),
  };
}

export function recalculatePlayerStats(player: PlayerState, profile?: ProfileState): PlayerState {
  const { stats, activeSynergyIds } = calculateStats(player, profile);
  const hp = Math.min(player.hp || stats.maxHp, stats.maxHp);
  return { ...player, stats, hp: hp || stats.maxHp, activeSynergyIds };
}
