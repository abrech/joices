import type { GameEffect } from '../../types/events';
import type { GameState } from '../../types/game-state';
import { getEnemy } from '../../content/registries';
import { scaledEnemyStats, scaledBossStats, scaleEnemyGold } from '../progression/Scaling';
import { initSkillCooldowns } from '../systems/SkillSystem';
import { startCombat } from '../combat/CombatEngine';

export function applyCombatEffects(
  state: GameState,
  effects: GameEffect[],
): GameState {
  let { run } = state;

  for (const effect of effects) {
    if (effect.type !== 'startCombat') continue;

    const combatEnemies: import('../combat/CombatEngine').StartCombatEnemyParams[] = [];
    let totalGold = 0;
    for (const eid of effect.enemyIds) {
      const enemy = getEnemy(eid);
      if (!enemy) continue;
      const scaled = effect.isBoss
        ? scaledBossStats(enemy.baseStats.maxHp, enemy.baseStats.attack, run.floor)
        : scaledEnemyStats(
            enemy.baseStats.maxHp,
            enemy.baseStats.attack,
            run.floor,
            enemy.tier,
          );
      const goldRange = scaleEnemyGold(enemy.goldDrop, run.floor);
      totalGold += goldRange[0] + Math.floor((goldRange[1] - goldRange[0]) * 0.5);
      combatEnemies.push({
        enemyId: eid,
        hp: scaled.hp,
        maxHp: scaled.hp,
        attack: scaled.attack,
      });
    }
    if (combatEnemies.length === 0) continue;
    run = {
      ...run,
      phase: 'event',
      combat: startCombat({
        enemies: combatEnemies,
        skillCooldowns: initSkillCooldowns(run),
        initialMana: run.player.stats.maxMana,
        isBoss: effect.isBoss ?? false,
        goldReward: totalGold,
      }),
    };
  }

  return { ...state, run };
}
