import { createEmptyProfile, createInitialRunState } from '../src/types/game-state.ts';
import { getPolicy } from '../src/game/autoplay/policy.ts';
import {
  applySelectClass,
  applySelectWeapon,
  applyPickFloor,
  applyCombatSkill,
  applyCombatEndTurn,
} from '../src/game/RunCommands.ts';
import { enemyTurn } from '../src/game/combat/CombatEngine.ts';

const p = getPolicy('greedy');
let s = { run: createInitialRunState(42), profile: createEmptyProfile() };
s = applySelectClass(s, p.selectClass(s));
s = applySelectWeapon(s, p.selectWeapon(s));
s = applyPickFloor(s, p.selectFloorIndex(s));

let uses = 0;
while (s.run.combat?.turn === 'player' && !s.run.combat.finished && uses < 40) {
  const id = p.selectCombatSkill(s);
  if (!id) break;
  const n = applyCombatSkill(s, id);
  if (n === s || n.run === s.run) break;
  s = n;
  uses++;
}
console.log('skills used', uses, 'mana', s.run.combat?.currentMana);
s = applyCombatEndTurn(s);
console.log('end turn', s.run.combat?.turn, 'idx', s.run.combat?.enemyPhaseIndex);

let run = s.run;
for (let i = 0; i < 40; i++) {
  if (!run.combat || run.combat.finished || run.combat.turn !== 'enemy') {
    console.log('enemy phase done', i, run.combat?.turn);
    break;
  }
  const before = `${run.combat.enemyPhaseIndex}|${run.combat.lastAction?.kind}`;
  run = enemyTurn(run);
  const after = `${run.combat?.enemyPhaseIndex}|${run.combat?.lastAction?.kind}`;
  console.log(i, before, '->', after, 'turn', run.combat?.turn);
  if (before === after && run.combat?.turn === 'enemy') {
    console.error('INFINITE enemy drain');
    process.exit(1);
  }
}
