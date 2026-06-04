import type { EnemyDef } from '../../types/definitions';
import type { FloorContext } from '../../types/events';
import { regularEnemies } from '../../content/enemies';
import { eliteChanceForFloor } from './Scaling';

export interface PickedEnemy {
  enemyId: string;
  isElite: boolean;
}

export interface PickEnemyOptions {
  forceNormal?: boolean;
}

export function pickEnemy(ctx: FloorContext, options: PickEnemyOptions = {}): PickedEnemy {
  const { floor, rng } = ctx;
  const forceNormal = options.forceNormal ?? false;

  let pool: EnemyDef[];
  if (forceNormal || floor <= 2) {
    pool = regularEnemies.filter((e) => e.tier === 'normal');
  } else {
    const eliteChance = eliteChanceForFloor(floor);
    const rollElite = rng() < eliteChance;
    if (rollElite) {
      pool = regularEnemies.filter((e) => e.tier === 'elite');
    } else {
      pool = regularEnemies.filter((e) => e.tier === 'normal');
    }
  }

  if (pool.length === 0) {
    pool = regularEnemies.filter((e) => e.tier === 'normal');
  }

  const idx = Math.floor(rng() * pool.length);
  const enemy = pool[idx];
  return { enemyId: enemy.id, isElite: enemy.tier === 'elite' };
}

export function buildCombatPayloadFromPick(pick: PickedEnemy): import('../../types/events').CombatPayload {
  return { enemyId: pick.enemyId, isElite: pick.isElite };
}
