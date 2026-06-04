import type { GameState } from '../../types/game-state';

export function getScreenKey(state: GameState): string {
  const { run } = state;
  switch (run.phase) {
    case 'classSelect':
      return 'classSelect';
    case 'weaponSelect':
      return 'weaponSelect';
    case 'floorChoice':
      return `floorChoice:${run.floor}`;
    case 'gameOver':
      return 'gameOver';
    case 'event': {
      if (run.combat) {
        const ids = run.combat.enemies.map((e) => e.enemyId).join(',');
        return `combat:${ids}:${run.floor}`;
      }
      const screen = run.activeEvent?.screen;
      if (screen) return `event:${screen}:${run.floor}`;
      return `event:unknown:${run.floor}`;
    }
    default:
      return 'unknown';
  }
}

export function isModalScreen(state: GameState): boolean {
  const screen = state.run.activeEvent?.screen;
  return screen === 'skillPick' || screen === 'loot';
}
