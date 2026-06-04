import type { Stats, StatModifier, SynergyBonuses } from '../../types/definitions';
import type { PlayerState, ProfileState } from '../../types/game-state';
import { getClass, getWeapon, getSkill } from '../../content/registries';
import { computeSynergyBonuses, getActiveSynergies } from './SynergySystem';

const BASE_STATS: Stats = {
  maxHp: 0,
  attack: 0,
  critChance: 0,
  block: 0,
  spellPower: 0,
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

  let stats: Stats = { ...classDef.baseStats };
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
  if (synergyBonuses.spellPowerBonus) {
    stats.spellPower = Math.floor(stats.spellPower * (1 + synergyBonuses.spellPowerBonus));
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
  stats.critChance = Math.min(0.75, Math.max(0, stats.critChance));
  stats.maxHp = Math.max(1, stats.maxHp);
  stats.attack = Math.max(0, stats.attack);

  return { stats, synergyBonuses, activeSynergyIds };
}

export function recalculatePlayerStats(player: PlayerState, profile?: ProfileState): PlayerState {
  const { stats, activeSynergyIds } = calculateStats(player, profile);
  const hp = Math.min(player.hp || stats.maxHp, stats.maxHp);
  return { ...player, stats, hp: hp || stats.maxHp, activeSynergyIds };
}
