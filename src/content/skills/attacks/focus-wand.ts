import type { SkillDef } from '../../../types/definitions';

export const arcaneBolt: SkillDef = {
  id: 'arcane-bolt',
  name: 'Arcane Bolt',
  description: 'Your default wand bolt. Always available.',
  imageKey: 'fireball',
  type: 'attack',
  tags: ['magic'],
  weaponId: 'focus-wand',
  maxLevel: 3,
  baseCooldown: 0,
  levelDescriptions: [
    'Deal 95% spell power damage. Always available.',
    'Deal 115% spell power damage. Always available.',
    'Deal 135% spell power damage. Always available.',
  ],
  onUse: (ctx, level) => {
    const mult = [1.0, 1.2, 1.4][level - 1];
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
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 90% spell power + 2 burn. Cooldown: 3 turns.',
    'Deal 105% spell power + 2 burn. Cooldown: 2 turns.',
    'Deal 120% spell power + 3 burn. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.95, 1.12, 1.28][level - 1];
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
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 125% spell power damage. Cooldown: 3 turns.',
    'Deal 145% spell power damage. Cooldown: 2 turns.',
    'Deal 170% spell power damage. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [1.3, 1.5, 1.75][level - 1];
    const dmg = Math.floor(ctx.player.stats.spellPower * mult);
    return {
      damage: dmg,
      pierceNext: true,
      logMessage: `Pierce Ray burns through for ${dmg}!`,
    };
  },
};

export const focusWandAttacks = [arcaneBolt, focusBurn, pierceRay];
