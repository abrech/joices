import type { LootItem, LootPayload, CombatPayload } from '../../types/events';
import type { GameState } from '../../types/game-state';
import { getEnemy, getAllSkills, getSkill } from '../../content/registries';
import { scaleEnemyGold } from '../progression/Scaling';
import { nextRandom } from '../rng';
import { defaultSkillFilter } from '../../content/events/enemy';
import type { FloorContext } from '../../types/events';

const ELITE_SKILL_DROP_CHANCE = 0.35;
const BOSS_SKILL_DROP_CHANCE = 0.55;
const ELITE_BONUS_GOLD_CHANCE = 0.25;
const NORMAL_BONUS_GOLD_CHANCE = 0.1;

function rollGoldAmount(
  goldDrop: [number, number],
  floor: number,
  rng: () => number,
): number {
  const scaled = scaleEnemyGold(goldDrop, floor);
  const range = scaled[1] - scaled[0];
  return scaled[0] + (range > 0 ? Math.floor(rng() * (range + 1)) : 0);
}

function pickBonusSkill(ctx: FloorContext): string | null {
  const owned = new Set(ctx.run.player.skills.map((s) => s.id));
  const pool = getAllSkills().filter((s) => !owned.has(s.id) && defaultSkillFilter(s, ctx));
  if (pool.length === 0) return null;
  return pool[Math.floor(ctx.rng() * pool.length)].id;
}

export function rollCombatLoot(
  state: GameState,
  combatPayload: CombatPayload,
): { loot: LootPayload; state: GameState } {
  const { run } = state;
  const enemy = getEnemy(combatPayload.enemyId);
  if (!enemy) {
    return {
      loot: {
        enemyId: combatPayload.enemyId,
        enemyName: 'Unknown',
        imageKey: 'enemy',
        items: [],
      },
      state,
    };
  }

  let rngState = run.rngState;
  const rng = () => {
    const result = nextRandom(rngState);
    rngState = result.state;
    return result.value;
  };

  const ctx: FloorContext = {
    run: { ...run, rngState },
    profile: state.profile,
    floor: run.floor,
    rng,
  };

  const items: LootItem[] = [];
  const gold = rollGoldAmount(enemy.goldDrop, run.floor, rng);
  items.push({
    type: 'gold',
    name: 'Gold',
    amount: gold,
    imageKey: 'gold',
    description: `${gold} gold collected`,
  });

  const isElite = combatPayload.isElite ?? enemy.tier === 'elite';
  const isBoss = combatPayload.isBoss ?? false;

  if (!isBoss && !isElite && rng() < NORMAL_BONUS_GOLD_CHANCE) {
    const bonus = Math.floor(gold * 0.25) + 3;
    items.push({
      type: 'gold',
      name: 'Bonus Spoils',
      amount: bonus,
      imageKey: 'gold',
      description: `Lucky find: +${bonus} gold`,
    });
  }

  if (isElite && rng() < ELITE_BONUS_GOLD_CHANCE) {
    const bonus = Math.floor(gold * 0.4) + 5;
    items.push({
      type: 'gold',
      name: 'Elite Bounty',
      amount: bonus,
      imageKey: 'gold',
      description: `Elite bonus: +${bonus} gold`,
    });
  }

  const skillChance = isBoss ? BOSS_SKILL_DROP_CHANCE : isElite ? ELITE_SKILL_DROP_CHANCE : 0;
  if (skillChance > 0 && rng() < skillChance) {
    const skillId = pickBonusSkill(ctx);
    if (skillId) {
      const skill = getSkill(skillId)!;
      items.push({
        type: 'skill',
        name: skill.name,
        skillId,
        imageKey: skill.imageKey,
        description: skill.description,
      });
    }
  }

  if (isBoss && rng() < 0.3) {
    const healAmount = Math.floor(run.player.stats.maxHp * 0.2);
    items.push({
      type: 'heal',
      name: 'Soul Essence',
      amount: healAmount,
      imageKey: 'heart',
      description: `Restore ${healAmount} HP`,
    });
  }

  return {
    loot: {
      enemyId: enemy.id,
      enemyName: enemy.name,
      imageKey: enemy.imageKey,
      isElite,
      isBoss,
      items,
    },
    state: { ...state, run: { ...run, rngState } },
  };
}

export function lootToEffects(items: LootItem[]): import('../../types/events').GameEffect[] {
  const effects: import('../../types/events').GameEffect[] = [];
  for (const item of items) {
    if (item.type === 'gold' && item.amount) {
      effects.push({ type: 'addGold', amount: item.amount });
    } else if (item.type === 'skill' && item.skillId) {
      effects.push({ type: 'addSkill', skillId: item.skillId });
    } else if (item.type === 'heal' && item.amount) {
      effects.push({ type: 'heal', amount: item.amount });
    }
  }
  return effects;
}
