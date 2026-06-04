import type { CombatState, PlayerState, RunState } from '../../types/game-state';
import type { SynergyBonuses } from '../../types/definitions';

export interface CombatContext {
  run: RunState;
  combat: CombatState;
  player: PlayerState;
  synergies: SynergyBonuses;
  skillLevel: (id: string) => number;
}

export interface PassiveContext {
  player: PlayerState;
  ownedSkills: { id: string; level: number }[];
  synergies: SynergyBonuses;
}

export function buildCombatContext(
  run: RunState,
  synergies: SynergyBonuses,
): CombatContext {
  const combat = run.combat!;
  return {
    run,
    combat,
    player: run.player,
    synergies,
    skillLevel: (id) => run.player.skills.find((s) => s.id === id)?.level ?? 0,
  };
}
