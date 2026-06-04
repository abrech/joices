import type { SkillDef } from '../../types/definitions';

export const powerStrike: SkillDef = {
  id: 'power-strike',
  name: 'Power Strike',
  description: 'A heavy melee blow dealing 150% attack damage.',
  imageKey: 'power-strike',
  type: 'active',
  tags: ['melee'],
  classId: 'warrior',
  maxLevel: 3,
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 150% attack damage. Cooldown: 3 turns.',
    'Deal 175% attack damage. Cooldown: 2 turns.',
    'Deal 200% attack damage and gain 2 block. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [1.5, 1.75, 2.0][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult * (ctx.synergies.damageMultiplier ?? 1));
    return { damage: dmg, logMessage: `Power Strike hits for ${dmg}!` };
  },
};

export const fireball: SkillDef = {
  id: 'fireball',
  name: 'Fireball',
  description: 'Hurl a ball of fire dealing spell power as damage and applying burn.',
  imageKey: 'fireball',
  type: 'active',
  tags: ['fire', 'magic', 'aoe'],
  classId: 'mage',
  maxLevel: 3,
  baseCooldown: 3,
  levelDescriptions: [
    'Deal spell power damage + 1 burn. Cooldown: 3 turns.',
    'Deal 125% spell power + 2 burn. Cooldown: 2 turns.',
    'Deal 150% spell power + 2 burn. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [1, 1.25, 1.5][level - 1];
    const dmg = Math.floor(ctx.player.stats.spellPower * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'burn', stacks: level >= 2 ? 2 : 1 },
      logMessage: `Fireball explodes for ${dmg} damage!`,
    };
  },
};

export const shadowStep: SkillDef = {
  id: 'shadow-step',
  name: 'Shadow Step',
  description: 'Dodge the next enemy attack completely.',
  imageKey: 'shadow-step',
  type: 'active',
  tags: ['stealth'],
  classId: 'rogue',
  maxLevel: 3,
  baseCooldown: 3,
  levelDescriptions: [
    'Dodge the next attack. Cooldown: 3 turns.',
    'Dodge and counter 50% attack. Cooldown: 2 turns.',
    'Dodge the next 2 attacks. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => ({
    dodgeNext: true,
    damage: level >= 2 ? Math.floor(ctx.player.stats.attack * 0.5) : 0,
    logMessage: level >= 3 ? 'You vanish into shadow! (2 dodges)' : 'You vanish into shadow!',
  }),
};

export const poisonDart: SkillDef = {
  id: 'poison-dart',
  name: 'Poison Dart',
  description: 'Throw a poisoned dart applying poison stacks.',
  imageKey: 'poison-dart',
  type: 'active',
  tags: ['poison', 'ranged'],
  classId: 'rogue',
  maxLevel: 3,
  baseCooldown: 3,
  levelDescriptions: [
    'Deal 80% attack + 2 poison. Cooldown: 3 turns.',
    'Deal 100% attack + 3 poison. Cooldown: 2 turns.',
    'Deal 120% attack + 4 poison. Cooldown: 1 turn.',
  ],
  onUse: (ctx, level) => {
    const mult = [0.8, 1.0, 1.2][level - 1];
    const stacks = [2, 3, 4][level - 1];
    const dmg = Math.floor(ctx.player.stats.attack * mult);
    return {
      damage: dmg,
      applyStatus: { target: 'enemy', type: 'poison', stacks },
      logMessage: `Poison dart hits for ${dmg}!`,
    };
  },
};

export const shieldBash: SkillDef = {
  id: 'shield-bash',
  name: 'Shield Bash',
  description: 'Bash with your shield, dealing damage and stunning the enemy.',
  imageKey: 'shield-bash',
  type: 'active',
  tags: ['melee', 'stun'],
  classId: 'warrior',
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
      logMessage: `Shield bash deals ${dmg} and stuns the enemy!`,
    };
  },
};

export const thickSkin: SkillDef = {
  id: 'thick-skin',
  name: 'Thick Skin',
  description: 'Permanently increases max HP.',
  imageKey: 'thick-skin',
  type: 'passive',
  tags: [],
  classId: 'warrior',
  maxLevel: 3,
  levelDescriptions: ['+15 max HP.', '+25 max HP.', '+40 max HP.'],
  onPassive: (_ctx, level) => [{ stat: 'maxHp', flat: [15, 25, 40][level - 1] }],
};

export const keenEye: SkillDef = {
  id: 'keen-eye',
  name: 'Keen Eye',
  description: 'Increases critical hit chance.',
  imageKey: 'keen-eye',
  type: 'passive',
  tags: ['crit'],
  classId: 'rogue',
  maxLevel: 3,
  levelDescriptions: ['+5% crit chance.', '+8% crit chance.', '+12% crit chance.'],
  onPassive: (_ctx, level) => [{ stat: 'critChance', flat: [0.05, 0.08, 0.12][level - 1] }],
};

export const burningAura: SkillDef = {
  id: 'burning-aura',
  name: 'Burning Aura',
  description: 'Enemies start combat with burn stacks.',
  imageKey: 'burning-aura',
  type: 'passive',
  tags: ['fire'],
  classId: 'mage',
  maxLevel: 3,
  levelDescriptions: [
    'Enemies start with 1 burn.',
    'Enemies start with 2 burn.',
    'Enemies start with 3 burn.',
  ],
  combatStart: (_ctx, level) => ({
    applyStatus: { target: 'enemy', type: 'burn', stacks: level },
    logMessage: `Burning aura scorches the enemy! (${level} burn)`,
  }),
};

export const hemophilia: SkillDef = {
  id: 'hemophilia',
  name: 'Hemophilia',
  description: 'Bleed effects last longer and deal more damage.',
  imageKey: 'hemophilia',
  type: 'passive',
  tags: ['bleed'],
  classId: 'rogue',
  maxLevel: 3,
  levelDescriptions: [
    'Bleed lasts +1 turn.',
    'Bleed lasts +1 turn, +1 stack on apply.',
    'Bleed lasts +2 turns, +1 stack on apply.',
  ],
  /** Bleed apply/damage bonuses handled in combat (applyBleedStatus + bleedBonusPerStack). */
  onPassive: () => [],
};

export const arcaneBattery: SkillDef = {
  id: 'arcane-battery',
  name: 'Arcane Battery',
  description: 'Gain spell power for each magic-tagged skill owned.',
  imageKey: 'arcane-battery',
  type: 'passive',
  tags: ['magic'],
  classId: 'mage',
  maxLevel: 3,
  levelDescriptions: [
    '+2 spell power per magic skill.',
    '+3 spell power per magic skill.',
    '+5 spell power per magic skill.',
  ],
  onPassive: (ctx, level) => {
    const perSkill = [2, 3, 5][level - 1];
    let count = 0;
    for (const os of ctx.ownedSkills) {
      const skill = allSkills.find((s) => s.id === os.id);
      if (skill?.tags.includes('magic')) count++;
    }
    return [{ stat: 'spellPower', flat: count * perSkill }];
  },
};

export const allSkills = [
  powerStrike,
  fireball,
  shadowStep,
  poisonDart,
  shieldBash,
  thickSkin,
  keenEye,
  burningAura,
  hemophilia,
  arcaneBattery,
];
