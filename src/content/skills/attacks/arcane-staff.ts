import type { SkillDef } from '../../../types/definitions';

export const fireball: SkillDef = {
  id: 'staff-fireball',
  name: 'Fireball',
  description: 'Your default staff cast. Always available.',
  imageKey: 'fireball',
  type: 'attack',
  tags: ['fire', 'magic', 'aoe'],
  weaponId: 'arcane-staff',
  maxLevel: 3,
  baseCooldown: 0,
  levelDescriptions: [
    'Deal 85% spell power + 1 burn. Always available.',
    'Deal 110% spell power + 2 burn. Always available.',
    'Deal 135% spell power + 2 burn. Always available.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.85, 1.1, 1.35][level - 1];
    const dmg = Math.floor(ctx.player.stats.spellPower * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'burn', stacks: level >= 2 ? 2 : 1 },
      logMessage: `Fireball explodes for ${dmg} damage!`,
    };
  },
};

export const flameWave: SkillDef = {
  id: 'flame-wave',
  name: 'Flame Wave',
  description: 'Wash the enemy in fire, stacking burn.',
  imageKey: 'fireball',
  type: 'attack',
  tags: ['fire', 'magic', 'aoe'],
  weaponId: 'arcane-staff',
  maxLevel: 3,
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 80% spell power + 2 burn. Cooldown: 3 turns.',
    'Deal 95% spell power + 3 burn. Cooldown: 2 turns.',
    'Deal 110% spell power + 3 burn. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.8, 0.95, 1.1][level - 1];
    const stacks = [2, 3, 3][level - 1];
    const dmg = Math.floor(ctx.player.stats.spellPower * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'burn', stacks },
      logMessage: `Flame Wave scorches for ${dmg}!`,
    };
  },
};

export const scorch: SkillDef = {
  id: 'scorch',
  name: 'Scorch',
  description: 'Intense heat that amplifies existing burn.',
  imageKey: 'burning-aura',
  type: 'attack',
  tags: ['fire', 'magic'],
  weaponId: 'arcane-staff',
  maxLevel: 3,
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 70% spell power + 3 burn. Cooldown: 3 turns.',
    'Deal 85% spell power + 4 burn. Cooldown: 2 turns.',
    'Deal 100% spell power + 4 burn. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.7, 0.85, 1.0][level - 1];
    const stacks = [3, 4, 4][level - 1];
    const dmg = Math.floor(ctx.player.stats.spellPower * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'burn', stacks },
      logMessage: `Scorch sears for ${dmg}!`,
    };
  },
};

export const arcaneStaffAttacks = [fireball, flameWave, scorch];
