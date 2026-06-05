import type { LootItem, LootPayload, CombatPayload } from '../../types/events';
import type { Stats } from '../../types/definitions';
import type { GameState } from '../../types/game-state';
import { getEnemy } from '../../content/registries';
import { learnableSkillFilter } from '../systems/SkillFilters';
import { pickSkills } from '../systems/SkillPool';
import { scaleEnemyGold } from '../progression/Scaling';
import { nextRandom } from '../rng';
import type { FloorContext } from '../../types/events';

const ELITE_BONUS_GOLD_CHANCE = 0.25;
const NORMAL_BONUS_GOLD_CHANCE = 0.1;

export const NORMAL_BONUS_REWARD_CHANCE = 0.32;
export const ELITE_BONUS_REWARD_CHANCE = 0.42;

const BONUS_HEAL_WEIGHT = 0.4;
const BONUS_SKILL_WEIGHT = 0.35;
/** Remaining weight goes to stat (0.25). */

function rollGoldAmount(
  goldDrop: [number, number],
  floor: number,
  rng: () => number,
): number {
  const scaled = scaleEnemyGold(goldDrop, floor);
  const range = scaled[1] - scaled[0];
  return scaled[0] + (range > 0 ? Math.floor(rng() * (range + 1)) : 0);
}

function healPercentForTier(isElite: boolean, isBoss: boolean): number {
  if (isBoss) return 0.2;
  if (isElite) return 0.16;
  return 0.12;
}

function rollStatBonus(rng: () => number): { stat: keyof Stats; delta: number; name: string } {
  const roll = rng();
  if (roll < 0.4) {
    return { stat: 'strength', delta: 2, name: 'Sharpening Stone' };
  }
  if (roll < 0.75) {
    return { stat: 'block', delta: 1, name: 'Reinforced Plating' };
  }
  return { stat: 'spell', delta: 2, name: 'Arcane Trinket' };
}

function tryRollBonusType(
  ctx: FloorContext,
  rng: () => number,
  isElite: boolean,
  isBoss: boolean,
  type: 'heal' | 'stat',
): LootItem | null {
  const maxHp = ctx.run.player.stats.maxHp;

  if (type === 'heal') {
    const amount = Math.floor(maxHp * healPercentForTier(isElite, isBoss));
    if (amount <= 0) return null;
    return {
      type: 'heal',
      name: isBoss ? 'Soul Essence' : 'Battle Salve',
      amount,
      imageKey: 'heal',
      description: `Restore ${amount} HP`,
    };
  }

  const { stat, delta, name } = rollStatBonus(rng);
  const statLabel =
    stat === 'strength' ? 'Strength' : stat === 'spell' ? 'Spell' : 'Block';
  return {
    type: 'stat',
    name,
    stat,
    statDelta: delta,
    imageKey: 'shop',
    description: `+${delta} ${statLabel} permanently this run`,
  };
}

interface CombatBonusRoll {
  item?: LootItem;
  skillChoices?: string[];
}

function rollCombatBonus(
  ctx: FloorContext,
  rng: () => number,
  isElite: boolean,
  isBoss: boolean,
): CombatBonusRoll | null {
  if (!isBoss) {
    const chance = isElite ? ELITE_BONUS_REWARD_CHANCE : NORMAL_BONUS_REWARD_CHANCE;
    if (rng() >= chance) return null;
  }

  const order: Array<'heal' | 'skill' | 'stat'> = ['heal', 'skill', 'stat'];
  const roll = rng();
  const skillThreshold = BONUS_HEAL_WEIGHT + BONUS_SKILL_WEIGHT;
  const first: 'heal' | 'skill' | 'stat' =
    roll < BONUS_HEAL_WEIGHT ? 'heal' : roll < skillThreshold ? 'skill' : 'stat';

  for (let i = 0; i < 3; i++) {
    const type = order[(order.indexOf(first) + i) % 3];
    if (type === 'skill') {
      const skillChoices = pickSkills(ctx, 2, learnableSkillFilter);
      if (skillChoices.length >= 2) return { skillChoices };
      continue;
    }
    const item = tryRollBonusType(ctx, rng, isElite, isBoss, type);
    if (item) return { item };
  }

  return null;
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

  const combatBonus = rollCombatBonus(ctx, rng, isElite, isBoss);
  if (combatBonus?.item) {
    items.push(combatBonus.item);
  }

  return {
    loot: {
      enemyId: enemy.id,
      enemyName: enemy.name,
      imageKey: enemy.imageKey,
      isElite,
      isBoss,
      items,
      skillChoices: combatBonus?.skillChoices,
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
    } else if (item.type === 'stat' && item.stat && item.statDelta) {
      effects.push({ type: 'modifyStat', stat: item.stat, delta: item.statDelta });
    }
  }
  return effects;
}
