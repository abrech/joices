import type { GameEngine } from '../../game/GameEngine';
import { mountCombatController } from '../combat/CombatController';

export function mountCombatScreen(container: HTMLElement, engine: GameEngine): () => void {
  return mountCombatController(container, engine);
}
