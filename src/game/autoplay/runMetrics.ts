import type { GameState, RunAction, RunRecord } from '../../types/game-state';
import { getWeapon } from '../../content/registries';
import { getAttackSkills } from '../systems/SkillSystem';

export type StuckReason =
  | 'combat_no_progress'
  | 'shop_no_progress'
  | 'event_no_progress'
  | 'max_steps'
  | 'unknown';

export interface AutoplayRunMetrics {
  skillCount: number;
  attackCount: number;
  passiveCount: number;
  basicSpamRatio: number;
  trainingVisits: number;
  skillsSkipped: number;
  shopBuys: number;
  hpAtEnd: number;
  goldAtEnd: number;
  stuck: boolean;
  stuckReason?: StuckReason;
  replayOk?: boolean;
  replayDiffs?: string[];
}

export function fingerprint(state: GameState): string {
  const { run } = state;
  return JSON.stringify({
    phase: run.phase,
    floor: run.floor,
    hp: run.player.hp,
    gold: run.player.gold,
    combatTurn: run.combat?.turn,
    combatFinished: run.combat?.finished,
    screen: run.activeEvent?.screen,
    optionCount: run.floorOptions.length,
    shopItems: (run.activeEvent?.payload as { items?: unknown[] } | undefined)?.items?.length,
  });
}

export function computeMetrics(
  state: GameState,
  actions: RunAction[],
  opts: { stuck: boolean; stuckReason?: StuckReason; replayOk?: boolean; replayDiffs?: string[] },
): AutoplayRunMetrics {
  const basicId = getWeapon(state.run.player.weaponId)?.starterAttackId;
  const attacks = getAttackSkills(state.run);
  const passives = state.run.player.skills.filter(
    (s) => !attacks.some((a) => a.id === s.id),
  );

  let combatSkills = 0;
  let basicUses = 0;
  let trainingVisits = 0;
  let skillsSkipped = 0;
  let shopBuys = 0;

  for (const a of actions) {
    if (a.kind === 'combatSkill') {
      combatSkills++;
      if (a.skillId === basicId) basicUses++;
    }
    if (a.kind === 'pickFloor' && a.eventId === 'skill-training') trainingVisits++;
    if (a.kind === 'skipSkillPick') skillsSkipped++;
    if (a.kind === 'buyShop') shopBuys++;
  }

  return {
    skillCount: state.run.player.skills.length,
    attackCount: attacks.length,
    passiveCount: passives.length,
    basicSpamRatio: combatSkills > 0 ? basicUses / combatSkills : 0,
    trainingVisits,
    skillsSkipped,
    shopBuys,
    hpAtEnd: state.run.player.hp,
    goldAtEnd: state.run.player.gold,
    stuck: opts.stuck,
    stuckReason: opts.stuckReason,
    replayOk: opts.replayOk,
    replayDiffs: opts.replayDiffs,
  };
}

export function metricsFromRecord(
  record: RunRecord,
  metrics: AutoplayRunMetrics,
): Record<string, unknown> {
  return {
    id: record.id,
    victory: record.victory,
    floorReached: record.floorReached,
    classId: record.classId,
    weaponId: record.weaponId,
    actionCount: record.actions.length,
    runGoldEarned: record.runGoldEarned,
    ...metrics,
  };
}
