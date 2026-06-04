import type { GameEngine } from '../../game/GameEngine';
import type { LootPayload } from '../../types/events';
import { AssetImage } from '../components/AssetImage';

export function LootScreen(engine: GameEngine): HTMLElement {
  const payload = engine.getState().run.activeEvent?.payload as LootPayload;

  const el = document.createElement('div');
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Victory!';
  el.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = payload
    ? `You defeated the ${payload.enemyName}${payload.isBoss ? ' (Boss)' : payload.isElite ? ' (Elite)' : ''}.`
    : 'Enemy defeated.';
  el.appendChild(subtitle);

  if (payload) {
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '1rem';
    header.style.margin = '1rem 0';
    header.appendChild(AssetImage(payload.imageKey, 'card__image', payload.enemyName));
    el.appendChild(header);

    const lootTitle = document.createElement('h2');
    lootTitle.style.fontSize = '1.1rem';
    lootTitle.style.marginBottom = '0.75rem';
    lootTitle.textContent = 'Loot';
    el.appendChild(lootTitle);

    const list = document.createElement('div');
    list.className = 'loot-list';

    for (const item of payload.items) {
      const row = document.createElement('div');
      row.className = 'loot-item';

      if (item.imageKey) {
        row.appendChild(AssetImage(item.imageKey, 'skill-chip__img', item.name));
      }

      const info = document.createElement('div');
      const name = document.createElement('div');
      name.style.fontWeight = '600';
      name.textContent =
        item.type === 'gold' && item.amount != null
          ? `${item.name}: +${item.amount}`
          : item.name;
      info.appendChild(name);

      if (item.description) {
        const desc = document.createElement('div');
        desc.style.fontSize = '0.85rem';
        desc.style.color = 'var(--text-secondary)';
        desc.textContent = item.description;
        info.appendChild(desc);
      }

      row.appendChild(info);
      list.appendChild(row);
    }

    if (payload.items.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted)">Nothing found.</p>';
    }

    el.appendChild(list);
  }

  const btn = document.createElement('button');
  btn.className = 'btn btn--primary';
  btn.style.marginTop = '1.5rem';
  btn.textContent = 'Continue';
  btn.addEventListener('click', () => engine.claimLoot());
  el.appendChild(btn);

  return el;
}
