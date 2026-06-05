import type { SkillDef } from '../../../types/definitions';

export const swordSlash: SkillDef = {
  id: 'sword-slash',
  name: 'Sword Slash',
  description: 'Quick blade strike. Low-cost filler.',
  imageKey: 'power-strike',
  type: 'attack',
  tags: ['melee'],
  weaponId: 'longsword',
  maxLevel: 3,
  baseCooldown: 0,
  manaCost: 2,
  levelDescriptions: [
    'Deal 60% attack (2 mana).',
    'Deal 72% attack (2 mana).',
    'Deal 85% attack (2 mana).',
  ],
  onUse: (ctx, level) => {
    const mult = [0.6, 0.72, 0.85][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult * (ctx.synergies.damageMultiplier ?? 1));
    return { damage: dmg, logMessage: `Sword Slash hits for ${dmg}!` };
  },
};

export const shieldGuard: SkillDef = {
  id: 'shield-guard',
  name: 'Shield Guard',
  description: 'Raise your guard for bonus block this enemy phase.',
  imageKey: 'shield-bash',
  type: 'attack',
  tags: ['melee', 'defense'],
  weaponId: 'longsword',
  maxLevel: 3,
  baseCooldown: 0,
  manaCost: 2,
  levelDescriptions: [
    'Grant +4 block (2 mana).',
    'Grant +6 block (2 mana).',
    'Grant +8 block (2 mana).',
  ],
  onUse: (_ctx, level) => ({
    grantBlock: [4, 6, 8][level - 1],
    logMessage: `Shield Guard adds +${[4, 6, 8][level - 1]} block!`,
  }),
};

export const longswordShieldBash: SkillDef = {
  id: 'longsword-shield-bash',
  name: 'Shield Bash',
  description: 'Bash with your shield, dealing damage and stunning the enemy.',
  imageKey: 'shield-bash',
  type: 'attack',
  tags: ['melee', 'stun'],
  weaponId: 'longsword',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 5,
  levelDescriptions: [
    'Deal 100% attack and stun (5 mana). CD 2.',
    'Deal 120% attack and stun (5 mana). CD 1.',
    'Deal 135% attack, stun, +4 block (5 mana).',
  ],
  onUse: (ctx, level) => {
    const mult = [1.0, 1.2, 1.35][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult);
    return {
      damage: dmg,
      stun: true,
      grantBlock: level >= 3 ? 4 : 0,
      logMessage: `Shield Bash deals ${dmg} and stuns!${level >= 3 ? ' (+4 block)' : ''}`,
    };
  },
};

export const riposte: SkillDef = {
  id: 'riposte',
  name: 'Riposte',
  description: 'Parry and counter the next enemy attack.',
  imageKey: 'shield-bash',
  type: 'attack',
  tags: ['melee'],
  weaponId: 'longsword',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 4,
  levelDescriptions: [
    'Dodge next attack, counter 60% attack (4 mana). CD 2.',
    'Dodge and counter 85% attack (4 mana). CD 1.',
    'Dodge and counter 105% attack (4 mana).',
  ],
  onUse: (ctx, level) => ({
    dodgeNext: true,
    counterOnDodge: Math.floor(ctx.player.stats.attack * [0.6, 0.85, 1.05][level - 1]),
    logMessage: 'You brace for a Riposte!',
  }),
};

export const longswordAttacks = [swordSlash, shieldGuard, longswordShieldBash, riposte];
