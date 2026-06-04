import type { EnemyDef } from '../../types/definitions';
import type { FloorContext } from '../../types/events';
import { regularEnemies } from '../../content/enemies';
import { eliteChanceForFloor } from './Scaling';

export interface PickedEnemy {
  enemyId: string;
  isElite: boolean;
}

export interface PickedEnemyGroup {
  enemyIds: string[];
  isElite: boolean;
}

export interface PickEnemyOptions {
  forceNormal?: boolean;
}

function pickFromPool(pool: EnemyDef[], rng: () => number): EnemyDef {
  if (pool.length === 0) {
    return regularEnemies.filter((e) => e.tier === 'normal')[0]!;
  }
  return pool[Math.floor(rng() * pool.length)]!;
}

export function pickEnemy(ctx: FloorContext, options: PickEnemyOptions = {}): PickedEnemy {
  const group = pickEnemyGroup(ctx, options);
  return { enemyId: group.enemyIds[0], isElite: group.isElite };
}

export function pickEnemyGroup(ctx: FloorContext, options: PickEnemyOptions = {}): PickedEnemyGroup {
  const { floor, rng } = ctx;
  const forceNormal = options.forceNormal ?? false;

  let pool: EnemyDef[];
  let isElite = false;
  if (forceNormal || floor <= 2) {
    pool = regularEnemies.filter((e) => e.tier === 'normal');
  } else {
    const eliteChance = eliteChanceForFloor(floor);
    isElite = rng() < eliteChance;
    pool = regularEnemies.filter((e) => e.tier === (isElite ? 'elite' : 'normal'));
  }

  if (pool.length === 0) {
    pool = regularEnemies.filter((e) => e.tier === 'normal');
  }

  let count = 1;
  if (!forceNormal && floor >= 4) {
    const roll = rng();
    if (roll < 0.08) count = 3;
    else if (roll < 0.33) count = 2;
  }

  const enemyIds: string[] = [];
  for (let i = 0; i < count; i++) {
    const enemy = pickFromPool(pool, rng);
    enemyIds.push(enemy.id);
  }

  return { enemyIds, isElite };
}

export function buildCombatPayloadFromPick(pick: PickedEnemy | PickedEnemyGroup): import('../../types/events').CombatPayload {
  const enemyIds = 'enemyIds' in pick ? pick.enemyIds : [pick.enemyId];
  return {
    enemyIds,
    enemyId: enemyIds[0],
    isElite: pick.isElite,
  };
}
