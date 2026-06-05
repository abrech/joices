import type { EventDef, FloorContext, SkillPickPayload } from '../../types/events';
import { getAllSkills, getSkill } from '../../content/registries';
import { WEIGHT_SKILL } from '../progression/EncounterWeights';
import { isBossFloor } from '../progression/PacingRules';
import { countWeaponAttacks, pickSkills, pickWeaponAttacks } from '../systems/SkillPool';
import {
  filterTrainingChoices,
  isUpgradeable,
  learnableSkillFilter,
} from '../systems/SkillFilters';

function getUpgradeableSkillIds(ctx: FloorContext): string[] {
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

export function buildTrainingChoices(ctx: FloorContext): string[] {
  const choices: string[] = [];
  if (ctx.floor >= 4 && countWeaponAttacks(ctx) < 2) {
    choices.push(...pickWeaponAttacks(ctx, 1));
  }

  const newSkills = pickSkills(ctx, 2, learnableSkillFilter);
  const upgrades = shuffleIds(getUpgradeableSkillIds(ctx), ctx.rng);
  for (const id of newSkills) {
    if (!choices.includes(id)) choices.push(id);
  }

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

export function hasTrainingAvailable(ctx: FloorContext): boolean {
  const owned = new Set(ctx.run.player.skills.map((s) => s.id));
  return (
    getAllSkills().some((s) => !owned.has(s.id) && learnableSkillFilter(s, ctx)) ||
    getUpgradeableSkillIds(ctx).length > 0
  );
}

export function canAppearTraining(ctx: FloorContext): boolean {
  if (ctx.floor < 2 || isBossFloor(ctx.floor)) return false;
  if (ctx.floor - ctx.run.pacing.lastTrainingFloor < 2) return false;
  return hasTrainingAvailable(ctx);
}

export function buildTrainingPayload(ctx: FloorContext): SkillPickPayload {
  const skills = buildTrainingChoices(ctx);
  return {
    label: 'Choose an attack or passive',
    skills,
    allowSkip: true,
  };
}

export const skillTrainingEventMeta: Pick<
  EventDef,
  'id' | 'name' | 'description' | 'imageKey' | 'tags' | 'weight' | 'screen' | 'resolve'
> = {
  id: 'skill-training',
  name: 'Training',
  description: 'Learn a new attack or passive, or upgrade one you know.',
  imageKey: 'skill',
  tags: ['skill'],
  weight: WEIGHT_SKILL,
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
