import type { EventDef, SkillPickPayload } from '../../types/events';
import { getAllSkills } from '../registries';
import { defaultSkillFilter } from './enemy';
import { WEIGHT_SKILL_OFFER, WEIGHT_SKILL_UPGRADE } from '../../game/progression/EncounterWeights';
import { isBossFloor } from '../../game/progression/PacingRules';

function pickSkills(ctx: import('../../types/events').FloorContext, count: number, filter: typeof defaultSkillFilter): string[] {
  const owned = new Set(ctx.run.player.skills.map((s) => s.id));
  const pool = getAllSkills().filter(
    (s) => !owned.has(s.id) && filter(s, ctx),
  );
  const picked: string[] = [];
  const available = [...pool];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(ctx.rng() * available.length);
    picked.push(available[idx].id);
    available.splice(idx, 1);
  }
  return picked;
}

export const skillOfferEvent: EventDef = {
  id: 'skill-offer',
  name: 'Skill Discovery',
  description: 'Learn a new skill.',
  imageKey: 'skill',
  tags: ['skill'],
  weight: WEIGHT_SKILL_OFFER,
  canAppear: (ctx) => {
    if (ctx.floor < 2 || isBossFloor(ctx.floor)) return false;
    const owned = new Set(ctx.run.player.skills.map((s) => s.id));
    return getAllSkills().some((s) => !owned.has(s.id) && defaultSkillFilter(s, ctx));
  },
  buildPayload: (ctx) => {
    const count = ctx.floor >= 8 ? 3 : 2;
    const skills = pickSkills(ctx, count, defaultSkillFilter);
    return {
      label: 'Choose a skill to learn',
      skills,
      allowSkip: false,
    } satisfies SkillPickPayload;
  },
  buildOfferPreview: (_ctx, payload) => {
    const p = payload as SkillPickPayload;
    return p.skills.length > 0 ? `${p.skills.length} skills offered` : 'No new skills';
  },
  screen: 'skillPick',
  resolve: (ctx) => {
    if (ctx.playerChoice) {
      return [
        { type: 'addSkill', skillId: ctx.playerChoice },
        { type: 'advanceFloor' },
      ];
    }
    return [];
  },
};

export const skillUpgradeEvent: EventDef = {
  id: 'skill-upgrade',
  name: 'Skill Upgrade',
  description: 'Upgrade an existing skill.',
  imageKey: 'skill',
  tags: ['skill'],
  weight: WEIGHT_SKILL_UPGRADE,
  canAppear: (ctx) => {
    if (ctx.floor < 2 || isBossFloor(ctx.floor)) return false;
    return ctx.run.player.skills.some((s) => {
      const def = getAllSkills().find((d) => d.id === s.id);
      return def && s.level < def.maxLevel;
    });
  },
  buildPayload: (ctx) => {
    const upgradeable = ctx.run.player.skills.filter((s) => {
      const def = getAllSkills().find((d) => d.id === s.id);
      return def && s.level < def.maxLevel;
    });
    const skills = upgradeable.map((s) => s.id);
    return {
      label: 'Choose a skill to upgrade',
      skills,
      allowSkip: true,
    } satisfies SkillPickPayload;
  },
  buildOfferPreview: (_ctx, payload) => {
    const p = payload as SkillPickPayload;
    return `Upgrade one of ${p.skills.length} skills`;
  },
  screen: 'skillPick',
  resolve: (ctx) => {
    if (ctx.playerChoice === '__skip__') {
      return [{ type: 'advanceFloor' }];
    }
    if (ctx.playerChoice) {
      return [
        { type: 'upgradeSkill', skillId: ctx.playerChoice },
        { type: 'advanceFloor' },
      ];
    }
    return [];
  },
};
