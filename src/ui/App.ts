import type { GameState } from '../types/game-state';
import type { GameEngine } from '../game/GameEngine';
import type { SkillPickPayload } from '../types/events';
import { Layout } from './layout/Layout';
import { ClassSelectScreen } from './screens/ClassSelectScreen';
import { WeaponSelectScreen } from './screens/WeaponSelectScreen';
import { FloorChoiceScreen } from './screens/FloorChoiceScreen';
import { HealScreen } from './screens/HealScreen';
import { SkillPickScreen } from './screens/SkillPickScreen';
import { ShopScreen } from './screens/ShopScreen';
import { EndScreen } from './screens/EndScreen';
import { CustomEventScreen } from './screens/CustomEventScreen';
import { LootScreen } from './screens/LootScreen';
import { GlossaryScreen } from './screens/GlossaryScreen';
import { mountCombatScreen } from './screens/mountCombatScreen';
import { showToast } from './components/Tooltip';
import { ModalOverlay } from './components/ModalOverlay';
import { getScreenKey, isModalScreen } from './navigation/screenKey';
import { getAppView, subscribeAppView, type AppView } from './navigation/appView';
import { SCREEN_TRANSITION_MS, animMs } from './animation/timing';
import { StatsPanel } from './layout/StatsPanel';

interface AppShell {
  layout: HTMLElement;
  main: HTMLElement;
  sidebar: HTMLElement | null;
}

let shell: AppShell | null = null;
let lastAppView: AppView | null = null;
let currentScreenKey = '';
let combatUnmount: (() => void) | null = null;
let transitionTimer: ReturnType<typeof setTimeout> | null = null;
let mountContainer: HTMLElement | null = null;
let mountEngine: GameEngine | null = null;

function buildScreenContent(engine: GameEngine, state: GameState): HTMLElement {
  const { run } = state;

  switch (run.phase) {
    case 'classSelect':
      return ClassSelectScreen(engine);
    case 'weaponSelect':
      return WeaponSelectScreen(engine);
    case 'floorChoice':
      return FloorChoiceScreen(engine);
    case 'event':
      if (run.combat) {
        const placeholder = document.createElement('div');
        placeholder.className = 'combat-screen-mount';
        return placeholder;
      }
      if (run.activeEvent?.screen === 'loot') {
        return LootScreen(engine, true);
      }
      if (run.activeEvent) {
        switch (run.activeEvent.screen) {
          case 'heal':
            return HealScreen(engine);
          case 'skillPick':
            return SkillPickScreen(engine, true);
          case 'shop':
            return ShopScreen(engine);
          case 'custom':
            return CustomEventScreen(engine);
          default:
            return FloorChoiceScreen(engine);
        }
      }
      return FloorChoiceScreen(engine);
    case 'gameOver':
      return EndScreen(engine);
    default:
      return ClassSelectScreen(engine);
  }
}

function buildMainContent(engine: GameEngine, state: GameState): HTMLElement {
  if (getAppView() === 'glossary') {
    return GlossaryScreen();
  }
  return buildScreenContent(engine, state);
}

function wrapContent(state: GameState, content: HTMLElement): HTMLElement {
  if (getAppView() === 'glossary' || !isModalScreen(state)) return content;

  if (state.run.activeEvent?.screen === 'skillPick') {
    const payload = state.run.activeEvent.payload as SkillPickPayload;
    const isTraining = state.run.activeEvent.eventId === 'skill-training';
    const isCombatLoot = payload?.afterCombatLoot === true;
    return ModalOverlay({
      title: isCombatLoot ? 'Skill Reward' : isTraining ? 'Training' : 'Choose a reward',
      subtitle: payload?.label ?? (isTraining ? 'Choose an attack or passive' : 'Pick a reward'),
      content,
    });
  }

  if (state.run.activeEvent?.screen === 'loot') {
    return ModalOverlay({
      title: 'Victory!',
      subtitle: undefined,
      content,
    });
  }

  return content;
}

function destroyShell(container: HTMLElement): void {
  if (combatUnmount) {
    combatUnmount();
    combatUnmount = null;
  }
  if (shell) {
    container.removeChild(shell.layout);
    shell = null;
  }
}

function ensureShell(container: HTMLElement, state: GameState): void {
  const view = getAppView();
  if (shell && lastAppView === view) return;

  destroyShell(container);

  const layout = Layout(state, document.createElement('div'));
  shell = {
    layout,
    main: layout.querySelector('.layout-main')!,
    sidebar: layout.querySelector('.stats-panel'),
  };
  container.appendChild(layout);
  lastAppView = view;
  currentScreenKey = '';
}

function setMainContent(engine: GameEngine, state: GameState, content: HTMLElement, animate: boolean): void {
  if (!shell) return;

  const wrapped = wrapContent(state, content);
  const main = shell.main;

  if (combatUnmount) {
    combatUnmount();
    combatUnmount = null;
  }

  const mountCombat =
    getAppView() === 'game' && state.run.combat && content.classList.contains('combat-screen-mount');

  const applyContent = () => {
    main.innerHTML = '';
    main.appendChild(wrapped);
    if (mountCombat) {
      const mountPoint = main.querySelector('.combat-screen-mount') ?? main;
      combatUnmount = mountCombatScreen(mountPoint as HTMLElement, engine);
    }
    if (animate) {
      wrapped.classList.add('screen-enter');
    }
  };

  if (!animate || main.childElementCount === 0) {
    applyContent();
    return;
  }

  const outgoing = main.firstElementChild;
  if (outgoing) {
    outgoing.classList.add('screen-exit');
    if (transitionTimer) clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => {
      applyContent();
      transitionTimer = null;
    }, animMs(SCREEN_TRANSITION_MS));
  } else {
    applyContent();
  }
}

function updateSidebar(state: GameState): void {
  if (!shell?.sidebar) return;
  const next = StatsPanel(state);
  shell.sidebar.replaceWith(next);
  shell.sidebar = next;
}

export function renderApp(container: HTMLElement, engine: GameEngine, state: GameState): void {
  ensureShell(container, state);

  const screenKey = getAppView() === 'glossary' ? 'glossary' : getScreenKey(state);
  const screenChanged = screenKey !== currentScreenKey;
  const content = buildMainContent(engine, state);

  if (screenChanged) {
    currentScreenKey = screenKey;
    setMainContent(engine, state, content, shell!.main.childElementCount > 0);
  } else if (getAppView() === 'game' && state.run.combat && combatUnmount) {
    /* combat mount updates its own DOM */
  } else {
    setMainContent(engine, state, content, false);
  }

  if (getAppView() === 'game') {
    updateSidebar(state);
  }

  if (state.run.newSynergyToast) {
    showToast(state.run.newSynergyToast);
    engine.clearSynergyToast();
  }
}

export function mountApp(container: HTMLElement, engine: GameEngine): void {
  mountContainer = container;
  mountEngine = engine;

  engine.subscribe((state) => {
    if (mountContainer && mountEngine) {
      renderApp(mountContainer, mountEngine, state);
    }
  });

  subscribeAppView(() => {
    if (mountContainer && mountEngine) {
      renderApp(mountContainer, mountEngine, mountEngine.getState());
    }
  });
}
