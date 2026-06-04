import type { EventDef } from '../../types/events';
import { calcHealAmount } from '../../game/progression/Scaling';
import { WEIGHT_HEAL } from '../../game/progression/EncounterWeights';
import { isBossFloor } from '../../game/progression/PacingRules';

export const healEvent: EventDef = {
  id: 'heal',
  name: 'Healing Spring',
  description: 'Rest and recover health.',
  imageKey: 'heal',
  tags: ['heal'],
  weight: WEIGHT_HEAL,
  canAppear: (ctx) =>
    ctx.floor >= 2 && !isBossFloor(ctx.floor) && ctx.run.player.hp < ctx.run.player.stats.maxHp,
  buildPayload: (ctx) => {
    const healAmount = calcHealAmount(ctx.run.player.stats.maxHp, ctx.floor);
    return {
      healAmount,
      label: `Restore ${healAmount} HP`,
    };
  },
  buildOfferPreview: (_ctx, payload) => {
    const p = payload as { healAmount: number };
    return `Restore ${p.healAmount} HP`;
  },
  screen: 'heal',
  resolve: (ctx) => [
    { type: 'heal', amount: (ctx.payload as { healAmount: number }).healAmount },
    { type: 'advanceFloor' },
  ],
};
