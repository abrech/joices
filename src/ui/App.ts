import type { GameState } from '../types/game-state';
import type { GameEngine } from '../game/GameEngine';
import { Layout } from './layout/Layout';
import { ClassSelectScreen } from './screens/ClassSelectScreen';
import { WeaponSelectScreen } from './screens/WeaponSelectScreen';
import { FloorChoiceScreen } from './screens/FloorChoiceScreen';
import { CombatScreen } from './screens/CombatScreen';
import { HealScreen } from './screens/HealScreen';
import { SkillPickScreen } from './screens/SkillPickScreen';
import { ShopScreen } from './screens/ShopScreen';
import { EndScreen } from './screens/EndScreen';
import { CustomEventScreen } from './screens/CustomEventScreen';
import { LootScreen } from './screens/LootScreen';
import { showToast } from './components/Tooltip';

export function renderApp(container: HTMLElement, engine: GameEngine, state: GameState): void {
  container.innerHTML = '';

  let content: HTMLElement;

  switch (state.run.phase) {
    case 'classSelect':
      content = ClassSelectScreen(engine);
      break;
    case 'weaponSelect':
      content = WeaponSelectScreen(engine);
      break;
    case 'floorChoice':
      content = FloorChoiceScreen(engine);
      break;
    case 'event':
      if (state.run.combat) {
        content = CombatScreen(engine);
      } else if (state.run.activeEvent?.screen === 'loot') {
        content = LootScreen(engine);
      } else if (state.run.activeEvent) {
        switch (state.run.activeEvent.screen) {
          case 'heal':
            content = HealScreen(engine);
            break;
          case 'skillPick':
            content = SkillPickScreen(engine);
            break;
          case 'shop':
            content = ShopScreen(engine);
            break;
          case 'custom':
            content = CustomEventScreen(engine);
            break;
          default:
            content = FloorChoiceScreen(engine);
        }
      } else {
        content = FloorChoiceScreen(engine);
      }
      break;
    case 'gameOver':
      content = EndScreen(engine);
      break;
    default:
      content = ClassSelectScreen(engine);
  }

  container.appendChild(Layout(state, content));

  if (state.run.newSynergyToast) {
    showToast(state.run.newSynergyToast);
    engine.clearSynergyToast();
  }
}

export function mountApp(container: HTMLElement, engine: GameEngine): void {
  engine.subscribe((state) => renderApp(container, engine, state));
}
