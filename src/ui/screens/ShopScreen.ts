import type { GameEngine } from '../../game/GameEngine';
import type { ShopItem, ShopPayload } from '../../types/events';
import { getSkill } from '../../content/registries';
import { Card } from '../components/Card';
import { getSkillDescription } from '../../game/systems/SkillSystem';
import { skillTypeLabel } from './shared/skillCardMeta';
import { createSelectScreenShell } from './shared/selectGrid';

const STAT_ITEM_IMAGES: Record<string, string> = {
  'shop-heal': 'heal',
  'shop-strength': 'power-strike',
  'shop-attack': 'power-strike',
  'shop-block': 'shield-bash',
  'shop-maxhp': 'thick-skin',
  'shop-crit': 'keen-eye',
  'shop-spell': 'arcane-battery',
};

function shopItemImageKey(item: ShopItem): string {
  if (item.type === 'skill' && item.skillId) {
    return getSkill(item.skillId)?.imageKey ?? 'skill';
  }
  return STAT_ITEM_IMAGES[item.id] ?? 'shop';
}

function shopItemTags(item: ShopItem): string[] | undefined {
  if (item.type === 'skill' && item.skillId) {
    const skill = getSkill(item.skillId);
    if (skill) return skill.tags;
  }
  return [item.type];
}

function shopItemDescription(item: ShopItem): string {
  if (item.type === 'skill' && item.skillId) {
    const skill = getSkill(item.skillId);
    if (skill) {
      const levelDesc = getSkillDescription(item.skillId, 1);
      return [skill.description, levelDesc].filter(Boolean).join('\n\n');
    }
  }
  return item.description;
}

function shopItemTitle(item: ShopItem): string {
  if (item.type === 'skill') {
    const skill = item.skillId ? getSkill(item.skillId) : null;
    const kind = skill?.type ? skillTypeLabel(skill.type) : 'Skill';
    return skill ? `${skill.name} (${kind})` : item.name;
  }
  return item.name;
}

export function ShopScreen(engine: GameEngine): HTMLElement {
  const state = engine.getState();
  const payload = state.run.activeEvent?.payload as ShopPayload;

  const { root: el, grid } = createSelectScreenShell({
    title: 'Merchant',
    subtitle: `Buy what you can afford, then leave when done. You have ${state.run.player.gold} gold.`,
  });

  const items = payload?.items ?? [];
  if (items.length === 0) {
    grid.remove();
    const empty = document.createElement('p');
    empty.style.color = 'var(--text-muted)';
    empty.textContent = 'Nothing left to buy.';
    el.appendChild(empty);
  } else {
    for (const item of items) {
      const canAfford = state.run.player.gold >= item.price;
      grid.appendChild(
        Card({
          title: shopItemTitle(item),
          description: shopItemDescription(item),
          imageKey: shopItemImageKey(item),
          tags: shopItemTags(item),
          preview: `${item.price} gold${canAfford ? '' : ' — not enough gold'}`,
          disabled: !canAfford,
          onClick: canAfford ? () => engine.buyShopItem(item.id) : undefined,
        }),
      );
    }
  }

  const leave = document.createElement('button');
  leave.className = 'btn btn--secondary';
  leave.style.marginTop = '1rem';
  leave.textContent = 'Leave Shop';
  leave.addEventListener('click', () => engine.leaveShop());
  el.appendChild(leave);

  return el;
}
