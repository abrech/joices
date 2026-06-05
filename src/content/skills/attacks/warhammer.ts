import type { SkillDef } from '../../../types/definitions';
import { physicalDamage } from '../../../game/combat/skill-damage';

export const crushingBlow: SkillDef = {
  id: 'crushing-blow',
  name: 'Crushing Blow',
  description: 'Heavy warhammer strike. Low-cost filler.',
  imageKey: 'power-strike',
  type: 'attack',
  tags: ['melee', 'heavy'],
  weaponId: 'warhammer',
  maxLevel: 3,
  baseCooldown: 0,
  manaCost: 2,
  levelDescriptions: [
    'Deal 2 + strength (2 mana).',
    'Deal 3 + strength (2 mana).',
    'Deal 4 + strength (2 mana).',
  ],
  onUse: (ctx, level) => {
    const dmg = physicalDamage(ctx, level, [2, 3, 4]);
    return { damage: dmg, logMessage: `Crushing Blow smashes for ${dmg}!` };
  },
};

export const ironBrace: SkillDef = {
  id: 'iron-brace',
  name: 'Iron Brace',
  description: 'Brace behind the hammer head for massive block.',
  imageKey: 'shield-bash',
  type: 'attack',
  tags: ['melee', 'heavy', 'defense'],
  weaponId: 'warhammer',
  maxLevel: 3,
  baseCooldown: 0,
  manaCost: 2,
  levelDescriptions: [
    'Grant +5 block (2 mana).',
    'Grant +7 block (2 mana).',
    'Grant +10 block (2 mana).',
  ],
  onUse: (_ctx, level) => ({
    grantBlock: [5, 7, 10][level - 1],
    logMessage: `Iron Brace adds +${[5, 7, 10][level - 1]} block!`,
  }),
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
  baseCooldown: 2,
  manaCost: 5,
  levelDescriptions: [
    'Deal 5 + strength and stun (5 mana). CD 2.',
    'Deal 7 + strength and stun (5 mana). CD 1.',
    'Deal 9 + strength and stun (5 mana).',
  ],
  onUse: (ctx, level) => {
    const dmg = physicalDamage(ctx, level, [5, 7, 9]);
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
  baseCooldown: 2,
  manaCost: 6,
  levelDescriptions: [
    'Deal 6 + strength + bleed (6 mana). CD 2.',
    'Deal 8 + strength + bleed (6 mana). CD 1.',
    'Deal 10 + strength + bleed (6 mana).',
  ],
  onUse: (ctx, level) => {
    const dmg = physicalDamage(ctx, level, [6, 8, 10]);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'bleed', stacks: level >= 2 ? 2 : 1 },
      extraStatuses: [{ target: 'enemy', type: 'weaken', stacks: 1, duration: 2 }],
      logMessage: `Shockwave weakens the foe and deals ${dmg}!`,
    };
  },
};

export const warhammerAttacks = [crushingBlow, ironBrace, hammerStun, shockwave];
