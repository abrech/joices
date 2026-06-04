import type { ClassDef } from '../../types/definitions';

export const warrior: ClassDef = {
  id: 'warrior',
  name: 'Warrior',
  description: 'High HP and block. Excels at surviving long fights and stunning foes.',
  imageKey: 'warrior',
  baseStats: { maxHp: 120, attack: 12, critChance: 0.05, block: 4, spellPower: 0 },
  weaponIds: ['longsword', 'warhammer'],
  starterPassiveId: 'thick-skin',
};

export const mage: ClassDef = {
  id: 'mage',
  name: 'Mage',
  description: 'Low HP but high spell power. Devastating AoE and fire synergies.',
  imageKey: 'mage',
  baseStats: { maxHp: 70, attack: 6, critChance: 0.08, block: 0, spellPower: 15 },
  weaponIds: ['arcane-staff', 'focus-wand'],
  starterPassiveId: 'arcane-battery',
};

export const rogue: ClassDef = {
  id: 'rogue',
  name: 'Rogue',
  description: 'High crit and evasion. Masters bleed stacks and poison effects.',
  imageKey: 'rogue',
  baseStats: { maxHp: 85, attack: 10, critChance: 0.2, block: 1, spellPower: 0 },
  weaponIds: ['twin-daggers', 'hand-crossbow'],
  starterPassiveId: 'keen-eye',
};

export const allClasses = [warrior, mage, rogue];
