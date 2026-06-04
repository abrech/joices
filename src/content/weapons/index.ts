import type { WeaponDef } from '../../types/definitions';

export const longsword: WeaponDef = {
  id: 'longsword',
  name: 'Longsword',
  description: 'Balanced blade. Grants block on each strike.',
  imageKey: 'longsword',
  classId: 'warrior',
  statModifiers: { attack: 3, block: 2 },
  tags: ['melee'],
};

export const warhammer: WeaponDef = {
  id: 'warhammer',
  name: 'Warhammer',
  description: 'Slow but crushing. High damage with a chance to stun.',
  imageKey: 'warhammer',
  classId: 'warrior',
  statModifiers: { attack: 8, critChance: -0.02 },
  tags: ['melee', 'heavy'],
};

export const arcaneStaff: WeaponDef = {
  id: 'arcane-staff',
  name: 'Arcane Staff',
  description: 'Amplifies spells. Best for AoE and fire builds.',
  imageKey: 'arcane-staff',
  classId: 'mage',
  statModifiers: { spellPower: 8, attack: -2 },
  tags: ['magic', 'aoe'],
};

export const focusWand: WeaponDef = {
  id: 'focus-wand',
  name: 'Focus Wand',
  description: 'Fast single-target casts. High burst damage.',
  imageKey: 'focus-wand',
  classId: 'mage',
  statModifiers: { spellPower: 4, attack: 2, critChance: 0.05 },
  tags: ['magic'],
};

export const twinDaggers: WeaponDef = {
  id: 'twin-daggers',
  name: 'Twin Daggers',
  description: 'Quick multi-hit attacks. Applies bleed stacks easily.',
  imageKey: 'twin-daggers',
  classId: 'rogue',
  statModifiers: { attack: 2, critChance: 0.08 },
  tags: ['melee', 'bleed'],
};

export const handCrossbow: WeaponDef = {
  id: 'hand-crossbow',
  name: 'Hand Crossbow',
  description: 'Ranged pierce attacks. Ignores some enemy block.',
  imageKey: 'hand-crossbow',
  classId: 'rogue',
  statModifiers: { attack: 5, critChance: 0.05 },
  tags: ['ranged', 'pierce'],
};

export const allWeapons = [
  longsword,
  warhammer,
  arcaneStaff,
  focusWand,
  twinDaggers,
  handCrossbow,
];
