import type { SynergyDef } from '../types/definitions';

export const inferno: SynergyDef = {
  id: 'inferno',
  name: 'Inferno',
  description: '2+ Fire skills: burn damage +50%',
  requiredTags: ['fire'],
  minCount: 2,
  effect: () => ({ burnMultiplier: 1.5 }),
};

export const hemorrhage: SynergyDef = {
  id: 'hemorrhage',
  name: 'Hemorrhage',
  description: '2+ Bleed effects: bleed ticks twice',
  requiredTags: ['bleed'],
  minCount: 2,
  effect: () => ({ bleedDoubleTick: true }),
};

export const assassinsMark: SynergyDef = {
  id: 'assassins-mark',
  name: "Assassin's Mark",
  description: '2+ Crit skills: +10% crit chance',
  requiredTags: ['crit'],
  minCount: 2,
  effect: () => ({ critBonus: 0.1 }),
};

export const arcaneConduit: SynergyDef = {
  id: 'arcane-conduit',
  name: 'Arcane Conduit',
  description: '2+ Magic skills: +20% spell damage',
  requiredTags: ['magic'],
  minCount: 2,
  effect: () => ({ spellPowerBonus: 0.2, damageMultiplier: 1.1 }),
};

export const toxicCloud: SynergyDef = {
  id: 'toxic-cloud',
  name: 'Toxic Cloud',
  description: '2+ Poison skills: +15% damage',
  requiredTags: ['poison'],
  minCount: 2,
  effect: () => ({ poisonMultiplier: 1.15 }),
};

export const allSynergies = [inferno, hemorrhage, assassinsMark, arcaneConduit, toxicCloud];
