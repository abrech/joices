import type { SkillDef } from '../../../types/definitions';
import { physicalDamage } from '../../../game/combat/skill-damage';

export const poisonDart: SkillDef = {
  id: 'crossbow-poison-dart',
  name: 'Poison Dart',
  description: 'Poisoned bolt. Low-cost filler.',
  imageKey: 'poison-dart',
  type: 'attack',
  tags: ['poison', 'ranged'],
  weaponId: 'hand-crossbow',
  maxLevel: 3,
  baseCooldown: 0,
  manaCost: 2,
  levelDescriptions: [
    'Deal 1 + strength + poison (2 mana).',
    'Deal 2 + strength + poison (2 mana).',
    'Deal 3 + strength + poison (2 mana).',
  ],
  onUse: (ctx, level) => {
    const stacks = [3, 4, 5][level - 1];
    const dmg = physicalDamage(ctx, level, [1, 2, 3]);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'poison', stacks },
      logMessage: `Poison Dart hits for ${dmg}!`,
    };
  },
};

export const markedShot: SkillDef = {
  id: 'marked-shot',
  name: 'Marked Shot',
  description: 'Mark the target for increased poison damage.',
  imageKey: 'poison-dart',
  type: 'attack',
  tags: ['poison', 'ranged'],
  weaponId: 'hand-crossbow',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 4,
  levelDescriptions: [
    'Deal 5 + strength + poison (4 mana). CD 2.',
    'Deal 7 + strength + poison (4 mana). CD 1.',
    'Deal 9 + strength + poison (4 mana).',
  ],
  onUse: (ctx, level) => {
    const stacks = [3, 3, 4][level - 1];
    const dmg = physicalDamage(ctx, level, [5, 7, 9]);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'poison', stacks },
      extraStatuses: [{ target: 'enemy', type: 'mark', stacks: 1, duration: 4 }],
      logMessage: `Marked Shot marks the foe and deals ${dmg}!`,
    };
  },
};

export const volley: SkillDef = {
  id: 'volley',
  name: 'Volley',
  description: 'Loose a volley of poisoned bolts.',
  imageKey: 'poison-dart',
  type: 'attack',
  tags: ['poison', 'ranged', 'aoe'],
  weaponId: 'hand-crossbow',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 6,
  levelDescriptions: [
    'Deal 4 + strength + poison (6 mana). CD 2.',
    'Deal 6 + strength + poison (6 mana). CD 1.',
    'Deal 8 + strength + poison (6 mana).',
  ],
  onUse: (ctx, level) => {
    const stacks = [3, 4, 5][level - 1];
    const dmg = physicalDamage(ctx, level, [4, 6, 8]);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'poison', stacks },
      aoe: true,
      logMessage: `Volley rains down for ${dmg} on each foe!`,
    };
  },
};

export const handCrossbowAttacks = [poisonDart, markedShot, volley];
