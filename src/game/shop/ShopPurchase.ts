import type { GameEffect, ShopItem, ShopPayload } from '../../types/events';
import type { GameState } from '../../types/game-state';
import { applyEffects } from '../effects/EffectApplier';
import { resolveShopItemId } from './shop-item-ids';

export function buildShopPurchaseEffects(
  run: GameState['run'],
  item: ShopItem,
): GameEffect[] | null {
  if (run.player.gold < item.price) return null;

  const effects: GameEffect[] = [{ type: 'addGold', amount: -item.price }];
  if (item.type === 'skill' && item.skillId) {
    effects.push({ type: 'addSkill', skillId: item.skillId });
  } else if (item.type === 'heal' && item.healPercent) {
    const amount = Math.floor(run.player.stats.maxHp * item.healPercent);
    effects.push({ type: 'heal', amount });
  } else if (item.type === 'stat' && item.stat && item.statDelta) {
    effects.push({ type: 'modifyStat', stat: item.stat, delta: item.statDelta });
  }
  return effects;
}

export function purchaseShopItem(state: GameState, itemId: string): GameState {
  const { activeEvent } = state.run;
  if (!activeEvent || activeEvent.eventId !== 'shop') return state;

  const payload = (activeEvent.eventPayload ?? activeEvent.payload) as ShopPayload;
  const resolvedId = resolveShopItemId(itemId);
  const item = payload.items.find((i) => i.id === resolvedId || i.id === itemId);
  if (!item) return state;

  const effects = buildShopPurchaseEffects(state.run, item);
  if (!effects) return state;

  let next = applyEffects(state, effects);
  const newPayload: ShopPayload = {
    items: payload.items.filter((i) => i.id !== itemId),
  };

  return {
    ...next,
    run: {
      ...next.run,
      activeEvent: {
        ...activeEvent,
        payload: newPayload,
        eventPayload: newPayload,
      },
    },
  };
}
