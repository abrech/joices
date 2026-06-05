/** Replay logs may reference legacy shop item ids. */
const SHOP_ITEM_ALIASES: Record<string, string> = {
  'shop-attack': 'shop-strength',
};

export function resolveShopItemId(itemId: string): string {
  return SHOP_ITEM_ALIASES[itemId] ?? itemId;
}
