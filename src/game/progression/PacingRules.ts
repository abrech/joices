import type { FloorContext } from '../../types/events';
import type { CombatPayload } from '../../types/events';
import type { FloorOption } from '../../types/game-state';
import { getEvent, getEnemy } from '../../content/registries';
import { pickEnemy, buildCombatPayloadFromPick } from './EnemyPicker';
import { scaleEnemyGold } from './Scaling';

export const BOSS_INTERVAL = 5;
export const BOSS_FIRST_FLOOR = 10;

export function isBossFloor(floor: number): boolean {
  return floor >= BOSS_FIRST_FLOOR && floor % BOSS_INTERVAL === 0;
}

export function isFirstCombatFloor(ctx: FloorContext): boolean {
  return ctx.floor === 1 && ctx.run.pacing.combatsThisRun === 0;
}

export function buildEnemyPreview(ctx: FloorContext, payload: CombatPayload): string {
  const ids = payload.enemyIds ?? [payload.enemyId];
  const names = ids
    .map((id) => getEnemy(id)?.name ?? 'Enemy')
    .join(', ');
  let goldLow = 0;
  let goldHigh = 0;
  for (const id of ids) {
    const enemy = getEnemy(id);
    if (!enemy) continue;
    const gold = scaleEnemyGold(enemy.goldDrop, ctx.floor);
    goldLow += gold[0];
    goldHigh += gold[1];
  }
  const eliteLabel = payload.isElite ? ' · Elite' : '';
  const countLabel = ids.length > 1 ? ` (×${ids.length})` : '';
  return `${names}${countLabel}${eliteLabel} · ~${goldLow}-${goldHigh} gold`;
}

export function buildForcedEnemyOption(ctx: FloorContext): FloorOption {
  const event = getEvent('enemy')!;
  const forceNormal = isFirstCombatFloor(ctx);
  const pick = pickEnemy(ctx, { forceNormal });
  const payload = buildCombatPayloadFromPick(pick);

  return {
    eventId: event.id,
    name: event.name,
    description: event.description,
    imageKey: event.imageKey,
    preview: buildEnemyPreview(ctx, payload),
    payload,
  };
}

export function applyPacingConstraints(options: FloorOption[], ctx: FloorContext): FloorOption[] {
  if (isFirstCombatFloor(ctx)) {
    return [buildForcedEnemyOption(ctx)];
  }
  return options;
}
