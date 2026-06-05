import type { CombatState, CombatLastAction, CombatLogEntry } from '../../types/game-state';

export function addLog(
  combat: CombatState,
  text: string,
  type: CombatLogEntry['type'] = 'system',
): CombatState {
  return { ...combat, log: [...combat.log, { text, type }] };
}

export function withLastAction(
  combat: CombatState,
  action: CombatLastAction,
  targetInstanceId?: string,
): CombatState {
  return {
    ...combat,
    lastAction: { ...action, targetInstanceId: targetInstanceId ?? action.targetInstanceId },
  };
}
