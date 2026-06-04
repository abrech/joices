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
      if (run.combat) return `combat:${run.combat.enemyId}:${run.floor}`;
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
