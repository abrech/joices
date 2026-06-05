import type { SkillDef } from '../../../types/definitions';
import { spellDamage } from '../../../game/combat/skill-damage';

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
    'Deal 1 + spell (2 mana).',
    'Deal 2 + spell (2 mana).',
    'Deal 3 + spell (2 mana).',
  ],
  onUse: (ctx, level) => {
    const dmg = spellDamage(ctx, level, [1, 2, 3]);
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
    'Deal 5 + spell + burn (4 mana). CD 2.',
    'Deal 7 + spell + burn (4 mana). CD 1.',
    'Deal 9 + spell + burn (4 mana).',
  ],
  onUse: (ctx, level) => {
    const stacks = [3, 3, 4][level - 1];
    const dmg = spellDamage(ctx, level, [5, 7, 9]);
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
    'Deal 6 + spell (5 mana). CD 2.',
    'Deal 8 + spell (5 mana). CD 1.',
    'Deal 10 + spell (5 mana).',
  ],
  onUse: (ctx, level) => {
    const dmg = spellDamage(ctx, level, [6, 8, 10]);
    return {
      damage: dmg,
      pierceNext: true,
      logMessage: `Pierce Ray burns through for ${dmg}!`,
    };
  },
};

export const focusWandAttacks = [arcaneBolt, focusBurn, pierceRay];
