import type { EventDef } from '../../types/events';
import { scaleEnemyGold } from '../../game/progression/Scaling';
import { isBossFloor } from '../../game/progression/PacingRules';
import { lich } from '../enemies';

export const bossEvent: EventDef = {
  id: 'boss',
  name: 'Boss Encounter',
  description: 'A powerful foe blocks your path!',
  imageKey: 'boss',
  tags: ['combat', 'boss'],
  weight: 100,
  canAppear: (ctx) => isBossFloor(ctx.floor),
  buildPayload: () => ({ enemyId: lich.id, isBoss: true }),
  buildOfferPreview: (ctx) => {
    const gold = scaleEnemyGold(lich.goldDrop, ctx.floor);
    return `${lich.name} · ${gold[0]}-${gold[1]} gold`;
  },
  screen: 'combat',
  resolve: (ctx) => {
    if (ctx.combatResult === 'win') {
      return [{ type: 'advanceFloor' }];
    }
    if (ctx.combatResult === 'lose') {
      return [{ type: 'endRun', victory: false }];
    }
    const payload = ctx.payload as { enemyId: string; isBoss?: boolean };
    return [{ type: 'startCombat', enemyId: payload.enemyId, isBoss: payload.isBoss }];
  },
};
