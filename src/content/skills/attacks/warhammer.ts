import type { SkillDef } from '../../../types/definitions';

export const crushingBlow: SkillDef = {
  id: 'crushing-blow',
  name: 'Crushing Blow',
  description: 'Your default warhammer strike. Always available.',
  imageKey: 'power-strike',
  type: 'attack',
  tags: ['melee', 'heavy'],
  weaponId: 'warhammer',
  maxLevel: 3,
  baseCooldown: 0,
  levelDescriptions: [
    'Deal 115% attack damage. Always available.',
    'Deal 135% attack damage. Always available.',
    'Deal 155% attack damage. Always available.',
  ],
  onUse: (ctx, level) => {
    const mult = [1.15, 1.35, 1.55][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult * (ctx.synergies.damageMultiplier ?? 1));
    return { damage: dmg, logMessage: `Crushing Blow smashes for ${dmg}!` };
  },
};

export const hammerStun: SkillDef = {
  id: 'hammer-stun',
  name: 'Staggering Slam',
  description: 'Slam the ground to stun your foe.',
  imageKey: 'shield-bash',
  type: 'attack',
  tags: ['melee', 'stun', 'heavy'],
  weaponId: 'warhammer',
  maxLevel: 3,
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 90% attack and stun. Cooldown: 3 turns.',
    'Deal 110% attack and stun. Cooldown: 2 turns.',
    'Deal 120% attack and stun. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.9, 1.1, 1.2][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult);
    return {
      damage: dmg,
      stun: true,
      logMessage: `Staggering Slam deals ${dmg} and stuns!`,
    };
  },
};

export const shockwave: SkillDef = {
  id: 'shockwave',
  name: 'Shockwave',
  description: 'Send a shockwave that weakens the enemy.',
  imageKey: 'power-strike',
  type: 'attack',
  tags: ['melee', 'heavy', 'aoe'],
  weaponId: 'warhammer',
  maxLevel: 3,
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 100% attack + 1 bleed. Cooldown: 3 turns.',
    'Deal 120% attack + 2 bleed. Cooldown: 2 turns.',
    'Deal 140% attack + 2 bleed. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [1.0, 1.2, 1.4][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'bleed', stacks: level >= 2 ? 2 : 1 },
      extraStatuses: [{ target: 'enemy', type: 'weaken', stacks: 1, duration: 2 }],
      logMessage: `Shockwave weakens the foe and deals ${dmg}!`,
    };
  },
};

export const warhammerAttacks = [crushingBlow, hammerStun, shockwave];
