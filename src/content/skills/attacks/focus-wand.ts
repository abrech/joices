import type { SkillDef } from '../../../types/definitions';

export const arcaneBolt: SkillDef = {
  id: 'arcane-bolt',
  name: 'Arcane Bolt',
  description: 'Fast wand bolt. Low-cost filler.',
  imageKey: 'fireball',
  type: 'attack',
  tags: ['magic'],
  weaponId: 'focus-wand',
  maxLevel: 3,
  baseCooldown: 0,
  manaCost: 2,
  levelDescriptions: [
    'Deal 55% spell power (2 mana).',
    'Deal 70% spell power (2 mana).',
    'Deal 85% spell power (2 mana).',
  ],
  onUse: (ctx, level) => {
    const mult = [0.55, 0.7, 0.85][level - 1];
    const dmg = Math.floor(ctx.player.stats.spellPower * mult);
    return { damage: dmg, logMessage: `Arcane Bolt strikes for ${dmg}!` };
  },
};

export const focusBurn: SkillDef = {
  id: 'focus-burn',
  name: 'Focus Burn',
  description: 'Precise flame that applies burn stacks.',
  imageKey: 'fireball',
  type: 'attack',
  tags: ['fire', 'magic'],
  weaponId: 'focus-wand',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 4,
  levelDescriptions: [
    'Deal 95% spell power + burn (4 mana). CD 2.',
    'Deal 115% spell power + burn (4 mana). CD 1.',
    'Deal 135% spell power + burn (4 mana).',
  ],
  onUse: (ctx, level) => {
    const mult = [0.95, 1.15, 1.35][level - 1];
    const stacks = [3, 3, 4][level - 1];
    const dmg = Math.floor(ctx.player.stats.spellPower * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'burn', stacks },
      logMessage: `Focus Burn hits for ${dmg}!`,
    };
  },
};

export const pierceRay: SkillDef = {
  id: 'pierce-ray',
  name: 'Pierce Ray',
  description: 'A piercing ray that ignores part of enemy defense.',
  imageKey: 'arcane-battery',
  type: 'attack',
  tags: ['magic', 'pierce'],
  weaponId: 'focus-wand',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 5,
  levelDescriptions: [
    'Deal 110% spell power (5 mana). CD 2.',
    'Deal 130% spell power (5 mana). CD 1.',
    'Deal 155% spell power (5 mana).',
  ],
  onUse: (ctx, level) => {
    const mult = [1.1, 1.3, 1.55][level - 1];
    const dmg = Math.floor(ctx.player.stats.spellPower * mult);
    return {
      damage: dmg,
      pierceNext: true,
      logMessage: `Pierce Ray burns through for ${dmg}!`,
    };
  },
};

export const focusWandAttacks = [arcaneBolt, focusBurn, pierceRay];
