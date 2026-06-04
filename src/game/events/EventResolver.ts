import type { CombatPayload } from '../../types/events';
import type { GameState } from '../../types/game-state';
import { getEvent } from '../../content/registries';
import { applyEffects } from '../effects/EffectApplier';

export function resolveEvent(
  state: GameState,
  eventId: string,
  payload: unknown,
  playerChoice?: string,
  combatResult?: 'win' | 'lose',
): GameState {
  const event = getEvent(eventId);
  if (!event) return state;

  const ctx = {
    run: state.run,
    profile: state.profile,
    payload,
    playerChoice,
    combatResult,
  };

  const effects = event.resolve(ctx);
  return applyEffects(state, effects);
}

export function beginEvent(state: GameState, eventId: string, payload: unknown): GameState {
  const event = getEvent(eventId);
  if (!event) return state;

  const base: GameState = {
    ...state,
    run: {
      ...state.run,
      phase: 'event',
      activeEvent: { eventId, screen: event.screen, payload, eventPayload: payload },
    },
  };

  if (event.screen === 'combat') {
    const p = payload as CombatPayload;
    return applyEffects(base, [
      {
        type: 'startCombat',
        enemyIds: p.enemyIds ?? [p.enemyId],
        isBoss: p.isBoss,
      },
    ]);
  }

  return base;
}

export function completeEvent(
  state: GameState,
  playerChoice?: string,
  combatResult?: 'win' | 'lose',
): GameState {
  const { activeEvent } = state.run;
  if (!activeEvent) return state;

  const payload = activeEvent.eventPayload ?? activeEvent.payload;
  return resolveEvent(
    state,
    activeEvent.eventId,
    payload,
    playerChoice,
    combatResult,
  );
}
