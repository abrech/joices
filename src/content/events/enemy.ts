import type { EventDef } from '../../types/events';
import type { CombatPayload } from '../../types/events';
import { pickEnemy, buildCombatPayloadFromPick } from '../../game/progression/EnemyPicker';
import { buildEnemyPreview } from '../../game/progression/PacingRules';
import { isFirstCombatFloor, isBossFloor } from '../../game/progression/PacingRules';
import { WEIGHT_ENEMY } from '../../game/progression/EncounterWeights';

export const enemyEvent: EventDef = {
  id: 'enemy',
  name: 'Enemy Encounter',
  description: 'Fight a hostile creature for gold.',
  imageKey: 'enemy',
  tags: ['combat'],
  weight: WEIGHT_ENEMY,
  canAppear: (ctx) => ctx.floor > 0 && !isBossFloor(ctx.floor),
  buildPayload: (ctx) => {
    const forceNormal = isFirstCombatFloor(ctx);
    const pick = pickEnemy(ctx, { forceNormal });
    return buildCombatPayloadFromPick(pick);
  },
  buildOfferPreview: (ctx, payload) => buildEnemyPreview(ctx, payload as CombatPayload),
  screen: 'combat',
  resolve: (ctx) => {
    if (ctx.combatResult === 'win') {
      return [{ type: 'advanceFloor' }];
    }
    if (ctx.combatResult === 'lose') {
      return [{ type: 'endRun', victory: false }];
    }
    const payload = ctx.payload as CombatPayload;
    return [{ type: 'startCombat', enemyIds: payload.enemyIds }];
  },
};
