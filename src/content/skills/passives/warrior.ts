import type { SkillDef } from '../../../types/definitions';

export const thickSkin: SkillDef = {
  id: 'thick-skin',
  name: 'Thick Skin',
  description: 'Permanently increases max HP.',
  imageKey: 'thick-skin',
  type: 'passive',
  tags: [],
  classId: 'warrior',
  maxLevel: 3,
  levelDescriptions: ['+15 max HP.', '+25 max HP.', '+40 max HP.'],
  onPassive: (_ctx, level) => [{ stat: 'maxHp', flat: [15, 25, 40][level - 1] }],
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
  levelDescriptions: ['+10 max HP, +1 block.', '+18 max HP, +2 block.', '+28 max HP, +3 block.'],
  onPassive: (_ctx, level) => {
    const hp = [10, 18, 28][level - 1];
    const block = [1, 2, 3][level - 1];
    return [
      { stat: 'maxHp', flat: hp },
      { stat: 'block', flat: block },
    ];
  },
};

export const warriorPassives = [thickSkin, ironWard, stalwart];
