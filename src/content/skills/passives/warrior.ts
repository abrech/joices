import type { SkillDef, StatModifier } from '../../../types/definitions';

export const thickSkin: SkillDef = {
  id: 'thick-skin',
  name: 'Thick Skin',
  description: 'Permanently increases max HP.',
  imageKey: 'thick-skin',
  type: 'passive',
  tags: [],
  classId: 'warrior',
  maxLevel: 3,
  levelDescriptions: ['+12 max HP.', '+20 max HP.', '+32 max HP.'],
  onPassive: (_ctx, level) => [{ stat: 'maxHp', flat: [12, 20, 32][level - 1] }],
};

export const ironWard: SkillDef = {
  id: 'iron-ward',
  name: 'Iron Ward',
  description: 'Harden your guard with bonus block.',
  imageKey: 'shield-bash',
  type: 'passive',
  tags: ['melee'],
  classId: 'warrior',
  maxLevel: 3,
  levelDescriptions: ['+2 block.', '+3 block.', '+5 block.'],
  onPassive: (_ctx, level) => [{ stat: 'block', flat: [2, 3, 5][level - 1] }],
};

export const stalwart: SkillDef = {
  id: 'stalwart',
  name: 'Stalwart',
  description: 'Toughness that scales with your defenses.',
  imageKey: 'thick-skin',
  type: 'passive',
  tags: [],
  classId: 'warrior',
  maxLevel: 3,
  levelDescriptions: [
    '+8 max HP, +1 block.',
    '+14 max HP, +2 block.',
    '+22 max HP, +3 block, +1 mana regen.',
  ],
  onPassive: (_ctx, level) => {
    const mods: StatModifier[] = [
      { stat: 'maxHp', flat: [8, 14, 22][level - 1] },
      { stat: 'block', flat: [1, 2, 3][level - 1] },
    ];
    if (level >= 3) mods.push({ stat: 'manaRegen', flat: 1 });
    return mods;
  },
};

export const warriorPassives = [thickSkin, ironWard, stalwart];
