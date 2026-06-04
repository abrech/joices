import type { GameEngine } from '../../game/GameEngine';
import type { HealPayload } from '../../types/events';

export function HealScreen(engine: GameEngine): HTMLElement {
  const payload = engine.getState().run.activeEvent?.payload as HealPayload;

  const el = document.createElement('div');
  el.innerHTML = `<h1 class="screen-title">Healing Spring</h1>
    <p class="screen-subtitle">Rest and recover your strength.</p>
    <p style="margin:1rem 0;font-size:1.1rem">${payload?.label ?? 'Restore HP'}</p>`;

  const btn = document.createElement('button');
  btn.className = 'btn btn--primary';
  btn.textContent = 'Rest';
  btn.addEventListener('click', () => engine.confirmHeal());
  el.appendChild(btn);

  return el;
}
