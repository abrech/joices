import type { Stats } from '../../types/definitions';

/** Fixed merchant stock (skill row is rolled separately per visit). */
export interface ShopCatalogEntry {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  type: 'heal' | 'stat';
  healPercent?: number;
  stat?: keyof Stats;
  statDelta?: number;
}

export const SHOP_HEAL_ITEM: ShopCatalogEntry = {
  id: 'shop-heal',
  type: 'heal',
  name: 'Healing Potion',
  description: 'Restore 40% max HP',
  basePrice: 15,
  healPercent: 0.4,
};

export const SHOP_STAT_ITEMS: ShopCatalogEntry[] = [
  {
    id: 'shop-attack',
    type: 'stat',
    name: 'Sharpening Stone',
    description: '+2 Attack permanently this run',
    basePrice: 30,
    stat: 'attack',
    statDelta: 2,
  },
  {
    id: 'shop-block',
    type: 'stat',
    name: 'Reinforced Plating',
    description: '+1 Block permanently this run',
    basePrice: 25,
    stat: 'block',
    statDelta: 1,
  },
  {
    id: 'shop-maxhp',
    type: 'stat',
    name: 'Vitality Charm',
    description: '+8 Max HP permanently this run',
    basePrice: 28,
    stat: 'maxHp',
    statDelta: 8,
  },
  {
    id: 'shop-crit',
    type: 'stat',
    name: 'Keen Eye',
    description: '+3% Crit chance permanently this run',
    basePrice: 35,
    stat: 'critChance',
    statDelta: 0.03,
  },
  {
    id: 'shop-spell',
    type: 'stat',
    name: 'Arcane Focus',
    description: '+3 Spell Power permanently this run',
    basePrice: 28,
    stat: 'spellPower',
    statDelta: 3,
  },
];

export const SHOP_SKILL_BASE_PRICE = 25;
