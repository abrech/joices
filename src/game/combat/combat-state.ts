import type { CombatEnemyInstance, CombatState, StatusInstance } from '../../types/game-state';
import { getEnemy } from '../../content/registries';

let instanceCounter = 0;

export function nextEnemyInstanceId(): string {
  instanceCounter += 1;
  return `enemy-${instanceCounter}`;
}

export function resetEnemyInstanceIds(): void {
  instanceCounter = 0;
}

export function livingEnemies(combat: CombatState): CombatEnemyInstance[] {
  return combat.enemies.filter((e) => e.hp > 0);
}

export function allEnemiesDefeated(combat: CombatState): boolean {
  return livingEnemies(combat).length === 0;
}

export function targetEnemy(combat: CombatState): CombatEnemyInstance | undefined {
  const living = livingEnemies(combat);
  if (living.length === 0) return undefined;
  const idx = Math.min(combat.targetIndex, combat.enemies.length - 1);
  const direct = combat.enemies[idx];
  if (direct && direct.hp > 0) return direct;
  return living[0];
}

export function targetEnemyIndex(combat: CombatState): number {
  const t = targetEnemy(combat);
  if (!t) return -1;
  return combat.enemies.findIndex((e) => e.instanceId === t.instanceId);
}

export function enemyByInstanceId(
  combat: CombatState,
  instanceId: string,
): CombatEnemyInstance | undefined {
  return combat.enemies.find((e) => e.instanceId === instanceId);
}

export function totalEnemyHp(combat: CombatState): number {
  return livingEnemies(combat).reduce((sum, e) => sum + e.hp, 0);
}

export function totalEnemyMaxHp(combat: CombatState): number {
  return combat.enemies.reduce((sum, e) => sum + e.maxHp, 0);
}

export function primaryEnemyId(combat: CombatState): string {
  return targetEnemy(combat)?.enemyId ?? combat.enemies[0]?.enemyId ?? '';
}

export function weakenAttackMultiplier(statuses: StatusInstance[]): number {
  const weaken = statuses.find((s) => s.type === 'weaken');
  if (!weaken) return 1;
  const reduction = Math.min(0.3, weaken.stacks * 0.15);
  return 1 - reduction;
}

export function enemyDisplayLabel(combat: CombatState): string {
  const living = livingEnemies(combat);
  if (living.length === 0) return 'Enemy';
  if (living.length === 1) {
    return getEnemy(living[0].enemyId)?.name ?? 'Enemy';
  }
  return `${living.length} enemies`;
}

export function pickLowestHpTargetIndex(combat: CombatState): number {
  const living = livingEnemies(combat);
  if (living.length === 0) return 0;
  let best = combat.enemies.findIndex((e) => e.instanceId === living[0].instanceId);
  let lowest = living[0].hp;
  for (const e of living) {
    if (e.hp < lowest) {
      lowest = e.hp;
      best = combat.enemies.findIndex((x) => x.instanceId === e.instanceId);
    }
  }
  return best;
}

export function mapEnemyUpdate(
  combat: CombatState,
  instanceId: string,
  updater: (enemy: CombatEnemyInstance) => CombatEnemyInstance,
): CombatState {
  return {
    ...combat,
    enemies: combat.enemies.map((e) =>
      e.instanceId === instanceId ? updater(e) : e,
    ),
  };
}

export function mapAllEnemies(
  combat: CombatState,
  updater: (enemy: CombatEnemyInstance) => CombatEnemyInstance,
): CombatState {
  return {
    ...combat,
    enemies: combat.enemies.map((e) => (e.hp > 0 ? updater(e) : e)),
  };
}
