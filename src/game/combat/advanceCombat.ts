import type { GameState } from '../../types/game-state';
import {
  applyCombatEndTurn,
  applyCombatSkill,
  drainCombatEnemyPhase,
} from '../RunCommands';
import { enemyTurn } from './CombatEngine';

export type CombatAdvanceMode =
  | 'playerSkill'
  | 'endPlayerTurn'
  | 'enemyStep'
  | 'enemyDrain';

export function advanceCombat(
  state: GameState,
  mode: CombatAdvanceMode,
  skillId?: string,
): GameState {
  switch (mode) {
    case 'playerSkill': {
      if (!skillId) return state;
      return applyCombatSkill(state, skillId);
    }
    case 'endPlayerTurn':
      return applyCombatEndTurn(state);
    case 'enemyStep': {
      const run = enemyTurn(state.run);
      if (run === state.run) return state;
      return { ...state, run };
    }
    case 'enemyDrain':
      return drainCombatEnemyPhase(state);
    default:
      return state;
  }
}
