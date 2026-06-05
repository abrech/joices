import { createEmptyProfile, createInitialRunState } from '../src/types/game-state.ts';
import { getPolicy } from '../src/game/autoplay/policy.ts';
import {
  applySelectClass,
  applySelectWeapon,
  applyPickFloor,
  applyCombatEndTurn,
} from '../src/game/RunCommands.ts';
import { enemyTurn } from '../src/game/combat/CombatEngine.ts';

const p = getPolicy('greedy');
let s = { run: createInitialRunState(42), profile: createEmptyProfile() };
s = applySelectClass(s, p.selectClass(s));
s = applySelectWeapon(s, p.selectWeapon(s));
s = applyPickFloor(s, p.selectFloorIndex(s));

// Minimal player phase: end turn immediately
s = applyCombatEndTurn(s);
console.log('after end turn', s.run.combat?.turn, 'idx', s.run.combat?.enemyPhaseIndex);

let run = s.run;
for (let i = 0; i < 25; i++) {
  if (!run.combat || run.combat.finished || run.combat.turn !== 'enemy') {
    console.log('done at', i, run.combat?.turn, run.combat?.finished);
    break;
  }
  const before = `${run.combat.enemyPhaseIndex}|${run.combat.lastAction?.kind}|${run.combat.enemies.map((e) => e.hp).join(',')}`;
  const prev = run;
  run = enemyTurn(run);
  const after = `${run.combat?.enemyPhaseIndex}|${run.combat?.lastAction?.kind}|${run.combat?.enemies.map((e) => e.hp).join(',')}`;
  console.log(i, before, '->', after, 'turn', run.combat?.turn, 'sameRef', run === prev);
  if (before === after && run.combat?.turn === 'enemy') {
    console.error('STUCK enemy drain');
    process.exit(1);
  }
}
