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
    'Deal 110% spell power damage. Always available.',
    'Deal 130% spell power damage. Always available.',
    'Deal 150% spell power damage. Always available.',
  ],
  onUse: (ctx, level) => {
    const mult = [1.1, 1.3, 1.5][level - 1];
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
    const mult = [0.9, 1.05, 1.2][level - 1];
    const stacks = level >= 3 ? 3 : 2;
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
    const mult = [1.25, 1.45, 1.7][level - 1];
    const dmg = Math.floor(ctx.player.stats.spellPower * mult);
    return { damage: dmg, logMessage: `Pierce Ray burns through for ${dmg}!` };
  },
};

export const focusWandAttacks = [arcaneBolt, focusBurn, pierceRay];
