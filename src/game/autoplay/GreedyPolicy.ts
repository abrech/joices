import type { GameState } from '../../types/game-state';
import type { ShopPayload } from '../../types/events';
import { getAllClasses, getWeaponsForClass } from '../../content/registries';
import { isBossFloor } from '../progression/PacingRules';
import type { AutoplayPolicy } from './policy';
import {
  combatSkillScore,
  countAttacks,
  pickBestSkill,
  scoreShopItem,
} from './skillScoring';
import { getAttackSkills } from '../systems/SkillSystem';

function hpRatio(state: GameState): number {
  return state.run.player.hp / Math.max(1, state.run.player.stats.maxHp);
}

function scoreFloorOption(state: GameState, index: number): number {
  const option = state.run.floorOptions[index];
  if (!option) return -1;

  const hp = hpRatio(state);
  const attacks = countAttacks(state);
  const skills = state.run.player.skills.length;
  const nextBoss = isBossFloor(state.run.floor + 1);

  switch (option.eventId) {
    case 'heal':
      if (nextBoss && hp < 0.85) return 100;
      return hp < 0.45 ? 100 : hp < 0.7 ? 60 : 20;
    case 'skill-training':
      if (nextBoss && attacks < 3) return 90;
      return attacks < 2 ? 95 : skills < 4 ? 75 : 50;
    case 'shop':
      return attacks < 2 && state.run.player.gold >= 20 ? 85 : state.run.player.gold >= 35 ? 55 : 30;
    case 'enemy':
      if (hp < 0.22) return 15;
      if (nextBoss && hp < 0.75) return 15;
      return 70;
    case 'boss':
      return 10;
    default:
      return 40;
  }
}

export const greedyPolicy: AutoplayPolicy = {
  name: 'greedy',

  selectClass(state) {
    const classes = getAllClasses();
    return classes[Math.abs(state.run.rngSeed) % classes.length].id;
  },

  selectWeapon(state) {
    const weapons = getWeaponsForClass(state.run.player.classId);
    if (!weapons.length) return state.run.player.weaponId;
    return weapons[Math.abs(state.run.rngSeed) % weapons.length].id;
  },

  selectFloorIndex(state) {
    const options = state.run.floorOptions;
    if (!options.length) return 0;

    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < options.length; i++) {
      const s = scoreFloorOption(state, i);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    return bestIdx;
  },

  selectCombatSkill(state) {
    const combat = state.run.combat;
    if (!combat || combat.turn !== 'player') return null;

    let bestId: string | null = null;
    let bestScore = -Infinity;

    for (const owned of getAttackSkills(state.run)) {
      const s = combatSkillScore(state, owned.id);
      if (s > bestScore) {
        bestScore = s;
        bestId = owned.id;
      }
    }

    return bestScore >= 0 ? bestId : null;
  },

  selectSkillReward(state, skillIds, _context) {
    if (!skillIds.length) return { type: 'skip' };
    return { type: 'pick', skillId: pickBestSkill(state, skillIds) };
  },

  selectShopAction(state, _itemIds) {
    const payload = state.run.activeEvent?.payload as ShopPayload | undefined;
    const items = payload?.items ?? [];
    if (!items.length) return { type: 'leave' };

    let bestItem: (typeof items)[0] | null = null;
    let bestScore = 0;

    for (const item of items) {
      const s = scoreShopItem(state, item);
      if (s > bestScore) {
        bestScore = s;
        bestItem = item;
      }
    }

    if (bestItem && bestScore >= 25) {
      return { type: 'buy', itemId: bestItem.id };
    }

    return { type: 'leave' };
  },
};
