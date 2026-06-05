import type { SkillDef } from '../../../types/definitions';

export const twinSlash: SkillDef = {
  id: 'twin-slash',
  name: 'Twin Slash',
  description: 'Quick dagger cuts. Low-cost filler.',
  imageKey: 'poison-dart',
  type: 'attack',
  tags: ['melee', 'bleed'],
  weaponId: 'twin-daggers',
  maxLevel: 3,
  baseCooldown: 0,
  manaCost: 2,
  levelDescriptions: [
    'Deal 58% attack + bleed (2 mana).',
    'Deal 68% attack + bleed (2 mana).',
    'Deal 80% attack + bleed (2 mana).',
  ],
  onUse: (ctx, level) => {
    const mult = [0.58, 0.68, 0.8][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'bleed', stacks: 2 },
      logMessage: `Twin Slash cuts for ${dmg}!`,
    };
  },
};

export const shadowStep: SkillDef = {
  id: 'dagger-shadow-step',
  name: 'Shadow Step',
  description: 'Dodge the next enemy attack and slip into position.',
  imageKey: 'shadow-step',
  type: 'attack',
  tags: ['stealth', 'melee'],
  weaponId: 'twin-daggers',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 4,
  levelDescriptions: [
    'Dodge next attack (4 mana). CD 2.',
    'Dodge and counter 65% attack (4 mana). CD 1.',
    'Dodge and counter 95% attack (4 mana).',
  ],
  onUse: (ctx, level) => ({
    dodgeNext: true,
    counterOnDodge:
      level >= 2 ? Math.floor(ctx.player.stats.attack * (level >= 3 ? 0.95 : 0.65)) : 0,
    logMessage: 'You vanish with Shadow Step!',
  }),
};

export const flurry: SkillDef = {
  id: 'flurry',
  name: 'Flurry',
  description: 'A flurry of cuts that stack bleed rapidly.',
  imageKey: 'poison-dart',
  type: 'attack',
  tags: ['melee', 'bleed'],
  weaponId: 'twin-daggers',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 4,
  levelDescriptions: [
    'Deal 75% attack + bleed (4 mana). CD 2.',
    'Deal 90% attack + bleed (4 mana). CD 1.',
    'Deal 105% attack + bleed (4 mana).',
  ],
  onUse: (ctx, level) => {
    const mult = [0.75, 0.9, 1.05][level - 1];
    const stacks = [3, 4, 5][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'bleed', stacks },
      logMessage: `Flurry shreds for ${dmg}!`,
    };
  },
};

export const twinDaggersAttacks = [twinSlash, shadowStep, flurry];
