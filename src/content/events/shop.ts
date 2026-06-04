import type { EventDef, ShopPayload } from '../../types/events';
import { getAllSkills } from '../registries';
import { scaleShopPrice } from '../../game/progression/Scaling';
import { defaultSkillFilter } from './enemy';
import { WEIGHT_SHOP } from '../../game/progression/EncounterWeights';
import { isBossFloor } from '../../game/progression/PacingRules';

export const shopEvent: EventDef = {
  id: 'shop',
  name: 'Merchant',
  description: 'Buy skills, potions, and trinkets.',
  imageKey: 'shop',
  tags: ['shop'],
  weight: WEIGHT_SHOP,
  canAppear: (ctx) => ctx.floor >= 2 && !isBossFloor(ctx.floor),
  buildPayload: (ctx): ShopPayload => {
    const floor = ctx.floor;
    const owned = new Set(ctx.run.player.skills.map((s) => s.id));
    const skillPool = getAllSkills().filter((s) => !owned.has(s.id) && defaultSkillFilter(s, ctx));
    let skillItem = null;
    if (skillPool.length > 0) {
      const pick = skillPool[Math.floor(ctx.rng() * skillPool.length)];
      skillItem = {
        id: 'shop-skill',
        type: 'skill' as const,
        name: pick.name,
        description: 'Learn a new skill',
        price: scaleShopPrice(25, floor),
        skillId: pick.id,
      };
    }

    const items = [
      skillItem,
      {
        id: 'shop-heal',
        type: 'heal' as const,
        name: 'Healing Potion',
        description: 'Restore 40% max HP',
        price: scaleShopPrice(15, floor),
        healPercent: 0.4,
      },
      {
        id: 'shop-attack',
        type: 'stat' as const,
        name: 'Sharpening Stone',
        description: '+2 Attack permanently this run',
        price: scaleShopPrice(30, floor),
        stat: 'attack' as const,
        statDelta: 2,
      },
    ].filter(Boolean) as ShopPayload['items'];

    return { items };
  },
  buildOfferPreview: (_ctx, payload) => {
    const p = payload as ShopPayload;
    return `${p.items.length} items for sale`;
  },
  screen: 'shop',
  resolve: (ctx) => {
    if (!ctx.playerChoice || ctx.playerChoice === '__leave__') {
      return [{ type: 'advanceFloor' }];
    }
    return [];
  },
};
