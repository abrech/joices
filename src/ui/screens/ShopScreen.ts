import type { GameEngine } from '../../game/GameEngine';
import type { ShopItem, ShopPayload } from '../../types/events';
import { getSkill } from '../../content/registries';
import { Card } from '../components/Card';
import { getSkillDescription } from '../../game/systems/SkillSystem';

const STAT_ITEM_IMAGES: Record<string, string> = {
  'shop-heal': 'heal',
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
    const kind = skill?.type === 'attack' ? 'Attack' : skill?.type === 'passive' ? 'Passive' : 'Skill';
    return skill ? `${skill.name} (${kind})` : item.name;
  }
  return item.name;
}

export function ShopScreen(engine: GameEngine): HTMLElement {
  const state = engine.getState();
  const payload = state.run.activeEvent?.payload as ShopPayload;

  const el = document.createElement('div');
  el.innerHTML = `<h1 class="screen-title">Merchant</h1>
    <p class="screen-subtitle">Buy what you can afford, then leave when done. You have ${state.run.player.gold} gold.</p>`;

  const items = payload?.items ?? [];
  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.style.color = 'var(--text-muted)';
    empty.textContent = 'Nothing left to buy.';
    el.appendChild(empty);
  } else {
    const grid = document.createElement('div');
    grid.className = 'card-grid card-grid--stagger';

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

    el.appendChild(grid);
  }

  const leave = document.createElement('button');
  leave.className = 'btn btn--secondary';
  leave.style.marginTop = '1rem';
  leave.textContent = 'Leave Shop';
  leave.addEventListener('click', () => engine.leaveShop());
  el.appendChild(leave);

  return el;
}
