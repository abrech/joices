import type { CombatLogEntry } from '../../types/game-state';

export function CombatLog(entries: CombatLogEntry[]): HTMLElement {
  const el = document.createElement('div');
  el.className = 'combat-log';

  for (const entry of entries) {
    const line = document.createElement('div');
    line.className = 'combat-log__entry';
    if (entry.type === 'player') line.classList.add('combat-log__entry--player');
    if (entry.type === 'enemy') line.classList.add('combat-log__entry--enemy');
    if (entry.type === 'crit') line.classList.add('combat-log__entry--crit');
    line.textContent = entry.text;
    el.appendChild(line);
  }

  el.scrollTop = el.scrollHeight;
  return el;
}
