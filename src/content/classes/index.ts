import type { ClassDef } from '../../types/definitions';

export const warrior: ClassDef = {
  id: 'warrior',
  name: 'Warrior',
  description: 'High HP and block. Smaller mana pool; cheap skills and Shield Guard.',
  imageKey: 'warrior',
  baseStats: {
    maxHp: 120,
    attack: 12,
    critChance: 0.05,
    block: 4,
    spellPower: 0,
    maxMana: 5,
    manaRegen: 1,
  },
  weaponIds: ['longsword', 'warhammer'],
  starterPassiveId: 'thick-skin',
};

export const mage: ClassDef = {
  id: 'mage',
  name: 'Mage',
  description: 'Large mana pool and regen. Chain multiple spells each turn.',
  imageKey: 'mage',
  baseStats: {
    maxHp: 70,
    attack: 6,
    critChance: 0.08,
    block: 0,
    spellPower: 15,
    maxMana: 8,
    manaRegen: 2,
  },
  weaponIds: ['arcane-staff', 'focus-wand'],
  starterPassiveId: 'arcane-battery',
};

export const rogue: ClassDef = {
  id: 'rogue',
  name: 'Rogue',
  description: 'Balanced mana and crit. Efficient fillers and status chains.',
  imageKey: 'rogue',
  baseStats: {
    maxHp: 85,
    attack: 10,
    critChance: 0.2,
    block: 1,
    spellPower: 0,
    maxMana: 7,
    manaRegen: 1,
  },
  weaponIds: ['twin-daggers', 'hand-crossbow'],
  starterPassiveId: 'keen-eye',
};

export const allClasses = [warrior, mage, rogue];
