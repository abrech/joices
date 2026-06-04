import type { ShopPayload } from '../../types/events';
import { getAllClasses, getWeapon, getWeaponsForClass } from '../../content/registries';
import type { AutoplayPolicy } from './policy';
import { scoreShopItem } from './skillScoring';
import { getAttackSkills } from '../systems/SkillSystem';

function randomInt(n: number): number {
  return Math.floor(Math.random() * n);
}

function pickOne<T>(items: T[]): T {
  return items[randomInt(items.length)];
}

export const randomPolicy: AutoplayPolicy = {
  name: 'random',

  selectClass() {
    return pickOne(getAllClasses()).id;
  },

  selectWeapon(state) {
    const weapons = getWeaponsForClass(state.run.player.classId);
    return pickOne(weapons).id;
  },

  selectFloorIndex(state) {
    return randomInt(state.run.floorOptions.length);
  },

  selectCombatSkill(state) {
    const combat = state.run.combat;
    if (!combat || combat.turn !== 'player') return null;

    const usable = getAttackSkills(state.run)
      .filter((s) => (combat.skillCooldowns[s.id] ?? 0) === 0)
      .map((s) => s.id);

    if (usable.length > 0) return pickOne(usable);

    return getWeapon(state.run.player.weaponId)?.starterAttackId ?? null;
  },

  selectSkillReward(_state, skillIds, context) {
    if (!skillIds.length) return { type: 'skip' };
    const skipChance = context === 'loot' ? 0.2 : 0.1;
    if (Math.random() < skipChance) return { type: 'skip' };
    return { type: 'pick', skillId: pickOne(skillIds) };
  },

  selectShopAction(state, _itemIds) {
    const payload = state.run.activeEvent?.payload as ShopPayload | undefined;
    const items = payload?.items ?? [];
    if (!items.length) return { type: 'leave' };

    const affordable = items.filter((i) => state.run.player.gold >= i.price);
    if (affordable.length === 0 || Math.random() < 0.3) {
      return { type: 'leave' };
    }

    if (Math.random() < 0.7) {
      const scored = affordable
        .map((item) => ({ item, score: scoreShopItem(state, item) + Math.random() * 10 }))
        .sort((a, b) => b.score - a.score);
      return { type: 'buy', itemId: scored[0].item.id };
    }

    return { type: 'leave' };
  },
};
