import type { GameEffect } from '../../types/events';
import type { GameState } from '../../types/game-state';
import { applyCombatEffects } from './combat-effects';
import { applyRunEffects } from './run-effects';

export function applyEffects(state: GameState, effects: GameEffect[]): GameState {
  let current = state;
  const combatEffects = effects.filter((e) => e.type === 'startCombat');
  const runEffects = effects.filter((e) => e.type !== 'startCombat');

  if (combatEffects.length > 0) {
    current = applyCombatEffects(current, combatEffects);
  }
  if (runEffects.length > 0) {
    current = applyRunEffects(current, runEffects);
  }
  return current;
}
