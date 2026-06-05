import type { SkillDef } from '../../../types/definitions';
import { counterDamage, physicalDamage } from '../../../game/combat/skill-damage';

export const twinSlash: SkillDef = {
  id: 'twin-slash',
  name: 'Twin Slash',
  description: 'Quick dagger cuts. Low-cost filler.',
  imageKey: 'poison-dart',
  type: 'attack',
  tags: ['melee', 'bleed'],
  weaponId: 'twin-daggers',
  maxLevel: 3,
  baseCooldown: 0,
  manaCost: 2,
  levelDescriptions: [
    'Deal 4 + strength + bleed (2 mana).',
    'Deal 5 + strength + bleed (2 mana).',
    'Deal 6 + strength + bleed (2 mana).',
  ],
  onUse: (ctx, level) => {
    const dmg = physicalDamage(ctx, level, [4, 5, 6]);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'bleed', stacks: 2 },
      logMessage: `Twin Slash cuts for ${dmg}!`,
    };
  },
};

export const shadowStep: SkillDef = {
  id: 'dagger-shadow-step',
  name: 'Shadow Step',
  description: 'Dodge the next enemy attack and slip into position.',
  imageKey: 'shadow-step',
  type: 'attack',
  tags: ['stealth', 'melee'],
  weaponId: 'twin-daggers',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 4,
  levelDescriptions: [
    'Dodge next attack (4 mana). CD 2.',
    'Dodge and counter 2 + strength (4 mana). CD 1.',
    'Dodge and counter 5 + strength (4 mana).',
  ],
  onUse: (ctx, level) => ({
    dodgeNext: true,
    counterOnDodge: level >= 2 ? counterDamage(ctx, level, [0, 2, 5]) : 0,
    logMessage: 'You vanish with Shadow Step!',
  }),
};

export const flurry: SkillDef = {
  id: 'flurry',
  name: 'Flurry',
  description: 'A flurry of cuts that stack bleed rapidly.',
  imageKey: 'poison-dart',
  type: 'attack',
  tags: ['melee', 'bleed'],
  weaponId: 'twin-daggers',
  maxLevel: 3,
  baseCooldown: 2,
  manaCost: 4,
  levelDescriptions: [
    'Deal 3 + strength + bleed (4 mana). CD 2.',
    'Deal 5 + strength + bleed (4 mana). CD 1.',
    'Deal 7 + strength + bleed (4 mana).',
  ],
  onUse: (ctx, level) => {
    const stacks = [3, 4, 5][level - 1];
    const dmg = physicalDamage(ctx, level, [3, 5, 7]);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'bleed', stacks },
      logMessage: `Flurry shreds for ${dmg}!`,
    };
  },
};

export const twinDaggersAttacks = [twinSlash, shadowStep, flurry];
