import type { SkillDef } from '../../../types/definitions';

export const keenEye: SkillDef = {
  id: 'keen-eye',
  name: 'Keen Eye',
  description: 'Increases critical hit chance.',
  imageKey: 'keen-eye',
  type: 'passive',
  tags: ['crit'],
  classId: 'rogue',
  maxLevel: 3,
  levelDescriptions: ['+5% crit chance.', '+8% crit chance.', '+12% crit chance.'],
  onPassive: (_ctx, level) => [{ stat: 'critChance', flat: [0.05, 0.08, 0.12][level - 1] }],
};

export const hemophilia: SkillDef = {
  id: 'hemophilia',
  name: 'Hemophilia',
  description: 'Bleed effects last longer and deal more damage.',
  imageKey: 'hemophilia',
  type: 'passive',
  tags: ['bleed'],
  classId: 'rogue',
  maxLevel: 3,
  levelDescriptions: [
    'Bleed lasts +1 turn, +1 damage per stack.',
    'Bleed lasts +1 turn, +1 stack on apply, +2 damage per stack.',
    'Bleed lasts +2 turns, +1 stack on apply, +3 damage per stack.',
  ],
  onPassive: () => [],
};

export const toxicBlood: SkillDef = {
  id: 'toxic-blood',
  name: 'Toxic Blood',
  description: 'Poison damage you deal ticks harder.',
  imageKey: 'poison-dart',
  type: 'passive',
  tags: ['poison'],
  classId: 'rogue',
  maxLevel: 3,
  levelDescriptions: [
    '+25% poison damage.',
    '+40% poison damage.',
    '+55% poison damage.',
  ],
  onPassive: () => [],
};

export const roguePassives = [keenEye, hemophilia, toxicBlood];
