import type { SkillDef } from '../../../types/definitions';

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
    'Deal 55% attack + poison (2 mana).',
    'Deal 68% attack + poison (2 mana).',
    'Deal 82% attack + poison (2 mana).',
  ],
  onUse: (ctx, level) => {
    const mult = [0.55, 0.68, 0.82][level - 1];
    const stacks = [3, 4, 5][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult);
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
    'Deal 100% attack + poison (4 mana). CD 2.',
    'Deal 118% attack + poison (4 mana). CD 1.',
    'Deal 138% attack + poison (4 mana).',
  ],
  onUse: (ctx, level) => {
    const mult = [1.0, 1.18, 1.38][level - 1];
    const stacks = [3, 3, 4][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult);
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
    'Deal 88% attack + poison (6 mana). CD 2.',
    'Deal 105% attack + poison (6 mana). CD 1.',
    'Deal 122% attack + poison (6 mana).',
  ],
  onUse: (ctx, level) => {
    const mult = [0.88, 1.05, 1.22][level - 1];
    const stacks = [3, 4, 5][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'poison', stacks },
      aoe: true,
      logMessage: `Volley rains down for ${dmg} on each foe!`,
    };
  },
};

export const handCrossbowAttacks = [poisonDart, markedShot, volley];
