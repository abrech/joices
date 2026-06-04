import type { GameEngine } from '../../game/GameEngine';

export function CustomEventScreen(_engine: GameEngine): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = `<h1 class="screen-title">Special Event</h1>
    <p class="screen-subtitle">This event type is reserved for future content.</p>`;
  return el;
}
