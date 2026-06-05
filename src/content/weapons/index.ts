import type { WeaponDef } from '../../types/definitions';

export const longsword: WeaponDef = {
  id: 'longsword',
  name: 'Longsword',
  description: 'Balanced blade. Grants block on each strike.',
  imageKey: 'longsword',
  classId: 'warrior',
  statModifiers: { attack: 3, block: 3 },
  tags: ['melee'],
  starterAttackId: 'sword-slash',
  starterBlockId: 'shield-guard',
};

export const warhammer: WeaponDef = {
  id: 'warhammer',
  name: 'Warhammer',
  description: 'Slow but crushing. High damage with a chance to stun.',
  imageKey: 'warhammer',
  classId: 'warrior',
  statModifiers: { attack: 5, critChance: -0.02 },
  tags: ['melee', 'heavy'],
  starterAttackId: 'crushing-blow',
  starterBlockId: 'iron-brace',
};

export const arcaneStaff: WeaponDef = {
  id: 'arcane-staff',
  name: 'Arcane Staff',
  description: 'Amplifies spells. Best for AoE and fire builds.',
  imageKey: 'arcane-staff',
  classId: 'mage',
  statModifiers: { spellPower: 7, attack: -2 },
  tags: ['magic', 'aoe'],
  starterAttackId: 'staff-fireball',
};

export const focusWand: WeaponDef = {
  id: 'focus-wand',
  name: 'Focus Wand',
  description: 'Fast single-target casts. High burst damage.',
  imageKey: 'focus-wand',
  classId: 'mage',
  statModifiers: { spellPower: 9, attack: 2, critChance: 0.06 },
  tags: ['magic'],
  starterAttackId: 'arcane-bolt',
};

export const twinDaggers: WeaponDef = {
  id: 'twin-daggers',
  name: 'Twin Daggers',
  description: 'Quick multi-hit attacks. Applies bleed stacks easily.',
  imageKey: 'twin-daggers',
  classId: 'rogue',
  statModifiers: { attack: 4, critChance: 0.08, manaRegen: 1 },
  tags: ['melee', 'bleed'],
  starterAttackId: 'twin-slash',
};

export const handCrossbow: WeaponDef = {
  id: 'hand-crossbow',
  name: 'Hand Crossbow',
  description: 'Ranged pierce attacks. Ignores some enemy block.',
  imageKey: 'hand-crossbow',
  classId: 'rogue',
  statModifiers: { attack: 5, critChance: 0.06 },
  tags: ['ranged', 'pierce'],
  starterAttackId: 'crossbow-poison-dart',
};

export const allWeapons = [
  longsword,
  warhammer,
  arcaneStaff,
  focusWand,
  twinDaggers,
  handCrossbow,
];
