import type { SkillDef } from '../../../types/definitions';
import { counterDamage, physicalDamage } from '../../../game/combat/skill-damage';

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
    'Deal 3 + strength (2 mana).',
    'Deal 4 + strength (2 mana).',
    'Deal 5 + strength (2 mana).',
  ],
  onUse: (ctx, level) => {
    const dmg = physicalDamage(ctx, level, [3, 4, 5]);
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
    'Deal 6 + strength and stun (5 mana). CD 2.',
    'Deal 8 + strength and stun (5 mana). CD 1.',
    'Deal 10 + strength, stun, +4 block (5 mana).',
  ],
  onUse: (ctx, level) => {
    const dmg = physicalDamage(ctx, level, [6, 8, 10]);
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
    'Dodge next attack (4 mana). CD 2.',
    'Dodge and counter 2 + strength (4 mana). CD 1.',
    'Dodge and counter 4 + strength (4 mana).',
  ],
  onUse: (ctx, level) => ({
    dodgeNext: true,
    counterOnDodge: level >= 2 ? counterDamage(ctx, level, [0, 2, 4]) : 0,
    logMessage: 'You brace for a Riposte!',
  }),
};

export const longswordAttacks = [swordSlash, shieldGuard, longswordShieldBash, riposte];
