/**
 * Trace where autoplay combat stalls (no full batch). Run: npx tsx scripts/diagnose-autoplay-stuck.ts
 */
import { createEmptyProfile, createInitialRunState } from '../src/types/game-state.ts';
import { getPolicy } from '../src/game/autoplay/policy.ts';
import { applySelectClass, applySelectWeapon, applyPickFloor } from '../src/game/RunCommands.ts';
import {
  applyCombatSkill,
  applyCombatEndTurn,
  drainCombatEnemyPhase,
} from '../src/game/RunCommands.ts';
import { enemyTurn } from '../src/game/combat/CombatEngine.ts';
import { getAttackSkills, canAffordSkill, getSkillManaCost } from '../src/game/systems/SkillSystem.ts';
import { combatSkillScore } from '../src/game/autoplay/skillScoring.ts';
import { fingerprint } from '../src/game/autoplay/runMetrics.ts';
import type { GameState } from '../src/types/game-state.ts';

const policy = getPolicy('greedy');
let state: GameState = {
  run: createInitialRunState(42),
  profile: createEmptyProfile(),
};

state = applySelectClass(state, policy.selectClass(state));
state = applySelectWeapon(state, policy.selectWeapon(state));

const floorIdx = policy.selectFloorIndex(state);
state = applyPickFloor(state, floorIdx);

if (!state.run.combat) {
  console.log('No combat after pickFloor — event:', state.run.activeEvent?.eventId);
  process.exit(0);
}

console.log('Combat started. maxMana:', state.run.player.stats.maxMana, 'mana:', state.run.combat.currentMana);

let iterations = 0;
const MAX = 50;

while (state.run.combat && !state.run.combat.finished && iterations < MAX) {
  iterations++;
  const combat = state.run.combat;
  const before = fingerprint(state);

  if (combat.turn === 'player') {
    const affordable = getAttackSkills(state.run).filter((s) => {
      const cd = combat.skillCooldowns[s.id] ?? 0;
      return cd <= 0 && canAffordSkill(combat, s.id);
    });
    const pick = policy.selectCombatSkill(state);
    console.log(`\n--- player phase #${iterations} mana=${combat.currentMana} enemyHp=${combat.enemies.reduce((n, e) => n + e.hp, 0)} affordable=${affordable.length} pick=${pick ?? 'null'}`);

    if (pick) {
      const score = combatSkillScore(state, pick);
      console.log(`  pick score=${score} cost=${getSkillManaCost(pick)}`);
    }

    let progressed = false;
    for (let skillUse = 0; skillUse < 20; skillUse++) {
      if (state.run.combat?.turn !== 'player' || state.run.combat?.finished) break;
      const skillId = policy.selectCombatSkill(state);
      if (!skillId) {
        console.log('  skill loop: selectCombatSkill returned null');
        break;
      }
      const manaBefore = state.run.combat!.currentMana;
      const next = applyCombatSkill(state, skillId);
      if (next === state) {
        console.log('  skill loop: applyCombatSkill no-op for', skillId);
        break;
      }
      state = next;
      progressed = true;
      console.log(`  used ${skillId} mana ${manaBefore} -> ${state.run.combat!.currentMana}`);
    }

    if (!state.run.combat || state.run.combat.finished) {
      console.log('  finished during skills, progressed=', progressed);
      break;
    }
    if (state.run.combat.turn !== 'player') {
      console.log('  turn flipped during skills?');
      break;
    }

    const ended = applyCombatEndTurn(state);
    if (ended === state) {
      console.log('  STUCK: applyCombatEndTurn returned same state');
      process.exit(1);
    }
    state = ended;
    console.log('  end turn, draining enemy phase...');
    let drainSteps = 0;
    while (state.run.combat && !state.run.combat.finished && state.run.combat.turn === 'enemy') {
      drainSteps++;
      if (drainSteps > 100) {
        console.log('  STUCK: enemy drain exceeded 100 steps at index', state.run.combat.enemyPhaseIndex);
        process.exit(1);
      }
      const fp = fingerprint(state);
      state = { ...state, run: enemyTurn(state.run) };
      if (fingerprint(state) === fp && drainSteps > 1) {
        console.log('  STUCK: enemyTurn no fingerprint change at step', drainSteps);
        process.exit(1);
      }
    }
    console.log('  drain steps:', drainSteps, 'turn=', state.run.combat?.turn);

    const after = fingerprint(state);
    if (!state.run.combat?.finished && after === before) {
      console.log('  STUCK: fingerprint unchanged after full player phase');
      console.log('  before:', before);
      console.log('  after:', after);
      process.exit(1);
    }
    console.log('  phase complete, finished=', state.run.combat?.finished);
  } else {
    console.log(`\n--- enemy drain #${iterations} (unexpected branch)`);
    const next = drainCombatEnemyPhase(state);
    if (next === state) {
      console.log('  STUCK: drainCombatEnemyPhase no progress');
      process.exit(1);
    }
    state = next;
  }
}

if (state.run.combat && !state.run.combat.finished) {
  console.log('\nSTUCK: combat still active after', iterations, 'iterations');
  process.exit(1);
}

console.log('\nCombat resolved:', state.run.combat?.result, 'in', iterations, 'rounds');
