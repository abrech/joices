import type { GameEffect } from '../../types/events';
import type { GameState } from '../../types/game-state';
import { createInitialPacing } from '../../types/game-state';
import { addSkill, upgradeSkill } from '../systems/SkillSystem';
import { clampStats, recalculatePlayerStats } from '../systems/StatCalculator';
import { generateFloorOptions } from '../progression/FloorGenerator';
import { onRunEnd } from '../profile/RunLifecycle';
import { profileStore } from '../profile/ProfileStore';

function updatePacingOnAdvance(run: GameState['run']): GameState['run'] {
  const wasCombat =
    run.activeEvent?.eventId === 'enemy' || run.activeEvent?.eventId === 'boss';
  if (!wasCombat) return run;
  return {
    ...run,
    pacing: { ...run.pacing, combatsThisRun: run.pacing.combatsThisRun + 1 },
  };
}

export function applyRunEffects(
  state: GameState,
  effects: GameEffect[],
): GameState {
  let { run, profile } = state;

  for (const effect of effects) {
    switch (effect.type) {
      case 'damage': {
        run = {
          ...run,
          player: { ...run.player, hp: Math.max(0, run.player.hp - effect.amount) },
        };
        break;
      }
      case 'heal': {
        run = {
          ...run,
          player: {
            ...run.player,
            hp: Math.min(run.player.stats.maxHp, run.player.hp + effect.amount),
          },
        };
        break;
      }
      case 'addSkill': {
        run = addSkill(run, effect.skillId, effect.level ?? 1, profile);
        break;
      }
      case 'upgradeSkill': {
        run = upgradeSkill(run, effect.skillId, profile);
        break;
      }
      case 'addGold': {
        const newGold = Math.max(0, run.player.gold + effect.amount);
        const earned = effect.amount > 0 ? effect.amount : 0;
        run = {
          ...run,
          player: { ...run.player, gold: newGold },
          runGoldEarned: run.runGoldEarned + earned,
        };
        break;
      }
      case 'modifyStat': {
        const player = recalculatePlayerStats(run.player, profile);
        const stats = clampStats({
          ...player.stats,
          [effect.stat]: (player.stats[effect.stat] as number) + effect.delta,
        });
        run = { ...run, player: { ...player, stats } };
        break;
      }
      case 'advanceFloor': {
        const wasTraining = run.activeEvent?.eventId === 'skill-training';
        run = updatePacingOnAdvance(run);
        if (wasTraining) {
          run = {
            ...run,
            pacing: { ...run.pacing, lastTrainingFloor: run.floor },
          };
        }
        run = {
          ...run,
          floor: run.floor + 1,
          phase: 'floorChoice',
          activeEvent: undefined,
          combat: undefined,
          floorOptions: [],
        };
        if (!run.pacing) run = { ...run, pacing: createInitialPacing() };
        run.floorOptions = generateFloorOptions(run);
        break;
      }
      case 'endRun': {
        profile = onRunEnd({ ...run, victory: effect.victory }, profile);
        profileStore.save(profile);
        run = {
          ...run,
          phase: 'gameOver',
          victory: effect.victory,
          activeEvent: undefined,
          combat: undefined,
        };
        break;
      }
      case 'custom':
        break;
      default:
        break;
    }
  }

  if (run.player.hp <= 0 && run.phase !== 'gameOver') {
    profile = onRunEnd({ ...run, victory: false }, profile);
    profileStore.save(profile);
    run = { ...run, phase: 'gameOver', victory: false };
  }

  return { run, profile };
}
