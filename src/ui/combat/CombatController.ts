import type { GameEngine } from '../../game/GameEngine';
import type { CombatState, GameState } from '../../types/game-state';
import { enemyDisplayLabel } from '../../game/combat/combat-state';
import { getEnemy } from '../../content/registries';
import {
  animMs,
  DEFEAT_ANIM_MS,
  ENEMY_TURN_BANNER_MS,
  VICTORY_ANIM_MS,
  prefersReducedMotion,
} from '../animation/timing';
import {
  hideActionBanner,
  playActionAnimations,
  setActionBanner,
} from './CombatAnimations';
import {
  createCombatRoot,
  createCombatViewState,
  updateCombatDom,
  type CombatViewState,
} from './CombatView';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneCombat(c: CombatState): CombatState {
  return structuredClone(c);
}

async function processCombatUpdate(
  root: HTMLElement,
  engine: GameEngine,
  state: GameState,
  prev: CombatState | undefined,
  viewState: CombatViewState,
): Promise<void> {
  const combat = state.run.combat;
  if (!combat) return;

  const playerEndedTurn =
    prev?.turn === 'player' && combat.turn === 'enemy' && !combat.finished;
  const playerUsedSkill =
    prev?.turn === 'player' &&
    combat.turn === 'player' &&
    !combat.finished &&
    combat.lastAction?.actor === 'player' &&
    (prev.lastAction !== combat.lastAction ||
      prev.currentMana !== combat.currentMana);
  const enemyJustActed = prev?.turn === 'enemy' && combat.turn === 'player' && !combat.finished;
  const enemyPhaseContinues =
    prev?.turn === 'enemy' && combat.turn === 'enemy' && !combat.finished && !!combat.lastAction;
  const justFinished = combat.finished && !prev?.finished;
  const enemyName = enemyDisplayLabel(combat);

  if (playerUsedSkill) {
    viewState.busy = true;
    updateCombatDom(root, state, viewState);
    await playActionAnimations(root, combat.lastAction, enemyName, false);
    engine.clearCombatLastAction();
    viewState.busy = false;
    updateCombatDom(root, engine.getState(), viewState);
    return;
  }

  if (playerEndedTurn && !combat.finished) {
    viewState.busy = true;
    updateCombatDom(root, state, viewState);
    await playActionAnimations(root, combat.lastAction, enemyName, false);
    engine.clearCombatLastAction();
    updateCombatDom(root, engine.getState(), viewState);
    setActionBanner(root, 'Enemy turn…');
    updateCombatDom(root, engine.getState(), viewState);
    if (!prefersReducedMotion()) {
      await delay(animMs(ENEMY_TURN_BANNER_MS));
    }
    hideActionBanner(root);

    while (true) {
      engine.resolveEnemyTurn();
      const after = engine.getState();
      const c = after.run.combat;
      if (!c || c.finished || c.turn === 'player') break;
      updateCombatDom(root, after, viewState);
      if (c.lastAction) {
        const label =
          getEnemy(
            c.enemies.find((e) => e.instanceId === c.lastAction?.targetInstanceId)?.enemyId ??
              c.enemies[0]?.enemyId ??
              '',
          )?.name ?? enemyName;
        await playActionAnimations(root, c.lastAction, label, true);
        engine.clearCombatLastAction();
      }
    }
    viewState.busy = false;
    return;
  }

  if ((enemyJustActed || enemyPhaseContinues) && combat.lastAction) {
    viewState.busy = true;
    updateCombatDom(root, state, viewState);
    await playActionAnimations(root, combat.lastAction, enemyName, true);
    engine.clearCombatLastAction();
    updateCombatDom(root, engine.getState(), viewState);
    viewState.busy = false;
    return;
  }

  if (justFinished && combat.result === 'win') {
    viewState.busy = true;
    root.classList.add('combat-victory-flash');
    updateCombatDom(root, state, viewState);
    await delay(animMs(VICTORY_ANIM_MS));
    root.classList.remove('combat-victory-flash');
    viewState.busy = false;
    engine.combatVictoryContinue();
    return;
  }

  if (justFinished && combat.result === 'lose') {
    viewState.busy = true;
    updateCombatDom(root, state, viewState);
    await delay(animMs(DEFEAT_ANIM_MS));
    viewState.busy = false;
    engine.combatDefeatContinue();
    return;
  }

  updateCombatDom(root, state, viewState);
}

export function mountCombatController(container: HTMLElement, engine: GameEngine): () => void {
  const viewState = createCombatViewState();

  const root = createCombatRoot(engine, engine.getState(), viewState);
  container.appendChild(root);

  let prevCombat: CombatState | undefined = cloneCombat(engine.getState().run.combat!);
  let draining = false;
  const queue: GameState[] = [];

  const drain = async () => {
    if (draining) return;
    draining = true;
    while (queue.length > 0) {
      const state = queue.shift()!;
      if (!state.run.combat) continue;
      await processCombatUpdate(root, engine, state, prevCombat, viewState);
      prevCombat = state.run.combat ? cloneCombat(state.run.combat) : undefined;
    }
    draining = false;
  };

  const unsub = engine.subscribe((state) => {
    if (!state.run.combat) return;
    queue.push(state);
    void drain();
  });

  return () => {
    unsub();
    root.remove();
    viewState.busy = false;
    queue.length = 0;
  };
}
