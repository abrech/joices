import type { FloorContext } from '../../types/events';
import type { FloorOption, RunState } from '../../types/game-state';
import { getAllEvents, getEvent } from '../../content/registries';
import { nextRandom } from '../rng';
import {
  applyPacingConstraints,
  isFirstCombatFloor,
  isBossFloor,
  buildEnemyPreview,
  buildForcedEnemyOption,
} from './PacingRules';
import { pickEnemy, buildCombatPayloadFromPick } from './EnemyPicker';
import { hasTrainingAvailable } from '../../content/events/skill';
import type { CombatPayload } from '../../types/events';

function getEventWeight(event: import('../../types/events').EventDef, ctx: FloorContext): number {
  if (event.canAppear && !event.canAppear(ctx)) return 0;
  if (typeof event.weight === 'function') return event.weight(ctx);
  return event.weight ?? 10;
}

function pickWeightedEvent(ctx: FloorContext, exclude: Set<string>): string | null {
  const events = getAllEvents().filter((e) => !exclude.has(e.id));
  const weights = events.map((e) => getEventWeight(e, ctx));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;

  let roll = ctx.rng() * total;
  for (let i = 0; i < events.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return events[i].id;
  }
  return events[events.length - 1].id;
}

/** Pick an event; if enemy already chosen this floor, exclude enemy from pool. */
function pickWeightedEventForSlot(
  ctx: FloorContext,
  exclude: Set<string>,
  enemyAlreadyPicked: boolean,
): string | null {
  const slotExclude = new Set(exclude);
  if (enemyAlreadyPicked) slotExclude.add('enemy');
  return pickWeightedEvent(ctx, slotExclude);
}

export function getOptionCount(floor: number, rng: () => number): number {
  if (floor <= 1) return 1;
  if (floor <= 3) return 2;
  if (isBossFloor(floor + 1)) {
    const base = rng() < 0.7 ? 1 : 2;
    return Math.max(2, base);
  }
  if (floor <= 9) return rng() < 0.5 ? 1 : 2;
  const r = rng();
  if (r < 0.4) return 1;
  if (r < 0.8) return 2;
  return 3;
}

function buildFloorContext(run: RunState): FloorContext {
  const rng = () => {
    const result = nextRandom(run.rngState);
    run.rngState = result.state;
    return result.value;
  };
  return {
    run,
    profile: { version: 1 },
    floor: run.floor,
    rng,
  };
}

function buildEventPayload(
  eventId: string,
  ctx: FloorContext,
): unknown {
  if (eventId === 'enemy') {
    const forceNormal = isFirstCombatFloor(ctx);
    const pick = pickEnemy(ctx, { forceNormal });
    return buildCombatPayloadFromPick(pick);
  }
  const event = getEvent(eventId);
  return event?.buildPayload?.(ctx) ?? {};
}

function buildOptionPreview(eventId: string, ctx: FloorContext, payload: unknown): string | undefined {
  if (eventId === 'enemy') {
    return buildEnemyPreview(ctx, payload as CombatPayload);
  }
  const event = getEvent(eventId);
  return event?.buildOfferPreview?.(ctx, payload);
}

function buildFloorOption(eventId: string, ctx: FloorContext): FloorOption | null {
  const event = getEvent(eventId);
  if (!event) return null;
  const payload = buildEventPayload(eventId, ctx);

  if (eventId === 'skill-training') {
    const p = payload as { skills: string[] };
    if (p.skills.length === 0) return null;
  }

  return {
    eventId: event.id,
    name: event.name,
    description: event.description,
    imageKey: event.imageKey,
    preview: buildOptionPreview(eventId, ctx, payload),
    payload,
  };
}

function pickFallbackOptions(ctx: FloorContext): FloorOption[] {
  const eventId = pickWeightedEvent(ctx, new Set());
  if (eventId) {
    const option = buildFloorOption(eventId, ctx);
    if (option) return [option];
  }

  const enemy = getEvent('enemy');
  if (enemy && getEventWeight(enemy, ctx) > 0) {
    return [buildForcedEnemyOption(ctx)];
  }

  return [];
}

export function generateFloorOptions(run: RunState): FloorOption[] {
  const ctx = buildFloorContext(run);

  if (isFirstCombatFloor(ctx)) {
    return applyPacingConstraints([], ctx);
  }

  if (isBossFloor(run.floor)) {
    const boss = getEvent('boss')!;
    const payload = boss.buildPayload?.(ctx) ?? {};
    return [{
      eventId: boss.id,
      name: boss.name,
      description: boss.description,
      imageKey: boss.imageKey,
      preview: boss.buildOfferPreview?.(ctx, payload),
      payload,
    }];
  }

  const count = getOptionCount(run.floor, ctx.rng);
  const picked = new Set<string>();
  const options: FloorOption[] = [];

  for (let i = 0; i < count; i++) {
    const enemyAlreadyPicked = picked.has('enemy');
    const eventId = pickWeightedEventForSlot(ctx, picked, enemyAlreadyPicked);
    if (!eventId) break;
    picked.add(eventId);
    const option = buildFloorOption(eventId, ctx);
    if (option) options.push(option);
  }

  if (options.length === 0) {
    return pickFallbackOptions(ctx);
  }

  return applyPacingConstraints(injectPreBossTrainingIfNeeded(options, ctx), ctx);
}

function injectPreBossTrainingIfNeeded(
  options: FloorOption[],
  ctx: FloorContext,
): FloorOption[] {
  if (!isBossFloor(ctx.floor + 1)) return options;
  if (options.some((o) => o.eventId === 'skill-training')) return options;
  if (!hasTrainingAvailable(ctx)) return options;

  const trainingOption = buildFloorOption('skill-training', ctx);
  if (!trainingOption) return options;

  const replaceCandidates = options
    .map((o, index) => ({
      index,
      weight: getEventWeight(getEvent(o.eventId)!, ctx),
      eventId: o.eventId,
    }))
    .filter((c) => c.eventId !== 'enemy');

  if (replaceCandidates.length > 0) {
    const lowest = replaceCandidates.reduce((a, b) => (a.weight <= b.weight ? a : b));
    const result = [...options];
    result[lowest.index] = trainingOption;
    return result;
  }

  if (options.length > 1) {
    const result = [...options];
    result[result.length - 1] = trainingOption;
    return result;
  }

  return options;
}
