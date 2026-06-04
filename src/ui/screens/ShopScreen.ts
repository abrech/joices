import type { GameEngine } from '../../game/GameEngine';
import type { ShopPayload } from '../../types/events';
import { AssetImage } from '../components/AssetImage';

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
  }

  for (const item of items) {
    const row = document.createElement('button');
    row.type = 'button';
    const canAfford = state.run.player.gold >= item.price;
    row.className = 'shop-item' + (canAfford ? '' : ' shop-item--disabled');
    row.disabled = !canAfford;

    row.appendChild(AssetImage('shop', 'skill-chip__img', item.name));

    const info = document.createElement('div');
    info.innerHTML = `<strong>${item.name}</strong><br><span style="font-size:0.85rem;color:var(--text-secondary)">${item.description}</span>`;
    row.appendChild(info);

    const price = document.createElement('span');
    price.className = 'shop-item__price';
    price.textContent = `${item.price}g`;
    row.appendChild(price);

    if (canAfford) {
      row.addEventListener('click', () => engine.buyShopItem(item.id));
    }

    el.appendChild(row);
  }

  const leave = document.createElement('button');
  leave.className = 'btn btn--secondary';
  leave.style.marginTop = '1rem';
  leave.textContent = 'Leave Shop';
  leave.addEventListener('click', () => engine.leaveShop());
  el.appendChild(leave);

  return el;
}
