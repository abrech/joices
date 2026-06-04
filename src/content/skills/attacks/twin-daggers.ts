import type { SkillDef } from '../../../types/definitions';

export const twinSlash: SkillDef = {
  id: 'twin-slash',
  name: 'Twin Slash',
  description: 'Your default dagger strike. Always available.',
  imageKey: 'poison-dart',
  type: 'attack',
  tags: ['melee', 'bleed'],
  weaponId: 'twin-daggers',
  maxLevel: 3,
  baseCooldown: 0,
  levelDescriptions: [
    'Deal 90% attack + 1 bleed. Always available.',
    'Deal 105% attack + 2 bleed. Always available.',
    'Deal 120% attack + 2 bleed. Always available.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.9, 1.05, 1.2][level - 1];
    const stacks = level >= 2 ? 2 : 1;
    const dmg = Math.floor(ctx.player.stats.attack * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'bleed', stacks },
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
  baseCooldown: 3,
  levelDescriptions: [
    'Dodge the next attack. Cooldown: 3 turns.',
    'Dodge and counter 50% attack. Cooldown: 2 turns.',
    'Dodge and counter 75% attack. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => ({
    dodgeNext: true,
    damage: level >= 2 ? Math.floor(ctx.player.stats.attack * (level >= 3 ? 0.75 : 0.5)) : 0,
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
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 70% attack + 2 bleed. Cooldown: 3 turns.',
    'Deal 85% attack + 3 bleed. Cooldown: 2 turns.',
    'Deal 100% attack + 4 bleed. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.7, 0.85, 1.0][level - 1];
    const stacks = [2, 3, 4][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'bleed', stacks },
      logMessage: `Flurry shreds for ${dmg}!`,
    };
  },
};

export const twinDaggersAttacks = [twinSlash, shadowStep, flurry];
