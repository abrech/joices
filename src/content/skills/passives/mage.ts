import type { SkillDef } from '../../../types/definitions';
import { getSkill } from '../../registries';

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
    logMessage: `Burning Aura scorches the enemy! (${level} burn)`,
  }),
};

export const arcaneBattery: SkillDef = {
  id: 'arcane-battery',
  name: 'Arcane Battery',
  description: 'Gain spell power for each magic-tagged ability owned.',
  imageKey: 'arcane-battery',
  type: 'passive',
  tags: ['magic'],
  classId: 'mage',
  maxLevel: 3,
  levelDescriptions: [
    '+2 spell power per magic ability.',
    '+3 spell power per magic ability.',
    '+5 spell power per magic ability.',
  ],
  onPassive: (ctx, level) => {
    const perSkill = [2, 3, 5][level - 1];
    let count = 0;
    for (const os of ctx.ownedSkills) {
      const skill = getSkill(os.id);
      if (skill?.tags.includes('magic')) count++;
    }
    return [{ stat: 'spellPower', flat: count * perSkill }];
  },
};

export const emberMind: SkillDef = {
  id: 'ember-mind',
  name: 'Ember Mind',
  description: 'Spell power grows with your mastery of fire.',
  imageKey: 'burning-aura',
  type: 'passive',
  tags: ['fire', 'magic'],
  classId: 'mage',
  maxLevel: 3,
  levelDescriptions: [
    '+3 spell power per fire-tagged ability.',
    '+5 spell power per fire-tagged ability.',
    '+8 spell power per fire-tagged ability.',
  ],
  onPassive: (ctx, level) => {
    const perSkill = [3, 5, 8][level - 1];
    let count = 0;
    for (const os of ctx.ownedSkills) {
      const skill = getSkill(os.id);
      if (skill?.tags.includes('fire')) count++;
    }
    return [{ stat: 'spellPower', flat: count * perSkill }];
  },
};

export const magePassives = [burningAura, arcaneBattery, emberMind];
