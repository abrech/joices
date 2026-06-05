import type { EventDef, ShopPayload } from '../../types/events';
import { getAllSkills } from '../registries';
import { scaleShopPrice } from '../../game/progression/Scaling';
import { SHOP_HEAL_ITEM, SHOP_SKILL_BASE_PRICE, SHOP_STAT_ITEMS } from '../shop/catalog';
import { defaultSkillFilter } from '../../game/systems/SkillFilters';
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
        description: 'Learn a new attack or passive',
        price: scaleShopPrice(SHOP_SKILL_BASE_PRICE, floor),
        skillId: pick.id,
      };
    }

    const fixedItems = [
      {
        ...SHOP_HEAL_ITEM,
        price: scaleShopPrice(SHOP_HEAL_ITEM.basePrice, floor),
      },
      ...SHOP_STAT_ITEMS.map((item) => ({
        ...item,
        price: scaleShopPrice(item.basePrice, floor),
      })),
    ];

    const items = [skillItem, ...fixedItems].filter(Boolean) as ShopPayload['items'];

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
