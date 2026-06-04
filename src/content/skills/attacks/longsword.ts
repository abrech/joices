import type { SkillDef } from '../../../types/definitions';

export const swordSlash: SkillDef = {
  id: 'sword-slash',
  name: 'Sword Slash',
  description: 'Your default longsword strike. Always available.',
  imageKey: 'power-strike',
  type: 'attack',
  tags: ['melee'],
  weaponId: 'longsword',
  maxLevel: 3,
  baseCooldown: 0,
  levelDescriptions: [
    'Deal 90% attack damage. Always available.',
    'Deal 105% attack damage. Always available.',
    'Deal 120% attack damage. Always available.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.9, 1.05, 1.2][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult * (ctx.synergies.damageMultiplier ?? 1));
    return { damage: dmg, logMessage: `Sword Slash hits for ${dmg}!` };
  },
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
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 80% attack and stun. Cooldown: 3 turns.',
    'Deal 100% attack and stun. Cooldown: 2 turns.',
    'Deal 100% attack, stun, +4 block. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = level >= 2 ? 1.0 : 0.8;
    const dmg = Math.floor(ctx.player.stats.attack * mult);
    return {
      damage: dmg,
      stun: true,
      logMessage: `Shield Bash deals ${dmg} and stuns the enemy!`,
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
  baseCooldown: 3,
  levelDescriptions: [
    'Dodge next attack, counter 50% attack. Cooldown: 3 turns.',
    'Dodge and counter 75% attack. Cooldown: 2 turns.',
    'Dodge and counter 100% attack. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => ({
    dodgeNext: true,
    damage: Math.floor(ctx.player.stats.attack * [0.5, 0.75, 1.0][level - 1]),
    logMessage: 'You brace for a Riposte!',
  }),
};

export const longswordAttacks = [swordSlash, longswordShieldBash, riposte];
