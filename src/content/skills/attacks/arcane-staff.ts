import type { SkillDef } from '../../../types/definitions';
import { spellDamage } from '../../../game/combat/skill-damage';

export const fireball: SkillDef = {
  id: 'staff-fireball',
  name: 'Fireball',
  description: 'Small explosive fireball. Weak AoE filler.',
  imageKey: 'fireball',
  type: 'attack',
  tags: ['fire', 'magic', 'aoe'],
  weaponId: 'arcane-staff',
  maxLevel: 3,
  baseCooldown: 0,
  manaCost: 2,
  levelDescriptions: [
    'Deal 1 + spell + burn (2 mana).',
    'Deal 2 + spell + burn (2 mana).',
    'Deal 3 + spell + burn (2 mana).',
  ],
  onUse: (ctx, level) => {
    const dmg = spellDamage(ctx, level, [1, 2, 3]);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'burn', stacks: level >= 2 ? 2 : 1 },
      aoe: true,
      logMessage: `Fireball explodes for ${dmg} on each foe!`,
    };
  },
};

export const flameWave: SkillDef = {
  id: 'flame-wave',
  name: 'Flame Wave',
  description: 'Wash enemies in fire, stacking burn.',
  imageKey: 'fireball',
  type: 'attack',
  tags: ['fire', 'magic', 'aoe'],
  weaponId: 'arcane-staff',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 6,
  levelDescriptions: [
    'Deal 6 + spell + burn (6 mana). CD 2.',
    'Deal 8 + spell + burn (6 mana). CD 1.',
    'Deal 10 + spell + burn (6 mana).',
  ],
  onUse: (ctx, level) => {
    const stacks = [2, 3, 3][level - 1];
    const dmg = spellDamage(ctx, level, [6, 8, 10]);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'burn', stacks },
      aoe: true,
      logMessage: `Flame Wave scorches each foe for ${dmg}!`,
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
  baseCooldown: 2,
  manaCost: 4,
  levelDescriptions: [
    'Deal 5 + spell + burn (4 mana). CD 2.',
    'Deal 7 + spell + burn (4 mana). CD 1.',
    'Deal 9 + spell + burn (4 mana).',
  ],
  onUse: (ctx, level) => {
    let stacks = [3, 4, 4][level - 1];
    const dmg = spellDamage(ctx, level, [5, 7, 9]);
    const target =
      ctx.combat.enemies[ctx.combat.targetIndex] ?? ctx.combat.enemies[0];
    const existingBurn = target?.statuses.find((s) => s.type === 'burn');
    if (existingBurn) {
      stacks += Math.floor(existingBurn.stacks * 0.5);
    }
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'burn', stacks },
      logMessage: existingBurn
        ? `Scorch amplifies burn and deals ${dmg}!`
        : `Scorch sears for ${dmg}!`,
    };
  },
};

export const arcaneStaffAttacks = [fireball, flameWave, scorch];
