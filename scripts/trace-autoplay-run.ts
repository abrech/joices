/**
 * One greedy run, no replay verify. Run: npx tsx scripts/trace-autoplay-run.ts
 */
import { configureHeadlessProfileStore, runSingleAutoplay } from '../src/game/autoplay/AutoplayRunner.ts';
import { getPolicy } from '../src/game/autoplay/policy.ts';
import { createEmptyProfile } from '../src/types/game-state.ts';

configureHeadlessProfileStore();
const t0 = Date.now();
console.log('starting...');
const result = runSingleAutoplay(42, getPolicy('greedy'), createEmptyProfile(), false);
console.log({
  ms: Date.now() - t0,
  steps: result.steps,
  stuck: result.stuck,
  stuckReason: result.stuckReason,
  phase: result.finalState.run.phase,
  victory: result.record?.victory,
  floor: result.record?.floorReached,
  combat: !!result.finalState.run.combat,
  event: result.finalState.run.activeEvent?.screen,
});
