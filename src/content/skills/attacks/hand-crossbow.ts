import type { SkillDef } from '../../../types/definitions';

export const poisonDart: SkillDef = {
  id: 'crossbow-poison-dart',
  name: 'Poison Dart',
  description: 'Your default crossbow shot. Always available.',
  imageKey: 'poison-dart',
  type: 'attack',
  tags: ['poison', 'ranged'],
  weaponId: 'hand-crossbow',
  maxLevel: 3,
  baseCooldown: 0,
  levelDescriptions: [
    'Deal 72% attack + 3 poison. Always available.',
    'Deal 90% attack + 4 poison. Always available.',
    'Deal 108% attack + 5 poison. Always available.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.72, 0.9, 1.08][level - 1];
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
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 95% attack + 2 poison. Cooldown: 3 turns.',
    'Deal 110% attack + 3 poison. Cooldown: 2 turns.',
    'Deal 125% attack + 3 poison. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [1.0, 1.15, 1.3][level - 1];
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
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 75% attack + 3 poison. Cooldown: 3 turns.',
    'Deal 90% attack + 4 poison. Cooldown: 2 turns.',
    'Deal 105% attack + 5 poison. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.82, 0.98, 1.12][level - 1];
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
