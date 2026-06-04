import type { EventDef, SkillPickPayload } from '../../types/events';
import { getAllSkills, getSkill } from '../registries';
import { WEIGHT_SKILL } from '../../game/progression/EncounterWeights';
import { isBossFloor } from '../../game/progression/PacingRules';
import { pickSkills } from '../../game/systems/SkillPool';
import {
  filterTrainingChoices,
  isUpgradeable,
  learnableSkillFilter,
} from '../../game/systems/SkillFilters';

function getUpgradeableSkillIds(ctx: import('../../types/events').FloorContext): string[] {
  return ctx.run.player.skills
    .filter((s) => {
      const def = getSkill(s.id);
      return def && isUpgradeable(s, def);
    })
    .map((s) => s.id);
}

function shuffleIds(ids: string[], rng: () => number): string[] {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildTrainingChoices(ctx: import('../../types/events').FloorContext): string[] {
  const newSkills = pickSkills(ctx, 2, learnableSkillFilter);
  const upgrades = shuffleIds(getUpgradeableSkillIds(ctx), ctx.rng);
  const choices: string[] = [...newSkills];

  for (const id of upgrades) {
    if (choices.length >= 3) break;
    if (!choices.includes(id)) choices.push(id);
  }

  if (choices.length < 3 && newSkills.length === 0) {
    for (const id of upgrades) {
      if (choices.length >= 3) break;
      choices.push(id);
    }
  }

  if (choices.length < 3) {
    const extra = pickSkills(ctx, 3 - choices.length, learnableSkillFilter);
    for (const id of extra) {
      if (!choices.includes(id)) choices.push(id);
    }
  }

  return filterTrainingChoices(ctx, choices.slice(0, 3));
}

function hasLearnableSkill(ctx: import('../../types/events').FloorContext): boolean {
  const owned = new Set(ctx.run.player.skills.map((s) => s.id));
  return getAllSkills().some((s) => !owned.has(s.id) && learnableSkillFilter(s, ctx));
}

export const skillTrainingEvent: EventDef = {
  id: 'skill-training',
  name: 'Training',
  description: 'Learn a new attack or passive, or upgrade one you know.',
  imageKey: 'skill',
  tags: ['skill'],
  weight: WEIGHT_SKILL,
  canAppear: (ctx) => {
    if (ctx.floor < 2 || isBossFloor(ctx.floor)) return false;
    return hasLearnableSkill(ctx) || getUpgradeableSkillIds(ctx).length > 0;
  },
  buildPayload: (ctx) => {
    const skills = buildTrainingChoices(ctx);
    return {
      label: 'Choose an attack or passive',
      skills,
      allowSkip: true,
    } satisfies SkillPickPayload;
  },
  buildOfferPreview: (_ctx, payload) => {
    const p = payload as SkillPickPayload;
    return p.skills.length > 0 ? 'New attacks, passives, and upgrades available' : 'No training available';
  },
  screen: 'skillPick',
  resolve: (ctx) => {
    if (ctx.playerChoice === '__skip__') {
      return [{ type: 'advanceFloor' }];
    }
    if (!ctx.playerChoice) return [];

    const owned = ctx.run.player.skills.some((s) => s.id === ctx.playerChoice);
    if (owned) {
      return [
        { type: 'upgradeSkill', skillId: ctx.playerChoice },
        { type: 'advanceFloor' },
      ];
    }
    return [
      { type: 'addSkill', skillId: ctx.playerChoice },
      { type: 'advanceFloor' },
    ];
  },
};
