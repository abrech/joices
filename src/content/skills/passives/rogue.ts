import type { SkillDef } from '../../../types/definitions';
import { getSkill } from '../../registries';

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
    'Bleed lasts +1 turn.',
    'Bleed lasts +1 turn, +1 stack on apply.',
    'Bleed lasts +2 turns, +1 stack on apply.',
  ],
  onPassive: () => [],
};

export const toxicBlood: SkillDef = {
  id: 'toxic-blood',
  name: 'Toxic Blood',
  description: 'Poison you apply hits harder.',
  imageKey: 'poison-dart',
  type: 'passive',
  tags: ['poison'],
  classId: 'rogue',
  maxLevel: 3,
  levelDescriptions: [
    '+2 attack while you own a poison attack.',
    '+4 attack while you own a poison attack.',
    '+6 attack while you own a poison attack.',
  ],
  onPassive: (ctx, level) => {
    const ownsPoison = ctx.ownedSkills.some((os) => getSkill(os.id)?.tags.includes('poison'));
    const atk = ownsPoison ? [2, 4, 6][level - 1] : 0;
    return [{ stat: 'attack', flat: atk }];
  },
};

export const roguePassives = [keenEye, hemophilia, toxicBlood];
