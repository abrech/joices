import type { SkillDef, StatModifier } from '../../../types/definitions';
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
  description: 'Expands your mana pool and recovery.',
  imageKey: 'arcane-battery',
  type: 'passive',
  tags: ['magic'],
  classId: 'mage',
  maxLevel: 3,
  levelDescriptions: [
    '+2 max mana.',
    '+3 max mana, +1 mana regen.',
    '+4 max mana, +1 mana regen.',
  ],
  onPassive: (_ctx, level) => {
    const maxMana = [2, 3, 4][level - 1];
    const mods: StatModifier[] = [{ stat: 'maxMana', flat: maxMana }];
    if (level >= 2) mods.push({ stat: 'manaRegen', flat: 1 });
    return mods;
  },
};

export const emberMind: SkillDef = {
  id: 'ember-mind',
  name: 'Ember Mind',
  description: 'Spell grows with your mastery of fire.',
  imageKey: 'burning-aura',
  type: 'passive',
  tags: ['fire', 'magic'],
  classId: 'mage',
  maxLevel: 3,
  levelDescriptions: [
    '+3 spell per fire-tagged ability.',
    '+5 spell per fire-tagged ability.',
    '+8 spell per fire-tagged ability.',
  ],
  onPassive: (ctx, level) => {
    const perSkill = [3, 5, 8][level - 1];
    let count = 0;
    for (const os of ctx.ownedSkills) {
      const skill = getSkill(os.id);
      if (skill?.tags.includes('fire')) count++;
    }
    return [{ stat: 'spell', flat: count * perSkill }];
  },
};

export const magePassives = [burningAura, arcaneBattery, emberMind];
